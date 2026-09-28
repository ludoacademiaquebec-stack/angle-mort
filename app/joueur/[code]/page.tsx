'use client';

import { useEffect, useState } from 'react';
import { GameEngine } from '../../../components/GameEngine';
import type { Joueur, Version } from '../../../lib/types';
import { supabase } from '@/lib/supabase';

export default function JoueurSallePage({ params }: { params: { code: string } }) {
  const [playerId, setPlayerId] = useState('');
  const [nick, setNick] = useState('');
  const [version, setVersion] = useState<Version>('moyen');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const code = params.code;

    // Format A : JSON complet dans `anglemort-XXX`
    const keyJson = 'anglemort-' + code;
    // Format B : clés séparées (PROMPT MASTER v3.4.1)
    const keyId = 'anglemort-' + code + '-playerId';
    const keyNick = 'anglemort-' + code + '-nick';

    let pid = '';
    let nk = '';

    // Essayer Format A d'abord
    const storedJson = localStorage.getItem(keyJson);
    if (storedJson) {
      try {
        const data = JSON.parse(storedJson);
        if (data?.playerId) pid = data.playerId;
        if (data?.nick) nk = data.nick;
      } catch {}
    }

    // Sinon Format B
    if (!pid) {
      const idB = localStorage.getItem(keyId);
      const nickB = localStorage.getItem(keyNick);
      if (idB) pid = idB;
      if (nickB) nk = nickB;
    }

    if (!pid || !nk) {
      window.location.href = '/joueur';
      return;
    }

    setPlayerId(pid);
    setNick(nk);

    // Charger la version de la session
    (async () => {
      try {
        const { data } = await supabase
          .from('sessions')
          .select('version')
          .eq('id', code)
          .maybeSingle();
        if (data?.version) setVersion(data.version as Version);
      } catch {}
      setReady(true);
    })();
  }, [params.code]);

  if (!ready || !playerId || !nick) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#F4EFE2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'ui-monospace, monospace',
          fontSize: 12,
          letterSpacing: '0.1em',
        }}
      >
        CHARGEMENT...
      </div>
    );
  }

  const joueurs: Joueur[] = [
    {
      id: playerId,
      sessionId: params.code,
      nick: nick,
      cartesQuestion: 0,
      cartesMesure: 0,
      lastSeenAt: Date.now(),
      connected: true,
    },
  ];

  return (
    <GameEngine
      sessionId={params.code}
      role="player"
      playerId={playerId}
      playerNick={nick}
      joueurs={joueurs}
      versionInitiale={version}
    />
  );
}
