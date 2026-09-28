'use client';

import type { ResultatCarte, Quadrant } from '../lib/types';

interface SyntheseViewProps {
  company: string;
  version: string;
  nbJoueurs: number;
  zonesRouges: Record<Quadrant, number>;
  famillesChaudes: Record<string, number>;
  resultats: ResultatCarte[];
  tensionGlobale: number;
  onContinuer: () => void;
}

export function SyntheseView({
  company,
  version,
  nbJoueurs,
  zonesRouges,
  famillesChaudes,
  resultats,
  tensionGlobale,
  onContinuer,
}: SyntheseViewProps) {
  const totalAnglesMorts = resultats.filter((r) => r.condition === 'angle_mort_aveugle').length;
  const totalRevelations = resultats.filter((r) => r.condition === 'revelation_confirmee').length;
  const totalFaussesAlertes = resultats.filter((r) => r.condition === 'fausse_alerte').length;
  const totalCoherences = resultats.filter((r) => r.condition === 'coherence_confirmee').length;

  const zonesTriees = Object.entries(zonesRouges)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1]);

  const famillesTriees = Object.entries(famillesChaudes)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1]);

  return (
    <div style={{ padding: 24, background: '#14171B', color: '#FBF8EF', borderRadius: 8 }}>
      <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.6 }}>
        Synthèse générale
      </div>
      <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 24, fontWeight: 700, margin: '8px 0 16px' }}>
        {company || 'Session'} — Version {version}
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
        <Stat label="Joueurs" value={nbJoueurs} />
        <Stat label="Cartes jouées" value={resultats.length} />
        <Stat label="Angles morts" value={totalAnglesMorts} accent="#EF4444" />
        <Stat label="Révélations" value={totalRevelations} accent="#EF4444" />
        <Stat label="Fausses alertes" value={totalFaussesAlertes} accent="#FDE047" />
        <Stat label="Cohérences" value={totalCoherences} accent="#FDE047" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.5, marginBottom: 8 }}>
            Zones chaudes (pions rouges)
          </div>
          {zonesTriees.length === 0 ? (
            <div style={{ fontSize: 12, opacity: 0.5 }}>Aucun déplacement rouge enregistré.</div>
          ) : (
            zonesTriees.map(([zone, count]) => (
              <div key={zone} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.1)', fontSize: 13 }}>
                <span>{zone}</span>
                <span style={{ fontFamily: 'ui-monospace, monospace', opacity: 0.7 }}>{count} pions</span>
              </div>
            ))
          )}
        </div>
        <div>
          <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.5, marginBottom: 8 }}>
            Familles problématiques
          </div>
          {famillesTriees.length === 0 ? (
            <div style={{ fontSize: 12, opacity: 0.5 }}>Aucune famille en tension détectée.</div>
          ) : (
            famillesTriees.map(([fam, count]) => (
              <div key={fam} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.1)', fontSize: 13 }}>
                <span>{fam}</span>
                <span style={{ fontFamily: 'ui-monospace, monospace', opacity: 0.7 }}>{count} tensions</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div style={{ fontSize: 12, lineHeight: 1.6, opacity: 0.7, marginBottom: 20, padding: 12, background: 'rgba(255,255,255,0.05)', borderRadius: 4 }}>
        <b>Tension globale</b> : {tensionGlobale > 0 ? `${tensionGlobale} votes vers le mouvement` : tensionGlobale < 0 ? `${Math.abs(tensionGlobale)} votes vers le maintien` : 'équilibre parfait'}.<br />
        Le système a analysé ces patterns pour sélectionner les 3 cartes ALL de fermeture. Score basé sur les zones chaudes + familles tendues + niveau de la carte.
      </div>

      <button
        onClick={onContinuer}
        style={{
          padding: '12px 24px',
          background: '#FDE047',
          color: '#14171B',
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
        Voir les 3 cartes ALL →
      </button>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div style={{ padding: 12, background: 'rgba(255,255,255,0.05)', borderRadius: 4 }}>
      <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.5 }}>
        {label}
      </div>
      <div style={{ fontFamily: 'Georgia, serif', fontSize: 26, fontWeight: 700, marginTop: 4, color: accent || '#FBF8EF' }}>
        {value}
      </div>
    </div>
  );
}
