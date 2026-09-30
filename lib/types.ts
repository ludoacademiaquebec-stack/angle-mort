// ============================================================
// ANGLE MORT v4.3 — Types ADDITIFS
// Garde le modèle initial + ajoute quadrantCorrect (QCM) + arbitrage
// ============================================================

export type Famille = 'REC' | 'MIC' | 'PRI' | 'CLI';
export type FamilleAll = 'ALL';
export type FamilleTotale = Famille | FamilleAll;

export type Quadrant = 'NO' | 'NE' | 'SO' | 'SE';
export type Canal = 'signal' | 'situation';
export type CouleurPion = 'neutre' | 'jaune' | 'rouge';
export type ModeSession = 'individuel' | 'equipe';

export type Version = 'rapide' | 'moyen' | 'long' | 'complet';

export const VERSION_CONFIG: Record<Version, { nbCartes: number; dureeMin: number; label: string }> = {
  rapide:  { nbCartes: 15, dureeMin: 25,  label: 'Rapide (15 cartes · 25 min)' },
  moyen:   { nbCartes: 30, dureeMin: 50,  label: 'Moyen (30 cartes · 50 min)' },
  long:    { nbCartes: 45, dureeMin: 85,  label: 'Long (45 cartes · 1h25)' },
  complet: { nbCartes: 60, dureeMin: 120, label: 'Complet (60 cartes · 2h)' },
};

export type PhaseProtocole =
  | 'cadrage'
  | 'signal'
  | 'situation'
  | 'reaction'
  | 'argumentation'
  | 'vote'
  | 'decompte'
  | 'fermeture_all';

export type ConditionResolution =
  | 'coherence_confirmee'
  | 'revelation_confirmee'
  | 'fausse_alerte'
  | 'angle_mort_aveugle'
  | 'egalite'
  | 'en_attente';

export type JetonGagne = 'violet' | 'priorite' | 'lucidite' | null;

// NOUVEAU : profil individuel (couche informative)
export type ProfilIndividuel = 'intuition' | 'construit' | 'tardif' | 'perdu' | 'abandon';

export interface ScoreIndividuel {
  playerId: string;
  nick: string;
  profil: ProfilIndividuel;
  positionFinale: Quadrant | null;
  nbDeplacements: number;
  dansLeBonCadran: boolean;
}

export interface CarteDiagnostique {
  id: string;
  famille: Famille;
  titre: string;
  image: string;
  image_url_signal?: string | null;
  image_url_situation?: string | null;
  signal: string;
  situation: string;
  question: string;
  motPiege?: string;
  compteur?: string;
  compteurLabel?: string;
  extra?: { type: 'effet' | 'cout'; texte: string };
  quadrantCorrect?: Quadrant | null;
  explication?: string | null;
  arbitrage?: string | null;      // ← AJOUT : livret facilitateur (4-6 phrases, académique)
  niveauDifficulte?: 1 | 2 | 3;
}

export interface CarteAll {
  id: string;
  famille: 'ALL';
  titre: string;
  action: string;
  indicateur: string;
  delai: string;
  niveau: 1 | 2 | 3;
  couleur: string;
  zoneCible?: Quadrant | 'ALL';
}

export interface Pion {
  playerId: string;
  nick: string;
  quadrantInitial: Quadrant | null;
  quadrantActuel: Quadrant | null;
  couleur: CouleurPion;
  equipeId?: string;
  reactionFaite?: boolean;
  nbDeplacements?: number;
}

export interface Joueur {
  id: string;
  sessionId: string;
  nick: string;
  equipeId?: string;
  cartesQuestion: number;
  cartesMesure: number;
  lastSeenAt: number;
  connected: boolean;
}

export interface Vote {
  playerId: string;
  nick?: string;
  choix: 'reste' | 'bouge' | 'neutre';
  cardId: string;
  question_id?: string;
  questionId?: string;
  timestamp: number;
  sessionId?: string;
}

// RÉSULTAT : garde TOUT l'existant + ajoute la couche QCM
export interface ResultatCarte {
  // --- Existant (inchangé) ---
  cardId: string;
  famille?: Famille;
  positionSignal: Quadrant;
  positionFinale: Quadrant;
  pariGagnant: 'jaune' | 'rouge';
  condition: ConditionResolution;
  gagnants: string[];
  perdants: string[];
  pointsJaunes: number;
  pointsRouges: number;
  jetonDonne: JetonGagne;
  timestamp: number;
  reste?: number;
  bouge?: number;
  neutre?: number;
  majorite?: 'reste' | 'bouge' | 'neutre' | 'egalite';

  // --- Couche QCM (vérité terrain) ---
  quadrantCorrect?: Quadrant | null;
  explication?: string | null;
  arbitrage?: string | null;    // ← AJOUT : arbitrage scientifique complet
  nbOntVuJuste?: number;        // combien de pions dans quadrantCorrect
  totalJoueurs?: number;        // total pions
  scoresIndividuels?: ScoreIndividuel[];
}

export interface Engagement {
  id?: string;
  sessionId: string;
  playerId: string;
  allCardId: string;
  engagementText: string;
  indicateur: string;
  echeance: string;
  createdAt?: number;
}

export interface TimerState {
  elapsedSec: number;
  running: boolean;
  startedAt: string | null;
}

export interface SessionState {
  sessionId: string;
  code: string;
  company: string;
  mode: ModeSession;
  version: Version;
  nbEquipes: number;
  dureeArgumentationSec: number;
  phase: PhaseProtocole;
  cardIdxEnCours: number;
  cartesTirees: string[];
  pions: Pion[];
  votes: Vote[];
  resultatCarte: ResultatCarte | null;
  allSelectionnees: string[];
  engagementRetenu: string | null;
  timer: TimerState;
  startedAt: number;
  updatedAt: number;
  status: 'active' | 'paused' | 'closed';
}

export interface LocalPlayerState {
  playerId: string;
  nick: string;
  sessionId: string;
  equipeId?: string;
  pion: Pion | null;
  cartesQuestion: number;
  cartesMesure: number;
}

export interface SessionConfig {
  sessionId: string;
  company: string;
  mode: ModeSession;
  version: Version;
  nbEquipes?: number;
  dureeArgumentationSec: number;
}