'use client';

import { useEffect, useState, useRef } from 'react';
import type { Joueur } from '../lib/types';

// ------------------------------------------------------------
// Hook interne : gère le décompte total et l'index du tour
// ------------------------------------------------------------
function useArgumentTimer(
  dureeTotalSec: number,
  joueurs: { id: string; nick: string }[],
  onFin?: () => void
) {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [indexEnCours, setIndexEnCours] = useState(0);

  // Temps par joueur (réparti équitablement)
  const tempsParJoueur = joueurs.length > 0 ? Math.floor(dureeTotalSec / joueurs.length) : 0;

  useEffect(() => {
    if (!running) return;
    const iv = setInterval(() => {
      setElapsed((e) => e + 1);
    }, 1000);
    return () => clearInterval(iv);
  }, [running]);

  // Gestion des transitions de tour et de fin (hors reducer)
  useEffect(() => {
    if (!running) return;

    // Calcul du tour courant à partir du temps écoulé
    if (tempsParJoueur > 0) {
      const idx = Math.floor(elapsed / tempsParJoueur);
      if (idx !== indexEnCours && idx < joueurs.length) {
        setIndexEnCours(idx);
      }
    }

    // Fin totale
    if (elapsed >= dureeTotalSec) {
      setRunning(false);
      onFin?.();
    }
  }, [elapsed, running, tempsParJoueur, joueurs.length, dureeTotalSec, indexEnCours, onFin]);

  // Effet dédié : déclenche onFin une seule fois quand le timer s'arrête
  const onFinCalledRef = useRef(false);
  useEffect(() => {
    if (!running && elapsed > 0 && onFinCalledRef.current === false) {
      onFinCalledRef.current = true;
      onFin?.();
    }
    if (running) {
      onFinCalledRef.current = false;
    }
  }, [running, elapsed, onFin]);

  const demarrer = () => {
    setElapsed(0);
    setIndexEnCours(0);
    setRunning(true);
    onFinCalledRef.current = false;
  };

  const arreter = () => setRunning(false);

  const passerAuSuivant = () => {
    const nextIdx = indexEnCours + 1;
    if (nextIdx >= joueurs.length) {
      setRunning(false);
      // onFin sera appelé via l'effet ci-dessous
      return;
    }
    setIndexEnCours(nextIdx);
    setElapsed(nextIdx * tempsParJoueur);
  };

  const ajouterTemps = (secondes: number) => {
    setElapsed((e) => Math.max(0, e - secondes));
  };

  // Pour chaque joueur : temps restant dans son tour
  const tempsRestantJoueur = (idx: number): number => {
    const finTour = (idx + 1) * tempsParJoueur;
    return Math.max(0, finTour - elapsed);
  };

  const tempsRestantTotal = Math.max(0, dureeTotalSec - elapsed);

  return {
    running,
    elapsed,
    indexEnCours,
    tempsParJoueur,
    tempsRestantTotal,
    tempsRestantJoueur,
    demarrer,
    arreter,
    passerAuSuivant,
    ajouterTemps,
  };
}

// ------------------------------------------------------------
// Formatage mm:ss
// ------------------------------------------------------------
function formatTemps(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ------------------------------------------------------------
// Vue facilitateur
// ------------------------------------------------------------
export function ArgumentTimerFacilitator({
  dureeTotalSec,
  joueurs,
}: {
  dureeTotalSec: number;
  joueurs: Joueur[];
  onFin?: () => void;
}) {
  // Le timer ne déclenche JAMAIS le passage de phase.
  // C'est le facilitateur qui clique les boutons.
  const t = useArgumentTimer(dureeTotalSec, joueurs);
  const joueurEnCours = joueurs[t.indexEnCours];

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

      {/* Barre de progression globale */}
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

      {/* Liste des joueurs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {joueurs.map((j, i) => {
          const estEnCours = i === t.indexEnCours && t.running;
          const estPasse = i < t.indexEnCours;
          const restant = t.tempsRestantJoueur(i);
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
                transition: 'all 0.15s',
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

      {/* Contrôles */}
      <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
        {!t.running ? (
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
        ) : (
          <>
            <button
              onClick={t.passerAuSuivant}
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
              ⏭ Passer la parole
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
            <button
              onClick={t.arreter}
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
              ⏸ Pause
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// Vue joueur
// ------------------------------------------------------------
export function ArgumentTimerPlayer({
  dureeTotalSec,
  joueurs,
  playerId,
}: {
  dureeTotalSec: number;
  joueurs: Joueur[];
  playerId: string;
}) {
  const t = useArgumentTimer(dureeTotalSec, joueurs);
  const joueurEnCours = joueurs[t.indexEnCours];
  const monIndex = joueurs.findIndex((j) => j.id === playerId);
  const cEstMonTour = monIndex === t.indexEnCours && t.running;
  const restantMonTour = cEstMonTour ? t.tempsRestantJoueur(monIndex) : 0;

  // Détection quand le tour du joueur est écoulé
  const tourEstEcoule = cEstMonTour && restantMonTour === 0;

  // Bandeau jaune à la fin du temps total
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
        background: cEstMonTour ? (tourEstEcoule ? '#FEF2F2' : '#FDE047') : '#FBF8EF',
        border: cEstMonTour ? '2px solid #14171B' : '1px solid rgba(20,23,27,0.15)',
        borderRadius: 6,
        padding: 20,
        textAlign: 'center',
        transition: 'all 0.2s',
      }}
    >
      {!t.running ? (
        <>
          <div style={{ fontSize: 13, color: 'rgba(20,23,27,0.6)' }}>
            En attente du lancement
          </div>
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
              color: tourEstEcoule ? '#DC2626' : '#14171B',
              lineHeight: 1,
              marginTop: 8,
            }}
          >
            {formatTemps(restantMonTour)}
          </div>
          <div style={{ fontSize: 12, marginTop: 8, color: 'rgba(20,23,27,0.6)' }}>
            Argumente ton choix : pourquoi tu gardes ou tu déplaces
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
