// lib/analyticsEngine.ts - ne casse jamais le build
import { supabase } from '@/lib/supabase';

export type EventType = 'change_quadrant' | 'create_sticky' | 'delete_sticky' | 'hesitation' | 'follow_leader';

export async function logEvent(sessionId: string, playerId: string, type: EventType, payload: any = {}) {
  try {
    await supabase.from('session_events').insert({
      session_id: sessionId,
      player_id: playerId,
      type,
      payload,
      created_at: new Date().toISOString()
    });
  } catch (e) {
    // silencieux, ne casse pas le jeu
    console.warn('analytics log failed', e);
  }
}