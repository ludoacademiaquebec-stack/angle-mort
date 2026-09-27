// ============================================================
// ANGLE MORT v3.3 — Types canoniques
// ============================================================

// ---------- FAMILLES DE CARTES ----------
export type Famille = 'REC' | 'MIC' | 'PRI' | 'CLI';
export type FamilleAll = 'ALL';
export type FamilleTotale = Famille | FamilleAll;

// ---------- QUADRANTS SÉMANTIQUES ----------
export type Quadrant = 'NO' | 'NE' | 'SO' | 'SE';

// ---------- CANAL DE LA CARTE ----------
export type Canal = 'signal' | 'situation';

// ---------- COULEUR DU PION (= PARI) ----------
export type CouleurPion = 'neutre' | 'jaune' | 'rouge';

// ---------- MODE DE SESSION ----------
export type ModeSession = 'individuel' | 'equipe';

// ---------- PHASES DU PROTOCOLE ----------
export type PhaseProtocole =
  | 'cadrage'
  | 'signal'
  | 'situation'
  | 'argumentation'
  | 'vote'
  | 'decompte'
  | 'fermeture_all';

// ---------- CONDITION DE RÉSOLUTION (4 cas) ----------
export type ConditionResolution =
  | 'coherence_confirmee'   // Jaune gagne : position identique
  | 'revelation_confirmee'  // Rouge gagne : position différente
  | 'fausse_alerte'         // Rouge perd : position identique
  | 'angle_mort_aveugle';   // Jaune perd : position différente

// ---------- CARTE DIAGNOSTIQUE (60) ----------
export interface CarteDiagnostique {
  id: string;                    // 'REC-01' ... 'CLI-15'
  famille: Famille;
  titre: string;
  image: string;                 // description de la scène (pour l'illustration)
  signal: string;                // face Signal (pointillé)
  situation: string;             // face Situation (plein)
  question: string;              // question d'animation
  motPiege?: string;             // citation-piège (optionnel)
  compteur?: string;             // '72%', '11/12', etc. (optionnel)
  compteurLabel?: string;        // description du compteur
  extra?: {
    type: 'effet' | 'cout';
    texte: string;
  };
}

// ---------- CARTE ALL (15) ----------
export interface CarteAll {
  id: string;                    // 'ALL-01' ... 'ALL-15'
  famille: 'ALL';
  titre: string;
  action: string;
  indicateur: string;            // '3 reformulations / semaine'
  delai: string;                 // 'J+7', 'J+30', 'J+90'
  niveau: 1 | 2 | 3;
  couleur: string;               // '#123024'
}

// ---------- PION (1 par joueur) ----------
export interface Pion {
  playerId: string;
  nick: string;
  quadrantInitial: Quadrant | null;   // où il était en fin de Phase 1
  quadrantActuel: Quadrant | null;    // où il est maintenant
  couleur: CouleurPion;               // calculée à la fin de Phase 2
  equipeId?: string;                  // si mode équipe
}

// ---------- JOUEUR ----------
export interface Joueur {
  id: string;
  sessionId: string;
  nick: string;
  equipeId?: string;                  // si mode équipe
  cartesQuestion: number;             // compteur de cartes Question gagnées
  cartesMesure: number;               // compteur de cartes Mesure gagnées
  lastSeenAt: number;
  connected: boolean;
}

// ---------- VOTE D'UN JOUEUR ----------
export interface Vote {
  playerId: string;
  choix: 'reste' | 'bouge' | 'neutre';
  cardId: string;
  question_id?: string;
  questionId?: string;
  timestamp: number;
  sessionId?: string;
}

// ---------- RÉSULTAT D'UNE CARTE ----------
export interface ResultatCarte {
  cardId: string;
  positionSignal: Quadrant;           // position majoritaire avant Situation
  positionFinale: Quadrant;           // position majoritaire après vote
  pariGagnant: 'jaune' | 'rouge';
  condition: ConditionResolution;
  gagnants: string[];                 // playerIds
  perdants: string[];                 // playerIds
  timestamp: number;
 reste?: number;
  bouge?: number;
  neutre?: number;
 majorite?: 'reste' | 'bouge' | 'neutre' | 'egalite';
}

// ---------- SESSION (état complet) ----------
export interface SessionState {
  sessionId: string;
  code: string;
  company: string;
  mode: ModeSession;
  nbEquipes: number;                  // si mode équipe
  dureeArgumentationSec: number;      // 240 à 360 (4-6 min)
  phase: PhaseProtocole;
  cardIdxEnCours: number;             // index dans la liste des cartes tirées (-1 si aucune)
  cartesTirees: string[];             // ids des cartes dans l'ordre de tirage
  pions: Pion[];                      // 1 par joueur
  votes: Vote[];                      // votes de la carte en cours
  resultatCarte: ResultatCarte | null;
  cartesQuestionTotales: number;
  cartesMesureTotales: number;
  allSelectionnees: string[];         // 3 cartes ALL choisies en fermeture
  engagementRetenu: string | null;    // l'engagement 48h unique
  startedAt: number;
  updatedAt: number;
  status: 'active' | 'paused' | 'closed';
}

// ---------- ÉTAT LOCAL DU JOUEUR ----------
export interface LocalPlayerState {
  playerId: string;
  nick: string;
  sessionId: string;
  equipeId?: string;
  pion: Pion | null;
  cartesQuestion: number;
  cartesMesure: number;
}

// ---------- CONFIGURATION D'UNE NOUVELLE SESSION ----------
export interface SessionConfig {
  sessionId: string;
  company: string;
  mode: ModeSession;
  nbEquipes?: number;
  dureeArgumentationSec: number;
}
