'use client';
import { supabase } from '@/lib/supabase';
import type { Pion, PhaseProtocole, Version, ResultatCarte, Engagement } from './types';

async function post(sessionId: string, body: any) {
  try {
    const res = await fetch(`/api/session/${sessionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.warn('[session-api] POST failed:', res.status);
      return null;
    }
    return await res.json();
  } catch (e) {
    console.warn('[session-api] POST error:', e);
    return null;
  }
}

export async function loadSession(sessionId: string) {
  try {
    const res = await fetch(`/api/session/${sessionId}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.warn('[session-api] loadSession error:', e);
    return null;
  }
}

export async function saveSession(
  sessionId: string,
  data: {
    code?: string;
    company?: string;
    phase?: PhaseProtocole;
    cardIdx?: number;
    revealed?: string;
    version?: Version;
    allSelectionnees?: string[];
    cardsTirees?: string[];
  }
) {
  return post(sessionId, { action: 'upsert_session', ...data });
}

export async function savePlayer(sessionId: string, playerId: string, nick: string) {
  return post(sessionId, { action: 'upsert_player', playerId, nick });
}

export async function savePion(
  sessionId: string,
  pion: Pion,
  cardId: string,
  reaction?: string | null
) {
  if (!pion.quadrantActuel) return null;
  return post(sessionId, {
    action: 'upsert_depot',
    playerId: pion.playerId,
    nick: pion.nick,
    cardId,
    quadrant: pion.quadrantActuel,
    canal: pion.couleur === 'neutre' ? 'signal' : 'situation',
    couleur: pion.couleur,
    reaction: reaction || null,
    nbDeplacements: pion.nbDeplacements || 0,
  });
}

export async function savePari(
  sessionId: string,
  playerId: string,
  nick: string,
  cardId: string,
  choix: 'reste' | 'bouge' | 'neutre'
) {
  try {
    await supabase
      .from('session_paris')
      .delete()
      .eq('session_id', sessionId)
      .eq('player_id', playerId)
      .eq('card_id', cardId);
    await supabase.from('session_paris').insert({
      session_id: sessionId,
      player_id: playerId,
      card_id: cardId,
      pari: choix,
    });
  } catch (e) {
    console.error('savePari/session_paris', e);
  }

  try {
    await supabase.from('session_events').insert({
      session_id: sessionId,
      type: 'pari',
      to_quadrant: choix,
      question_id: cardId,
      player_id: playerId,
      player_nick: nick,
      metadata: { choix, cardId, question_id: cardId },
    });
  } catch (e) {
    console.error('savePari/session_events', e);
  }
}

// ============================================================
// SAVE RESULTAT CARTE
// Persiste aussi la couche QCM (quadrant, explication, arbitrage,
// profils individuels) pour conservation historique du rapport.
// Les colonnes doivent exister dans session_resultats (voir SQL ci-dessous).
// ============================================================
export async function saveResultatCarte(sessionId: string, resultat: ResultatCarte) {
  try {
    const payload: any = {
      session_id: sessionId,
      card_id: resultat.cardId,
      card_famille: resultat.famille || null,
      position_signal: resultat.positionSignal,
      position_finale: resultat.positionFinale,
      pari_gagnant: resultat.pariGagnant,
      condition: resultat.condition,
      points_jaunes: resultat.pointsJaunes,
      points_rouges: resultat.pointsRouges,
      jeton_donne: resultat.jetonDonne || null,
      votes_json: {
        reste: resultat.reste,
        bouge: resultat.bouge,
        neutre: resultat.neutre,
        majorite: resultat.majorite,
      },
      // === Couche QCM (conservation historique) ===
      quadrant_correct: resultat.quadrantCorrect || null,
      explication: resultat.explication || null,
      arbitrage: resultat.arbitrage || null,
      nb_ont_vu_juste: resultat.nbOntVuJuste ?? null,
      total_joueurs: resultat.totalJoueurs ?? null,
      scores_individuels: resultat.scoresIndividuels || null,
    };

    const { error } = await supabase.from('session_resultats').insert(payload);
    if (error) {
      // Fallback : si les colonnes QCM n'existent pas encore, on retente
      // avec le payload minimal pour ne pas perdre le résultat historique.
      if (
        error.message?.includes('column') ||
        error.code === 'PGRST204' ||
        error.code === '42703'
      ) {
        console.warn(
          '[saveResultatCarte] Colonnes QCM absentes — fallback payload minimal.',
          error.message
        );
        const minimalPayload = {
          session_id: sessionId,
          card_id: resultat.cardId,
          card_famille: resultat.famille || null,
          position_signal: resultat.positionSignal,
          position_finale: resultat.positionFinale,
          pari_gagnant: resultat.pariGagnant,
          condition: resultat.condition,
          points_jaunes: resultat.pointsJaunes,
          points_rouges: resultat.pointsRouges,
          jeton_donne: resultat.jetonDonne || null,
          votes_json: payload.votes_json,
        };
        const { error: err2 } = await supabase
          .from('session_resultats')
          .insert(minimalPayload);
        if (err2) console.error('[saveResultatCarte] fallback KO', err2);
      } else {
        console.error('[saveResultatCarte]', error);
      }
    }
  } catch (e) {
    console.error('saveResultatCarte', e);
  }
}

// ✅ CORRIGÉ : passe par l'API route (service key) au lieu du client anon
export async function saveEngagement(engagement: Engagement) {
  console.log('[saveEngagement] envoi via API', engagement);
  const result = await post(engagement.sessionId, {
    action: 'save_engagement',
    playerId: engagement.playerId,
    allCardId: engagement.allCardId,
    engagementText: engagement.engagementText,
    indicateur: engagement.indicateur,
    echeance: engagement.echeance,
  });
  console.log('[saveEngagement] réponse API', result);
  return result;
}

// ============================================================
// LOAD RESULTATS
// Lit la couche QCM si elle existe (tolérant aux colonnes absentes).
// ============================================================
export async function loadResultats(sessionId: string): Promise<ResultatCarte[]> {
  try {
    const { data } = await supabase
      .from('session_resultats')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });
    if (!data) return [];
    return data.map((r: any) => ({
      cardId: r.card_id,
      famille: r.card_famille,
      positionSignal: r.position_signal,
      positionFinale: r.position_finale,
      pariGagnant: r.pari_gagnant,
      condition: r.condition,
      gagnants: [],
      perdants: [],
      pointsJaunes: r.points_jaunes || 0,
      pointsRouges: r.points_rouges || 0,
      jetonDonne: r.jeton_donne,
      timestamp: new Date(r.created_at).getTime(),
      reste: r.votes_json?.reste,
      bouge: r.votes_json?.bouge,
      neutre: r.votes_json?.neutre,
      majorite: r.votes_json?.majorite,
      // === Couche QCM (tolérant si absent) ===
      quadrantCorrect: r.quadrant_correct || null,
      explication: r.explication || null,
      arbitrage: r.arbitrage || null,
      nbOntVuJuste: r.nb_ont_vu_juste ?? undefined,
      totalJoueurs: r.total_joueurs ?? undefined,
      scoresIndividuels: r.scores_individuels || undefined,
    }));
  } catch (e) {
    console.error('loadResultats', e);
    return [];
  }
}

export async function loadEngagements(sessionId: string): Promise<Engagement[]> {
  try {
    const { data } = await supabase
      .from('session_engagements')
      .select('*')
      .eq('session_id', sessionId);
    if (!data) return [];
    return data.map((e: any) => ({
      id: e.id,
      sessionId: e.session_id,
      playerId: e.player_id,
      allCardId: e.all_card_id,
      engagementText: e.engagement_text,
      indicateur: e.indicateur,
      echeance: e.echeance,
      createdAt: new Date(e.created_at).getTime(),
    }));
  } catch (e) {
    console.error('loadEngagements', e);
    return [];
  }
}