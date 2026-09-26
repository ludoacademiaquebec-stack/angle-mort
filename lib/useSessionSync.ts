'use client';

// ============================================================
// ANGLE MORT v3.3 — useSessionSync
// Synchronisation temps réel via Supabase Realtime Broadcast.
// Canal : anglemort-{sessionId}
// ============================================================

import { useEffect, useRef, useState, useCallback } from 'react';
import { getSupabaseBrowser } from './supabase';

export interface PlayerRemote {
  nick: string;
  pion: any | null;
  vote: any | null;
}

export function useSessionSync(sessionId: string, playerId?: string, nick?: string) {
  const [remotePhase, setRemotePhase] = useState<string | null>(null);
  const [remoteCardIdx, setRemoteCardIdx] = useState<number | null>(null);
  const [remotePlayers, setRemotePlayers] = useState<Record<string, PlayerRemote>>({});
  const [remoteResultat, setRemoteResultat] = useState<any | null>(null);
  const [connected, setConnected] = useState(false);
  const chRef = useRef<any>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    const ch = supabase.channel(`anglemort-${sessionId}`, {
      config: { broadcast: { self: false } },
    });

    ch.on('broadcast', { event: 'msg' }, ({ payload }) => {
      const m = payload as any;
      console.log('[sync] reçu:', m.type, m.playerId || '', m.data);
      if (m.type === 'phase') {
        setRemotePhase(m.data.phase);
      } else if (m.type === 'carte') {
        setRemoteCardIdx(m.data.cardIdx);
      } else if (m.type === 'pion' && m.playerId) {
        setRemotePlayers((prev) => ({
          ...prev,
          [m.playerId]: {
            ...(prev[m.playerId] || { nick: '', pion: null, vote: null }),
            nick: m.data.nick,
            pion: m.data.pion,
          },
        }));
      } else if (m.type === 'vote' && m.playerId) {
        setRemotePlayers((prev) => ({
          ...prev,
          [m.playerId]: {
            ...(prev[m.playerId] || { nick: '', pion: null, vote: null }),
            nick: m.data.nick,
            vote: m.data.vote,
          },
        }));
      } else if (m.type === 'resultat') {
        setRemoteResultat(m.data.resultat);
      } else if (m.type === 'hello' && m.playerId && m.data) {
        setRemotePlayers((prev) => ({
          ...prev,
          [m.playerId]: {
            ...(prev[m.playerId] || { pion: null, vote: null }),
            nick: m.data.nick,
          },
        }));
      }
    });

    ch.subscribe((status: string) => {
      if (status === 'SUBSCRIBED') {
        setConnected(true);
        if (playerId && nick) {
          ch.send({
            type: 'broadcast',
            event: 'msg',
            payload: { type: 'hello', playerId, data: { nick } },
          });
        }
      }
    });

    chRef.current = ch;
    return () => {
      ch.unsubscribe();
      chRef.current = null;
    };
  }, [sessionId, playerId, nick]);

  const sendPhase = useCallback((phase: string) => {
    chRef.current?.send({
      type: 'broadcast',
      event: 'msg',
      payload: { type: 'phase', data: { phase } },
    });
  }, []);

  const sendCarte = useCallback((cardIdx: number) => {
    chRef.current?.send({
      type: 'broadcast',
      event: 'msg',
      payload: { type: 'carte', data: { cardIdx } },
    });
  }, []);

  const sendPion = useCallback(
    (pion: any) => {
      if (!playerId || !nick) return;
      console.log('[sync] envoi pion:', playerId, pion);
      chRef.current?.send({
        type: 'broadcast',
        event: 'msg',
        payload: { type: 'pion', playerId, data: { nick, pion } },
      });
    },
    [playerId, nick]
  );

  const sendVote = useCallback(
    (vote: any) => {
      if (!playerId || !nick) return;
      chRef.current?.send({
        type: 'broadcast',
        event: 'msg',
        payload: { type: 'vote', playerId, data: { nick, vote } },
      });
    },
    [playerId, nick]
  );

  const sendResultat = useCallback((resultat: any) => {
    chRef.current?.send({
      type: 'broadcast',
      event: 'msg',
      payload: { type: 'resultat', data: { resultat } },
    });
  }, []);

  return {
    connected,
    remotePhase,
    remoteCardIdx,
    remotePlayers,
    remoteResultat,
    sendPhase,
    sendCarte,
    sendPion,
    sendVote,
    sendResultat,
  };
}
