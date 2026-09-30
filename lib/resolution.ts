import type {
  Quadrant, Pion, Vote, ResultatCarte, ConditionResolution,
  JetonGagne, Famille, FamilleAll, CarteDiagnostique,
  ProfilIndividuel, ScoreIndividuel,
} from './types';

// ============================================================
// EXISTANT (inchangé)
// ============================================================

export function positionMajoritaire(
  pions: Pion[],
  champ: 'quadrantInitial' | 'quadrantActuel'
): Quadrant | null {
  const actifs = pions.filter((p) => p[champ] !== null);
  if (actifs.length === 0) return null;
  const compte: Record<Quadrant, number> = { NO: 0, NE: 0, SO: 0, SE: 0 };
  for (const p of actifs) {
    const q = p[champ];
    if (q) compte[q]++;
  }
  const ordre: Quadrant[] = ['NO', 'NE', 'SO', 'SE'];
  let max = -1;
  let gagnant: Quadrant | null = null;
  for (const q of ordre) {
    if (compte[q] > max) {
      max = compte[q];
      gagnant = q;
    }
  }
  return gagnant;
}

export function compterVotes(votes: Vote[]): {
  reste: number;
  bouge: number;
  neutre: number;
  majorite: 'reste' | 'bouge' | 'neutre' | 'egalite';
} {
  let reste = 0, bouge = 0, neutre = 0;
  for (const v of votes) {
    if (v.choix === 'reste') reste++;
    else if (v.choix === 'bouge') bouge++;
    else if (v.choix === 'neutre') neutre++;
  }
  let majorite: 'reste' | 'bouge' | 'neutre' | 'egalite' = 'egalite';
  if (reste > bouge && reste > neutre) majorite = 'reste';
  else if (bouge > reste && bouge > neutre) majorite = 'bouge';
  else if (neutre > reste && neutre > bouge) majorite = 'neutre';
  return { reste, bouge, neutre, majorite };
}

export function calculerCondition(
  positionSignal: Quadrant | null,
  positionFinale: Quadrant | null,
  majorite: 'reste' | 'bouge' | 'neutre' | 'egalite'
): ConditionResolution {
  if (!positionSignal || !positionFinale) return 'en_attente';
  if (majorite === 'egalite' || majorite === 'neutre') return 'egalite';
  const aBouge = positionSignal !== positionFinale;
  if (aBouge && majorite === 'bouge')  return 'revelation_confirmee';
  if (!aBouge && majorite === 'reste') return 'coherence_confirmee';
  if (!aBouge && majorite === 'bouge') return 'fausse_alerte';
  if (aBouge && majorite === 'reste')  return 'angle_mort_aveugle';
  return 'en_attente';
}

export function pariGagnant(condition: ConditionResolution): 'jaune' | 'rouge' {
  if (condition === 'coherence_confirmee' || condition === 'fausse_alerte') return 'jaune';
  return 'rouge';
}

export function calculerRecompenses(condition: ConditionResolution): {
  pointsJaunes: number;
  pointsRouges: number;
  jetonDonne: JetonGagne;
} {
  switch (condition) {
    case 'revelation_confirmee':
      return { pointsJaunes: 0, pointsRouges: 2, jetonDonne: 'priorite' };
    case 'coherence_confirmee':
      return { pointsJaunes: 1, pointsRouges: 0, jetonDonne: 'lucidite' };
    case 'fausse_alerte':
      return { pointsJaunes: 1, pointsRouges: 0, jetonDonne: 'lucidite' };
    case 'angle_mort_aveugle':
      return { pointsJaunes: 0, pointsRouges: 2, jetonDonne: 'priorite' };
    default:
      return { pointsJaunes: 0, pointsRouges: 0, jetonDonne: null };
  }
}

export function attribuerRecompenses(
  pions: Pion[],
  gagnant: 'jaune' | 'rouge'
): { gagnants: string[]; perdants: string[] } {
  const gagnants: string[] = [];
  const perdants: string[] = [];
  for (const p of pions) {
    if (p.couleur === 'neutre') continue;
    if (p.couleur === gagnant) gagnants.push(p.playerId);
    else perdants.push(p.playerId);
  }
  return { gagnants, perdants };
}

// ============================================================
// Profil individuel (couche informative)
// ============================================================

export function profilIndividuel(
  p: Pion,
  quadrantCorrect: Quadrant | null
): ProfilIndividuel {
  if (p.couleur === 'neutre') return 'abandon';
  if (!quadrantCorrect) return 'abandon';
  const positionFinale = p.quadrantActuel;
  if (!positionFinale) return 'abandon';
  const dansLeBon = positionFinale === quadrantCorrect;
  const nbDepl = p.nbDeplacements || 0;
  if (!dansLeBon) return 'perdu';
  if (nbDepl === 0) return 'intuition';
  if (nbDepl <= 2) return 'construit';
  return 'tardif';
}

