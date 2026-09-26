'use client';
import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function FacilitateurPage() {
  const [code, setCode] = useState('');
  const [sessionCode, setSessionCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const startSession = async () => {
    setError(''); setLoading(true);
    // 1. Vérifie FACI-XXX dans Supabase
    const { data: faci, error: faciErr } = await supabase.from('facilitators').select('*').eq('code', code).eq('active', true).single();
    if(faciErr ||!faci) { setError('Code FACI invalide ou inactif. Vérifie dans Super Admin.'); setLoading(false); return; }

    // 2. Crée session dans public.sessions
    const newId = crypto.randomUUID();
    const newCode = 'SESS-' + Math.random().toString(36).substring(2,8).toUpperCase();
    const { error: sessErr } = await supabase.from('sessions').insert({
      id: newId,
      code: newCode,
      facilitator_id: faci.id,
      status: 'active',
      phase: 'cadrage'
    });
    if(sessErr) { setError(sessErr.message); setLoading(false); return; }
    setSessionCode(newCode);
    setLoading(false);
  };

  return (
    <div style={{ minHeight:'100vh', background:'#FFFEF9', color:'#14171B', padding:40 }}>
      <div style={{ maxWidth:600, margin:'0 auto' }}>
        <Link href="/" style={{ fontSize:13, opacity:0.6 }}>← Landing</Link>
        <h1 style={{ fontFamily:'Georgia, serif', fontSize:32, marginTop:16 }}>Espace Facilitateur - Production</h1>
        <p style={{ opacity:0.7, fontSize:14, marginBottom:20 }}>Code vérifié dans Supabase table facilitators. Session créée dans sessions.</p>
        {!sessionCode? (
          <div style={{ background:'#FBF8EF', border:'2px solid #14171B', borderRadius:12, padding:24 }}>
            <label style={{ fontSize:12, fontWeight:700 }}>Code FACI-XXX (depuis Super Admin)</label>
            <input value={code} onChange={e=>setCode(e.target.value.toUpperCase())} placeholder="FACI-001" style={{ width:'100%', padding:14, marginTop:8, border:'1px solid #14171B', borderRadius:4, fontWeight:700 }} />
            {error && <div style={{ color:'#DC2626', fontSize:13, marginTop:8 }}>{error}</div>}
            <button onClick={startSession} disabled={loading} style={{ width:'100%', marginTop:16, padding:16, background:'#14171B', color:'#FBF8EF', borderRadius:4, fontWeight:600 }}>{loading? 'Vérification Supabase...' : 'Démarrer session →'}</button>
          </div>
        ) : (
          <div style={{ background:'#FDE047', border:'2px solid #14171B', borderRadius:12, padding:24, textAlign:'center' }}>
            <div style={{ fontSize:12, fontWeight:700, opacity:0.6 }}>Session créée dans Supabase</div>
            <div style={{ fontSize:32, fontWeight:800, margin:'12px 0' }}>{sessionCode}</div>
            <Link href={`/board/${sessionCode}`} style={{ display:'block', padding:12, background:'#14171B', color:'#FFF', textDecoration:'none', borderRadius:4 }}>Ouvrir le plateau /board/{sessionCode}</Link>
            <Link href="/joueur" style={{ display:'block', marginTop:10, padding:12, background:'#FFF', border:'1px solid #14171B', textDecoration:'none', borderRadius:4, color:'#14171B' }}>Aller à /joueur pour tester</Link>
          </div>
        )}
      </div>
    </div>
  );
}
