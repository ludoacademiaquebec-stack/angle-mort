'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { getSupabaseBrowser } from '@/lib/supabase';
const supabase = getSupabaseBrowser();

const QUADRANTS = ['JAUNE', 'VERT', 'ROUGE', 'BLEU'] as const;

type EventRow = {
  id: string;
  session_id: string;
  player_id: string | null;
  nick: string | null;
  type: string;
  from_quadrant: string | null;
  to_quadrant: string | null;
  question_id: string | null;
  latency_ms: number | null;
  metadata: any;
  created_at: string;
};

function RapportContent() {
  const searchParams = useSearchParams();
  const code = useMemo(() => searchParams.get('code')?.trim() || null, [searchParams]);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!code) { setLoading(false); return; }

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. Résout la session - ton SESS- est dans code OU id
        let session: any = null;
        const { data: sById } = await supabase.from('sessions').select('*').eq('id', code).maybeSingle();
        if (sById) session = sById;
        else {
          const { data: sByCode } = await supabase.from('sessions').select('*').eq('code', code).maybeSingle();
          if (sByCode) session = sByCode;
        }
        if (!session) throw new Error(`Session ${code} introuvable dans sessions.id et sessions.code`);

        // 2. Utilise les 2 clés possibles pour les tables liées
        // Ta table session_events a session_id = SESS-ZX73FJ (text)
        // Mais session_players peut avoir session_id = uuid
        const sessionIdsToTry = [code, session.id, session.code].filter(Boolean) as string[];

        let depots: any[] = [];
        let events: EventRow[] = [];
        let players: any[] = [];

        // On essaie avec chaque id possible et on prend le premier qui retourne des données
        for (const sid of sessionIdsToTry) {
          const [d, e, p] = await Promise.all([
            supabase.from('session_depots').select('*').eq('session_id', sid),
            supabase.from('session_events').select('*').eq('session_id', sid).order('created_at', { ascending: true }),
            supabase.from('session_players').select('*').eq('session_id', sid),
          ]);
          if ((d.data?.length || 0) > 0 || (e.data?.length || 0) > 0 || (p.data?.length || 0) > 0) {
            depots = d.data || [];
            events = (e.data as EventRow[]) || [];
            players = p.data || [];
            // On continue si on n'a que des players mais pas d'events pour essayer de compléter
            if (depots.length > 0 || events.length > 0) break;
            // sinon on garde players et on continue pour trouver depots/events
            if (players.length > 0 && depots.length === 0) {
               // garde players en mémoire et continue la boucle pour depots/events
            }
          }
        }

        // Fallback : si on a trouvé players avec uuid mais pas events avec code, on refait un fetch events avec code
        if (events.length === 0) {
          const { data: evByCode } = await supabase.from('session_events').select('*').eq('session_id', code).order('created_at', { ascending: true });
          if (evByCode?.length) events = evByCode as EventRow[];
        }

        const ev = events;
        const dp = depots;
        const pl = players;

        const byQuadrant = QUADRANTS.map(q => ({
          q, count: dp.filter((d: any) => d.quadrant === q).length,
        }));
        const usedQuadrants = [...new Set(dp.map((d: any) => d.quadrant).filter(Boolean))];
        const angleMort = QUADRANTS.filter(q =>!usedQuadrants.includes(q as any));

        const changeEvents = ev.filter(e => e.type === 'change_quadrant');
        const hesitations = changeEvents.length;
        const avgLatency = changeEvents.length
         ? Math.round(changeEvents.reduce((acc, e) => acc + (e.latency_ms || 0), 0) / changeEvents.length)
          : 0;

        const latencyByQuadrant = QUADRANTS.map(q => {
          const list = ev.filter(e => e.to_quadrant === q && e.latency_ms!= null);
          return {
            q,
            avg: list.length? Math.round(list.reduce((a, b) => a + (b.latency_ms || 0), 0) / list.length) : null,
            count: list.length,
          };
        });

        const byPlayer = pl.map((p: any) => {
          const pEvents = ev.filter(e => (p.id && e.player_id === p.id) || (p.nick && e.nick === p.nick));
          const pChanges = pEvents.filter(e => e.type === 'change_quadrant');
          const pDepots = dp.filter((d: any) => d.player_id === p.id);
          return {
           ...p,
            events: pEvents.length,
            changes: pChanges.length,
            depots: pDepots.length,
            uniqueQuadrants: [...new Set(pDepots.map((d: any) => d.quadrant))].length,
            avgLatency: pChanges.length? Math.round(pChanges.reduce((a, b) => a + (b.latency_ms || 0), 0) / pChanges.length) : null,
            lastQuadrant: pDepots[pDepots.length - 1]?.quadrant || pChanges[pChanges.length - 1]?.to_quadrant || 'aucun',
          };
        });

        const leader = [...byPlayer].sort((a, b) => b.changes - a.changes)[0] || null;
        const totalDepots = dp.length || 1;
        const maxQuadrant = byQuadrant.reduce((max, cur) => (cur.count > max.count? cur : max), byQuadrant[0]);

        setData({
          session, depots: dp, events: ev, players: byPlayer, byQuadrant, angleMort,
          hesitations, avgLatency, latencyByQuadrant, leader,
          polarisation: maxQuadrant.count / totalDepots, maxQuadrant,
        });
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [code]);

  if (!code) return <div style={{ padding: 40, fontFamily: 'monospace' }}>Utilise : /rapport-profond?code=SESS-ZX73FJ</div>;
  if (loading) return <div style={{ padding: 40 }}>Analyse de {code}...</div>;
  if (error) return <div style={{ padding: 40 }}>Erreur: {error}</div>;
  if (!data?.session) return <div style={{ padding: 40 }}>Session {code} introuvable</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#FFFEF9', color: '#14171B', padding: 32, fontFamily: 'ui-monospace' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <h1 style={{ fontFamily: 'Georgia', fontSize: 42, lineHeight: 0.95 }}>Rapport Organisationnel<br />{code}</h1>
        <p style={{ marginTop: 12, opacity: 0.7, fontSize: 12 }}>
          {new Date(data.session.created_at).toLocaleDateString('fr-FR')} • {data.players.length} participants • {data.depots.length} dépôts • {data.hesitations} mouvements • {data.avgLatency}ms latence moy
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 28 }}>
          <div style={{ border: '3px solid #14171B', background: '#FDE047', padding: 18 }}>
            <div style={{ fontWeight: 900, fontSize: 10, letterSpacing: 1 }}>ANGLE MORT COLLECTIF</div>
            <div style={{ fontFamily: 'Georgia', fontSize: 22, marginTop: 6 }}>{data.angleMort.length? data.angleMort.join(' + ') : 'Aucun'}</div>
            <div style={{ marginTop: 8, fontSize: 12, lineHeight: 1.4 }}>
              {data.angleMort.length? `Évite ${data.angleMort.join(', ')}. C'est votre blocage systémique.` : `Exploration totale.`}
            </div>
            {data.polarisation > 0.6 && <div style={{ marginTop: 8, fontSize: 10, background: '#14171B', color: '#fff', padding: 5 }}>{Math.round(data.polarisation * 100)}% dans {data.maxQuadrant.q}</div>}
          </div>
          <div style={{ border: '3px solid #14171B', background: '#FBF8EF', padding: 18 }}>
            <div style={{ fontWeight: 900, fontSize: 10, letterSpacing: 1 }}>INVISIBLE EN PRÉSENTIEL</div>
            <div style={{ fontFamily: 'Georgia', fontSize: 22, marginTop: 6 }}>{data.hesitations} hésitations</div>
            <div style={{ marginTop: 8, fontSize: 12, lineHeight: 1.4 }}>Moy <b>{data.avgLatency}ms</b> • {data.avgLatency > 3000? 'Incertitude' : 'Fluide'}</div>
          </div>
        </div>

        <div style={{ marginTop: 20, border: '3px solid #14171B', padding: 16, background: '#fff' }}>
          <div style={{ fontWeight: 900, fontSize: 10 }}>CARTOGRAPHIE + LATENCE</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginTop: 10 }}>
            {data.byQuadrant.map((b: any) => {
              const lat = data.latencyByQuadrant.find((l: any) => l.q === b.q);
              return (
                <div key={b.q} style={{ border: '2px solid #14171B', padding: 10, background: b.count === 0? '#FFE4E6' : '#fff' }}>
                  <div style={{ fontWeight: 800, fontSize: 11 }}>{b.q}</div>
                  <div style={{ fontSize: 26, fontFamily: 'Georgia' }}>{b.count}</div>
                  <div style={{ fontSize: 10 }}>{b.count === 0? 'ANGLE MORT' : `${b.count} dépôts`}</div>
                  <div style={{ fontSize: 9, marginTop: 4, opacity: 0.6 }}>{lat?.avg!= null? `⏱ ${lat.avg}ms` : '-'}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ marginTop: 20, border: '3px solid #14171B', padding: 16, background: '#fff' }}>
          <div style={{ fontWeight: 900, fontSize: 10 }}>DYNAMIQUES DE POUVOIR</div>
          <div style={{ marginTop: 10, display: 'grid', gap: 6 }}>
            {data.players.map((p: any) => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', border: '1px solid #14171B', padding: 8, background: p.id === data.leader?.id? '#FDE047' : '#FFFEF9', fontSize: 12 }}>
                <span><b>{p.nick}</b> → {p.lastQuadrant} | {p.depots} dépôts | {p.changes} mouv | {p.uniqueQuadrants}/4 | ⏱ {p.avgLatency?? '-'}ms</span>
                <span style={{ fontSize: 9, fontWeight: 800 }}>{p.id === data.leader?.id? 'LEADER INVISIBLE' : ''}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 20, fontSize: 11, opacity: 0.5 }}>
          <a href={`/board/${code}`} style={{ textDecoration: 'underline' }}>← Plateau</a> • <a href="/super-admin" style={{ textDecoration: 'underline' }}>Super Admin</a> • {data.events.length} events loggés
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div style={{ padding: 40 }}>Chargement rapport...</div>}>
      <RapportContent />
    </Suspense>
  );
}