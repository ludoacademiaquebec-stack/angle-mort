'use client';
import { supabase } from '@/lib/supabase';

// ============================================================
// ANGLE MORT v3.3 — Client API session
// Wrapper autour des API Routes. Utilisé par GameEngine.
// ============================================================

import type { Pion, PhaseProtocole } from './types';

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

// ----- Charger l'état complet -----
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

// ----- Session (phase, carte) -----
export async function saveSession(
  sessionId: string,
  data: { code?: string; company?: string; phase?: PhaseProtocole; cardIdx?: number; revealed?: string }
) {
  return post(sessionId, { action: 'upsert_session', ...data });
}

// ----- Joueur connecté -----
export async function savePlayer(sessionId: string, playerId: string, nick: string) {
  return post(sessionId, { action: 'upsert_player', playerId, nick });
}

// ----- Dépôt de pion -----
export async function savePion(sessionId: string, pion: Pion, cardId: string) {
  if (!pion.quadrantActuel) return null;
  return post(sessionId, {
    action: 'upsert_depot',
    playerId: pion.playerId,
    nick: pion.nick,
    cardId,
    quadrant: pion.quadrantActuel,
    canal: pion.couleur === 'neutre' ? 'signal' : 'situation',
    couleur: pion.couleur,
  });
}

// ----- Pari (vote final) -----
export async function savePari(sessionId: string, playerId: string, nick: string, cardId: string, choix: 'reste'|'bouge'|'neutre'){
  try{
    await supabase.from('session_events').insert({
      session_id: sessionId,
      type: 'pari',
      to_quadrant: choix,
      question_id: cardId,
      player_id: playerId,
      player_nick: nick,
      metadata: { choix, cardId, question_id: cardId }
    });
  }catch(e){ console.error('savePari', e); }
}
