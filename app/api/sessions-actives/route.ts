export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase-server';

export async function GET() {
  try {
    const db = supabaseAdmin();
    const { data: sessions, error } = await db
      .from('sessions')
      .select('id, code, company, phase, created_at, status')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    // Compter les joueurs pour chaque session
    const enriched = await Promise.all(
      (sessions || []).map(async (s) => {
        const { count } = await db
          .from('session_players')
          .select('*', { count: 'exact', head: true })
          .eq('session_id', s.id);
        return { ...s, player_count: count || 0 };
      })
    );

    return NextResponse.json({ sessions: enriched });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erreur serveur' }, { status: 500 });
  }
}
