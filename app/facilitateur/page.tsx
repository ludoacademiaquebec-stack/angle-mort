'use client';
import { useState } from 'react';
import Link from 'next/link';
export default function FacilitateurPage() {
  const [code, setCode] = useState('');
  const [sessionCode, setSessionCode] = useState('');
  const [error, setError] = useState('');
  const startSession = () => {
    if (!code.startsWith('FACI-')) { setError('Format attendu: FACI-001'); return; }
    const newCode = 'SESS-' + Math.random().toString(36).substring(2,8).toUpperCase();
    setSessionCode(newCode); setError('');
    const sessions = JSON.parse(localStorage.getItem('am_sessions') || '[]');
    sessions.push({ id: newCode, faci: code, date: new Date().toISOString(), joueurs: 0, statut: 'En cours' });
    localStorage.setItem('am_sessions', JSON.stringify(sessions));
  };
  return (
    <div style={{ minHeight:'100vh', background:'#FFFEF9', color:'#14171B', padding:40 }}>
      <div style={{ maxWidth:600, margin:'0 auto' }}>
        <Link href="/" style={{ fontSize:13, opacity:0.6 }}>← Retour</Link>
        <h1 style={{ fontFamily:'Georgia, serif', fontSize:36, marginTop:20 }}>Espace Facilitateur</h1>
        {!sessionCode ? (
          <div style={{ background:'#FBF8EF', border:'2px solid #14171B', borderRadius:12, padding:24, marginTop:20 }}>
            <label style={{ fontSize:12, fontWeight:700 }}>Code facilitateur</label>
            <input value={code} onChange={e=>setCode(e.target.value.toUpperCase())} placeholder="FACI-001" style={{ width:'100%', padding:14, marginTop:8, border:'1px solid #14171B', borderRadius:4, fontWeight:700 }} />
            {error && <div style={{ color:'#DC2626', fontSize:13, marginTop:8 }}>{error}</div>}
            <button onClick={startSession} style={{ width:'100%', marginTop:16, padding:16, background:'#14171B', color:'#FBF8EF', borderRadius:4, fontWeight:600 }}>Démarrer session →</button>
          </div>
        ) : (
          <div style={{ background:'#FDE047', border:'2px solid #14171B', borderRadius:12, padding:24, textAlign:'center', marginTop:20 }}>
            <div style={{ fontSize:12, fontWeight:700, opacity:0.6 }}>Session créée</div>
            <div style={{ fontSize:32, fontWeight:800, margin:'12px 0' }}>{sessionCode}</div>
            <p style={{ fontSize:13 }}>Partage ce code aux joueurs → /joueur</p>
            <Link href={`/board/${sessionCode}`} style={{ display:'block', marginTop:16, padding:12, background:'#14171B', color:'#FFF', textDecoration:'none', borderRadius:4 }}>Ouvrir le plateau</Link>
            <button onClick={()=>setSessionCode('')} style={{ marginTop:12, fontSize:12, background:'none', border:'none', textDecoration:'underline' }}>Créer une autre</button>
          </div>
        )}
      </div>
    </div>
  );
}
