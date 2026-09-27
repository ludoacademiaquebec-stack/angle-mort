import type { Quadrant, Pion, Vote, ResultatCarte, ConditionResolution } from './types';

export function positionMajoritaire(pions: Pion[], champ: 'quadrantInitial' | 'quadrantActuel'): Quadrant | null {
  const actifs = pions.filter((p) => p[champ]!== null);
  if (actifs.length === 0) return null;
  const compte: Record<Quadrant, number> = { NO: 0, NE: 0, SO: 0, SE: 0 };
  for (const p of actifs) { const q = p[champ]; if (q) compte[q]++; }
  const ordre: Quadrant[] = ['NO', 'NE', 'SO', 'SE'];
  let max = -1; let gagnant: Quadrant | null = null;
  for (const q of ordre) { if (compte[q] > max) { max = compte[q]; gagnant = q; } }
  return gagnant;
}

export function compterVotes(votes: Vote[]): { reste: number; bouge: number; neutre: number; majorite: 'reste' | 'bouge' | 'neutre' | 'egalite' } {
  let reste = 0; let bouge = 0; let neutre = 0;
  for (const v of votes) { if (v.choix === 'reste') reste++; else if (v.choix === 'bouge') bouge++; else if (v.choix === 'neutre') neutre++; }
  let majorite: 'reste' | 'bouge' | 'neutre' | 'egalite' = 'egalite';
  if (reste > bouge && reste > neutre) majorite = 'reste';
  else if (bouge > reste && bouge > neutre) majorite = 'bouge';
  else if (neutre > reste && neutre > bouge) majorite = 'neutre';
  return { reste, bouge, neutre, majorite };
}

export function calculerCondition(positionSignal: Quadrant | null, positionFinale: Quadrant | null, majorite: 'reste' | 'bouge' | 'neutre' | 'egalite'): ConditionResolution {
  if (!positionSignal ||!positionFinale) {
    if (majorite === 'reste') return 'coherence_confirmee';
    if (majorite === 'bouge') return 'revelation_confirmee';
    return 'fausse_alerte';
  }
  if (positionSignal === positionFinale) {
    if (majorite === 'reste') return 'coherence_confirmee';
    return 'fausse_alerte';
  } else {
    if (majorite === 'bouge') return 'revelation_confirmee';
    return 'angle_mort_aveugle';
  }
}

export function pariGagnant(condition: ConditionResolution): 'jaune' | 'rouge' {
  if (condition === 'coherence_confirmee') return 'jaune';
  if (condition === 'fausse_alerte') return 'jaune';
  return 'rouge';
}

export function attribuerRecompenses(pions: Pion[], gagnant: 'jaune' | 'rouge'): { gagnants: string[]; perdants: string[] } {
  const gagnants: string[] = []; const perdants: string[] = [];
  for (const p of pions) { if (p.couleur === 'neutre') continue; if (p.couleur === gagnant) gagnants.push(p.playerId); else perdants.push(p.playerId); }
  return { gagnants, perdants };
}

export function construireResultat(cardId: string, pions: Pion[], votes: Vote[]): ResultatCarte {
  const positionSignal = positionMajoritaire(pions, 'quadrantInitial');
  const positionFinale = positionMajoritaire(pions, 'quadrantActuel');
  const { reste, bouge, neutre, majorite } = compterVotes(votes);
  let positionFinaleRetenue = positionFinale;
  if (majorite === 'reste') positionFinaleRetenue = positionSignal;
  let majoritePourCondition: 'reste' | 'bouge' | 'neutre' | 'egalite' = majorite;
  if (majorite === 'neutre') majoritePourCondition = 'egalite';
  const condition = calculerCondition(positionSignal, positionFinaleRetenue, majoritePourCondition);
  const gagnant = pariGagnant(condition);
  const { gagnants, perdants } = attribuerRecompenses(pions, gagnant);
  return { cardId, positionSignal: positionSignal?? 'NO', positionFinale: positionFinaleRetenue?? 'NO', pariGagnant: gagnant, condition, gagnants, perdants, timestamp: Date.now(), reste, bouge, neutre, majorite } as ResultatCarte;
}

export const LIBELLE_CONDITION: Record<ConditionResolution, string> = {
  coherence_confirmee: 'Cohérence Confirmée',
  revelation_confirmee: 'Révélation Confirmée',
  fausse_alerte: 'Fausse Alerte',
  angle_mort_aveugle: 'Angle Mort Aveugle',
};

export const DESCRIPTION_CONDITION: Record<ConditionResolution, string> = {
  coherence_confirmee: 'La majorité pensait que ça reste, et c’est resté.',
  revelation_confirmee: 'La majorité pensait que ça bouge, et ça a bougé.',
  fausse_alerte: 'On craignait un déplacement, mais la position tient.',
  angle_mort_aveugle: 'Personne n’avait vu le déplacement. Angle mort pur.',
};
