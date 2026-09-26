// ============================================================
// ANGLE MORT v3.3 — Logique de résolution et attribution
// ============================================================

import type {
  Quadrant,
  Pion,
  Vote,
  ResultatCarte,
  ConditionResolution,
} from './types';

// ------------------------------------------------------------
// 1. Position majoritaire
// ------------------------------------------------------------
// Retourne le quadrant où le plus de pions sont posés.
// En cas d'égalité, retourne le premier dans l'ordre NO > NE > SO > SE.
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

// ------------------------------------------------------------
// 2. Compter les votes
// ------------------------------------------------------------
export function compterVotes(votes: Vote[]): {
  reste: number;
  bouge: number;
  majorite: 'reste' | 'bouge' | 'egalite';
} {
  let reste = 0;
  let bouge = 0;
  for (const v of votes) {
    if (v.choix === 'reste') reste++;
    else if (v.choix === 'bouge') bouge++;
  }
  let majorite: 'reste' | 'bouge' | 'egalite' = 'egalite';
  if (reste > bouge) majorite = 'reste';
  else if (bouge > reste) majorite = 'bouge';
  return { reste, bouge, majorite };
}

// ------------------------------------------------------------
// 3. Calculer la condition de résolution
// ------------------------------------------------------------
// Compare la position Signal (avant Situation) et la position
// finale décidée par le vote.
export function calculerCondition(
  positionSignal: Quadrant | null,
  positionFinale: Quadrant | null
): ConditionResolution {
  if (!positionSignal || !positionFinale) return 'coherence_confirmee';
  if (positionSignal === positionFinale) return 'coherence_confirmee';
  return 'revelation_confirmee';
}

// ------------------------------------------------------------
// 4. Déterminer le pari gagnant
// ------------------------------------------------------------
export function pariGagnant(condition: ConditionResolution): 'jaune' | 'rouge' {
  if (condition === 'coherence_confirmee') return 'jaune';
  if (condition === 'revelation_confirmee') return 'rouge';
  if (condition === 'fausse_alerte') return 'jaune';
  return 'rouge';
}

// ------------------------------------------------------------
// 5. Attribuer les récompenses
// ------------------------------------------------------------
// Renvoie la liste des gagnants (cartes Mesure) et des perdants
// (cartes Question) selon la couleur de leur pion.
export function attribuerRecompenses(
  pions: Pion[],
  gagnant: 'jaune' | 'rouge'
): { gagnants: string[]; perdants: string[] } {
  const gagnants: string[] = [];
  const perdants: string[] = [];

  for (const p of pions) {
    if (p.couleur === 'neutre') continue;
    if (p.couleur === gagnant) {
      gagnants.push(p.playerId);
    } else {
      perdants.push(p.playerId);
    }
  }
  return { gagnants, perdants };
}

// ------------------------------------------------------------
// 6. Construire le résultat complet d'une carte
// ------------------------------------------------------------
export function construireResultat(
  cardId: string,
  pions: Pion[],
  votes: Vote[]
): ResultatCarte {
  const positionSignal = positionMajoritaire(pions, 'quadrantInitial');
  const positionFinale = positionMajoritaire(pions, 'quadrantActuel');

  const { majorite } = compterVotes(votes);

  let positionFinaleRetenue = positionFinale;
  if (majorite === 'reste') positionFinaleRetenue = positionSignal;
  else if (majorite === 'bouge') {
    // Position la plus votée après déplacement
    positionFinaleRetenue = positionFinale;
  }

  const condition = calculerCondition(positionSignal, positionFinaleRetenue);
  const gagnant = pariGagnant(condition);
  const { gagnants, perdants } = attribuerRecompenses(pions, gagnant);

  return {
    cardId,
    positionSignal: positionSignal ?? 'NO',
    positionFinale: positionFinaleRetenue ?? 'NO',
    pariGagnant: gagnant,
    condition,
    gagnants,
    perdants,
    timestamp: Date.now(),
  };
}

// ------------------------------------------------------------
// 7. Libellés des conditions (pour l'affichage)
// ------------------------------------------------------------
export const LIBELLE_CONDITION: Record<ConditionResolution, string> = {
  coherence_confirmee: 'Cohérence Confirmée',
  revelation_confirmee: 'Révélation Confirmée',
  fausse_alerte: 'Fausse Alerte',
  angle_mort_aveugle: 'Angle Mort Aveugle',
};

export const DESCRIPTION_CONDITION: Record<ConditionResolution, string> = {
  coherence_confirmee:
    'La majorité pensait que la position resterait, et elle est restée.',
  revelation_confirmee:
    'La majorité pensait que la position bougerait, et elle a bougé.',
  fausse_alerte:
    'On craignait un angle mort, mais la position tient.',
  angle_mort_aveugle:
    'Personne ne l\'avait vu bouger. C\'est l\'angle mort pur.',
};
