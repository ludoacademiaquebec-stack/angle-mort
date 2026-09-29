export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase-server';

export async function GET(_: NextRequest, { params }: { params: { sessionId: string } }) {
  const db = supabaseAdmin();
  const { sessionId } = params;

  const { data: session, error: errSess } = await db
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .maybeSingle();

  if (errSess) return NextResponse.json({ error: errSess.message }, { status: 500 });
  if (!session) return NextResponse.json({ empty: true, sessionId });

  const { data: players } = await db
    .from('session_players')
    .select('*')
    .eq('session_id', sessionId);
  const { data: depots } = await db
    .from('session_depots')
    .select('*')
    .eq('session_id', sessionId);
  const { data: paris } = await db
    .from('session_paris')
    .select('*')
    .eq('session_id', sessionId);

  return NextResponse.json({
    sessionId,
    phase: session.phase,
    cardIdx: session.card_idx,
    revealed: session.revealed,
    version: session.version,
    cards_tirees: session.cards_tirees || [],
    allSelectionnees: session.all_selectionnees || [],
    players: players || [],
    depots: depots || [],
    paris: paris || [],
    updatedAt: session.updated_at,
  });
}

export async function POST(req: NextRequest, { params }: { params: { sessionId: string } }) {
  const db = supabaseAdmin();
  const { sessionId } = params;
  const body = await req.json();

  try {
    switch (body.action) {
      case 'upsert_session': {
        const { data: existing } = await db
          .from('sessions')
          .select('phase, card_idx, code, company, version, cards_tirees, all_selectionnees')
          .eq('id', sessionId)
          .maybeSingle();

        const newPhase = body.phase !== undefined ? body.phase : existing?.phase || 'cadrage';
        const newCardIdx = body.cardIdx !== undefined ? body.cardIdx : existing?.card_idx ?? 0;
        const newVersion = body.version !== undefined ? body.version : existing?.version || 'complet';
        const newCardsTirees = body.cardsTirees !== undefined
          ? body.cardsTirees
          : existing?.cards_tirees || [];
        const newAllSelectionnees = body.allSelectionnees !== undefined
          ? body.allSelectionnees
          : existing?.all_selectionnees || [];

        const { error } = await db.from('sessions').upsert(
          {
            id: sessionId,
            code: body.code || existing?.code || '000000',
            company: body.company !== undefined ? body.company : existing?.company || null,
            phase: newPhase,
            card_idx: newCardIdx,
            revealed: body.revealed || 'signal',
            version: newVersion,
            cards_tirees: newCardsTirees,
            all_selectionnees: newAllSelectionnees,
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
                  case 'save_engagement': {
        // Convertir "J+14" en date réelle
        let echeanceDate: string | null = null;
        if (body.echeance && typeof body.echeance === 'string') {
          const match = body.echeance.match(/J\+(\d+)/);
          if (match) {
            const jours = parseInt(match[1], 10);
            const d = new Date();
            d.setDate(d.getDate() + jours);
            echeanceDate = d.toISOString();
          } else {
            // Si c'est déjà une date ISO
            echeanceDate = body.echeance;
          }
        }

        const { error } = await db.from('session_engagements').insert({
          session_id: sessionId,
          player_id: body.playerId,
          all_card_id: body.allCardId,
          engagement_text: body.engagementText,
          indicateur: body.indicateur || '',
          echeance: echeanceDate,
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
