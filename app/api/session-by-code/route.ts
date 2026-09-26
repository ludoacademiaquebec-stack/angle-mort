import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase-server';

// GET /api/session-by-code?code=LUMI42
// Retourne { sessionId } si trouvée
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code')?.toUpperCase().trim();

  if (!code || code.length !== 6) {
    return NextResponse.json({ error: 'Code invalide' }, { status: 400 });
  }

  const db = supabaseAdmin();
  const { data, error } = await db
    .from('sessions')
    .select('id, code')
    .eq('code', code)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: 'Aucune session avec ce code' }, { status: 404 });
  }

  return NextResponse.json({ sessionId: data.id });
}
