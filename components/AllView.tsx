'use client';

import { useEffect, useState } from 'react';
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
  sessionId?: string;
  playerId?: string;
  onEngagement?: (carteId: string, texte: string) => void;
  engagements?: Record<string, string>;
}

export function AllView({
  cartes,
  raisonnements,
  role,
  sessionId,
  playerId,
  onEngagement,
  engagements = {},
}: AllViewProps) {
  // État local pour les textarea — évite d'appeler onEngagement à chaque frappe
  const [localText, setLocalText] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});

  // Initialiser depuis les props au montage uniquement
  useEffect(() => {
    setLocalText(engagements);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getText = (id: string) => localText[id] ?? engagements[id] ?? '';

  const enregistrer = (carteId: string) => {
    const texte = getText(carteId);
    if (onEngagement) onEngagement(carteId, texte);
    setSaved((prev) => ({ ...prev, [carteId]: true }));
    setTimeout(() => setSaved((prev) => ({ ...prev, [carteId]: false })), 2500);
  };

  const imprimerPDF = () => {
    if (!sessionId || !playerId) {
      window.print();
      return;
    }
    window.open(`/engagements/${sessionId}/${playerId}`, '_blank');
  };

  const nbRemplis = cartes.filter((c) => getText(c.id).trim().length > 0).length;

  return (
    <div style={{ padding: 20, background: '#FBF8EF', borderRadius: 6, border: '1px solid rgba(20,23,27,0.15)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.6 }}>
          Fermeture — 3 cartes ALL sélectionnées par le système
        </div>
        {role === 'player' && (
          <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, opacity: 0.6 }}>
            {nbRemplis}/3 remplis
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
        {cartes.map((carte) => {
          const r = raisonnements.find((ra) => ra.allCardId === carte.id);
          const estEnregistre = saved[carte.id];
          const texte = getText(carte.id);
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
                {r && role === 'facilitator' && (
                  <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 9, opacity: 0.5 }}>
                    score {r.score}
                  </span>
                )}
              </div>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: 18, fontWeight: 700, lineHeight: 1.2 }}>
                {carte.titre}
              </div>
              <div style={{ fontSize: 12, lineHeight: 1.5, opacity: 0.9 }}>{carte.action}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 10, fontFamily: 'ui-monospace, monospace', opacity: 0.7 }}>
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
                  <div style={{ fontSize: 10, fontFamily: 'ui-monospace, monospace', textTransform: 'uppercase', opacity: 0.7, marginBottom: 4 }}>
                    Mon engagement
                  </div>
                  <textarea
                    placeholder="Ce que je m'engage à faire dans les 48h..."
                    value={texte}
                    onChange={(e) => setLocalText((prev) => ({ ...prev, [carte.id]: e.target.value }))}
                    style={{
                      width: '100%',
                      minHeight: 70,
                      fontSize: 12,
                      padding: 8,
                      borderRadius: 4,
                      border: '1px solid rgba(255,255,255,0.3)',
                      background: 'rgba(255,255,255,0.1)',
                      color: '#FBF8EF',
                      resize: 'vertical',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box',
                    }}
                  />
                  <button
                    onClick={() => enregistrer(carte.id)}
                    disabled={!texte.trim()}
                    style={{
                      marginTop: 6,
                      width: '100%',
                      padding: '8px 12px',
                      background: estEnregistre ? '#10B981' : '#FDE047',
                      color: '#14171B',
                      border: 'none',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: texte.trim() ? 'pointer' : 'not-allowed',
                      opacity: texte.trim() ? 1 : 0.5,
                      fontFamily: 'ui-monospace, monospace',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {estEnregistre ? '✓ Enregistré' : '💾 Enregistrer'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {role === 'player' && (
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: '2px solid rgba(20,23,27,0.15)' }}>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
            🎉 Fin de l'atelier Angle Mort
          </div>
          <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 12, lineHeight: 1.5 }}>
            Récupérez votre plan d'action personnel avec vos engagements 48h, les cartes ALL présentées et un résumé de votre session.
          </div>
          <button
            onClick={imprimerPDF}
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
            📄 Imprimer mes engagements PDF
          </button>
        </div>
      )}

      {role === 'facilitator' && (
        <div style={{ marginTop: 16, fontSize: 11, fontFamily: 'ui-monospace, monospace', opacity: 0.6 }}>
          Le système a tiré ces 3 cartes en fonction des zones chaudes et des familles problématiques observées. Score plus haut = carte plus pertinente.
        </div>
      )}
    </div>
  );
}
