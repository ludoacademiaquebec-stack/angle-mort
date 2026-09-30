import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase-server';
import { CARTES_DIAG } from '../../../lib/cards';

export const dynamic = 'force-dynamic';

export async function GET() {
  const db = supabaseAdmin();
  let inserted = 0;
  let updated = 0;
  const errors: string[] = [];

  for (const carte of CARTES_DIAG) {
    const { data: existing } = await db
      .from('cards_diag')
      .select('id')
      .eq('id', carte.id)
      .maybeSingle();

    const payload: any = {
      id: carte.id,
      famille: carte.famille,
      titre: carte.titre,
      signal: carte.signal,
      situation: carte.situation,
      question: carte.question,
      mot_piege: carte.motPiege || null,
      compteur: carte.compteur || null,
      compteur_label: carte.compteurLabel || null,
      extra_type: carte.extra?.type || null,
      extra_texte: carte.extra?.texte || null,
      updated_at: new Date().toISOString(),
    };

    if (existing) {
      const { error } = await db.from('cards_diag').update(payload).eq('id', carte.id);
      if (error) errors.push(`${carte.id}: ${error.message}`);
      else updated++;
    } else {
      const { error } = await db.from('cards_diag').insert(payload);
      if (error) errors.push(`${carte.id}: ${error.message}`);
      else inserted++;
    }
  }

  return NextResponse.json({
    ok: errors.length === 0,
    inserted,
    updated,
    total: CARTES_DIAG.length,
    errors,
  });
}
