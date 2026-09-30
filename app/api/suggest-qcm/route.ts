import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Types de retour pour clarté et sécurité
type Quadrant = 'NO' | 'NE' | 'SO' | 'SE';

interface AIResult {
  quadrant: Quadrant;
  explication: string;
  arbitrage: string;
}

interface APIResponse {
  ok: true;
  quadrant: Quadrant;
  explication: string;
  arbitrage: string;
}

const VALID_QUADRANTS: Quadrant[] = ['NO', 'NE', 'SO', 'SE'];

// Timeout de sécurité pour l'appel Groq (30s)
const GROQ_TIMEOUT_MS = 30_000;

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // 1. Lecture et validation des entrées
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: 'Corps de requête invalide (JSON attendu)' },
        { status: 400 }
      );
    }

    const { signal, situation, motPiege, titre } = body as {
      signal?: string;
      situation?: string;
      motPiege?: string;
      titre?: string;
    };

    if (!signal || !situation) {
      return NextResponse.json(
        { error: 'signal et situation sont requis' },
        { status: 400 }
      );
    }

    // 2. Construction du prompt enrichi (deux niveaux : joueur + facilitateur)
    const prompt = `Tu es un Ingénieur Pédagogique Senior et un Expert Mondial en Équité, Diversité et Inclusion (EDI), spécialisé dans la conception de Serious Games. Tu maîtrises parfaitement la sémiotique et le carré de Greimas appliqué aux dynamiques d'entreprise.

Ton rôle : analyser un cas soumis par le Super-Admin et déterminer, de manière scientifique et indiscutable, dans quel cadran du modèle "Punctum" il se situe.

### LES 4 CADRANS (CARRÉ DE GREIMAS / EDI)
- **NO (Vision centrale nette — S1 : L'Inclusion)** : Inclusion réelle. Appartenance forte + Unicité valorisée (Shore et al., 2011). La différence est une force intégrée. La voix est présente, entendue, suivie d'effet. Processus vérifiable.
- **NE (Hors champ assumé — S2 : L'Exclusion)** : Rejet explicite, marginalisation, discrimination ou environnement hostile. Choix assumé de ne pas inclure. On dit non clairement. C'est lisible et contestable.
- **SO (Tache aveugle par tolérance — Non-S1 : La Non-Inclusion)** : Assimilation forcée. La personne est dans l'équipe mais doit cacher sa différence pour "fitter" dans le moule. On laisse faire, on tolère, on ne regarde pas. Inaction passive, habitude.
- **SE (Tache aveugle par façade — Non-S2 : La Non-Exclusion)** : Différenciation passive ou Tokenisme (Kanter, 1977). Inclusion symbolique. Présence sans pouvoir, utilisée comme faire-valoir de la diversité. On croit voir alors qu'on ne voit pas.

### TES CONSIGNES D'ANALYSE
- **Rigueur académique** : Appuie ton verdict sur les auteurs clés (Shore et al., Ely & Thomas, Derald Wing Sue sur les microagressions, Kahneman sur les biais cognitifs, Kanter sur le tokenisme).
- **Repère le décalage** : La Carte Signal peut induire un biais ou un doute ; la Carte Situation apporte les faits qui figent le quadrant. Analyse la situation complète, pas seulement le signal.
- **Distingue surtout SO vs SE** : SO = assimilation forcée / inaction passive. SE = inclusion de façade / tokenisme affiché. C'est la confusion la plus fréquente.

### TON FORMAT DE SORTIE À DEUX NIVEAUX

Tu dois produire DEUX explications distinctes :

1. **explication** (pour l'affichage joueur en temps réel) :
   - 2 à 3 phrases maximum.
   - Ton CATÉGORIQUE et définitif, sans hésitation, sans "on pourrait objecter", sans "cependant".
   - Cite UN élément concret du signal ou de la situation.
   - Termine par la logique du quadrant en une phrase.
   - Objectif : le joueur comprend immédiatement pourquoi ce cadran est le bon.

2. **arbitrage** (pour le livret facilitateur) :
   - 4 à 6 phrases.
   - Ton académique et pédagogique.
   - Nomme explicitement les tensions ou ambiguïtés possibles (ex : "on pourrait objecter un glissement vers X, mais...").
   - Cite au moins UN auteur clé (Shore, Kanter, Sue, Kahneman ou Ely & Thomas).
   - Explique pourquoi les autres cadrans sont écartés.
   - Objectif : le facilitateur peut trancher n'importe quel débat en salle, sans être contesté.

### CAS À ANALYSER
- Titre : ${titre || '(non fourni)'}
- Signal : "${signal}"
- Situation : "${situation}"
- Mot-piège : "${motPiege || '(aucun)'}"

Réponds UNIQUEMENT en json valide avec ce format exact :
{
  "quadrant": "NO" | "NE" | "SO" | "SE",
  "explication": "2-3 phrases catégoriques pour l'affichage joueur.",
  "arbitrage": "4-6 phrases académiques et nuancées pour le livret facilitateur."
}`;

    // 3. Appel Groq avec timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), GROQ_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'openai/gpt-oss-120b',
          messages: [
            {
              role: 'system',
              content:
                'Tu es un expert DEI. Tu réponds toujours en json valide, sans texte avant ou après.',
            },
            { role: 'user', content: prompt },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.3,
        }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    // 4. Gestion des erreurs HTTP de Groq
    if (!response.ok) {
      const errText = await response.text().catch(() => '(illisible)');
      console.error('[suggest-qcm] Groq error:', response.status, errText);
      return NextResponse.json(
        { error: `Erreur Groq: ${response.status}` },
        { status: 502 }
      );
    }

    // 5. Extraction du contenu
    const data = await response.json();
    const content: string | undefined = data?.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('Réponse Groq vide');
    }

    // 6. Parsing JSON robuste (tolère les fences markdown éventuels)
    let parsed: AIResult;
    try {
      parsed = JSON.parse(content);
    } catch {
      const cleaned = content.replace(/```json|```/g, '').trim();
      parsed = JSON.parse(cleaned);
    }

    // 7. Validation stricte du schéma
    if (!VALID_QUADRANTS.includes(parsed.quadrant)) {
      throw new Error(`Quadrant invalide reçu: ${parsed.quadrant}`);
    }
    if (
      typeof parsed.explication !== 'string' ||
      parsed.explication.trim().length === 0
    ) {
      throw new Error('Champ "explication" manquant ou vide');
    }
    if (
      typeof parsed.arbitrage !== 'string' ||
      parsed.arbitrage.trim().length === 0
    ) {
      throw new Error('Champ "arbitrage" manquant ou vide');
    }

    // 8. Réponse finale
    const payload: APIResponse = {
      ok: true,
      quadrant: parsed.quadrant,
      explication: parsed.explication.trim(),
      arbitrage: parsed.arbitrage.trim(),
    };

    return NextResponse.json(payload);
  } catch (e: unknown) {
    const err = e as Error;
    const isAbort = err?.name === 'AbortError';
    console.error('[suggest-qcm] Erreur:', isAbort ? 'Timeout Groq' : err);

    return NextResponse.json(
      {
        error: isAbort
          ? "L'analyse a dépassé le temps imparti. Réessayez."
          : err?.message || 'Erreur serveur',
      },
      { status: 500 }
    );
  }
}