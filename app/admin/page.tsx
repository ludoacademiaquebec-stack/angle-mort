'use client';

import { useState, useEffect } from 'react';

export default function AdminPage() {
  const [sessionId, setSessionId] = useState('');
  const [company, setCompany] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ sessionId: string; code: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);

  const chargerSessions = async () => {
    try {
      const res = await fetch('/api/sessions');
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    } catch {}
  };

  useEffect(() => { chargerSessions(); }, []);

  const creer = async () => {
    if (!sessionId.trim()) { setError('Identifiant requis'); return; }
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await fetch('/api/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sessionId.trim(), company: company.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');
      setResult({ sessionId: data.sessionId, code: data.code });
      setSessionId(''); setCompany('');
      chargerSessions();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F4EFE2', padding: 32 }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 28, marginBottom: 4 }}>Super Admin</h1>
        <p style={{ color: 'rgba(20,23,27,0.6)', fontSize: 13, marginBottom: 24 }}>Créer et gérer les sessions</p>

        <div style={{ background: '#FBF8EF', border: '1px solid rgba(20,23,27,0.15)', borderRadius: 8, padding: 24, marginBottom: 32 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Nouvelle session</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <input type="text" placeholder="ID (ex: ILQ-DESJARDINS)" value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              style={{ padding: '12px 14px', fontSize: 14, border: '1px solid rgba(20,23,27,0.2)', borderRadius: 4, background: '#FFF', outline: 'none' }} />
            <input type="text" placeholder="Entreprise" value={company}
              onChange={(e) => setCompany(e.target.value)}
              style={{ padding: '12px 14px', fontSize: 14, border: '1px solid rgba(20,23,27,0.2)', borderRadius: 4, background: '#FFF', outline: 'none' }} />
          </div>
          <button onClick={creer} disabled={loading}
            style={{ marginTop: 12, padding: '12px 24px', background: '#14171B', color: '#FBF8EF', border: 'none', borderRadius: 4, fontSize: 13, fontWeight: 600, cursor: loading ? 'wait' : 'pointer' }}>
            {loading ? 'Création...' : 'Créer la session'}
          </button>

          {error && <div style={{ marginTop: 12, padding: 10, background: '#FEF2F2', color: '#B91C1C', borderRadius: 4, fontSize: 12 }}>{error}</div>}

          {result && (
            <div style={{ marginTop: 16, padding: 16, background: '#FDE047', borderRadius: 4 }}>
              <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Session créée</div>
              <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'monospace', letterSpacing: '0.2em', marginBottom: 12 }}>{result.code}</div>
              <div style={{ fontSize: 12 }}><strong>Code :</strong> {result.code}</div>
              <div style={{ fontSize: 12 }}><strong>Board :</strong> /board/{result.sessionId}</div>
              <div style={{ fontSize: 12 }}><strong>Joueur :</strong> /rejoindre</div>
            </div>
          )}
        </div>

        <div style={{ background: '#FBF8EF', border: '1px solid rgba(20,23,27,0.15)', borderRadius: 8, padding: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Sessions ({sessions.length})</div>
          {sessions.length === 0 && <div style={{ fontSize: 12, color: 'rgba(20,23,27,0.5)' }}>Aucune</div>}
          {sessions.map((s) => (
            <div key={s.id} style={{ padding: '10px 12px', borderTop: '1px solid rgba(20,23,27,0.08)', display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <strong>{s.id}</strong>
              <span style={{ fontFamily: 'monospace', letterSpacing: '0.15em' }}>{s.code}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
