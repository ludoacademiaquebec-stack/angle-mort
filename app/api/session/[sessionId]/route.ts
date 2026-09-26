export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase-server';

// ============================================================
// GET /api/session/[sessionId]
// Retourne : session + players + depots + paris
// ============================================================
export async function GET(
  _: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const db = supabaseAdmin();
  const { sessionId } = params;

  // Session
  const { data: session, error: errSess } = await db
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .maybeSingle();

  if (errSess) {
    return NextResponse.json({ error: errSess.message }, { status: 500 });
  }

  if (!session) {
    return NextResponse.json({ empty: true, sessionId });
  }

  // Players
  const { data: players } = await db
    .from('session_players')
    .select('*')
    .eq('session_id', sessionId);

  // Depots
  const { data: depots } = await db
    .from('session_depots')
    .select('*')
    .eq('session_id', sessionId);

  // Paris
  const { data: paris } = await db
    .from('session_paris')
    .select('*')
    .eq('session_id', sessionId);

  return NextResponse.json({
    sessionId,
    phase: session.phase,
    cardIdx: session.card_idx,
    revealed: session.revealed,
    players: players || [],
    depots: depots || [],
    paris: paris || [],
    updatedAt: session.updated_at,
  });
}

// ============================================================
// POST /api/session/[sessionId]
// Body :
//   { action: 'upsert_session', code, company, phase, cardIdx }
//   { action: 'upsert_player', playerId, nick }
//   { action: 'delete_player', playerId }
//   { action: 'upsert_depot', playerId, nick, cardId, quadrant, canal, couleur }
//   { action: 'upsert_pari', playerId, nick, cardId, pari }
// ============================================================
export async function POST(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const db = supabaseAdmin();
  const { sessionId } = params;
  const body = await req.json();

  try {
    switch (body.action) {
      case 'upsert_session': {
        const { error } = await db.from('sessions').upsert(
          {
            id: sessionId,
            code: body.code || '000000',
            company: body.company || null,
            phase: body.phase || 'cadrage',
            card_idx: body.cardIdx ?? -1,
            revealed: body.revealed || 'signal',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );
        if (error) throw error;
        break;
      }

      case 'upsert_player': {
        const { error } = await db.from('session_players').upsert(
          {
            id: body.playerId,
            session_id: sessionId,
            nick: body.nick,
            last_seen_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );
        if (error) throw error;
        break;
      }

      case 'upsert_depot': {
        // Un seul dépôt actif par joueur et par carte → on supprime puis insère
        await db
          .from('session_depots')
          .delete()
          .eq('session_id', sessionId)
          .eq('player_id', body.playerId)
          .eq('card_id', body.cardId);

        const { error } = await db.from('session_depots').insert({
          session_id: sessionId,
          player_id: body.playerId,
          card_id: body.cardId,
          quadrant: body.quadrant,
          canal: body.couleur === 'neutre' ? 'signal' : 'situation',
          slot: body.couleur === 'rouge' ? 1 : 0,
        });
        if (error) throw error;
        break;
      }

      case 'upsert_pari': {
        await db
          .from('session_paris')
          .delete()
          .eq('session_id', sessionId)
          .eq('player_id', body.playerId)
          .eq('card_id', body.cardId);

        const { error } = await db.from('session_paris').insert({
          session_id: sessionId,
          player_id: body.playerId,
          card_id: body.cardId,
          pari: body.pari,
        });
        if (error) throw error;
        break;
      }

      default:
        return NextResponse.json({ error: 'action inconnue' }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('[api/session] Erreur:', e);
    return NextResponse.json({ error: e?.message || 'Erreur serveur' }, { status: 500 });
  }
}