export function construireScoresIndividuels(
  pions: Pion[],
  quadrantCorrect: Quadrant | null
): ScoreIndividuel[] {
  return pions.map((p) => {
    const profil = profilIndividuel(p, quadrantCorrect);
    const dansLeBonCadran = !!(quadrantCorrect && p.quadrantActuel === quadrantCorrect);
    return {
      playerId: p.playerId,
      nick: p.nick,
      profil,
      positionFinale: p.quadrantActuel,
      nbDeplacements: p.nbDeplacements || 0,
      dansLeBonCadran,
    };
  });
}

// ============================================================
// CONSTRUIRE LE RÉSULTAT (ADDITIF)
// ============================================================

export function construireResultat(
  carte: CarteDiagnostique,
  pions: Pion[],
  votes: Vote[]
): ResultatCarte | null {
  if (pions.length === 0 || votes.length === 0) return null;

  const positionSignal = positionMajoritaire(pions, 'quadrantInitial');
  const positionFinale = positionMajoritaire(pions, 'quadrantActuel');
  if (!positionSignal || !positionFinale) return null;

  const { reste, bouge, neutre, majorite } = compterVotes(votes);
  const condition = calculerCondition(positionSignal, positionFinale, majorite);
  const gagnant = pariGagnant(condition);
  const { gagnants, perdants } = attribuerRecompenses(pions, gagnant);
  const { pointsJaunes, pointsRouges, jetonDonne } = calculerRecompenses(condition);

  // Calcul des profils individuels
  const quadrantCorrect = carte.quadrantCorrect || null;
  const scoresIndividuels = construireScoresIndividuels(pions, quadrantCorrect);
  const nbOntVuJuste = scoresIndividuels.filter((s) => s.dansLeBonCadran).length;

  return {
    // Existant
    cardId: carte.id,
    famille: carte.famille,
    positionSignal,
    positionFinale,
    pariGagnant: gagnant,
    condition,
    gagnants,
    perdants,
    pointsJaunes,
    pointsRouges,
    jetonDonne,
    timestamp: Date.now(),
    reste,
    bouge,
    neutre,
    majorite,
    // Couche QCM
    quadrantCorrect,
    explication: carte.explication || null,
    arbitrage: carte.arbitrage || null,      // ← AJOUT : copie l'arbitrage dans le résultat
    nbOntVuJuste,
    totalJoueurs: pions.length,
    scoresIndividuels,
  };
}

// ============================================================
// LIBELLÉS
// ============================================================

export const LIBELLE_CONDITION: Record<ConditionResolution, string> = {
  coherence_confirmee: 'Cohérence Confirmée',
  revelation_confirmee: 'Révélation Confirmée',
  fausse_alerte: 'Fausse Alerte',
  angle_mort_aveugle: 'Angle Mort Aveugle',
  egalite: 'Égalité',
  en_attente: 'En attente',
};

export const DESCRIPTION_CONDITION: Record<ConditionResolution, string> = {
  coherence_confirmee: 'La majorité pensait que ça resterait, et c\u2019est resté.',
  revelation_confirmee: 'La majorité pensait que ça bougerait, et ça a bougé.',
  fausse_alerte: 'On craignait un angle mort, mais l\u2019argument tient en place.',
  angle_mort_aveugle: 'Personne ne l\u2019avait vu bouger. C\u2019est l\u2019angle mort pur.',
  egalite: 'Pas de majorité claire. Le facilitateur tranche ou on passe.',
  en_attente: 'Aucun vote enregistré. Impossible de décompter.',
};

export const COULEUR_CONDITION: Record<ConditionResolution, string> = {
  coherence_confirmee: '#FDE047',
  revelation_confirmee: '#EF4444',
  fausse_alerte: '#FDE047',
  angle_mort_aveugle: '#EF4444',
  egalite: '#6B7280',
  en_attente: '#6B7280',
};

export const LIBELLE_PROFIL_INDIVIDUEL: Record<ProfilIndividuel, string> = {
  intuition: '🏆 Punctum instantané',
  construit: '🎯 Punctum construit',
  tardif: '💭 Punctum tardif',
  perdu: '❌ Angle mort',
  abandon: '⚪ Abandon',
};

export const COULEUR_PROFIL_INDIVIDUEL: Record<ProfilIndividuel, string> = {
  intuition: '#10B981',
  construit: '#3B82F6',
  tardif: '#EAB308',
  perdu: '#EF4444',
  abandon: '#6B7280',
};