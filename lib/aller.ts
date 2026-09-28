import { CARTES_ALL } from './cards';
import type { CarteAll, Pion, Vote, ResultatCarte, Quadrant, ConditionResolution } from './types';

export interface RaisonnementAll {
  allCardId: string;
  score: number;
  raisons: string[];
}

export function tirerCartesAllIntelligent(
  pions: Pion[],
  votes: Vote[],
  resultats: ResultatCarte[]
): { cartes: CarteAll[]; raisonnements: RaisonnementAll[] } {
  const zonesRouges: Record<Quadrant, number> = { NO: 0, NE: 0, SO: 0, SE: 0 };
  for (const p of pions) {
    if (p.couleur === 'rouge' && p.quadrantActuel) {
      zonesRouges[p.quadrantActuel]++;
    }
  }

  const famillesChaudes: Record<string, number> = { REC: 0, MIC: 0, PRI: 0, CLI: 0 };
  for (const r of resultats) {
    if (!r.famille) continue;
    let poids = 0;
    const cond: ConditionResolution = r.condition;
    if (cond === 'angle_mort_aveugle') poids = 3;
    else if (cond === 'revelation_confirmee') poids = 2;
    else if (cond === 'fausse_alerte') poids = 1;
    famillesChaudes[r.famille] = (famillesChaudes[r.famille] || 0) + poids;
  }

  const votesBouge = votes.filter((v) => v.choix === 'bouge').length;
  const votesReste = votes.filter((v) => v.choix === 'reste').length;
  const tensionGlobale = votesBouge - votesReste;

  const scores: RaisonnementAll[] = CARTES_ALL.map((c) => {
    let score = 0;
    const raisons: string[] = [];

    const zoneCible = c.zoneCible;
    if (zoneCible && zoneCible !== 'ALL') {
      const poidsZone = zonesRouges[zoneCible as Quadrant] || 0;
      if (poidsZone > 0) {
        score += poidsZone * 2;
        raisons.push(`Zone ${zoneCible} chaude (${poidsZone} rouges)`);
      }
    }

    score += c.niveau * 2;
    raisons.push(`Niveau ${c.niveau}`);

    if (tensionGlobale > 0 && c.niveau >= 2) {
      score += 1;
      raisons.push('Tension globale vers le mouvement');
    } else if (tensionGlobale < 0 && c.niveau === 1) {
      score += 1;
      raisons.push('Tension globale vers le maintien');
    }

    return { allCardId: c.id, score, raisons };
  });

  const parNiveau: Record<number, RaisonnementAll[]> = { 1: [], 2: [], 3: [] };
  for (const s of scores) {
    const carte = CARTES_ALL.find((c) => c.id === s.allCardId);
    if (!carte) continue;
    parNiveau[carte.niveau].push(s);
  }

  const raisonnementsChoisis: RaisonnementAll[] = [];
  const cartesChoisies: CarteAll[] = [];

  for (const niveau of [1, 2, 3]) {
    const pool = parNiveau[niveau].sort((a, b) => b.score - a.score).slice(0, 5);
    if (pool.length === 0) continue;
    const choisi = pool[Math.floor(Math.random() * pool.length)];
    const carte = CARTES_ALL.find((c) => c.id === choisi.allCardId);
    if (carte) {
      cartesChoisies.push(carte);
      raisonnementsChoisis.push(choisi);
    }
  }

  return { cartes: cartesChoisies, raisonnements: raisonnementsChoisis };
}

export function syntheseGenerale(
  pions: Pion[],
  votes: Vote[],
  resultats: ResultatCarte[]
): {
  zonesRouges: Record<Quadrant, number>;
  famillesChaudes: Record<string, number>;
  totalAnglesMorts: number;
  totalRevelations: number;
  totalFaussesAlertes: number;
  totalCoherences: number;
  tensionGlobale: number;
} {
  const zonesRouges: Record<Quadrant, number> = { NO: 0, NE: 0, SO: 0, SE: 0 };
  for (const p of pions) {
    if (p.couleur === 'rouge' && p.quadrantActuel) zonesRouges[p.quadrantActuel]++;
  }

  const famillesChaudes: Record<string, number> = { REC: 0, MIC: 0, PRI: 0, CLI: 0 };
  let totalAnglesMorts = 0, totalRevelations = 0, totalFaussesAlertes = 0, totalCoherences = 0;

  for (const r of resultats) {
    if (r.famille) famillesChaudes[r.famille] = (famillesChaudes[r.famille] || 0) + 1;
    if (r.condition === 'angle_mort_aveugle') totalAnglesMorts++;
    else if (r.condition === 'revelation_confirmee') totalRevelations++;
    else if (r.condition === 'fausse_alerte') totalFaussesAlertes++;
    else if (r.condition === 'coherence_confirmee') totalCoherences++;
  }

  const votesBouge = votes.filter((v) => v.choix === 'bouge').length;
  const votesReste = votes.filter((v) => v.choix === 'reste').length;

  return {
    zonesRouges,
    famillesChaudes,
    totalAnglesMorts,
    totalRevelations,
    totalFaussesAlertes,
    totalCoherences,
    tensionGlobale: votesBouge - votesReste,
  };
}
