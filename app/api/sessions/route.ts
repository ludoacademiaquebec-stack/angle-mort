import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase-server';

export async function GET() {
  const db = supabaseAdmin();
  const { data } = await db
    .from('sessions')
    .select('id, code, company, created_at, phase')
    .order('created_at', { ascending: false })
    .limit(50);

  return NextResponse.json({ sessions: data || [] });
}
