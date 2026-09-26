'use client';

import { useEffect, useState } from 'react';
import { PunctumBoard } from '../../../components/PunctumBoard';
import { QUADRANTS, QUADRANTS_ORDER } from '../../../lib/quadrants';
import type { Pion, Quadrant } from '../../../lib/types';

export default function RapportPage({
  params,
}: {
  params: { sessionId: string };
}) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/session/${params.sessionId}`, { cache: 'no-store' });
        const json = await res.json();
        setData(json);
      } catch (e) {
        console.warn(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [params.sessionId]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#F4EFE2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'ui-monospace, monospace', fontSize: 12, letterSpacing: '0.1em' }}>
        CHARGEMENT...
      </div>
    );
  }

  if (!data || data.empty) {
    return (
      <div style={{ minHeight: '100vh', background: '#F4EFE2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia, serif', fontSize: 18 }}>
        Aucune donnée pour cette session.
      </div>
    );
  }

  // Reconstruire les pions
  const pions: Pion[] = (data.depots || []).map((d: any) => ({
    playerId: d.player_id,
    nick: data.players?.find((p: any) => p.id === d.player_id)?.nick || 'Anonyme',
    quadrantInitial: d.quadrant,
    quadrantActuel: d.quadrant,
    couleur: d.canal === 'situation' ? 'rouge' : d.slot === 1 ? 'rouge' : 'jaune',
  }));

  // Compter les pions par quadrant
  const compteur: Record<Quadrant, number> = { NO: 0, NE: 0, SO: 0, SE: 0 };
  for (const p of pions) {
    if (p.quadrantActuel) compteur[p.quadrantActuel]++;
  }

  // Quadrant majoritaire
  let quadrantMajoritaire: Quadrant | null = null;
  let maxCount = 0;
  for (const q of QUADRANTS_ORDER) {
    if (compteur[q] > maxCount) {
      maxCount = compteur[q];
      quadrantMajoritaire = q;
    }
  }

  const totalJoueurs = data.players?.length || 0;
  const totalPions = pions.length;
  const cartesVues = data.cardIdx >= 0 ? data.cardIdx + 1 : 0;
  const dateStr = new Date().toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div style={{ minHeight: '100vh', background: '#F4EFE2', padding: '40px 20px' }}>
      {/* Bouton imprimer (caché à l'impression) */}
      <div className="no-print" style={{ maxWidth: 900, margin: '0 auto 24px', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <a
          href={`/board/${params.sessionId}`}
          style={{
            padding: '10px 16px',
            background: 'transparent',
            border: '1px solid rgba(20,23,27,0.3)',
            borderRadius: 4,
            fontSize: 12,
            color: '#14171B',
            textDecoration: 'none',
          }}
        >
          ← Retour au plateau
        </a>
        <button
          onClick={() => window.print()}
          style={{
            padding: '10px 20px',
            background: '#14171B',
            color: '#FBF8EF',
            border: 'none',
            borderRadius: 4,
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          🖨 Imprimer le rapport
        </button>
      </div>

      {/* Contenu imprimable */}
      <div
        className="rapport-content"
        style={{
          maxWidth: 900,
          margin: '0 auto',
          background: '#FFFFFF',
          borderRadius: 8,
          padding: 48,
          boxShadow: '0 4px 24px rgba(20,23,27,0.08)',
        }}
      >
        {/* En-tête */}
        <div style={{ borderBottom: '2px solid #14171B', paddingBottom: 20, marginBottom: 32 }}>
          <div
            style={{
              fontFamily: 'ui-monospace, monospace',
              fontSize: 10,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'rgba(20,23,27,0.5)',
              marginBottom: 8,
            }}
          >
            Angle Mort — Rapport de session
          </div>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 32, fontWeight: 700, color: '#14171B', marginBottom: 4 }}>
            {data.company || params.sessionId}
          </div>
          <div style={{ fontSize: 13, color: 'rgba(20,23,27,0.6)' }}>
            Session <strong>{params.sessionId}</strong> · {dateStr}
          </div>
        </div>

        {/* Statistiques */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 40 }}>
          {[
            { label: 'Participants', val: totalJoueurs },
            { label: 'Cartes vues', val: cartesVues },
            { label: 'Dépôts', val: totalPions },
            { label: 'Quadrant majoritaire', val: quadrantMajoritaire || '—' },
          ].map((s) => (
            <div key={s.label} style={{ padding: 16, background: '#F7F2E9', borderRadius: 6 }}>
              <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(20,23,27,0.5)', marginBottom: 4 }}>
                {s.label}
              </div>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: 28, fontWeight: 700, color: '#14171B' }}>
                {s.val}
              </div>
            </div>
          ))}
        </div>

        {/* Cartographie */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
            Cartographie finale du champ visuel
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <PunctumBoard pions={pions} />
          </div>
        </div>

        {/* Détail par quadrant */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
            Répartition par quadrant
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {QUADRANTS_ORDER.map((q) => {
              const def = QUADRANTS[q];
              const count = compteur[q];
              const isMaj = q === quadrantMajoritaire && count > 0;
              return (
                <div
                  key={q}
                  style={{
                    padding: 16,
                    background: isMaj ? '#14171B' : def.couleurFond,
                    color: isMaj ? '#FBF8EF' : '#14171B',
                    borderRadius: 6,
                    border: `1px solid ${isMaj ? '#14171B' : def.couleurTrait + '33'}`,
                  }}
                >
                  <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, letterSpacing: '0.14em', opacity: 0.7, marginBottom: 4 }}>
                    {def.position}
                  </div>
                  <div style={{ fontFamily: 'Georgia, serif', fontSize: 14, fontWeight: 700, marginBottom: 6, lineHeight: 1.15 }}>
                    {def.label}
                  </div>
                  <div style={{ fontFamily: 'Georgia, serif', fontSize: 32, fontWeight: 700, lineHeight: 1 }}>
                    {count}
                  </div>
                  <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 9, letterSpacing: '0.1em', marginTop: 4, opacity: 0.7 }}>
                    {count === 1 ? 'pion' : 'pions'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Liste des joueurs */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
            Joueurs et positions
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #14171B' }}>
                <th style={{ textAlign: 'left', padding: '8px 0', fontFamily: 'ui-monospace, monospace', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Pseudo
                </th>
                <th style={{ textAlign: 'left', padding: '8px 0', fontFamily: 'ui-monospace, monospace', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Quadrant
                </th>
                <th style={{ textAlign: 'left', padding: '8px 0', fontFamily: 'ui-monospace, monospace', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Couleur
                </th>
              </tr>
            </thead>
            <tbody>
              {data.players?.map((p: any) => {
                const pion = pions.find((pp) => pp.playerId === p.id);
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid rgba(20,23,27,0.1)' }}>
                    <td style={{ padding: '10px 0', fontWeight: 600 }}>{p.nick}</td>
                    <td style={{ padding: '10px 0', fontFamily: 'ui-monospace, monospace', fontSize: 12 }}>
                      {pion?.quadrantActuel || '—'}
                    </td>
                    <td style={{ padding: '10px 0' }}>
                      {pion ? (
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '3px 8px',
                            borderRadius: 3,
                            fontSize: 11,
                            background: pion.couleur === 'jaune' ? '#FDE047' : pion.couleur === 'rouge' ? '#EF4444' : '#E5E7EB',
                            color: pion.couleur === 'rouge' ? '#FFFFFF' : '#14171B',
                            fontWeight: 600,
                          }}
                        >
                          {pion.couleur}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pied de page */}
        <div style={{ borderTop: '1px solid rgba(20,23,27,0.15)', paddingTop: 20, marginTop: 40, fontSize: 11, color: 'rgba(20,23,27,0.5)', textAlign: 'center', fontFamily: 'ui-monospace, monospace', letterSpacing: '0.1em' }}>
          Angle Mort · Institut Ludopédagogique du Québec · {dateStr}
        </div>
      </div>

      {/* Styles d'impression */}
      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body { background: #FFFFFF !important; }
          .rapport-content {
            box-shadow: none !important;
            border-radius: 0 !important;
            padding: 24px !important;
            max-width: 100% !important;
          }
          @page { margin: 15mm; }
        }
      `}</style>
    </div>
  );
}
