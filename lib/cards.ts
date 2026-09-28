// ============================================================
// ANGLE MORT v3.3 — Les 75 cartes (60 diag + 15 ALL)
// Source de vérité : cards-data.js (projet HTML de référence)
// ============================================================

import type { CarteDiagnostique, CarteAll, Famille, FamilleTotale } from './types';

// ------------------------------------------------------------
// CARTES DIAGNOSTIQUES — REC (Recrutement, 01-15)
// ------------------------------------------------------------
const CARTES_REC: CarteDiagnostique[] = [
  {
    id: 'REC-01',
    famille: 'REC',
    titre: 'Le nom sur le CV',
    image: 'Deux CV côte à côte, contenus identiques, noms différents.',
    signal: 'On a pris le plus solide.',
    situation: 'Deux candidatures pour un poste en maintenance. Cinq ans d\'expérience chacune, mêmes qualifications. Samir Benali et Samuel Benard. Une seule personne convoquée en entrevue.',
    question: 'Quel critère a vraiment guidé le choix ? Sur quoi vous êtes-vous basé dans les premières secondes ?',
    motPiege: 'On a pris le plus solide.',
    extra: { type: 'effet', texte: 'Le même filtre s\'applique à chaque cycle d\'embauche, sans qu\'on l\'énonce jamais.' },
  },
  {
    id: 'REC-02',
    famille: 'REC',
    titre: 'Le fit culturel',
    image: 'Cinq silhouettes de dos dans un bureau ouvert.',
    signal: 'Elle n\'aurait pas fite avec la gang.',
    situation: 'Candidate excellente techniquement. Le comité conclut qu\'elle « ne fite pas avec la culture d\'équipe ». Aucun critère précis n\'est formulé.',
    question: 'Quel comportement observable le mot « fit » remplace-t-il ici ? Si aucun, qu\'a-t-on vraiment évalué ?',
    motPiege: 'Elle n\'aurait pas fite avec la gang.',
    extra: { type: 'effet', texte: 'Le mot revient à chaque comité de sélection, jamais défini, jamais contesté.' },
  },
  {
    id: 'REC-03',
    famille: 'REC',
    titre: 'L\'accent au téléphone',
    image: 'Casque d\'écoute sur des notes d\'entrevue.',
    signal: 'Nos clients ne comprendront pas.',
    situation: 'Entrevue téléphonique pour un poste en service à la clientèle. Le candidat répond correctement, avec un accent. Le gestionnaire note : « communication à valider ».',
    question: 'Qu\'a-t-on évalué : la clarté du message ou la familiarité de l\'accent ? Comment distinguer les deux ?',
    motPiege: 'Nos clients ne comprendront pas.',
    extra: { type: 'effet', texte: 'Chaque appel filtré de la même façon façonne qui accède au poste.' },
  },
  {
    id: 'REC-04',
    famille: 'REC',
    titre: 'Le trou dans le CV',
    image: 'Ligne du temps avec un intervalle vide de 18 mois.',
    signal: 'Il y a un trou, c\'est louche.',
    situation: 'Dix-huit mois sans emploi entre 2023 et 2024. Le comité passe à la candidate suivante sans poser de question. Le trou correspondait à un congé de proche aidant.',
    question: 'Quelle histoire le groupe s\'est-il racontée pour éviter de poser la question ?',
    motPiege: 'Il y a un trou, c\'est louche.',
    extra: { type: 'effet', texte: 'Le même silence écarte, année après année, les mêmes parcours de vie.' },
  },
  {
    id: 'REC-05',
    famille: 'REC',
    titre: 'La question de trop',
    image: 'Stylo suspendu au-dessus d\'une case vide d\'un formulaire.',
    signal: 'C\'est juste pour planifier.',
    situation: 'En fin d\'entrevue, un gestionnaire demande à une candidate de 31 ans si elle prévoit fonder une famille bientôt, car le poste demande de la stabilité.',
    question: 'Cette question a-t-elle été posée au candidat masculin de 31 ans ? Que révèle la réponse ?',
    motPiege: 'C\'est juste pour planifier.',
    extra: { type: 'effet', texte: 'Posée à chaque candidate du même âge, la question devient une politique non écrite.' },
  },
  {
    id: 'REC-06',
    famille: 'REC',
    titre: 'Le profil peu agile',
    image: 'Deux mains, un téléphone et un carnet sur un bureau.',
    signal: 'Il ne serait pas à l\'aise avec nos outils.',
    situation: 'Candidat de 57 ans, vingt-deux ans d\'expérience, écarté avant l\'entrevue. Motif : « profil peu susceptible d\'être agile numériquement ». Aucun test n\'appuie ce motif.',
    question: 'Quel signe a servi de preuve ? Que faudrait-il pour transformer cette impression en mesure réelle ?',
    motPiege: 'Il ne serait pas à l\'aise avec nos outils.',
    extra: { type: 'effet', texte: 'L\'âge devient un filtre invisible, répété à chaque affichage de poste.' },
  },
  {
    id: 'REC-07',
    famille: 'REC',
    titre: 'Le réseau qui se reproduit',
    image: 'Deux tasses de café sur un bureau.',
    signal: 'On a un excellent programme de référencement.',
    situation: '70 % des embauches viennent de références d\'employés. La direction en est fière. La composition de l\'équipe n\'a pas changé en huit ans.',
    question: 'Ce mécanisme n\'exclut personne explicitement. Alors qu\'est-ce qu\'il produit, année après année ?',
    motPiege: 'On a un excellent programme de référencement.',
    compteur: '70%',
    compteurLabel: 'des embauches viennent de références',
    extra: { type: 'effet', texte: 'Huit ans plus tard, l\'équipe n\'a toujours pas changé de visage.' },
  },
  {
    id: 'REC-08',
    famille: 'REC',
    titre: 'L\'équivalence introuvable',
    image: 'Diplôme rédigé dans une langue non identifiable, avec un tampon.',
    signal: 'On ne peut pas vraiment évaluer ça.',
    situation: 'Ingénieure avec neuf ans d\'expérience à l\'étranger. L\'affichage exige un « diplôme canadien ou équivalence reconnue ». Elle n\'a pas encore l\'équivalence.',
    question: 'L\'exigence protège-t-elle la compétence, ou l\'incertitude de la personne qui évalue ?',
    motPiege: 'On ne peut pas vraiment évaluer ça.',
    extra: { type: 'effet', texte: 'Le même obstacle administratif revient à chaque candidature internationale.' },
  },
  {
    id: 'REC-09',
    famille: 'REC',
    titre: 'Le prénom raccourci',
    image: 'Étiquette nominative dont la fin est coupée.',
    signal: 'On va t\'appeler Kat, ce sera plus simple.',
    situation: 'Premier jour. La gestionnaire annonce qu\'on utilisera une version raccourcie du prénom de l\'employée, « parce que personne ne le prononcera correctement ». Personne n\'a demandé son avis.',
    question: 'Que dit ce geste sur qui doit faire l\'effort d\'adaptation ? Quel serait le coût de l\'autre option ?',
    motPiege: 'On va t\'appeler Kat, ce sera plus simple.',
    extra: { type: 'effet', texte: 'Le geste se répète à chaque embauche jugée « difficile à prononcer ».' },
  },
  {
    id: 'REC-10',
    famille: 'REC',
    titre: 'Le précédent refusé',
    image: 'Porte de salle de réunion entrouverte.',
    signal: 'On ne voudrait pas créer de précédent.',
    situation: 'Un candidat autiste demande de recevoir les questions par écrit cinq minutes avant l\'entrevue. Le comité refuse : « ce ne serait pas équitable pour les autres ».',
    question: 'Qu\'a-t-on mesuré ici : sa capacité à faire le travail, ou sa capacité à faire une entrevue ?',
    motPiege: 'On ne voudrait pas créer de précédent.',
    extra: { type: 'effet', texte: 'Chaque refus d\'accommodement referme un peu plus la porte au suivant.' },
  },
  {
    id: 'REC-11',
    famille: 'REC',
    titre: 'Les trois mêmes lunettes',
    image: 'Trois chaises identiques face à une quatrième.',
    signal: 'On veut trois évaluateurs pour être objectifs.',
    situation: 'Comité de trois personnes, même service, même formation, dix ans d\'ancienneté chacune. Elles notent indépendamment et arrivent presque toujours au même résultat.',
    question: 'Trois évaluateurs qui lisent les mêmes signes : est-ce trois avis, ou un seul avis répété trois fois ?',
    motPiege: 'On veut trois évaluateurs pour être objectifs.',
    extra: { type: 'effet', texte: 'Le comité se renouvelle rarement — et le résultat non plus.' },
  },
  {
    id: 'REC-12',
    famille: 'REC',
    titre: 'Le profil consulté en privé',
    image: 'Curseur sur une vignette de profil LinkedIn floutée.',
    signal: 'Je voulais juste voir qui c\'était.',
    situation: 'Avant la présélection, un gestionnaire consulte les profils LinkedIn des candidats. Deux personnes sont écartées après cette consultation. Les motifs ne sont pas consignés.',
    question: 'Quelle information a été ajoutée au dossier ? Laquelle a été retirée du processus officiel ?',
    motPiege: 'Je voulais juste voir qui c\'était.',
    extra: { type: 'effet', texte: 'La pratique se répète à chaque cycle, hors de toute trace officielle.' },
  },
  {
    id: 'REC-13',
    famille: 'REC',
    titre: 'L\'échelle non affichée',
    image: 'Affichage de poste avec la ligne salaire vide.',
    signal: 'On s\'ajuste selon l\'expérience.',
    situation: 'L\'échelle salariale n\'est pas affichée. Deux personnes, même poste, même semaine d\'entrée : neuf pour cent d\'écart. Celle qui a le plus négocié avait déjà travaillé ici.',
    question: 'Qui gagne dans un système où le salaire dépend de l\'aisance à négocier ? Est-ce lié au poste ?',
    motPiege: 'On s\'ajuste selon l\'expérience.',
    extra: { type: 'effet', texte: 'L\'écart se creuse un peu plus à chaque négociation individuelle.' },
  },
  {
    id: 'REC-14',
    famille: 'REC',
    titre: 'Le comité sans budget',
    image: 'Ordre du jour sans ligne budgétaire.',
    signal: 'On a un comité EDI très actif.',
    situation: 'Le comité EDI existe depuis trois ans. Réunions sur l\'heure du dîner, hors heures payées, sans budget ni pouvoir décisionnel. Onze recommandations, aucune mise en œuvre.',
    question: 'Le comité est présent. Qu\'est-ce qui lui manque pour que sa présence change quelque chose ?',
    motPiege: 'On a un comité EDI très actif.',
    extra: { type: 'effet', texte: 'Trois ans, onze recommandations, zéro mise en œuvre.' },
  },
  {
    id: 'REC-15',
    famille: 'REC',
    titre: 'Gardée en tête',
    image: 'Dossier posé sur une pile, jamais rouvert.',
    signal: 'On la garde en tête pour la prochaine fois.',
    situation: 'Excellente en entrevue, elle n\'est pas retenue. On lui écrit qu\'on la garde en tête. Trois postes similaires s\'ouvrent en quatorze mois. Elle n\'est jamais recontactée.',
    question: 'Entre l\'intention et l\'appel, qu\'est-ce qui a manqué : la mémoire, ou un système ?',
    motPiege: 'On la garde en tête pour la prochaine fois.',
    extra: { type: 'effet', texte: 'Quatorze mois, trois postes similaires, un seul silence répété.' },
  },
];

