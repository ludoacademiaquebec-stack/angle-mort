import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase-server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, company } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId requis' }, { status: 400 });
    }

    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }

    const db = supabaseAdmin();
    const { error } = await db.from('sessions').upsert(
      {
        id: sessionId,
        code,
        company: company || null,
        phase: 'cadrage',
        card_idx: -1,
        revealed: 'signal',
        status: 'active',
      },
      { onConflict: 'id' }
    );

    if (error) throw error;
    return NextResponse.json({ ok: true, sessionId, code });
  } catch (e: any) {
    console.error('[create-session] Erreur:', e);
    return NextResponse.json({ error: e?.message || 'Erreur serveur' }, { status: 500 });
  }
}
