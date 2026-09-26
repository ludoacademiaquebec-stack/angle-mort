'use client';

import type { Quadrant, Pion, CouleurPion } from '../lib/types';
import { QUADRANTS, QUADRANTS_ORDER, AXE_HORIZONTAL, AXE_VERTICAL } from '../lib/quadrants';

function couleurPion(c: CouleurPion): string {
  if (c === 'jaune') return '#FDE047';
  if (c === 'rouge') return '#EF4444';
  return '#6B7280';
}

const POSITION_GRID: Record<Quadrant, { gridColumn: string; gridRow: string }> = {
  NO: { gridColumn: '1', gridRow: '1' },
  NE: { gridColumn: '2', gridRow: '1' },
  SO: { gridColumn: '1', gridRow: '2' },
  SE: { gridColumn: '2', gridRow: '2' },
};

// Position des pions : coin extérieur de chaque quadrant (loin de la rétine)
const PION_POS: Record<Quadrant, React.CSSProperties> = {
  NO: { top: 12, left: 12 },
  NE: { top: 12, right: 12 },
  SO: { bottom: 12, left: 12 },
  SE: { bottom: 12, right: 12 },
};
function PionVisuel({ pion, small }: { pion: Pion; small?: boolean }) {
  const size = small ? 20 : 26;
  return (
    <div
      title={`${pion.nick} — ${pion.couleur}`}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: couleurPion(pion.couleur),
        border: '2px solid #FFFFFF',
        boxShadow: '0 2px 4px rgba(20,23,27,0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 9,
        fontWeight: 700,
        color: '#14171B',
        textShadow: '0 1px 0 rgba(255,255,255,0.6)',
        zIndex: 30,
      }}
    >
      {pion.nick.slice(0, 1).toUpperCase()}
    </div>
  );
}

function QuadrantCase({
  code,
  pions,
  onClick,
  selected,
}: {
  code: Quadrant;
  pions: Pion[];
  onClick?: (q: Quadrant) => void;
  selected?: boolean;
}) {
  const q = QUADRANTS[code];
  const pos = POSITION_GRID[code];

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        console.log('[QuadrantCase] CLIC', code, 'onClick?', !!onClick);
        onClick?.(code);
      }}
      style={{
        gridColumn: pos.gridColumn,
        gridRow: pos.gridRow,
        position: 'relative',
        background: q.couleurFond,
        border: `1px solid ${q.couleurTrait}33`,
        padding: 16,
        textAlign: 'left',
        cursor: onClick ? 'pointer' : 'default',
        outline: selected ? `2px solid ${q.couleurTrait}` : 'none',
        outlineOffset: -2,
        transition: 'all 0.15s',
        pointerEvents: 'auto',
        zIndex: 10,
      }}
    >
      <div
        style={{
          fontFamily: 'ui-monospace, monospace',
          fontSize: 9,
          letterSpacing: '0.14em',
          color: q.couleurTrait,
          opacity: 0.7,
          fontWeight: 600,
        }}
      >
        {q.position}
      </div>
      <div
        style={{
          fontFamily: 'Georgia, serif',
          fontWeight: 700,
          fontSize: 14,
          lineHeight: 1.1,
          color: '#14171B',
          marginTop: 4,
        }}
      >
        {q.label}
      </div>
      <div
        style={{
          fontSize: 11,
          color: q.couleurTrait,
          opacity: 0.9,
          marginTop: 2,
          fontStyle: 'italic',
        }}
      >
        {q.sousTitre}
      </div>
      <div
        style={{
          fontSize: 10,
          color: 'rgba(20,23,27,0.6)',
          marginTop: 8,
          lineHeight: 1.35,
          maxWidth: '85%',
        }}
      >
        {q.description}
      </div>
      <div
        style={{
          position: 'absolute',
          ...PION_POS[code],
          display: 'flex',
          gap: 4,
          flexWrap: 'wrap',
          maxWidth: 120,
        }}
      >
        {pions.map((p, i) => (
          <PionVisuel key={`${p.playerId}-${i}`} pion={p} small />
        ))}
      </div>
    </button>
  );
}

