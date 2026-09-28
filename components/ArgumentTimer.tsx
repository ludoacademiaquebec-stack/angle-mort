'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { Joueur } from '../lib/types';

function useSharedTimer(
  sessionId: string,
  dureeTotalSec: number,
  isFacilitator: boolean
) {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<any>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('sessions')
        .select('elapsed_sec, timer_running')
        .eq('id', sessionId)
        .maybeSingle();
      if (data) {
        setElapsed(data.elapsed_sec || 0);
        setRunning(data.timer_running || false);
      }
    })();
  }, [sessionId]);

  useEffect(() => {
    const iv = setInterval(async () => {
      const { data } = await supabase
        .from('sessions')
        .select('elapsed_sec, timer_running')
        .eq('id', sessionId)
        .maybeSingle();
      if (data) {
        setElapsed(data.elapsed_sec || 0);
        setRunning(data.timer_running || false);
      }
    }, 1000);
    return () => clearInterval(iv);
  }, [sessionId]);

  useEffect(() => {
    if (!isFacilitator) return;
    if (!running) return;
    intervalRef.current = setInterval(async () => {
      const nouvelElapsed = elapsed + 1;
      setElapsed(nouvelElapsed);
      await supabase
        .from('sessions')
        .update({ elapsed_sec: nouvelElapsed })
        .eq('id', sessionId);
      if (nouvelElapsed >= dureeTotalSec) {
        setRunning(false);
        await supabase
          .from('sessions')
          .update({ timer_running: false })
          .eq('id', sessionId);
      }
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, elapsed, isFacilitator, sessionId, dureeTotalSec]);

  const demarrer = async () => {
    setElapsed(0);
    setRunning(true);
    if (isFacilitator) {
      await supabase
        .from('sessions')
        .update({ elapsed_sec: 0, timer_running: true })
        .eq('id', sessionId);
    }
  };

  const arreter = async () => {
    setRunning(false);
    if (isFacilitator) {
      await supabase
        .from('sessions')
        .update({ timer_running: false })
        .eq('id', sessionId);
    }
  };

  const reprendre = async () => {
    if (elapsed >= dureeTotalSec) return;
    setRunning(true);
    if (isFacilitator) {
      await supabase
        .from('sessions')
        .update({ timer_running: true })
        .eq('id', sessionId);
    }
  };

  const ajouterTemps = async (sec: number) => {
    const nouveau = Math.max(0, elapsed - sec);
    setElapsed(nouveau);
    if (isFacilitator) {
      await supabase
        .from('sessions')
        .update({ elapsed_sec: nouveau })
        .eq('id', sessionId);
    }
  };

  const reset = async () => {
    setElapsed(0);
    setRunning(false);
    if (isFacilitator) {
      await supabase
        .from('sessions')
        .update({ elapsed_sec: 0, timer_running: false })
        .eq('id', sessionId);
    }
  };

  const tempsRestantTotal = Math.max(0, dureeTotalSec - elapsed);

  return {
    running,
    elapsed,
    tempsRestantTotal,
    demarrer,
    arreter,
    reprendre,
    ajouterTemps,
    reset,
  };
}

function formatTemps(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function ArgumentTimerFacilitator({
  dureeTotalSec,
  joueurs,
  sessionId,
}: {
  dureeTotalSec: number;
  joueurs: Joueur[];
  sessionId: string;
}) {
  const t = useSharedTimer(sessionId, dureeTotalSec, true);
  const tempsParJoueur = joueurs.length > 0 ? Math.floor(dureeTotalSec / joueurs.length) : 0;
  const indexEnCours =
    tempsParJoueur > 0 ? Math.min(Math.floor(t.elapsed / tempsParJoueur), joueurs.length - 1) : 0;

  return (
    <div
      style={{
        background: '#FBF8EF',
        border: '1px solid rgba(20,23,27,0.15)',
        borderRadius: 6,
        padding: 20,
      }}
    >
      <div
        style={{
          fontFamily: 'ui-monospace, monospace',
          fontSize: 10,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'rgba(20,23,27,0.5)',
          marginBottom: 12,
        }}
      >
        Argumentation • {formatTemps(t.tempsRestantTotal)} restant
      </div>

      <div
        style={{
          height: 6,
          background: 'rgba(20,23,27,0.08)',
          borderRadius: 3,
          overflow: 'hidden',
          marginBottom: 16,
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${(t.elapsed / dureeTotalSec) * 100}%`,
            background: '#14171B',
            transition: 'width 1s linear',
          }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {joueurs.map((j, i) => {
          const estEnCours = i === indexEnCours && t.running;
          const estPasse = i < indexEnCours;
          const finTour = (i + 1) * tempsParJoueur;
          const restant = Math.max(0, finTour - t.elapsed);
          return (
            <div
              key={j.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: 4,
                background: estEnCours ? '#FDE047' : estPasse ? 'rgba(20,23,27,0.03)' : '#FFFFFF',
                border: estEnCours ? '1px solid #14171B' : '1px solid rgba(20,23,27,0.08)',
                opacity: estPasse ? 0.5 : 1,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14 }}>{estEnCours ? '🎤' : estPasse ? '✓' : '·'}</span>
                <span style={{ fontSize: 13, fontWeight: estEnCours ? 700 : 400 }}>{j.nick}</span>
              </div>
              <span
                style={{
                  fontFamily: 'ui-monospace, monospace',
                  fontSize: 12,
                  fontWeight: 600,
                  color: estEnCours ? '#14171B' : 'rgba(20,23,27,0.4)',
                }}
              >
                {formatTemps(restant)}
              </span>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
        {!t.running && t.elapsed === 0 && (
          <button
            onClick={t.demarrer}
            style={{
              flex: 1,
              padding: '10px 16px',
              background: '#14171B',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 4,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            ▶ Lancer l'argumentation
          </button>
        )}
        {t.running && (
          <>
            <button
              onClick={t.arreter}
              style={{
                flex: 1,
                padding: '10px 16px',
                background: '#FBF8EF',
                color: '#14171B',
                border: '1px solid #14171B',
                borderRadius: 4,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              ⏸ Pause
            </button>
            <button
              onClick={() => t.ajouterTemps(30)}
              style={{
                padding: '10px 16px',
                background: '#FBF8EF',
                color: '#14171B',
                border: '1px solid rgba(20,23,27,0.2)',
                borderRadius: 4,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              +30 s
            </button>
          </>
        )}
        {!t.running && t.elapsed > 0 && (
          <>
            <button
              onClick={t.reprendre}
              style={{
                flex: 1,
                padding: '10px 16px',
                background: '#14171B',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 4,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              ▶ Reprendre
            </button>
            <button
              onClick={t.reset}
              style={{
                padding: '10px 16px',
                background: '#FBF8EF',
                color: '#14171B',
                border: '1px solid rgba(20,23,27,0.2)',
                borderRadius: 4,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              ↻ Reset
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export function ArgumentTimerPlayer({
  dureeTotalSec,
  joueurs,
  playerId,
  sessionId,
}: {
  dureeTotalSec: number;
  joueurs: Joueur[];
  playerId: string;
  sessionId: string;
}) {
  const t = useSharedTimer(sessionId, dureeTotalSec, false);
  const tempsParJoueur = joueurs.length > 0 ? Math.floor(dureeTotalSec / joueurs.length) : 0;
  const indexEnCours =
    tempsParJoueur > 0 ? Math.min(Math.floor(t.elapsed / tempsParJoueur), joueurs.length - 1) : 0;
  const joueurEnCours = joueurs[indexEnCours];
  const monIndex = joueurs.findIndex((j) => j.id === playerId);
  const cEstMonTour = monIndex === indexEnCours && t.running;
  const finTour = (monIndex + 1) * tempsParJoueur;
  const restantMonTour = cEstMonTour ? Math.max(0, finTour - t.elapsed) : 0;
  const tempsEcoule = t.elapsed >= dureeTotalSec;

  if (tempsEcoule) {
    return (
      <div
        style={{
          background: '#FDE047',
          border: '2px solid #14171B',
          borderRadius: 6,
          padding: 24,
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 700, color: '#14171B' }}>Temps écoulé</div>
        <div style={{ fontSize: 13, marginTop: 4, color: 'rgba(20,23,27,0.7)' }}>
          Passage au vote final
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        background: cEstMonTour ? '#FDE047' : '#FBF8EF',
        border: cEstMonTour ? '2px solid #14171B' : '1px solid rgba(20,23,27,0.15)',
        borderRadius: 6,
        padding: 20,
        textAlign: 'center',
      }}
    >
      {!t.running ? (
        <>
          <div style={{ fontSize: 13, color: 'rgba(20,23,27,0.6)' }}>En attente du lancement</div>
          <div style={{ fontSize: 11, marginTop: 4, color: 'rgba(20,23,27,0.4)' }}>
            Le facilitateur va lancer l'argumentation
          </div>
        </>
      ) : cEstMonTour ? (
        <>
          <div
            style={{
              fontFamily: 'ui-monospace, monospace',
              fontSize: 10,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'rgba(20,23,27,0.6)',
            }}
          >
            C'est ton tour
          </div>
          <div
            style={{
              fontFamily: 'Georgia, serif',
              fontSize: 48,
              fontWeight: 700,
              color: '#14171B',
              lineHeight: 1,
              marginTop: 8,
            }}
          >
            {formatTemps(restantMonTour)}
          </div>
          <div style={{ fontSize: 12, marginTop: 8, color: 'rgba(20,23,27,0.6)' }}>
            1) Ton punctum du signal • 2) Ce qui guide ta décision
          </div>
        </>
      ) : (
        <>
          <div
            style={{
              fontFamily: 'ui-monospace, monospace',
              fontSize: 10,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'rgba(20,23,27,0.6)',
            }}
          >
            Au tour de
          </div>
          <div
            style={{
              fontFamily: 'Georgia, serif',
              fontSize: 24,
              fontWeight: 700,
              color: '#14171B',
              marginTop: 4,
            }}
          >
            {joueurEnCours?.nick || '—'}
          </div>
          <div style={{ fontSize: 12, marginTop: 8, color: 'rgba(20,23,27,0.5)' }}>
            Temps total restant : {formatTemps(t.tempsRestantTotal)}
          </div>
        </>
      )}
    </div>
  );
}
