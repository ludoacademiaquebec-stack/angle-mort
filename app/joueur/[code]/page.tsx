'use client';

import { useEffect, useState } from 'react';
import { GameEngine } from '../../../components/GameEngine';
import type { Joueur } from '../../../lib/types';

export default function JoueurSallePage({ params }: { params: { code: string } }) {
  const [playerId, setPlayerId] = useState('');
  const [nick, setNick] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const key = 'anglemort-' + params.code;
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const data = JSON.parse(stored);
        setPlayerId(data.playerId);
        setNick(data.nick);
      } else {
        window.location.href = '/joueur';
        return;
      }
    } catch {
      window.location.href = '/joueur';
      return;
    }
    setReady(true);
  }, [params.code]);

  if (!ready || !playerId || !nick) {
    return (
      <div style={{ minHeight: '100vh', background: '#F4EFE2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'ui-monospace, monospace', fontSize: 12, letterSpacing: '0.1em' }}>
        CHARGEMENT...
      </div>
    );
  }

  const joueurs: Joueur[] = [{
    id: playerId,
    sessionId: params.code,
    nick: nick,
    cartesQuestion: 0,
    cartesMesure: 0,
    lastSeenAt: Date.now(),
    connected: true,
  }];

  return (
    <GameEngine
      sessionId={params.code}
      role="player"
      playerId={playerId}
      playerNick={nick}
      joueurs={joueurs}
    />
  );
}
