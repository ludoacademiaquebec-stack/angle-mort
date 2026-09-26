// ============================================================
// ANGLE MORT v3.3 — Les 4 quadrants sémantiques
// Source de vérité : https://2asinternational.org/INC/anglemort
// ============================================================
//
// Les quadrants NE SONT PAS des familles de cartes.
// Une carte REC, MIC, PRI ou CLI peut atterrir dans n'importe
// quel quadrant selon la lecture du groupe.
//
// Axe horizontal : Présence / Absence de voix
// Axe vertical   : Action / Inaction
//
// ============================================================

import type { Quadrant } from './types';

export interface QuadrantDef {
  code: Quadrant;
  position: string;         // 'N-O', 'N-E', 'S-O', 'S-E'
  label: string;            // ex: 'Vision centrale nette'
  sousTitre: string;        // ex: 'Inclusion réelle'
  description: string;      // texte complet d'animation
  nature: string;           // ex: 'Inclusion réelle — présence voix + action équitable'
  couleurFond: string;      // hex pour le fond du quadrant
  couleurTrait: string;     // hex pour la bordure
  axeHorizontal: 'voix_presente' | 'voix_absente';
  axeVertical: 'action' | 'inaction';
}

export const QUADRANTS: Record<Quadrant, QuadrantDef> = {
  NO: {
    code: 'NO',
    position: 'N-O',
    label: 'Vision centrale nette',
    sousTitre: 'Inclusion réelle',
    description: 'La voix est présente, entendue, et suivie d\'effet. Processus vérifiable.',
    nature: 'Inclusion réelle — présence voix + action équitable',
    couleurFond: '#FFFFFF',
    couleurTrait: '#14171B',
    axeHorizontal: 'voix_presente',
    axeVertical: 'action',
  },
  NE: {
    code: 'NE',
    position: 'N-E',
    label: 'Hors champ assumé',
    sousTitre: 'Exclusion assumée',
    description: 'On dit non, et on le dit. Pas de tache aveugle : un choix lisible, contestable, révisable.',
    nature: 'Exclusion assumée — absence voix + action explicite',
    couleurFond: '#FFF2F2',
    couleurTrait: '#B91C1C',
    axeHorizontal: 'voix_absente',
    axeVertical: 'action',
  },
  SO: {
    code: 'SO',
    position: 'S-O',
    label: 'Tache aveugle par tolérance',
    sousTitre: '1er angle mort',
    description: 'Pas d\'hostilité active, mais inaction. On laisse passer. Le système apprend que c\'est toléré.',
    nature: 'On ne regarde pas',
    couleurFond: '#FFFBEB',
    couleurTrait: '#B45309',
    axeHorizontal: 'voix_presente',
    axeVertical: 'inaction',
  },
  SE: {
    code: 'SE',
    position: 'S-E',
    label: 'Tache aveugle par façade',
    sousTitre: '2e angle mort',
    description: 'Présence symbolique sans pouvoir. On affiche, on coche, mais la décision se prend ailleurs.',
    nature: 'On croit voir',
    couleurFond: '#F5F3FF',
    couleurTrait: '#6D28D9',
    axeHorizontal: 'voix_absente',
    axeVertical: 'inaction',
  },
};

// Ordre d'affichage sur le plateau (N-O, N-E, S-O, S-E)
export const QUADRANTS_ORDER: Quadrant[] = ['NO', 'NE', 'SO', 'SE'];

// Libellés des axes pour l'affichage
export const AXE_HORIZONTAL = {
  gauche: 'Présence voix',
  droite: 'Absence voix',
};

export const AXE_VERTICAL = {
  haut: 'Action équitable / explicite',
  bas: 'Inaction / Symbolique',
};

// ============================================================
// FAMILLES DE CARTES (rappel : familles ≠ quadrants)
// ============================================================

export interface FamilleDef {
  code: 'REC' | 'MIC' | 'PRI' | 'CLI' | 'ALL';
  nom: string;
  description: string;
  couleur: string;
  plage: string;         // ex: '01–15'
  enTirageAleatoire: boolean;
}

export const FAMILLES: Record<string, FamilleDef> = {
  REC: {
    code: 'REC',
    nom: 'Recrutement',
    description: 'Canaux, critères, mérite, vivier. Où on cherche = qui on trouve.',
    couleur: '#101E33',
    plage: '01–15',
    enTirageAleatoire: true,
  },
  MIC: {
    code: 'MIC',
    nom: 'Micro & Charge',
    description: 'Blagues, interruptions, charge invisible, travail de traduction.',
    couleur: '#6B3620',
    plage: '16–30',
    enTirageAleatoire: true,
  },
  PRI: {
    code: 'PRI',
    nom: 'Privilège & Pouvoir',
    description: 'Qui est cru d\'emblée, qui doit prouver, qui est sponsorisé.',
    couleur: '#37203A',
    plage: '31–45',
    enTirageAleatoire: true,
  },
  CLI: {
    code: 'CLI',
    nom: 'Climat & Règles',
    description: 'Normes non dites, horaires, présentéisme, sécurité à parler.',
    couleur: '#0B2E33',
    plage: '46–60',
    enTirageAleatoire: true,
  },
  ALL: {
    code: 'ALL',
    nom: 'Alliés — Action',
    description: 'Jamais en tirage aléatoire. Réserve fermeture 56-70min. Choisi par facilitateur selon zone rouge la plus clivante.',
    couleur: '#123024',
    plage: '60–75',
    enTirageAleatoire: false,
  },
};
