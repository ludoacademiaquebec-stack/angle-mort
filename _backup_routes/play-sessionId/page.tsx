'use client';

import { useState, useEffect } from 'react';
import { GameEngine } from '../../../components/GameEngine';
import type { Joueur } from '../../../lib/types';

function uuidv4() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default function PlayPage({
  params,
}: {
  params: { sessionId: string };
}) {
  const [nick, setNick] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [entre, setEntre] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [ready, setReady] = useState(false);

  // Reconnexion automatique depuis localStorage
  useEffect(() => {
    const key = `anglemort-${params.sessionId}`;
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const data = JSON.parse(stored);
        if (data.playerId && data.nick) {
          setPlayerId(data.playerId);
          setNick(data.nick);
          setEntre(true);
        }
      }
    } catch {}
    setReady(true);
  }, [params.sessionId]);

  const rejoindre = () => {
    const newPlayerId = uuidv4();
    setPlayerId(newPlayerId);
    setNick(inputValue.trim());
    setEntre(true);
    // Sauvegarder dans localStorage
    const key = `anglemort-${params.sessionId}`;
    try {
      localStorage.setItem(key, JSON.stringify({
        playerId: newPlayerId,
        nick: inputValue.trim(),
      }));
    } catch {}
  };

  const seDeconnecter = () => {
    const key = `anglemort-${params.sessionId}`;
    try { localStorage.removeItem(key); } catch {}
    setEntre(false);
    setPlayerId('');
    setNick('');
    setInputValue('');
  };

  if (!ready) {
    return null;
  }

  // Écran d'entrée
  if (!entre) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#F4EFE2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
        }}
      >
        <div
          style={{
            maxWidth: 380,
            width: '100%',
            background: '#FBF8EF',
            border: '1px solid rgba(20,23,27,0.15)',
            borderRadius: 8,
            padding: 28,
          }}
        >
          <div
            style={{
              fontFamily: 'Georgia, serif',
              fontSize: 24,
              fontWeight: 700,
              color: '#14171B',
              marginBottom: 4,
            }}
          >
            Angle Mort
          </div>
          <div
            style={{
              fontFamily: 'ui-monospace, monospace',
              fontSize: 11,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'rgba(20,23,27,0.5)',
              marginBottom: 20,
            }}
          >
            Session {params.sessionId}
          </div>
          <label
            style={{
              fontSize: 12,
              color: 'rgba(20,23,27,0.6)',
              display: 'block',
              marginBottom: 6,
            }}
          >
            Ton prénom ou pseudo
          </label>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && inputValue.trim().length >= 2) rejoindre();
            }}
            placeholder="Ex : Marie"
            autoFocus
            style={{
              width: '100%',
              padding: '12px 14px',
              fontSize: 15,
              border: '1px solid rgba(20,23,27,0.2)',
              borderRadius: 4,
              background: '#FFFFFF',
              color: '#14171B',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          <button
            onClick={rejoindre}
            disabled={inputValue.trim().length < 2}
            style={{
              width: '100%',
              marginTop: 16,
              padding: '14px 16px',
              background: inputValue.trim().length >= 2 ? '#14171B' : 'rgba(20,23,27,0.2)',
              color: '#FBF8EF',
              border: 'none',
              borderRadius: 4,
              fontSize: 14,
              fontWeight: 600,
              cursor: inputValue.trim().length >= 2 ? 'pointer' : 'not-allowed',
            }}
          >
            Entrer dans la session
          </button>
          <div
            style={{
              marginTop: 12,
              fontSize: 11,
              color: 'rgba(20,23,27,0.4)',
              textAlign: 'center',
            }}
          >
            Votre pseudo sera mémorisé pour cette session
          </div>
        </div>
      </div>
    );
  }

  // En jeu
  const joueurs: Joueur[] = [
    {
      id: playerId,
      sessionId: params.sessionId,
      nick,
      cartesQuestion: 0,
      cartesMesure: 0,
      lastSeenAt: Date.now(),
      connected: true,
    },
  ];

  return (
    <>
      <GameEngine
        sessionId={params.sessionId}
        role="player"
        playerId={playerId}
        playerNick={nick}
        joueurs={joueurs}
      />
      <button
        onClick={seDeconnecter}
        style={{
          position: 'fixed',
          bottom: 12,
          right: 12,
          padding: '8px 12px',
          background: 'rgba(20,23,27,0.7)',
          color: '#FBF8EF',
          border: 'none',
          borderRadius: 4,
          fontSize: 11,
          cursor: 'pointer',
          zIndex: 100,
        }}
      >
        Changer de pseudo
      </button>
    </>
  );
}
