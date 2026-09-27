'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function FacilitateurPage() {
  const [code, setCode] = useState('FACI-002');
  const [company, setCompany] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionCode, setSessionCode] = useState('');
  const [sessionId, setSessionId] = useState('');
  const router = useRouter();

  const startSession = async () => {
    setError('');
    setLoading(true);
    const faciCode = code.trim().toUpperCase();

    // 1. Sauve IMMÉDIATEMENT pour que /board ne te rejette pas
    localStorage.setItem('facilitator_code', faciCode);
    localStorage.setItem('facilitator_company', company.trim());

    // 2. Vérifie FACI mais ne bloque pas si table vide (mode dev)
    const { data: faci } = await supabase
      .from('facilitators')
      .select('*')
      .eq('code', faciCode)
      .eq('active', true)
      .single();

    // Si pas trouvé, on continue quand même en dev, sinon erreur claire
    if (!faci) {
      console.warn('Facilitateur non trouvé, création session en mode dev avec', faciCode);
      // Optionnel: décommente pour forcer l'erreur si tu veux
      // setError(`Code ${faciCode} introuvable dans table facilitators. Va dans Supabase et INSERT le.`);
      // setLoading(false); return;
    }

    const newId = 'SESS-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    // IMPORTANT: id et code = MÊME valeur pour éviter la confusion
    const { error: sessErr } = await supabase.from('sessions').insert({
      id: newId,
      code: newId, // <- même code que l'id
      company: company.trim() || 'Test',
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
    
    // Redirection directe vers le board
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
            Partagez ce code avec vos joueurs
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
          Code FACI-002 + entreprise = démarrage direct
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