// ------------------------------------------------------------
// CARTES DIAGNOSTIQUES — MIC (Micro-agressions, 01-15)
// ------------------------------------------------------------
const CARTES_MIC: CarteDiagnostique[] = [
  {
    id: 'MIC-01',
    famille: 'MIC',
    titre: 'D\'où tu viens vraiment',
    image: 'Carte du monde punaisée au mur d\'une cuisine.',
    signal: 'Non mais... d\'où tu viens vraiment ?',
    situation: 'Pause-café. Un collègue demande à Léa d\'où elle vient. Elle répond : Longueuil. Il insiste : « Non mais avant ça ? » Elle est née à Longueuil. Sa mère aussi.',
    question: 'Quel signe a été lu sur elle avant qu\'un mot soit prononcé ? Que cherchait vraiment la question ?',
    motPiege: 'Non mais... d\'où tu viens vraiment ?',
    extra: { type: 'effet', texte: 'C\'est la 14e fois cette année.' },
  },
  {
    id: 'MIC-02',
    famille: 'MIC',
    titre: 'Agressive',
    image: 'Fil de messagerie avec une ligne surlignée.',
    signal: 'On dirait que tu deviens agressive.',
    situation: 'Fatou conteste un échéancier avec des chiffres. Son gestionnaire lui dit de « travailler son ton ». Deux semaines plus tôt, Éric a contesté le même échéancier en haussant la voix. On a dit qu\'il avait du caractère.',
    question: 'Le même comportement a reçu deux noms. Qu\'est-ce qui a changé : le comportement ou la personne ?',
    motPiege: 'On dirait que tu deviens agressive.',
    extra: { type: 'effet', texte: 'Elle intervient moins en réunion.' },
  },
  {
    id: 'MIC-03',
    famille: 'MIC',
    titre: 'La main dans les cheveux',
    image: 'Main tendue vers une mèche tressée. Aucun visage.',
    signal: 'Je peux toucher ? C\'est exotique !',
    situation: 'Aisha arrive avec une nouvelle coiffure. Une collègue tend la main vers sa tête et touche avant la réponse. Trois personnes rient. Aisha sourit et ne dit rien.',
    question: 'Quel signe le corps d\'Aisha a-t-il reçu, indépendamment de l\'intention ? Que dit le sourire ?',
    motPiege: 'Je peux toucher ? C\'est exotique !',
    extra: { type: 'effet', texte: 'C\'est arrivé à chaque changement de coiffure.' },
  },
  {
    id: 'MIC-04',
    famille: 'MIC',
    titre: 'Les gars, vous comprenez',
    image: 'Table de réunion vue de haut, sept tasses.',
    signal: 'Les gars, vous comprenez ce que je veux dire.',
    situation: 'Le directeur lance une blague sur « la conjointe qui ne comprend rien à la technique ». Rires. Marianne, seule femme du comité, regarde son écran.',
    question: 'À qui la phrase confirme-t-elle l\'appartenance ? À qui rappelle-t-elle qu\'elle est de passage ?',
    motPiege: 'Les gars, vous comprenez ce que je veux dire.',
    extra: { type: 'effet', texte: 'C\'est la troisième réunion de suite.' },
  },
  {
    id: 'MIC-05',
    famille: 'MIC',
    titre: 'Le compliment de trop',
    image: 'Rapport imprimé avec une note en marge.',
    signal: 'Ton français est impeccable, félicitations !',
    situation: 'Après une présentation d\'une heure, le seul commentaire à Karim porte sur son français. Il a fait sa maîtrise à Sherbrooke. Personne ne parle des résultats.',
    question: 'Ce compliment place la personne dans quelle catégorie ? Qu\'est-ce qui n\'a pas été commenté ?',
    motPiege: 'Ton français est impeccable, félicitations !',
    extra: { type: 'effet', texte: 'Son travail est commenté sur la forme, celui des autres sur le fond.' },
  },
  {
    id: 'MIC-06',
    famille: 'MIC',
    titre: 'Le prénom qu\'on ne retient jamais',
    image: 'Liste de participants avec un nom écorché.',
    signal: 'Excuse-moi, c\'est compliqué.',
    situation: 'Dix-huit mois d\'ancienneté. Le nom de Nguyen est écorché dans tous les courriels, orthographié de trois façons. Un collègue arrive le même mois : Simon.',
    question: 'Quel effort a été jugé optionnel ? Sur qui repose la charge de la correction ?',
    motPiege: 'Excuse-moi, c\'est compliqué.',
    extra: { type: 'effet', texte: 'Il a arrêté de corriger après six mois.' },
  },
  {
    id: 'MIC-07',
    famille: 'MIC',
    titre: 'Le mégenrage répété',
    image: 'Signature de courriel avec pronoms en gris.',
    signal: 'J\'oublie tout le temps.',
    situation: 'Alex a indiqué ses pronoms. Un gestionnaire continue d\'utiliser les mauvais pronoms, se corrige avec un rire, et recommence. Depuis quatre mois.',
    question: 'Après quatre mois, l\'oubli est-il encore un oubli ? Que ferait quelqu\'un qui voudrait y arriver ?',
    motPiege: 'J\'oublie tout le temps.',
    extra: { type: 'effet', texte: 'Alex évite les réunions avec ce gestionnaire.' },
  },
  {
    id: 'MIC-08',
    famille: 'MIC',
    titre: 'La question médicale',
    image: 'Canne appuyée contre un bureau.',
    signal: 'Qu\'est-ce qui t\'est arrivé ?',
    situation: 'Nouvelle employée avec une canne. Dans sa première semaine, six personnes lui demandent ce qui lui est arrivé. Deux lui disent qu\'elle est « courageuse ». Personne ne demande son dossier.',
    question: 'Quelle relation ces questions établissent-elles ? Quelle conversation n\'a pas eu lieu ?',
    motPiege: 'Qu\'est-ce qui t\'est arrivé ?',
    extra: { type: 'effet', texte: 'Elle est connue pour sa canne, pas pour son mandat.' },
  },
  {
    id: 'MIC-09',
    famille: 'MIC',
    titre: 'Le repas d\'équipe',
    image: 'Plateau de sandwichs et une bière.',
    signal: 'Come on, 5 à 7 au pub !',
    situation: 'Toutes les activités sont des 5 à 7 dans un pub. Deux personnes n\'y vont jamais : l\'une ne boit pas, l\'autre a la garde en semaine. Le gestionnaire note qu\'elles « ne s\'impliquent pas ».',
    question: 'Où la vie d\'équipe se joue-t-elle réellement ? Qui a choisi ce format ?',
    motPiege: 'Come on, 5 à 7 au pub !',
    extra: { type: 'effet', texte: 'Deux ans d\'invitations impossibles.' },
  },
  {
    id: 'MIC-10',
    famille: 'MIC',
    titre: 'Le porte-parole du groupe',
    image: 'Fauteuil isolé face à un cercle.',
    signal: 'Toi, tu peux nous expliquer...',
    situation: 'En comité, le sujet des congés religieux arrive. Le gestionnaire se tourne vers Yasmine, seule musulmane : « Toi tu peux nous expliquer la communauté ? » Elle n\'est pas responsable du dossier.',
    question: 'Quel rôle lui a été attribué sans son accord ? Qui a été dispensé de faire ses recherches ?',
    motPiege: 'Toi, tu peux nous expliquer...',
    extra: { type: 'effet', texte: 'Consultée sur son identité, jamais sur son expertise.' },
  },
  {
    id: 'MIC-11',
    famille: 'MIC',
    titre: 'Le surnom imposé',
    image: 'Badge avec un surnom écrit au marqueur.',
    signal: 'On t\'appellera Mike, c\'est plus facile.',
    situation: 'Mohammed arrive. Dès le premier jour, un collègue l\'appelle Mike. Mohammed préfère son prénom. Le surnom se répand. Personne ne lui demande son avis.',
    question: 'Qui décide du nom qu\'une personne porte ? Quel message sur l\'appartenance ?',
    motPiege: 'On t\'appellera Mike, c\'est plus facile.',
    extra: { type: 'effet', texte: 'Il répond au surnom, même si ça le gêne.' },
  },
  {
    id: 'MIC-12',
    famille: 'MIC',
    titre: 'La supposition de compétence',
    image: 'Ordinateur avec logiciel de programmation.',
    signal: 'Toi qui es asiatique, tu dois être bon.',
    situation: 'Un gestionnaire dit à Lin : « Toi qui es asiatique, tu vas nous aider avec le tableur ? » Lin étudie en RH, pas en informatique.',
    question: 'Quel stéréotype est mobilisé ? Comment cette attente affecte-t-elle la personne ?',
    motPiege: 'Toi qui es asiatique, tu dois être bon.',
    extra: { type: 'effet', texte: 'Elle se sent réduite à une origine.' },
  },
  {
    id: 'MIC-13',
    famille: 'MIC',
    titre: 'Le ton paternaliste',
    image: 'Main sur une épaule, geste protecteur.',
    signal: 'Ma petite, tu vas apprendre.',
    situation: 'Une cadre de 29 ans présente un projet. Un collègue plus âgé : « Ma petite, tu vas apprendre avec le temps. » Elle dirige l\'équipe depuis deux ans.',
    question: 'Quel rapport de pouvoir ce geste établit-il ? Que dit-il de son autorité ?',
    motPiege: 'Ma petite, tu vas apprendre.',
    extra: { type: 'effet', texte: 'Son autorité est minée devant l\'équipe.' },
  },
  {
    id: 'MIC-14',
    famille: 'MIC',
    titre: 'L\'humour qui exclut',
    image: 'Mème partagé dans un canal Slack.',
    signal: 'C\'est juste une blague, relaxe.',
    situation: 'Un collègue partage un mème sur les « femmes au volant ». Trois rient. Deux ne réagissent pas. La seule femme quitte le canal.',
    question: 'Qui est la cible de l\'humour ? Que signifie le silence des autres ?',
    motPiege: 'C\'est juste une blague, relaxe.',
    extra: { type: 'effet', texte: 'Elle ne participe plus aux échanges informels.' },
  },
  {
    id: 'MIC-15',
    famille: 'MIC',
    titre: 'La comparaison alimentaire',
    image: 'Deux assiettes, aliments inconnus vs sandwich.',
    signal: 'Ça sent fort, c\'est quoi ça ?',
    situation: 'Une collègue réchauffe un plat de sa culture. Un collègue fait une grimace : « Ça sent fort, c\'est quoi ça ? » Elle n\'ose plus manger à la pause.',
    question: 'Quelle norme est érigée en référence ? Qui doit s\'adapter ?',
    motPiege: 'Ça sent fort, c\'est quoi ça ?',
    extra: { type: 'effet', texte: 'Elle mange seule, à son poste.' },
  },
];

