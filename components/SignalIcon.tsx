'use client';

// ============================================================
// ANGLE MORT v3.3 — SignalIcon
// Portage React de signal-icons.js (médaillon gravé)
// 5 familles : REC, MIC, PRI, ALL, CLI
// ============================================================

import type { CarteDiagnostique, CarteAll, Famille } from '../lib/types';

const INK = '#14171B';
const GOLD = '#B8935A';
const STROKE = 1.6;
const HAIR = 0.6;

// ---------- Couleurs par famille ----------
export const COULEUR_FAMILLE: Record<Famille | 'ALL', string> = {
  REC: '#101E33',
  MIC: '#6B3620',
  PRI: '#37203A',
  CLI: '#0B2E33',
  ALL: '#123024',
};

// ---------- Extraction d'un pourcentage depuis '72%' ----------
function pctFromCounter(compteur?: string): number | null {
  if (!compteur) return null;
  const m = compteur.match(/(\d+)/);
  return m ? Math.min(100, parseInt(m[1], 10)) : null;
}

// ---------- Bezel : couronne de crans ----------
function bezelTicks(col: string, count: number, r1: number, r2: number) {
  const out: React.ReactElement[] = [];
  for (let i = 0; i < count; i++) {
    const a = (Math.PI * 2 * i) / count;
    const long = i % (count / 12) === 0;
    const rr1 = long ? r1 - 3 : r1;
    const x1 = 100 + rr1 * Math.cos(a);
    const y1 = 100 + rr1 * Math.sin(a);
    const x2 = 100 + r2 * Math.cos(a);
    const y2 = 100 + r2 * Math.sin(a);
    out.push(
      <line
        key={`tick-${i}`}
        x1={x1.toFixed(2)}
        y1={y1.toFixed(2)}
        x2={x2.toFixed(2)}
        y2={y2.toFixed(2)}
        stroke={col}
        strokeWidth={long ? 0.9 : 0.5}
        opacity={long ? 0.3 : 0.15}
      />
    );
  }
  return out;
}

// ---------- Fleuron sommital ----------
function Fleuron({ col }: { col: string }) {
  return (
    <g transform="translate(100 15)" opacity="0.55">
      <path d="M -9 6 Q -9 -3 0 -3 Q 9 -3 9 6" fill="none" stroke={col} strokeWidth="0.8" />
      <circle cx="0" cy="-3" r="1.6" fill={col} />
      <line x1="-13" y1="6" x2="13" y2="6" stroke={col} strokeWidth="0.5" opacity="0.6" />
    </g>
  );
}

// ---------- Sceau commun ----------
function Sceau({ col }: { col: string }) {
  return (
    <>
      <circle cx="100" cy="100" r="90" fill="none" stroke={col} strokeWidth="0.7" opacity="0.28" />
      {bezelTicks(col, 48, 90, 86)}
      <circle cx="100" cy="100" r="78" fill="none" stroke={INK} strokeWidth="0.5" opacity="0.14" />
      <Fleuron col={col} />
    </>
  );
}

// ---------- Buste au trait, sans visage ----------
function Bust({
  cx,
  cy,
  s,
  col,
  filled,
}: {
  cx: number;
  cy: number;
  s: number;
  col: string;
  filled?: boolean;
}) {
  const fill = filled ? col : 'none';
  const fillOpacity = filled ? 0.85 : 1;
  return (
    <g transform={`translate(${cx} ${cy})`}>
      <path
        d={`M ${-15 * s} ${24 * s} Q ${-15 * s} 0 0 0 Q ${15 * s} 0 ${15 * s} ${24 * s}`}
        fill={fill}
        fillOpacity={fillOpacity}
        stroke={col}
        strokeWidth={STROKE}
        strokeLinecap="round"
      />
      <circle
        cx="0"
        cy={-15 * s}
        r={9 * s}
        fill={fill}
        fillOpacity={fillOpacity}
        stroke={col}
        strokeWidth={STROKE}
      />
    </g>
  );
}

