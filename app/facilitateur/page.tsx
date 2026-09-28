'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { VERSION_CONFIG, Version } from '@/lib/types';

export default function FacilitateurPage() {
  const [code, setCode] = useState('FACI-002');
  const [company, setCompany] = useState('');
  const [version, setVersion] = useState<Version>('moyen');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionCode, setSessionCode] = useState('');
  const [sessionId, setSessionId] = useState('');
  const router = useRouter();

  const startSession = async () => {
    setError('');
    setLoading(true);
    const faciCode = code.trim().toUpperCase();

    localStorage.setItem('facilitator_code', faciCode);
    localStorage.setItem('facilitator_company', company.trim());

    const { data: faci } = await supabase
      .from('facilitators')
      .select('*')
      .eq('code', faciCode)
      .eq('active', true)
      .single();

    if (!faci) {
      console.warn('Facilitateur non trouvé, création session en mode dev avec', faciCode);
    }

    const newId = 'SESS-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const { error: sessErr } = await supabase.from('sessions').insert({
      id: newId,
      code: newId,
      company: company.trim() || 'Test',
      version,
      facilitator_id: faci?.id || null,
      phase: 'cadrage',
      status: 'active',
    });

    if (sessErr) {
      setError(sessErr.message);
      setLoading(false);
      return;
    }

    setSessionCode(newId);
    setSessionId(newId);
    setLoading(false);
    router.push('/board/' + newId);
  };

  if (sessionCode && sessionId) {
    return (
      <div style={{ minHeight: '100vh', background: '#FFFEF9', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ maxWidth: 520, width: '100%', background: '#FDE047', border: '2px solid #14171B', borderRadius: 12, padding: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.6, letterSpacing: '0.1em' }}>SESSION CRÉÉE</div>
          <div style={{ fontSize: 32, fontWeight: 800, margin: '16px 0 8px', letterSpacing: '0.05em', fontFamily: 'monospace' }}>
            {sessionCode}
          </div>
          <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 24 }}>
            Version {VERSION_CONFIG[version].label} • Partagez ce code avec vos joueurs
          </div>
          <Link
            href={'/board/' + sessionId}
            style={{ display: 'block', padding: 16, background: '#14171B', color: '#FFF', textDecoration: 'none', borderRadius: 6, fontWeight: 700, fontSize: 15 }}
          >
            Ouvrir le plateau facilitateur →
          </Link>
          <div style={{ fontSize: 12, marginTop: 16, opacity: 0.7 }}>
            Joueurs → <Link href="/joueur" style={{ color: '#14171B', textDecoration: 'underline' }}>/joueur</Link> + code <strong>{sessionCode}</strong>
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
          Code facilitateur + entreprise + version = démarrage direct
        </p>

        <div style={{ background: '#FBF8EF', border: '2px solid #14171B', borderRadius: 12, padding: 24 }}>
          <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>Code facilitateur</label>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="FACI-002"
            style={{ width: '100%', padding: 14, marginBottom: 16, border: '1px solid #14171B', borderRadius: 6, fontWeight: 700, fontFamily: 'monospace', letterSpacing: '0.1em', textAlign: 'center', boxSizing: 'border-box' }}
          />

          <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>Entreprise</label>
          <input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Institut Lumière"
            style={{ width: '100%', padding: 14, marginBottom: 16, border: '1px solid #14171B', borderRadius: 6, boxSizing: 'border-box' }}
          />

          <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 8 }}>Version du jeu</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
            {(Object.keys(VERSION_CONFIG) as Version[]).map((v) => (
              <button
                key={v}
                onClick={() => setVersion(v)}
                style={{
                  padding: 12,
                  background: version === v ? '#14171B' : '#FFF',
                  color: version === v ? '#FBF8EF' : '#14171B',
                  border: version === v ? '2px solid #14171B' : '1px solid rgba(20,23,27,0.3)',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: version === v ? 700 : 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  lineHeight: 1.3,
                }}
              >
                {VERSION_CONFIG[v].label}
              </button>
            ))}
          </div>

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
            {loading ? 'Création...' : 'Démarrer une session →'}
          </button>
        </div>
      </div>
    </div>
  );
}