// ------------------------------------------------------------
// CARTES DIAGNOSTIQUES — PRI (Privilège et pouvoir, 01-15)
// ------------------------------------------------------------
const CARTES_PRI: CarteDiagnostique[] = [
  {
    id: 'PRI-01',
    famille: 'PRI',
    titre: 'Qui parle',
    image: 'Graphique en barres : trois longues, cinq courtes.',
    signal: 'Tout le monde a eu l\'occasion de parler.',
    situation: 'Réunion de neuf personnes, une heure. Trois occupent les trois quarts du temps. Deux ne parlent que si on les nomme. Quatre décisions, toutes des mêmes trois.',
    question: 'Qui décide dans cette équipe ? Qu\'est-ce qui produit ce résultat ?',
    motPiege: 'Tout le monde a eu l\'occasion de parler.',
    compteur: '72%',
    compteurLabel: 'du temps de parole pour 3 sur 9',
    extra: { type: 'effet', texte: 'La même répartition se reproduit, réunion après réunion.' },
  },
  {
    id: 'PRI-02',
    famille: 'PRI',
    titre: 'Qui prend les notes',
    image: 'Carnet ouvert, ordinateur fermé à côté.',
    signal: 'On est une bonne équipe, tout le monde participe.',
    situation: 'Sur douze réunions, la même conseillère a pris les notes onze fois. Elle ne présente jamais. Ceux qui présentent n\'ont jamais pris de notes.',
    question: 'Qui accumule de la visibilité, qui accumule la charge invisible ?',
    motPiege: 'On est une bonne équipe, tout le monde participe.',
    compteur: '11/12',
    compteurLabel: 'réunions notées par la même personne',
    extra: { type: 'effet', texte: 'L\'écart devient écart de carrière.' },
  },
  {
    id: 'PRI-03',
    famille: 'PRI',
    titre: 'Le mentorat de couloir',
    image: 'Deux silhouettes près d\'une machine à café.',
    signal: 'Les gens se développent naturellement.',
    situation: 'Pas de programme de mentorat. Six promotions en deux ans, cinq concernent des personnes qui jouent au hockey avec deux directeurs. Processus respecté.',
    question: 'Le processus est irréprochable. Où la décision s\'est-elle construite ?',
    motPiege: 'Les gens se développent naturellement.',
    compteur: '5/6',
    compteurLabel: 'promotions du même réseau',
    extra: { type: 'effet', texte: 'Le réseau informel décide.' },
  },
  {
    id: 'PRI-04',
    famille: 'PRI',
    titre: 'L\'horaire du pouvoir',
    image: 'Calendrier avec réunion bloquée à 16h30.',
    signal: 'On a calé la réunion à l\'horaire qui convient à tout le monde.',
    situation: 'Comité à 16h30 le jeudi. Deux membres partent à 16h pour la garderie. Ils reçoivent le compte rendu. Jamais participé à un arbitrage.',
    question: 'Qui a défini « tout le monde » ? Participer au compte rendu, c\'est quoi ?',
    motPiege: 'On a calé la réunion à l\'horaire qui convient à tout le monde.',
    compteur: '4/5',
    compteurLabel: 'réunions après 16h',
    extra: { type: 'effet', texte: 'Exclus des décisions.' },
  },
  {
    id: 'PRI-05',
    famille: 'PRI',
    titre: 'Télétravail variable',
    image: 'Deux formulaires, un approuvé, un vierge.',
    signal: 'On gère au cas par cas, c\'est plus humain.',
    situation: 'Politique : « télétravail au cas par cas, à la discrétion du gestionnaire ». Cinq refus : quatre d\'un même service, une en retour de congé parental. Aucun motif consigné.',
    question: '« Au cas par cas » protège quoi et qui ? Que faudrait-il pour contester ?',
    motPiege: 'On gère au cas par cas, c\'est plus humain.',
    compteur: '9/14',
    compteurLabel: 'demandes approuvées, aucun critère',
    extra: { type: 'effet', texte: 'Décisions inégales, inexpliquées.' },
  },
  {
    id: 'PRI-06',
    famille: 'PRI',
    titre: 'L\'espace physique',
    image: 'Plan d\'étage, zone périphérique.',
    signal: 'On manque de place, on a optimisé.',
    situation: 'Bureaux fermés sur la rue. Postes du soutien administratif, majoritairement femmes, dans le corridor sans fenêtre, près des salles de bain. Personne n\'a décidé cela.',
    question: 'Qui était dans la salle ? Qu\'est-ce que l\'espace dit aux occupants ?',
    motPiege: 'On manque de place, on a optimisé.',
    compteur: '0',
    compteurLabel: 'poste à fenêtre pour l\'équipe de nuit',
    extra: { type: 'effet', texte: 'Hiérarchie spatiale invisible.' },
  },
  {
    id: 'PRI-07',
    famille: 'PRI',
    titre: 'Le budget du comité',
    image: 'Deux lignes budgétaires, une à zéro.',
    signal: 'On a un comité EDI très impliqué.',
    situation: 'Comité EDI : réunions sur l\'heure du dîner, hors heures payées. Comité social : budget 12 000 $. Même rubrique au rapport annuel.',
    question: 'Lequel a du pouvoir ? Que dit la ligne budgétaire ?',
    motPiege: 'On a un comité EDI très impliqué.',
    compteur: '0$',
    compteurLabel: 'de budget, 11 recommandations',
    extra: { type: 'effet', texte: 'Symbolique sans moyens.' },
  },
  {
    id: 'PRI-08',
    famille: 'PRI',
    titre: 'La charge de l\'inclusion',
    image: 'Pile de dossiers sur un coin de bureau.',
    signal: 'On valorise la diversité des voix.',
    situation: 'Trois personnes racisées siègent à tous les comités EDI, animent les activités, relisent les communications. Travail non décrit, non évalué, non rémunéré.',
    question: 'Qui fait le travail, qui en récolte la réputation ?',
    motPiege: 'On valorise la diversité des voix.',
    compteur: '3',
    compteurLabel: 'personnes, 100% des initiatives',
    extra: { type: 'effet', texte: 'Surcharge invisible.' },
  },
  {
    id: 'PRI-09',
    famille: 'PRI',
    titre: 'L\'accès à l\'information',
    image: 'Serveur avec dossiers verrouillés.',
    signal: 'On fait confiance à ceux qui sont là depuis longtemps.',
    situation: 'Trois personnes ont accès à tous les dossiers stratégiques. Les autres doivent faire une demande écrite. Les trois sont des hommes blancs, 10+ ans d\'ancienneté.',
    question: 'Qui a été désigné « de confiance » par défaut ? Quels critères ?',
    motPiege: 'On fait confiance à ceux qui sont là depuis longtemps.',
    compteur: '3/12',
    compteurLabel: 'dossiers accessibles sans demande',
    extra: { type: 'effet', texte: 'Privilège d\'accès.' },
  },
  {
    id: 'PRI-10',
    famille: 'PRI',
    titre: 'Langage du leadership',
    image: 'Tableau : « assertif », « leader », « fort ».',
    signal: 'On cherche des leaders naturels.',
    situation: 'Dix descriptions de poste de gestion. Huit utilisent « assertif », « dominateur », « alpha ». Aucune femme embauchée à ces postes en trois ans.',
    question: 'Le langage attire-t-il un profil ? Qui se reconnaît ?',
    motPiege: 'On cherche des leaders naturels.',
    compteur: '8/10',
    compteurLabel: 'descriptions masculinisées',
    extra: { type: 'effet', texte: 'Filtre linguistique.' },
  },
  {
    id: 'PRI-11',
    famille: 'PRI',
    titre: 'Visibilité sélective',
    image: 'Mur de photos, mêmes personnes.',
    signal: 'On met en avant nos meilleurs éléments.',
    situation: '50 photos sur le site. 90 % montrent les mêmes 12 cadres seniors. Employés de première ligne, majoritairement femmes racisées, jamais.',
    question: 'Qui est le visage de l\'entreprise ? Qui est invisible ?',
    motPiege: 'On met en avant nos meilleurs éléments.',
    compteur: '90%',
    compteurLabel: 'photos des mêmes 12 personnes',
    extra: { type: 'effet', texte: 'Représentation partiale.' },
  },
  {
    id: 'PRI-12',
    famille: 'PRI',
    titre: 'Droit à l\'erreur',
    image: 'Tampon « ÉCHEC » vs « OPPORTUNITÉ ».',
    signal: 'Les erreurs font partie de l\'apprentissage.',
    situation: 'Vingt erreurs documentées. Erreurs de femmes : 5 fois plus de commentaires négatifs que celles des hommes, impacts similaires.',
    question: 'Qui a le droit d\'échouer ? Qui est jugé sur son pire ?',
    motPiege: 'Les erreurs font partie de l\'apprentissage.',
    compteur: '1/5',
    compteurLabel: 'erreurs de femmes jugées plus sévèrement',
    extra: { type: 'effet', texte: 'Double standard.' },
  },
  {
    id: 'PRI-13',
    famille: 'PRI',
    titre: 'Mobilité imposée',
    image: 'Carte avec flèches vers villes lointaines.',
    signal: 'La mobilité, c\'est le prix pour avancer.',
    situation: 'Huit promotions en direction exigeaient mobilité géographique. Aucune politique pour proches aidants. Sept promus : hommes sans enfants à charge.',
    question: 'La mobilité est-elle une exigence ou un filtre ? Qui peut répondre ?',
    motPiege: 'La mobilité, c\'est le prix pour avancer.',
    compteur: '7/8',
    compteurLabel: 'promotions exigent mobilité',
    extra: { type: 'effet', texte: 'Filtre structurel.' },
  },
  {
    id: 'PRI-14',
    famille: 'PRI',
    titre: 'Réseau d\'anciens',
    image: 'Annuaire d\'anciens élèves.',
    signal: 'On recrute dans les meilleures écoles.',
    situation: '60 % des cadres viennent de trois universités. Le PDG y a étudié. Stages ciblés sur ces établissements. Candidats d\'autres parcours rares en finale.',
    question: 'Le réseau reproduit-il l\'excellence ou la familiarité ?',
    motPiege: 'On recrute dans les meilleures écoles.',
    compteur: '60%',
    compteurLabel: 'cadres de 3 universités',
    extra: { type: 'effet', texte: 'Reproduction sociale.' },
  },
  {
    id: 'PRI-15',
    famille: 'PRI',
    titre: 'Parole en réunion',
    image: 'Micro sur table, deux mains.',
    signal: 'Ici, tout le monde peut s\'exprimer librement.',
    situation: 'Vingt réunions de direction. Hommes : 85 % du temps. Femmes interrompues 3 fois plus. Idées de femmes reprises par hommes mieux accueillies.',
    question: 'Qui est écouté, qui est entendu ? Quel mécanisme ?',
    motPiege: 'Ici, tout le monde peut s\'exprimer librement.',
    compteur: '85%',
    compteurLabel: 'temps de parole par les hommes',
    extra: { type: 'effet', texte: 'Invisibilisation systématique.' },
  },
];

