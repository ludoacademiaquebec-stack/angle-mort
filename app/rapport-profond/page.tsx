'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

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
  const code = searchParams.get('code');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!code) { setLoading(false); return; }
    (async () => {
      try {
        setLoading(true);
        const { data: session, error: sErr } = await supabase.from('sessions').select('*').eq('id', code).single();
        if (sErr) throw sErr;

        const [{ data: depots }, { data: events }, { data: players }] = await Promise.all([
          supabase.from('session_depots').select('*').eq('session_id', code),
          supabase.from('session_events').select('*').eq('session_id', code).order('created_at', { ascending: true }),
          supabase.from('session_players').select('*').eq('session_id', code),
        ]);

        const ev = (events as EventRow[] | null) || [];
        const dp = depots || [];
        const pl = players || [];

        // Cartographie
        const byQuadrant = QUADRANTS.map(q => ({
          q,
          count: dp.filter((d: any) => d.quadrant === q).length,
        }));
        const usedQuadrants = [...new Set(dp.map((d: any) => d.quadrant))];
        const angleMort = QUADRANTS.filter(q =>!usedQuadrants.includes(q as any));

        // Dynamiques organisationnelles
        const changeEvents = ev.filter(e => e.type === 'change_quadrant');
        const hesitations = changeEvents.length;
        const avgLatency = changeEvents.length
         ? Math.round(changeEvents.reduce((acc, e) => acc + (e.latency_ms || 0), 0) / changeEvents.length)
          : 0;

        // Latence par quadrant
        const latencyByQuadrant = QUADRANTS.map(q => {
          const list = ev.filter(e => e.to_quadrant === q && e.latency_ms!= null);
          return {
            q,
            avg: list.length? Math.round(list.reduce((a, b) => a + (b.latency_ms || 0), 0) / list.length) : null,
            count: list.length,
          };
        });

        // Joueurs
        const byPlayer = pl.map((p: any) => {
          const pEvents = ev.filter(e => e.player_id === p.id || e.nick === p.nick);
          const pChanges = pEvents.filter(e => e.type === 'change_quadrant');
          const pDepots = dp.filter((d: any) => d.player_id === p.id);
          const uniqueQuadrants = [...new Set(pDepots.map((d: any) => d.quadrant))].length;
          return {
           ...p,
            events: pEvents.length,
            changes: pChanges.length,
            depots: pDepots.length,
            uniqueQuadrants,
            avgLatency: pChanges.length
             ? Math.round(pChanges.reduce((a, b) => a + (b.latency_ms || 0), 0) / pChanges.length)
              : null,
            lastQuadrant: pDepots[pDepots.length - 1]?.quadrant || 'aucun',
          };
        });

        // Leader invisible = celui qui initie le plus de mouvements + suivi < 45s
        const sortedByActivity = [...byPlayer].sort((a, b) => b.changes - a.changes);
        const leader = sortedByActivity[0] || null;

        // Polarisation : 80% des dépôts dans 1 seul quadrant?
        const totalDepots = dp.length || 1;
        const maxQuadrant = byQuadrant.reduce((max, cur) => (cur.count > max.count? cur : max), byQuadrant[0]);
        const polarisation = maxQuadrant.count / totalDepots;

        setData({
          session,
          depots: dp,
          events: ev,
          players: byPlayer,
          byQuadrant,
          angleMort,
          hesitations,
          avgLatency,
          latencyByQuadrant,
          leader,
          polarisation,
          maxQuadrant,
        });
        setLoading(false);
      } catch (e: any) {
        setError(e.message);
        setLoading(false);
      }
    })();
  }, [code]);

  if (!code) {
    return (
      <div style={{ padding: 40, fontFamily: 'monospace' }}>
        Utilise : /rapport-profond?code=SESS-XXXXXX
        <br />
        Exemple : /rapport-profond?code=SESS-ZX73FJ
      </div>
    );
  }
  if (loading) return <div style={{ padding: 40 }}>Analyse des dynamiques de {code}...</div>;
  if (error) return <div style={{ padding: 40 }}>Erreur: {error}</div>;
  if (!data?.session) return <div style={{ padding: 40 }}>Session {code} introuvable</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#FFFEF9', color: '#14171B', padding: 32, fontFamily: 'ui-monospace' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <h1 style={{ fontFamily: 'Georgia', fontSize: 42, lineHeight: 1, letterSpacing: -1 }}>
          Rapport Organisationnel
          <br />
          {code}
        </h1>
        <p style={{ marginTop: 12, opacity: 0.7, fontSize: 13 }}>
          {new Date(data.session.created_at).toLocaleDateString('fr-FR')} - {data.players.length} participants -{' '}
          {data.depots.length} dépôts - {data.hesitations} mouvements tracés - latence moy {data.avgLatency}ms
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 32 }}>
          <div style={{ border: '3px solid #14171B', background: '#FDE047', padding: 20 }}>
            <div style={{ fontWeight: 900, textTransform: 'uppercase', fontSize: 11, letterSpacing: 1 }}>Angle mort collectif</div>
            <div style={{ fontFamily: 'Georgia', fontSize: 24, marginTop: 8, lineHeight: 1.1 }}>
              {data.angleMort.length? data.angleMort.join(' + ') : 'Aucun - exploration totale'}
            </div>
            <div style={{ marginTop: 10, fontSize: 13, lineHeight: 1.4 }}>
              {data.angleMort.length
               ? `Votre équipe évite collectivement ${data.angleMort.join(', ')}. En systémique, ce que vous évitez est exactement ce qui vous bloque.`
                : `Performance rare : tous les quadrants explorés. Pas d'évitement systémique détecté.`}
            </div>
            {data.polarisation > 0.6 && (
              <div style={{ marginTop: 10, fontSize: 11, background: '#14171B', color: 'white', padding: 6 }}>
                Polarisation : {Math.round(data.polarisation * 100)}% dans {data.maxQuadrant.q}
              </div>
            )}
          </div>

          <div style={{ border: '3px solid #14171B', background: '#FBF8EF', padding: 20 }}>
            <div style={{ fontWeight: 900, textTransform: 'uppercase', fontSize: 11, letterSpacing: 1 }}>
              Ce que tu ne vois pas en présentiel
            </div>
            <div style={{ fontFamily: 'Georgia', fontSize: 24, marginTop: 8, lineHeight: 1.1 }}>
              {data.hesitations} hésitations tracées
            </div>
            <div style={{ marginTop: 10, fontSize: 13, lineHeight: 1.4 }}>
              Chaque `change_quadrant` = un doute. En salle tu vois le post-it final. Ici tu vois le temps d'hésitation moyen :{' '}
              <b>{data.avgLatency}ms</b>. {data.avgLatency > 3000? 'Forte incertitude organisationnelle.' : 'Décision fluide.'}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 24, border: '3px solid #14171B', padding: 20, background: 'white' }}>
          <div style={{ fontWeight: 900, textTransform: 'uppercase', fontSize: 11, letterSpacing: 1 }}>
            Cartographie par quadrant + latence
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginTop: 12 }}>
            {data.byQuadrant.map((b: any) => {
              const lat = data.latencyByQuadrant.find((l: any) => l.q === b.q);
              return (
                <div key={b.q} style={{ border: '2px solid #14171B', padding: 12, background: b.count === 0? '#FFE4E6' : 'white' }}>
                  <div style={{ fontWeight: 800, fontSize: 12 }}>{b.q}</div>
                  <div style={{ fontSize: 30, fontFamily: 'Georgia' }}>{b.count}</div>
                  <div style={{ fontSize: 11 }}>{b.count === 0? 'ANGLE MORT' : `${b.count} dépôts`}</div>
                  <div style={{ fontSize: 10, marginTop: 6, opacity: 0.7 }}>
                    {lat?.avg!= null? `⏱ ${lat.avg}ms moy` : 'pas de latence'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ marginTop: 24, border: '3px solid #14171B', padding: 20, background: 'white' }}>
          <div style={{ fontWeight: 900, textTransform: 'uppercase', fontSize: 11, letterSpacing: 1 }}>
            Dynamiques de pouvoir invisible
          </div>
          <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
            {data.players.map((p: any) => (
              <div
                key={p.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  border: '1px solid #14171B',
                  padding: 10,
                  background: p.id === data.leader?.id? '#FDE047' : '#FFFEF9',
                }}
              >
                <span style={{ fontSize: 13 }}>
                  <b>{p.nick}</b> → {p.lastQuadrant} | {p.depots} dépôts | {p.changes} mouvements | {p.uniqueQuadrants}/4
                  quadrants | ⏱ {p.avgLatency?? '-'}ms
                </span>
                <span style={{ fontSize: 10, fontWeight: 800 }}>{p.id === data.leader?.id? 'LEADER INVISIBLE' : ''}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, fontSize: 12, background: '#14171B', color: 'white', padding: 12, lineHeight: 1.4 }}>
            Lecture org : {data.leader?.nick || 'Aucun'} initie le plus de mouvements. En présentiel tu vois qui parle fort. Ici tu vois qui fait
            bouger les autres. Si son avg latency est basse, c'est un décideur. Si haute, il hésite et fait hésiter le groupe.
          </div>
        </div>

        <div style={{ marginTop: 24, border: '1px dashed #14171B', padding: 12, fontSize: 11, opacity: 0.6 }}>
          <div style={{ fontWeight: 800 }}>Source : session_events (11 colonnes)</div>
          <div>
            type=change_quadrant, from_quadrant, to_quadrant, latency_ms, nick, player_id, created_at. Rapport généré sans dossier [ ].
          </div>
        </div>

        <div style={{ marginTop: 24, fontSize: 12, opacity: 0.6 }}>
          <a href={`/board/${code}`} style={{ textDecoration: 'underline' }}>
            ← Retour plateau
          </a>{' '}
          · <a href={`/super-admin`} style={{ textDecoration: 'underline' }}>Super Admin</a>
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