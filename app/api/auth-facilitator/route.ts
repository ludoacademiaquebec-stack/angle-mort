export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase-server';

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json();
    if (!code) return NextResponse.json({ error: 'Code requis' }, { status: 400 });

    const db = supabaseAdmin();
    const { data, error } = await db
      .from('facilitators')
      .select('id, code, name, email')
      .eq('code', code.toUpperCase())
      .eq('active', true)
      .maybeSingle();

    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'Code facilitateur inconnu' }, { status: 404 });

    // Mettre à jour la date de connexion
    await db
      .from('facilitators')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', data.id);

    return NextResponse.json({ ok: true, facilitator: data });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erreur serveur' }, { status: 500 });
  }
}