// ------------------------------------------------------------
// CARTES DIAGNOSTIQUES — CLI (Clients et service, 01-15)
// ------------------------------------------------------------
const CARTES_CLI: CarteDiagnostique[] = [
  {
    id: 'CLI-01',
    famille: 'CLI',
    titre: 'Prénom au dossier',
    image: 'Écran de caisse, champ civilité binaire.',
    signal: 'Le système ne me laisse pas le choix.',
    situation: 'Cliente trans au comptoir. Dossier affiche ancien prénom légal. Employé lit à voix haute devant la file. Logiciel sans autre option.',
    question: 'Quelle part du problème est systémique ? Que peut faire l\'employé ?',
    motPiege: 'Le système ne me laisse pas le choix.',
    extra: { type: 'cout', texte: 'Cliente perdue, avis public, employé improvise.' },
  },
  {
    id: 'CLI-02',
    famille: 'CLI',
    titre: 'Le soupir',
    image: 'Guichet libre-service, main hésitante.',
    signal: 'C\'est pourtant écrit là.',
    situation: 'Client de 78 ans n\'arrive pas à valider. Employée soupire, prend l\'appareil, complète sans un mot, lui rend.',
    question: 'Problème réglé ou reporté ? Quel signe le soupir ?',
    motPiege: 'C\'est pourtant écrit là.',
    extra: { type: 'cout', texte: 'Client reviendra, coût plus élevé.' },
  },
  {
    id: 'CLI-03',
    famille: 'CLI',
    titre: 'Porte de 78 cm',
    image: 'Seuil avec marche de 10 cm.',
    signal: 'On est accessibles, rampe en arrière.',
    situation: 'Entrée principale avec marche. Rampe à l\'arrière, près des conteneurs, faut sonner. Site web : « accessible ».',
    question: 'Techniquement accessible. Quel message le trajet ?',
    motPiege: 'On est accessibles, rampe en arrière.',
    extra: { type: 'cout', texte: 'Clientèle invisible dans les données.' },
  },
  {
    id: 'CLI-04',
    famille: 'CLI',
    titre: 'Client suivi',
    image: 'Miroir de surveillance.',
    signal: 'Protocole de prévention des pertes.',
    situation: 'Deux adolescents entrent. Employé les suit. Protocole : « surveiller comportements suspects » sans définition. 80 % des interventions : clients racisés.',
    question: 'Que surveille-t-on sans définition ?',
    motPiege: 'Protocole de prévention des pertes.',
    extra: { type: 'cout', texte: 'Risque de plainte, réputation.' },
  },
  {
    id: 'CLI-05',
    famille: 'CLI',
    titre: 'Qui parle au client',
    image: 'Deux personnes, une regardée.',
    signal: 'Vous pouvez traduire ?',
    situation: 'Cliente avec sa fille adulte. Cliente parle français avec accent. Employé s\'adresse à la fille, questions personnelles sur le dossier de la mère.',
    question: 'Qui a été effacé de sa transaction ?',
    motPiege: 'Vous pouvez traduire ?',
    extra: { type: 'cout', texte: 'Consentement de la mauvaise personne.' },
  },
  {
    id: 'CLI-06',
    famille: 'CLI',
    titre: 'Formulaire impossible',
    image: 'Formulaire avec cases binaires.',
    signal: 'C\'est le formulaire officiel.',
    situation: 'Formulaire d\'ouverture de compte : civilité binaire, un seul prénom. Conçu en 2009. Quatre signalements. Utilisé 400 fois/mois.',
    question: 'Quatre signalements, aucun changement : quel processus manque ?',
    motPiege: 'C\'est le formulaire officiel.',
    extra: { type: 'cout', texte: '400 irritants/mois, données pauvres.' },
  },
  {
    id: 'CLI-07',
    famille: 'CLI',
    titre: 'Client hostile',
    image: 'Comptoir vu de l\'employé.',
    signal: 'Le client a toujours raison.',
    situation: 'Client ton méprisant à employée voilée, demande « quelqu\'un d\'autre ». Gérant s\'excuse au client, sert lui-même, dit : « ne le prenez pas personnel ».',
    question: 'Deux personnes servies. Laquelle protégée ?',
    motPiege: 'Le client a toujours raison.',
    extra: { type: 'cout', texte: 'Roulement personnel, prévention non remplie.' },
  },
  {
    id: 'CLI-08',
    famille: 'CLI',
    titre: 'Assistant vocal inaccessible',
    image: 'Kiosque tactile, pas d\'audio.',
    signal: 'La technologie, c\'est plus efficace.',
    situation: 'Kiosques libre-service pour toutes transactions. Pas d\'option vocale pour malvoyants. Client demande aide : « Le système est plus rapide. »',
    question: 'Efficacité pour qui ? Qui est exclu ?',
    motPiege: 'La technologie, c\'est plus efficace.',
    extra: { type: 'cout', texte: 'Clients exclus, plainte potentielle.' },
  },
  {
    id: 'CLI-09',
    famille: 'CLI',
    titre: 'Langue du service',
    image: 'Panneau « We speak English ».',
    signal: 'Tout le monde parle anglais, non ?',
    situation: 'Quartier francophone à Montréal. Panneaux uniquement en anglais. Employés répondent en anglais par défaut. Clients âgés se sentent exclus.',
    question: 'Qui est le client idéal ?',
    motPiege: 'Tout le monde parle anglais, non ?',
    extra: { type: 'cout', texte: 'Clientèle locale va ailleurs.' },
  },
  {
    id: 'CLI-10',
    famille: 'CLI',
    titre: 'Prix de la différence',
    image: 'Deux étiquettes, frais supplémentaires.',
    signal: 'Pour couvrir les frais.',
    situation: 'Frais supplémentaires pour « demandes spéciales », incluant adaptations handicap. Client en fauteuil : 25 $ de plus pour l\'accès.',
    question: 'Adaptation : luxe ou droit ? Qui devrait payer ?',
    motPiege: 'Pour couvrir les frais.',
    extra: { type: 'cout', texte: 'Risque juridique, réputation.' },
  },
  {
    id: 'CLI-11',
    famille: 'CLI',
    titre: 'Représentation publicitaire',
    image: 'Affiche : modèles blancs, minces, jeunes.',
    signal: 'C\'est ce qui vend le mieux.',
    situation: 'Campagnes : personnes blanches, minces, valides, 20-35 ans. Clientèle réelle plus diversifiée. Ventes stagnent.',
    question: 'Qui se reconnaît ? Qui est invisible ?',
    motPiege: 'C\'est ce qui vend le mieux.',
    extra: { type: 'cout', texte: 'Segments ignorés, image dépassée.' },
  },
  {
    id: 'CLI-12',
    famille: 'CLI',
    titre: 'Service à la chaîne',
    image: 'Script de service, cases à cocher.',
    signal: 'Je dois suivre le protocole.',
    situation: 'Agente suit un script rigide. Cliente explique une situation complexe. Agente : « Je ne peux pas dévier. » Cliente raccroche, frustrée.',
    question: 'Protocole : sert le client ou protège l\'entreprise ?',
    motPiege: 'Je dois suivre le protocole.',
    extra: { type: 'cout', texte: 'Client perdu, employé démotivé.' },
  },
  {
    id: 'CLI-13',
    famille: 'CLI',
    titre: 'Segmentation clients',
    image: 'Diagramme : Premium, Standard, Budget.',
    signal: 'On cible les clients rentables.',
    situation: 'Segmentation par « valeur ». Clients Budget : service minimal, délais longs, moins d\'options. Majoritairement faible revenu.',
    question: 'Rentabilité justifie-t-elle service à deux vitesses ?',
    motPiege: 'On cible les clients rentables.',
    extra: { type: 'cout', texte: 'Réputation élitisme, clients chiffrés.' },
  },
  {
    id: 'CLI-14',
    famille: 'CLI',
    titre: 'Feedback ignoré',
    image: 'Boîte à suggestions pleine.',
    signal: 'On a déjà assez de données.',
    situation: 'Clients envoient suggestions accessibilité. Aucune mise en œuvre depuis trois ans. Direction : « Assez de données. »',
    question: 'Quelles données comptent ? Lesquelles ignorées ?',
    motPiege: 'On a déjà assez de données.',
    extra: { type: 'cout', texte: 'Opportunités perdues, clients invisibles.' },
  },
  {
    id: 'CLI-15',
    famille: 'CLI',
    titre: 'Formation des employés',
    image: 'Manuel sans module diversité.',
    signal: 'Le service, c\'est naturel.',
    situation: 'Formation : aucun module sur diversité, accessibilité, inclusion. On présume que « c\'est naturel ». Plaintes discrimination augmentent.',
    question: 'Service inclusif : inné ou appris ?',
    motPiege: 'Le service, c\'est naturel.',
    extra: { type: 'cout', texte: 'Employés mal préparés, risques.' },
  },
];

