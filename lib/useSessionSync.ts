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

  // ✅ Refs pour éviter la re-souscription quand playerId/nick changent d'identité
  const playerIdRef = useRef(playerId);
  const nickRef = useRef(nick);
  useEffect(() => { playerIdRef.current = playerId; }, [playerId]);
  useEffect(() => { nickRef.current = nick; }, [nick]);

  // ✅ Souscription unique par sessionId
  useEffect(() => {
    if (!sessionId) return;

    const supabase = getSupabaseBrowser();
    const ch = supabase.channel(`anglemort-${sessionId}`, {
      config: { broadcast: { self: false } },
    });

    ch.on('broadcast', { event: 'msg' }, ({ payload }) => {
      const m = payload as any;
      if (!m || !m.type) return;

      if (m.type === 'phase') {
        setRemotePhase(m.data?.phase ?? null);
      } else if (m.type === 'carte') {
        setRemoteCardIdx(typeof m.data?.cardIdx === 'number' ? m.data.cardIdx : null);
      } else if (m.type === 'pion' && m.playerId) {
        setRemotePlayers((prev) => ({
          ...prev,
          [m.playerId]: {
            ...(prev[m.playerId] || { nick: '', pion: null, vote: null }),
            nick: m.data?.nick || prev[m.playerId]?.nick || '',
            pion: m.data?.pion ?? null,
          },
        }));
      } else if (m.type === 'vote' && m.playerId) {
        setRemotePlayers((prev) => ({
          ...prev,
          [m.playerId]: {
            ...(prev[m.playerId] || { nick: '', pion: null, vote: null }),
            nick: m.data?.nick || prev[m.playerId]?.nick || '',
            vote: m.data?.vote ?? null,
          },
        }));
      } else if (m.type === 'resultat') {
        setRemoteResultat(m.data?.resultat ?? null);
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
        // ✅ Utilise les refs pour éviter de relancer l'effet
        const pid = playerIdRef.current;
        const nk = nickRef.current;
        if (pid && nk) {
          ch.send({
            type: 'broadcast',
            event: 'msg',
            payload: { type: 'hello', playerId: pid, data: { nick: nk } },
          });
        }
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        setConnected(false);
      }
    });

    chRef.current = ch;

    return () => {
      // ✅ removeChannel supprime complètement le canal côté client Supabase
      try {
        supabase.removeChannel(ch);
      } catch {}
      chRef.current = null;
      setConnected(false);
    };
  }, [sessionId]); // ✅ uniquement sessionId

  // ✅ Envoi "safe" : vérifie que le canal est prêt et capture les erreurs
  const safeSend = useCallback((payload: any) => {
    const ch = chRef.current;
    if (!ch) return;
    try {
      // Certaines versions retournent une promesse
      const p = ch.send({ type: 'broadcast', event: 'msg', payload });
      if (p && typeof p.catch === 'function') {
        p.catch((err: any) => console.warn('[sync] send error:', err));
      }
    } catch (err) {
      console.warn('[sync] send error:', err);
    }
  }, []);

  const sendPhase = useCallback((phase: string) => {
    safeSend({ type: 'phase', data: { phase } });
  }, [safeSend]);

  const sendCarte = useCallback((cardIdx: number) => {
    safeSend({ type: 'carte', data: { cardIdx } });
  }, [safeSend]);

  const sendPion = useCallback((pion: any) => {
    const pid = playerIdRef.current;
    const nk = nickRef.current;
    if (!pid || !nk) return;
    safeSend({ type: 'pion', playerId: pid, data: { nick: nk, pion } });
  }, [safeSend]);

  const sendVote = useCallback((vote: any) => {
    const pid = playerIdRef.current;
    const nk = nickRef.current;
    if (!pid || !nk) return;
    safeSend({ type: 'vote', playerId: pid, data: { nick: nk, vote } });
  }, [safeSend]);

  const sendResultat = useCallback((resultat: any) => {
    safeSend({ type: 'resultat', data: { resultat } });
  }, [safeSend]);

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