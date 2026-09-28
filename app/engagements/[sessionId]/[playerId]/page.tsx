'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { CARTES_ALL } from '@/lib/cards';

export default function EngagementsPage({ params }: { params: { sessionId: string; playerId: string } }) {
  const { sessionId, playerId } = params;
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [player, setPlayer] = useState<any>(null);
  const [engagements, setEngagements] = useState<any[]>([]);
  const [allCards, setAllCards] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data: sess } = await supabase.from('sessions').select('*').eq('id', sessionId).maybeSingle();
      if (sess) {
        setSession(sess);
        const ids: string[] = sess.all_selectionnees || [];
        const cartes = ids
          .map((id: string) => CARTES_ALL.find((c) => c.id === id))
          .filter(Boolean);
        setAllCards(cartes);
      }

      const { data: pl } = await supabase.from('session_players').select('*').eq('id', playerId).maybeSingle();
      if (pl) setPlayer(pl);

      const { data: eng } = await supabase
        .from('session_engagements')
        .select('*')
        .eq('session_id', sessionId)
        .eq('player_id', playerId);
      if (eng) setEngagements(eng);

      setReady(true);
    })();
  }, [sessionId, playerId]);

  if (!ready) {
    return <div style={{ padding: 40, fontFamily: 'ui-monospace, monospace' }}>Chargement...</div>;
  }

  const today = new Date().toLocaleDateString('fr-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div style={{ minHeight: '100vh', background: '#FBF8EF', padding: 40, fontFamily: 'Georgia, serif', color: '#14171B' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        {/* En-tête imprimable */}
        <div style={{ borderBottom: '3px solid #14171B', paddingBottom: 16, marginBottom: 24 }}>
          <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.6 }}>
            Angle Mort · Institut Lumière Québec
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 700, margin: '8px 0 4px', lineHeight: 1.1 }}>
            Plan d'action personnel
          </h1>
          <div style={{ fontSize: 13, opacity: 0.7 }}>
            {session?.company || 'Session'} · {sessionId} · {today}
          </div>
          <div style={{ fontSize: 13, opacity: 0.7, marginTop: 4 }}>
            Joueur : <strong>{player?.nick || 'Anonyme'}</strong>
          </div>
        </div>

        {/* Bouton imprimer (non imprimé) */}
        <div style={{ textAlign: 'right', marginBottom: 24 }} className="no-print">
          <button
            onClick={() => window.print()}
            style={{
              padding: '12px 24px',
              background: '#14171B',
              color: '#FBF8EF',
              border: 'none',
              borderRadius: 4,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'ui-monospace, monospace',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            🖨 Imprimer / Enregistrer PDF
          </button>
        </div>

        {/* 3 cartes ALL */}
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Mes 3 engagements 48h</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {allCards.map((carte, idx) => {
           const engs = engagements
  .filter((e) => e.all_card_id === carte.id)
  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
const eng = engs[0];
            return (
              <div
                key={carte.id}
                style={{
                  padding: 20,
                  border: '2px solid #14171B',
                  borderRadius: 8,
                  background: '#FFFFFF',
                  pageBreakInside: 'avoid',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.6 }}>
                    {carte.id} · Niveau {carte.niveau}
                  </span>
                  <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, opacity: 0.6 }}>
                    Engagement {idx + 1}/3
                  </span>
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{carte.titre}</h3>
                <div style={{ fontSize: 13, lineHeight: 1.5, marginBottom: 12, color: 'rgba(20,23,27,0.8)' }}>
                  {carte.action}
                </div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 11, fontFamily: 'ui-monospace, monospace', marginBottom: 16 }}>
                  <span style={{ background: '#F4EFE2', padding: '4px 10px', borderRadius: 3 }}>
                    {carte.indicateur}
                  </span>
                  <span style={{ background: '#F4EFE2', padding: '4px 10px', borderRadius: 3 }}>
                    {carte.delai}
                  </span>
                </div>
                <div style={{ borderTop: '1px dashed rgba(20,23,27,0.3)', paddingTop: 12 }}>
                  <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.6, marginBottom: 6 }}>
                    Mon engagement
                  </div>
                  <div style={{ fontSize: 14, lineHeight: 1.6, minHeight: 40, fontStyle: eng?.engagement_text ? 'normal' : 'italic', color: eng?.engagement_text ? '#14171B' : 'rgba(20,23,27,0.4)' }}>
                    {eng?.engagement_text || '(non renseigné)'}
                  </div>
                </div>
                <div style={{ marginTop: 16, display: 'flex', gap: 24, fontSize: 11, fontFamily: 'ui-monospace, monospace', opacity: 0.6 }}>
                  <span>Signé : ______________________</span>
                  <span>Date : _____________</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pied de page */}
        <div style={{ marginTop: 40, paddingTop: 20, borderTop: '1px solid rgba(20,23,27,0.2)', fontSize: 11, textAlign: 'center', opacity: 0.5 }}>
          Fin de l'atelier Angle Mort · {sessionId} · {player?.nick} · {today}
          <br />
          Conservez ce document — il engage votre suivi à 48h.
        </div>
      </div>

      {/* CSS pour impression */}
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: #FFFFFF !important;
          }
        }
      `}</style>
    </div>
  );
}
