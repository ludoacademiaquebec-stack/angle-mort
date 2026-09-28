'use client';

import type { CarteAll } from '../lib/types';

interface RaisonnementAllLocal {
  allCardId: string;
  score: number;
  raisons: string[];
}

interface AllViewProps {
  cartes: CarteAll[];
  raisonnements: RaisonnementAllLocal[];
  role: 'facilitator' | 'player';
  onEngagement?: (carteId: string, texte: string) => void;
  engagements?: Record<string, string>;
}

export function AllView({ cartes, raisonnements, role, onEngagement, engagements = {} }: AllViewProps) {
  return (
    <div style={{ padding: 20, background: '#FBF8EF', borderRadius: 6, border: '1px solid rgba(20,23,27,0.15)' }}>
      <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.6, marginBottom: 12 }}>
        Fermeture — 3 cartes ALL sélectionnées par le système
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
        {cartes.map((carte) => {
          const r = raisonnements.find((ra) => ra.allCardId === carte.id);
          return (
            <div
              key={carte.id}
              style={{
                background: carte.couleur,
                color: '#FBF8EF',
                borderRadius: 8,
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, letterSpacing: '0.12em', opacity: 0.7 }}>
                  {carte.id} · Niveau {carte.niveau}
                </span>
                {r && (
                  <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 9, opacity: 0.5 }}>
                    score {r.score}
                  </span>
                )}
              </div>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: 18, fontWeight: 700, lineHeight: 1.2 }}>
                {carte.titre}
              </div>
              <div style={{ fontSize: 12, lineHeight: 1.5, opacity: 0.9 }}>
                {carte.action}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 10, fontFamily: 'ui-monospace, monospace', opacity: 0.7, marginTop: 'auto' }}>
                <span style={{ background: 'rgba(255,255,255,0.15)', padding: '3px 8px', borderRadius: 3 }}>
                  {carte.indicateur}
                </span>
                <span style={{ background: 'rgba(255,255,255,0.15)', padding: '3px 8px', borderRadius: 3 }}>
                  {carte.delai}
                </span>
              </div>
              {r && role === 'facilitator' && (
                <div style={{ fontSize: 10, fontFamily: 'ui-monospace, monospace', opacity: 0.6, marginTop: 6, borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: 6 }}>
                  {r.raisons.join(' · ')}
                </div>
              )}
              {role === 'player' && onEngagement && (
                <div style={{ marginTop: 8 }}>
                  <textarea
                    placeholder="Mon engagement 48h..."
                    value={engagements[carte.id] || ''}
                    onChange={(e) => onEngagement(carte.id, e.target.value)}
                    style={{
                      width: '100%',
                      minHeight: 60,
                      fontSize: 12,
                      padding: 8,
                      borderRadius: 4,
                      border: '1px solid rgba(255,255,255,0.3)',
                      background: 'rgba(255,255,255,0.1)',
                      color: '#FBF8EF',
                      resize: 'vertical',
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
      {role === 'facilitator' && (
        <div style={{ marginTop: 16, fontSize: 11, fontFamily: 'ui-monospace, monospace', opacity: 0.6 }}>
          Le système a tiré ces 3 cartes en fonction des zones chaudes et des familles problématiques observées. Score plus haut = carte plus pertinente.
        </div>
      )}
    </div>
  );
}