// ------------------------------------------------------------
// CARTES ALL — Alliés en action (01-15)
// Réservées à la fermeture, jamais en tirage aléatoire
// ------------------------------------------------------------
// CARTES ALL — Alliés en action (01-15)
// Réservées à la fermeture, jamais en tirage aléatoire
// zoneCible = quadrant visé pour le tirage intelligent v4.0
// ------------------------------------------------------------
export const CARTES_ALL: CarteAll[] = [
  {
    id: 'ALL-01',
    famille: 'ALL',
    titre: 'Le levier de la parole',
    action: 'Mettre en place un tour de parole systématique en réunion : chacun s\'exprime une fois avant que quiconque reprenne la parole.',
    indicateur: '100% des réunions avec tour de table mesuré',
    delai: 'J+7',
    niveau: 1,
    couleur: '#123024',
    zoneCible: 'NO',
  },
  {
    id: 'ALL-02',
    famille: 'ALL',
    titre: 'La mesure impossible',
    action: 'Identifier une décision prise ce mois-ci sans données. Décider ce qu\'on mesurerait pour la prochaine fois.',
    indicateur: '1 décision instrumentée',
    delai: 'J+14',
    niveau: 1,
    couleur: '#123024',
    zoneCible: 'SO',
  },
  {
    id: 'ALL-03',
    famille: 'ALL',
    titre: 'Le test client',
    action: 'Tester une hypothèse client sur un segment ignoré. Poser une question simple, écouter la réponse.',
    indicateur: '1 entretien client tracé',
    delai: 'J+14',
    niveau: 1,
    couleur: '#123024',
    zoneCible: 'SE',
  },
  {
    id: 'ALL-04',
    famille: 'ALL',
    titre: 'La rotation invisible',
    action: 'Cartographier qui prend les notes, qui organise, qui parle en réunion. Rendre ce travail visible dans l\'évaluation.',
    indicateur: 'Carte publiée à l\'équipe',
    delai: 'J+14',
    niveau: 1,
    couleur: '#123024',
    zoneCible: 'SO',
  },
  {
    id: 'ALL-05',
    famille: 'ALL',
    titre: 'L\'interruption cadrée',
    action: 'Convenir d\'une phrase type pour interrompre proprement : « Je te coupe pour revenir au fait X. »',
    indicateur: '3 interruptions cadrées observées',
    delai: 'J+7',
    niveau: 1,
    couleur: '#123024',
    zoneCible: 'NE',
  },
  {
    id: 'ALL-06',
    famille: 'ALL',
    titre: 'La co-évaluation',
    action: 'Doubler chaque entretien d\'embauche d\'un second évaluateur. Confronter les notes après.',
    indicateur: '100% des entretiens doublés',
    delai: 'J+30',
    niveau: 2,
    couleur: '#123024',
    zoneCible: 'SO',
  },
  {
    id: 'ALL-07',
    famille: 'ALL',
    titre: 'Le pacte de parole',
    action: 'Mesurer le temps de parole à chaque réunion. Publier le chiffre.',
    indicateur: 'Chiffre publié chaque semaine',
    delai: 'J+30',
    niveau: 2,
    couleur: '#123024',
    zoneCible: 'SE',
  },
  {
    id: 'ALL-08',
    famille: 'ALL',
    titre: 'Le test hypothèse',
    action: 'Sur une décision sensible, formuler l\'hypothèse sous-jacente par écrit avant de décider. La tester.',
    indicateur: '1 hypothèse testée',
    delai: 'J+30',
    niveau: 2,
    couleur: '#123024',
    zoneCible: 'SO',
  },
  {
    id: 'ALL-09',
    famille: 'ALL',
    titre: 'La cartographie accès',
    action: 'Lister qui a accès à quelle information stratégique. Vérifier si le critère est explicite.',
    indicateur: 'Liste rendue visible',
    delai: 'J+30',
    niveau: 2,
    couleur: '#123024',
    zoneCible: 'NE',
  },
  {
    id: 'ALL-10',
    famille: 'ALL',
    titre: 'Le canal sécurisé',
    action: 'Ouvrir un canal de signalement anonyme, avec réponse sous 72h.',
    indicateur: 'Canal actif + communication',
    delai: 'J+30',
    niveau: 2,
    couleur: '#123024',
    zoneCible: 'SO',
  },
  {
    id: 'ALL-11',
    famille: 'ALL',
    titre: 'La grille opposable',
    action: 'Formaliser une grille de recrutement avec critères pondérés. Archivée deux ans.',
    indicateur: 'Grille auditée',
    delai: 'J+90',
    niveau: 3,
    couleur: '#123024',
    zoneCible: 'SO',
  },
  {
    id: 'ALL-12',
    famille: 'ALL',
    titre: 'Le protocole client',
    action: 'Ajouter une clause anti-discrimination dans les contrats clients. Process si demande biaisée.',
    indicateur: 'Clause dans contrats',
    delai: 'J+90',
    niveau: 3,
    couleur: '#123024',
    zoneCible: 'NE',
  },
  {
    id: 'ALL-13',
    famille: 'ALL',
    titre: 'La rotation vitrine',
    action: 'Attribuer les projets visibles par rotation, avec suivi sur 12 mois.',
    indicateur: 'Tableau rotation publié',
    delai: 'J+60',
    niveau: 3,
    couleur: '#123024',
    zoneCible: 'SE',
  },
  {
    id: 'ALL-14',
    famille: 'ALL',
    titre: 'Le budget accommodement',
    action: 'Créer une enveloppe budgétaire dédiée aux accommodements, hors budget d\'équipe.',
    indicateur: 'Budget voté en CA',
    delai: 'J+60',
    niveau: 3,
    couleur: '#123024',
    zoneCible: 'NO',
  },
  {
    id: 'ALL-15',
    famille: 'ALL',
    titre: 'L\'audit parole',
    action: 'Analyse trimestrielle : temps de parole, interruptions, feedbacks genrés.',
    indicateur: 'Rapport trimestriel',
    delai: 'J+90',
    niveau: 3,
    couleur: '#123024',
    zoneCible: 'ALL',
  },
];

