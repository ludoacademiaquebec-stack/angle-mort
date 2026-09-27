'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function FacilitateurPage() {
  const [code, setCode] = useState('');
  const [company, setCompany] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionCode, setSessionCode] = useState('');
  const [sessionId, setSessionId] = useState('');
  const router = useRouter();

  const startSession = async () => {
    setError('');
    setLoading(true);

    const { data: faci, error: faciErr } = await supabase
      .from('facilitators')
      .select('*')
      .eq('code', code.trim().toUpperCase())
      .eq('active', true)
      .single();

    if (faciErr || !faci) {
      setError('Code FACI invalide ou inactif. Vérifie dans Super Admin.');
      setLoading(false);
      return;
    }

    const newId = 'SESS-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const { error: sessErr } = await supabase.from('sessions').insert({
      id: newId,
      code: newCode,
      company: company.trim() || null,
      facilitator_id: faci.id,
      phase: 'cadrage',
      status: 'active',
    });

    if (sessErr) {
      setError(sessErr.message);
      setLoading(false);
      return;
    }

    setSessionCode(newCode);
    setSessionId(newId);
    setLoading(false);
  };

  if (sessionCode && sessionId) {
    return (
      <div style={{ minHeight: '100vh', background: '#FFFEF9', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ maxWidth: 520, width: '100%', background: '#FDE047', border: '2px solid #14171B', borderRadius: 12, padding: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.6, letterSpacing: '0.1em' }}>SESSION CRÉÉE</div>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 42, fontWeight: 800, margin: '16px 0 8px', letterSpacing: '0.1em', fontFamily: 'monospace' }}>
            {sessionCode}
          </div>
          <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 24 }}>
            Partagez ce code avec vos joueurs
          </div>
          <Link
            href={'/board/' + sessionId}
            style={{ display: 'block', padding: 16, background: '#14171B', color: '#FFF', textDecoration: 'none', borderRadius: 6, fontWeight: 700, fontSize: 15 }}
          >
            Ouvrir le plateau facilitateur →
          </Link>
          <div style={{ fontSize: 12, marginTop: 16, opacity: 0.7 }}>
            Les joueurs vont sur <Link href="/joueur" style={{ color: '#14171B', textDecoration: 'underline' }}>/joueur</Link> et entrent <strong>{sessionCode}</strong>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FFFEF9', color: '#14171B', padding: 40 }}>
      <div style={{ maxWidth: 520, margin: '0 auto' }}>
        <Link href="/" style={{ fontSize: 13, opacity: 0.6, textDecoration: 'none' }}>← Retour</Link>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 32, fontWeight: 700, marginTop: 16, lineHeight: 1.1 }}>
          Espace facilitateur
        </h1>
        <p style={{ opacity: 0.7, fontSize: 14, marginBottom: 24 }}>
          Entrez votre code facilitateur pour démarrer une nouvelle session
        </p>

        <div style={{ background: '#FBF8EF', border: '2px solid #14171B', borderRadius: 12, padding: 24 }}>
          <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>Code facilitateur</label>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="FACI-001"
            style={{ width: '100%', padding: 14, marginBottom: 16, border: '1px solid #14171B', borderRadius: 6, fontWeight: 700, fontFamily: 'monospace', letterSpacing: '0.1em', textAlign: 'center', boxSizing: 'border-box' }}
          />

          <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>Entreprise (optionnel)</label>
          <input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Institut Lumière"
            style={{ width: '100%', padding: 14, marginBottom: 16, border: '1px solid #14171B', borderRadius: 6, boxSizing: 'border-box' }}
          />

          {error && (
            <div style={{ background: '#FEE2E2', color: '#DC2626', padding: 12, borderRadius: 6, marginBottom: 12, fontSize: 13 }}>
              {error}
            </div>
          )}

          <button
            onClick={startSession}
            disabled={loading}
            style={{ width: '100%', padding: 16, background: '#14171B', color: '#FBF8EF', borderRadius: 6, fontWeight: 700, fontSize: 15, border: 'none', cursor: loading ? 'wait' : 'pointer' }}
          >
            {loading ? 'Vérification...' : 'Démarrer une session →'}
          </button>
        </div>
      </div>
    </div>
  );
}