// ---------- REC : deux bustes, un accent doré ----------
function IconREC({ id, col }: { id: string; col: string }) {
  const num = parseInt(id.split('-')[1] || '1', 10);
  const v = num % 5;
  const swap = v >= 3;
  const leftX = swap ? 122 : 78;
  const rightX = swap ? 78 : 122;
  const chosen = v === 1 || v === 3 ? rightX : leftX;
  const other = chosen === leftX ? rightX : leftX;

  return (
    <>
      <Sceau col={col} />
      <line
        x1="100"
        y1="64"
        x2="100"
        y2="148"
        stroke={col}
        strokeWidth={HAIR}
        strokeDasharray="1 7"
        opacity="0.38"
      />
      <Bust cx={other} cy={108} s={1.3} col={INK} />
      <Bust cx={chosen} cy={108} s={1.3} col={col} />
      <circle cx={chosen} cy={80} r="2.6" fill={col} />
      <circle cx={chosen} cy="80" r="5.5" fill="none" stroke={col} strokeWidth="0.6" opacity="0.4" />
    </>
  );
}

// ---------- MIC : suite de points, le dernier doré ----------
function IconMIC({ id, col }: { id: string; col: string }) {
  const num = parseInt(id.split('-')[1] || '1', 10);
  const v = num % 5;
  const count = 5 + v;
  const startX = 52;
  const endX = 148;
  const y = 116;

  const dots: React.ReactElement[] = [];
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    const x = startX + t * (endX - startX);
    const r = 2 + t * 3.6;
    const last = i === count - 1;
    if (last) {
      dots.push(
        <g key={`dot-${i}`}>
          <circle cx={x} cy={y} r={r + 1.5} fill="none" stroke={col} strokeWidth="0.7" opacity="0.45" />
          <circle cx={x} cy={y} r={r} fill={col} fillOpacity="0.9" />
        </g>
      );
    } else {
      dots.push(
        <circle
          key={`dot-${i}`}
          cx={x}
          cy={y}
          r={r}
          fill="none"
          stroke={INK}
          strokeWidth="1.1"
          opacity={0.22 + t * 0.4}
        />
      );
    }
  }

  return (
    <>
      <Sceau col={col} />
      <path
        d={`M ${startX - 8} ${y + 16} Q 100 ${y - 24 - v} ${endX + 8} ${y + 16}`}
        fill="none"
        stroke={INK}
        strokeWidth={HAIR}
        strokeDasharray="1 7"
        opacity="0.3"
      />
      {dots}
    </>
  );
}

// ---------- PRI : trois colonnes, une dorée ----------
function IconPRI({ id, col, compteur }: { id: string; col: string; compteur?: string }) {
  const num = parseInt(id.split('-')[1] || '1', 10);
  const real = pctFromCounter(compteur);
  const v = num % 5;
  let heights: number[];
  if (real !== null) {
    const h = 16 + (real / 100) * 74;
    const others = [18, 24, 22][v % 3];
    heights = v % 2 === 0 ? [others, others * 0.65, h] : [h, others * 0.55, others * 0.8];
  } else {
    heights = [24 + v * 4.5, 42 + v * 3, 76];
  }
  const xs = [72, 100, 128];
  const goldIndex = v % 2 === 0 ? 2 : 0;

  return (
    <>
      <Sceau col={col} />
      <line x1="58" y1="140" x2="142" y2="140" stroke={INK} strokeWidth={HAIR} opacity="0.32" />
      {xs.map((x, i) => {
        const h = heights[i];
        const isGold = i === goldIndex;
        return isGold ? (
          <rect
            key={`bar-${i}`}
            x={x - 7.5}
            y={140 - h}
            width="15"
            height={h}
            rx="7.5"
            fill={col}
            fillOpacity="0.92"
          />
        ) : (
          <rect
            key={`bar-${i}`}
            x={x - 7.5}
            y={140 - h}
            width="15"
            height={h}
            rx="7.5"
            fill="none"
            stroke={INK}
            strokeWidth="1.1"
            opacity="0.4"
          />
        );
      })}
    </>
  );
}

