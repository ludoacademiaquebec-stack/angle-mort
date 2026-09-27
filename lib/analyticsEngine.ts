// lib/analyticsEngine.ts - compatible avec ta table actuelle
import { supabase } from '@/lib/supabase';

export type EventType = 'change_quadrant' | 'create_sticky' | 'delete_sticky' | 'hesitation' | 'latency';

export async function logEvent(
  session_id: string,
  player_id: string | null,
  nick: string | null,
  type: EventType,
  opts: {
    from_quadrant?: string | null,
    to_quadrant?: string | null,
    question_id?: string | null,
    latency_ms?: number | null,
    metadata?: any
  } = {}
) {
  try {
    await supabase.from('session_events').insert({
      session_id,
      player_id,
      nick,
      type,
      from_quadrant: opts.from_quadrant || null,
      to_quadrant: opts.to_quadrant || null,
      question_id: opts.question_id || null,
      latency_ms: opts.latency_ms || null,
      metadata: opts.metadata || null,
    });
  } catch (e) {
    console.warn('analytics log failed', e);
  }
}