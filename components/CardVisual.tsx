'use client';

import type { CarteDiagnostique, CarteAll } from '../lib/types';
import { SignalIcon, COULEUR_FAMILLE } from './SignalIcon';

type Face = 'signal' | 'situation';

export function CardVisual({
  card,
  face = 'signal',
  size = 'md',
}: {
  card: CarteDiagnostique | CarteAll;
  face?: Face;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}) {
  const famille = card.famille as keyof typeof COULEUR_FAMILLE;
  const couleur = COULEUR_FAMILLE[famille] || '#14171B';

  const dims = {
    xs: { w: 150, h: 240, pad: 8, iconSize: 100, title: 12 },
    sm: { w: 220, h: 340, pad: 12, iconSize: 140, title: 14 },
    md: { w: 300, h: 460, pad: 16, iconSize: 200, title: 18 },
    lg: { w: 380, h: 580, pad: 20, iconSize: 260, title: 22 },
  }[size];

  const piedTexte =
    face === 'signal'
      ? ('signal' in card ? card.signal : '')
      : ('situation' in card ? card.situation : '');

  return (
    <div
      className="relative overflow-hidden"
      style={{
        width: dims.w,
        height: dims.h,
        background: '#FBF8EF',
        border: '1px solid rgba(20,23,27,0.15)',
        borderRadius: 4,
        boxShadow: '0 10px 30px -10px rgba(20,23,27,0.25)',
      }}
    >
      <div
        style={{
          background: couleur,
          height: 32,
          padding: '0 14px',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11, letterSpacing: '0.14em', fontWeight: 600 }}>
          {card.famille}
        </span>
        <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, letterSpacing: '0.06em', opacity: 0.85 }}>
          {card.id}
        </span>
      </div>

      <div
        style={{
          height: dims.h - 32 - 120,
          padding: dims.pad,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <SignalIcon card={card} size={dims.iconSize} />
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 120,
          padding: '12px 16px',
          borderTop: '1px solid rgba(20,23,27,0.1)',
          background: '#FBF8EF',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div
            style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontStyle: 'italic',
              fontSize: dims.title,
              fontWeight: 600,
              color: '#14171B',
              lineHeight: 1.15,
              letterSpacing: '-0.01em',
            }}
          >
            {card.titre}
          </div>
          <div
            style={{
              fontFamily: 'ui-monospace, monospace',
              fontSize: 9,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: face === 'signal' ? '#B8935A' : '#6D28D9',
              marginTop: 6,
            }}
          >
            {face === 'signal' ? '● Signal (intuition)' : '● Situation (fait)'}
          </div>
        </div>
        <div
          style={{
            fontSize: 11,
            lineHeight: 1.35,
            color: 'rgba(20,23,27,0.7)',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {piedTexte}
        </div>
      </div>
    </div>
  );
}