// ------------------------------------------------------------
// AGRÉGATION : toutes les cartes
// ------------------------------------------------------------
export const CARTES_DIAG: CarteDiagnostique[] = [
  ...CARTES_REC,
  ...CARTES_MIC,
  ...CARTES_PRI,
  ...CARTES_CLI,
];

export const CARTES_ALL_EXPORT: CarteAll[] = CARTES_ALL;

// ------------------------------------------------------------
// HELPERS
// ------------------------------------------------------------
export function getCarteById(id: string): CarteDiagnostique | CarteAll | undefined {
  return CARTES_DIAG.find((c) => c.id === id) ?? CARTES_ALL.find((c) => c.id === id);
}

export function getCartesDiag(): CarteDiagnostique[] {
  return CARTES_DIAG;
}

export function getCartesAll(): CarteAll[] {
  return CARTES_ALL;
}

export function getCartesParFamille(famille: Famille): CarteDiagnostique[] {
  return CARTES_DIAG.filter((c) => c.famille === famille);
}

export function getCartesAllParNiveau(niveau: 1 | 2 | 3): CarteAll[] {
  return CARTES_ALL.filter((c) => c.niveau === niveau);
}

// Tirage aléatoire de N cartes diag, sans répétition
export function tirerCartesDiag(n: number): CarteDiagnostique[] {
  const shuffled = [...CARTES_DIAG].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

// Statistiques rapides (utile pour l'affichage)
export const STATS_CARTES = {
  totalDiag: CARTES_DIAG.length,
  totalAll: CARTES_ALL.length,
  parFamille: {
    REC: CARTES_REC.length,
    MIC: CARTES_MIC.length,
    PRI: CARTES_PRI.length,
    CLI: CARTES_CLI.length,
    ALL: CARTES_ALL.length,
  },
};

// ------------------------------------------------------------
// PROD : chargement depuis Supabase avec fallback statique
// ------------------------------------------------------------
import { supabase as supabaseClient } from './supabase';

let CACHE_DIAG: CarteDiagnostique[] | null = null;
let CACHE_ALL: CarteAll[] | null = null;

export async function loadCardsDiagFromDB(): Promise<CarteDiagnostique[]> {
  if (CACHE_DIAG) return CACHE_DIAG;
  try {
    const { data } = await supabaseClient.from('cards_diag').select('*').order('ordre', { ascending: true });
    if (data && data.length > 0) {
      CACHE_DIAG = data.map((r:any) => ({
        id: r.id, famille: r.famille, titre: r.titre, image: r.image, signal: r.signal, situation: r.situation,
        question: r.question, motPiege: r.mot_piege, compteur: r.compteur, compteurLabel: r.compteur_label,
        extra: r.extra_type? { type: r.extra_type, texte: r.extra_texte } : r.extra || undefined,
        ordre: r.ordre
      })) as CarteDiagnostique[];
      return CACHE_DIAG;
    }
  } catch {}
  // Fallback signal_cards ancienne table
  try {
    const { data } = await supabaseClient.from('signal_cards').select('*').order('ordre', { ascending: true });
    if (data && data.length > 0) {
      CACHE_DIAG = data.map((r:any) => ({
        id: r.id, famille: r.famille, titre: r.titre, image: r.image, signal: r.signal, situation: r.situation,
        question: r.question, motPiege: r.mot_piege, compteur: r.compteur, compteurLabel: r.compteur_label,
        extra: r.extra || undefined, ordre: r.ordre
      })) as CarteDiagnostique[];
      return CACHE_DIAG;
    }
  } catch {}
  CACHE_DIAG = CARTES_DIAG;
  return CACHE_DIAG;
}

export async function loadCardsAllFromDB(): Promise<CarteAll[]> {
  if (CACHE_ALL) return CACHE_ALL;
  try {
    const { data } = await supabaseClient.from('cards_all').select('*').order('ordre', { ascending: true });
    if (data && data.length > 0) {
      CACHE_ALL = data.map((r:any) => ({
        id: r.id, famille: 'ALL', titre: r.titre, action: r.action, indicateur: r.indicateur, delai: r.delai, niveau: r.niveau, couleur: r.couleur, ordre: r.ordre
      })) as CarteAll[];
      return CACHE_ALL;
    }
  } catch {}
  CACHE_ALL = CARTES_ALL;
  return CACHE_ALL;
}

export async function getCarteByIdAsync(id: string) {
  const diag = await loadCardsDiagFromDB();
  const all = await loadCardsAllFromDB();
  return diag.find(c=>c.id===id)?? all.find(c=>c.id===id);
}

export async function tirerCartesDiagAsync(n: number) {
  const diag = await loadCardsDiagFromDB();
  const shuffled = [...diag].sort(()=>Math.random()-0.5);
  return shuffled.slice(0,n);
}
