import { CARTES_DIAG } from './cards';
import type { Version, Famille, CarteDiagnostique } from './types';

const FAMILLES: Famille[] = ['REC', 'MIC', 'PRI', 'CLI'];

// ============================================================
// RNG déterministe basé sur une seed (sessionId)
// Permet au facilitateur ET aux joueurs de tirer LES MÊMES cartes
// ============================================================
function seededRandom(seed: string): () => number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) | 0;
  }
  return () => {
    h = (h * 1103515245 + 12345) & 0x7fffffff;
    return h / 0x7fffffff;
  };
}

function shuffleWith<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function parFamille(famille: Famille): CarteDiagnostique[] {
  return CARTES_DIAG.filter((c) => c.famille === famille);
}

// ============================================================
// Tirage des cartes selon la version + seed déterministe
// ============================================================
export function tirerCartesPourVersion(version: Version, seed?: string): CarteDiagnostique[] {
  const rng = seed ? seededRandom(seed) : Math.random;

  if (version === 'complet') {
    return shuffleWith(CARTES_DIAG, rng);
  }

  if (version === 'rapide') {
    const parF: Record<Famille, CarteDiagnostique[]> = {
      REC: [],
      MIC: [],
      PRI: [],
      CLI: [],
    };
    for (const f of FAMILLES) parF[f] = shuffleWith(parFamille(f), rng);
    const tirees: CarteDiagnostique[] = [];
    for (const f of FAMILLES) {
      tirees.push(...parF[f].slice(0, 4));
    }
    tirees.push(parF.REC[4], parF.MIC[4], parF.PRI[4]);
    return shuffleWith(tirees, rng).slice(0, 15);
  }

  if (version === 'moyen') {
    const parF: Record<Famille, CarteDiagnostique[]> = {
      REC: [],
      MIC: [],
      PRI: [],
      CLI: [],
    };
    for (const f of FAMILLES) parF[f] = shuffleWith(parFamille(f), rng);
    const tirees: CarteDiagnostique[] = [];
    for (const f of FAMILLES) {
      tirees.push(...parF[f].slice(0, 8));
    }
    return shuffleWith(tirees, rng).slice(0, 30);
  }

  if (version === 'long') {
    const parF: Record<Famille, CarteDiagnostique[]> = {
      REC: [],
      MIC: [],
      PRI: [],
      CLI: [],
    };
    for (const f of FAMILLES) parF[f] = shuffleWith(parFamille(f), rng);
    const tirees: CarteDiagnostique[] = [];
    for (const f of FAMILLES) {
      tirees.push(...parF[f].slice(0, 12));
    }
    return shuffleWith(tirees, rng).slice(0, 45);
  }

  return shuffleWith(CARTES_DIAG, rng).slice(0, 15);
}
