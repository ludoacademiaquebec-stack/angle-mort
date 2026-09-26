'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RejoindrePage() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const rejoindre = async () => {
    if (code.length !== 6) {
      setError('Le code doit faire 6 caractères');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/session-by-code?code=${code}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Session introuvable');
        setLoading(false);
        return;
      }
      router.push(`/play/${data.sessionId}`);
    } catch (e) {
      setError('Erreur de connexion');
      setLoading(false);
    }
  };

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
          maxWidth: 420,
          width: '100%',
          background: '#FBF8EF',
          border: '1px solid rgba(20,23,27,0.15)',
          borderRadius: 8,
          padding: 32,
        }}
      >
        <div
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: 28,
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
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'rgba(20,23,27,0.5)',
            marginBottom: 24,
          }}
        >
          Rejoindre une session
        </div>

        <label
          style={{
            fontSize: 12,
            color: 'rgba(20,23,27,0.6)',
            display: 'block',
            marginBottom: 6,
          }}
        >
          Code à 6 caractères
        </label>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
          onKeyDown={(e) => {
            if (e.key === 'Enter') rejoindre();
          }}
          placeholder="EX: LUMI42"
          autoFocus
          style={{
            width: '100%',
            padding: '16px 14px',
            fontSize: 20,
            fontFamily: 'ui-monospace, monospace',
            letterSpacing: '0.3em',
            textAlign: 'center',
            textTransform: 'uppercase',
            border: '1px solid rgba(20,23,27,0.2)',
            borderRadius: 4,
            background: '#FFFFFF',
            color: '#14171B',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />

        {error && (
          <div
            style={{
              marginTop: 12,
              padding: '10px 12px',
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: 4,
              fontSize: 12,
              color: '#B91C1C',
            }}
          >
            {error}
          </div>
        )}

        <button
          onClick={rejoindre}
          disabled={loading || code.length !== 6}
          style={{
            width: '100%',
            marginTop: 20,
            padding: '14px 16px',
            background: code.length === 6 && !loading ? '#14171B' : 'rgba(20,23,27,0.2)',
            color: '#FBF8EF',
            border: 'none',
            borderRadius: 4,
            fontSize: 15,
            fontWeight: 600,
            cursor: code.length === 6 && !loading ? 'pointer' : 'not-allowed',
          }}
        >
          {loading ? 'Recherche...' : 'Rejoindre →'}
        </button>

        <div
          style={{
            marginTop: 20,
            paddingTop: 16,
            borderTop: '1px solid rgba(20,23,27,0.08)',
            fontSize: 11,
            color: 'rgba(20,23,27,0.5)',
            textAlign: 'center',
          }}
        >
          Le code est fourni par votre facilitateur
        </div>
      </div>
    </div>
  );
}