function Retine({ label, sublabel }: { label?: string; sublabel?: string }) {
  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 20,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          width: 88,
          height: 88,
          borderRadius: '50%',
          background: '#FFFFFF',
          border: '2px solid #14171B',
          boxShadow: '0 0 0 8px rgba(255,254,251,0.7), 0 4px 12px rgba(0,0,0,0.15)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
        }}
      >
        <div
          style={{
            fontFamily: 'Georgia, serif',
            fontWeight: 700,
            fontSize: 11,
            letterSpacing: '0.14em',
            color: '#14171B',
            textAlign: 'center',
            lineHeight: 1.1,
          }}
        >
          {label || 'PUNCTUM'}
        </div>
        <div style={{ width: 20, height: 1, background: '#14171B' }} />
        <div
          style={{
            fontFamily: 'ui-monospace, monospace',
            fontSize: 8,
            letterSpacing: '0.1em',
            color: 'rgba(20,23,27,0.6)',
            textAlign: 'center',
          }}
        >
          {sublabel || 'ANGLE MORT'}
        </div>
      </div>
    </div>
  );
}

export function PunctumBoard({
  pions = [],
  onQuadrantClick,
  selectedQuadrant,
  retineLabel,
  retineSublabel,
  instruction,
  showCompteur = false,
}: {
  pions?: Pion[];
  onQuadrantClick?: (q: Quadrant) => void;
  selectedQuadrant?: Quadrant;
  retineLabel?: string;
  retineSublabel?: string;
  instruction?: string;
  showCompteur?: boolean;
}) {
  // Compteur de pions par quadrant
  const compteur = {
    NO: pions.filter((p) => p.quadrantActuel === 'NO').length,
    NE: pions.filter((p) => p.quadrantActuel === 'NE').length,
    SO: pions.filter((p) => p.quadrantActuel === 'SO').length,
    SE: pions.filter((p) => p.quadrantActuel === 'SE').length,
  };

  // Position majoritaire actuelle (pour info)
  const positionMajoritaire = (() => {
    const entries = Object.entries(compteur) as [Quadrant, number][];
    entries.sort((a, b) => b[1] - a[1]);
    if (entries[0][1] === 0) return null;
    return entries[0][0];
  })();

  return (
    <div style={{ width: '100%', maxWidth: 640, margin: '0 auto' }}>
      {/* Bandeau d'instruction */}
      {instruction && (
        <div
          style={{
            padding: '6px 10px',
            background: '#FDE047',
            border: '1px solid #14171B',
            borderRadius: 4,
            fontSize: 11,
            fontWeight: 600,
            color: '#14171B',
            marginBottom: 6,
            textAlign: 'center',
            maxWidth: 640,
            margin: '0 auto 6px auto',
          }}
        >
          {instruction}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8, gap: 12 }}>
        <div
          style={{
            fontFamily: 'ui-monospace, monospace',
            fontSize: 9,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'rgba(20,23,27,0.5)',
            minWidth: 110,
            textAlign: 'right',
          }}
        >
          ↑ {AXE_VERTICAL.haut}
        </div>
        <div style={{ flex: 1, height: 1, background: 'rgba(20,23,27,0.15)' }} />
      </div>

      <div
        style={{
          position: 'relative',
          aspectRatio: '1 / 1',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gridTemplateRows: '1fr 1fr',
          gap: 0,
          border: '1px solid rgba(20,23,27,0.15)',
          borderRadius: 4,
          overflow: 'hidden',
          background: '#FBF8EF',
        }}
      >
        {QUADRANTS_ORDER.map((q) => (
          <QuadrantCase
            key={q}
            code={q}
            pions={pions.filter((p) => p.quadrantActuel === q)}
            onClick={onQuadrantClick}
            selected={selectedQuadrant === q}
          />
        ))}
        <Retine label={retineLabel} sublabel={retineSublabel} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', marginTop: 8, gap: 12 }}>
        <div
          style={{
            fontFamily: 'ui-monospace, monospace',
            fontSize: 9,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'rgba(20,23,27,0.5)',
            minWidth: 110,
            textAlign: 'right',
          }}
        >
          ↓ {AXE_VERTICAL.bas}
        </div>
        <div style={{ flex: 1, height: 1, background: 'rgba(20,23,27,0.15)' }} />
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 8,
          fontFamily: 'ui-monospace, monospace',
          fontSize: 9,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'rgba(20,23,27,0.5)',
        }}
      >
        <span>← {AXE_HORIZONTAL.gauche}</span>
        <span>{AXE_HORIZONTAL.droite} →</span>
      </div>

      <div
        style={{
          marginTop: 14,
          display: 'flex',
          gap: 16,
          justifyContent: 'center',
          flexWrap: 'wrap',
          fontSize: 10,
          color: 'rgba(20,23,27,0.6)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#6B7280', border: '1px solid #FFF' }} />
          Neutre
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#FDE047', border: '1px solid #FFF' }} />
          Jaune (reste)
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#EF4444', border: '1px solid #FFF' }} />
          Rouge (bouge)
        </div>
      </div>
    </div>
  );
}