// ---------- ALL : escalier, arrivée dorée ----------
function IconALL({ id, col }: { id: string; col: string }) {
  const num = parseInt(id.split('-')[1] || '1', 10);
  const steps = 3;
  const v = num % 5;
  const rtl = v >= 3;
  const stepW = 28;
  const gap = 8;
  const baseY = 136;
  const heights = [18, 40, 66];
  const marks: React.ReactElement[] = [];

  for (let i = 0; i < steps; i++) {
    const h = heights[Math.min(i, heights.length - 1)];
    const idx = rtl ? steps - 1 - i : i;
    const x = 50 + idx * (stepW + gap);
    const isLast = i === steps - 1;
    if (isLast) {
      marks.push(
        <g key={`step-${i}`}>
          <rect x={x} y={baseY - h} width={stepW} height="3.6" rx="1.8" fill={col} />
          <line
            x1={x + stepW / 2}
            y1={baseY - h}
            x2={x + stepW / 2}
            y2={baseY}
            stroke={col}
            strokeWidth="1.1"
            opacity="0.45"
          />
        </g>
      );
    } else {
      marks.push(
        <g key={`step-${i}`}>
          <line
            x1={x}
            y1={baseY - h}
            x2={x + stepW}
            y2={baseY - h}
            stroke={INK}
            strokeWidth="1.1"
            opacity="0.38"
          />
          <line
            x1={x + stepW / 2}
            y1={baseY - h}
            x2={x + stepW / 2}
            y2={baseY}
            stroke={INK}
            strokeWidth="0.8"
            opacity="0.22"
          />
        </g>
      );
    }
  }

  return (
    <>
      <Sceau col={col} />
      <line x1="46" y1="136" x2="154" y2="136" stroke={INK} strokeWidth={HAIR} opacity="0.28" />
      {marks}
      <path
        d="M 56 116 Q 100 46 146 39"
        fill="none"
        stroke={col}
        strokeWidth={HAIR}
        strokeDasharray="1 7"
        opacity="0.5"
      />
      <path
        d="M 139 34 L 148 39 L 140 46"
        fill="none"
        stroke={col}
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  );
}

// ---------- CLI : seuil, écart doré ----------
function IconCLI({ id, col }: { id: string; col: string }) {
  const num = parseInt(id.split('-')[1] || '1', 10);
  const v = num % 5;
  const gap = 8 + v * 6;
  const frameX = 64;
  const frameW = 72;
  const topY = 54;
  const botY = 136;
  const midGapX = 100 - gap / 2;
  const midGapX2 = 100 + gap / 2;

  return (
    <>
      <Sceau col={col} />
      <path
        d={`M ${frameX} ${botY} L ${frameX} ${topY} L ${frameX + frameW} ${topY} L ${frameX + frameW} ${botY}`}
        fill="none"
        stroke={INK}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.75"
      />
      <line x1={frameX - 8} y1={botY} x2={midGapX} y2={botY} stroke={INK} strokeWidth={STROKE} strokeLinecap="round" opacity="0.75" />
      <line x1={midGapX2} y1={botY} x2={frameX + frameW + 8} y2={botY} stroke={INK} strokeWidth={STROKE} strokeLinecap="round" opacity="0.75" />
      <line x1={midGapX} y1={botY} x2={midGapX2} y2={botY} stroke={col} strokeWidth="1.4" strokeLinecap="round" strokeDasharray="1.5 5" />
      <Bust cx={100 - gap * 0.6} cy={110} s={0.8} col={col} />
    </>
  );
}

// ---------- Composant principal ----------
export function SignalIconInner({ card }: { card: CarteDiagnostique | CarteAll }) {
  const famille = card.famille as Famille | 'ALL';
  const col = COULEUR_FAMILLE[famille] || GOLD;

  switch (famille) {
    case 'REC':
      return <IconREC id={card.id} col={col} />;
    case 'MIC':
      return <IconMIC id={card.id} col={col} />;
    case 'PRI': {
      const compteur = 'compteur' in card ? card.compteur : undefined;
      return <IconPRI id={card.id} col={col} compteur={compteur} />;
    }
    case 'ALL':
      return <IconALL id={card.id} col={col} />;
    case 'CLI':
      return <IconCLI id={card.id} col={col} />;
    default:
      return <Sceau col={col} />;
  }
}

// ---------- Wrapper SVG ----------
export function SignalIcon({
  card,
  size = 200,
  className = '',
}: {
  card: CarteDiagnostique | CarteAll;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <SignalIconInner card={card} />
    </svg>
  );
}
