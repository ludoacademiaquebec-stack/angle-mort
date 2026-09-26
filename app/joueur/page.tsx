'use client';
import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function JoueurPage() {
  const [sessionCode, setSessionCode] = useState('');
  const [pseudo, setPseudo] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const rejoindre = async () => {
    setError(''); setLoading(true);
    if(!sessionCode || !pseudo) { setError('Code session + pseudo requis'); setLoading(false); return; }

    // 1. Vérifie que SESS-XXX existe dans Supabase
    const { data: sess, error: sessErr } = await supabase.from('sessions').select('*').eq('code', sessionCode).eq('status','active').single();
    if(sessErr || !sess) { setError(`Session ${sessionCode} introuvable ou inactive. Vérifie avec facilitateur.`); setLoading(false); return; }

    // 2. Crée le joueur dans session_players
    const { error: playerErr } = await supabase.from('session_players').insert({
      session_id: sess.id,
      nick: pseudo,
      points: 0,
      jetons: []
    });

    if(playerErr) { 
      // Si pseudo déjà pris, on tente quand même d'entrer
      if(playerErr.message.includes('duplicate')) {
        setSuccess(`Pseudo déjà pris, mais session ${sessionCode} existe - tu peux rejoindre le plateau.`);
      } else {
        setError(playerErr.message); setLoading(false); return;
      }
    } else {
      setSuccess(`Bienvenue ${pseudo}! Tu as rejoint ${sessionCode}`);
    }

    setLoading(false);
    // Redirige vers le plateau après 1s
    setTimeout(()=>{
      window.location.href = `/board/${sessionCode}?pseudo=${encodeURIComponent(pseudo)}`;
    }, 1000);
  };

  return (
    <div style={{ minHeight:'100vh', background:'#FFFEF9', color:'#14171B', padding:40 }}>
      <div style={{ maxWidth:520, margin:'0 auto' }}>
        <Link href="/" style={{ fontSize:13, opacity:0.6 }}>← Landing</Link>
        <h1 style={{ fontFamily:'Georgia, serif', fontSize:32, marginTop:16 }}>Espace Joueur - Production</h1>
        <p style={{ fontSize:14, opacity:0.7, marginBottom:24 }}>Entre le code SESS-XXX partagé par ton facilitateur. Vérifié dans Supabase table sessions → crée session_players.</p>

        <div style={{ background:'#FBF8EF', border:'2px solid #14171B', borderRadius:12, padding:24 }}>
          <label style={{ fontSize:12, fontWeight:700 }}>Code session (SESS-XXX)</label>
          <input value={sessionCode} onChange={e=>setSessionCode(e.target.value.toUpperCase())} placeholder="SESS-A1B2C3" style={{ width:'100%', padding:14, marginTop:6, marginBottom:12, border:'1px solid #14171B', borderRadius:6, fontWeight:700, fontSize:15 }} />
          
          <label style={{ fontSize:12, fontWeight:700 }}>Ton pseudo / prénom</label>
          <input value={pseudo} onChange={e=>setPseudo(e.target.value)} placeholder="Marie" style={{ width:'100%', padding:14, marginTop:6, border:'1px solid #14171B', borderRadius:6, fontSize:15 }} />

          {error && <div style={{ background:'#FEE2E2', color:'#DC2626', padding:10, borderRadius:6, fontSize:13, marginTop:12 }}>{error}</div>}
          {success && <div style={{ background:'#DCFCE7', color:'#166534', padding:10, borderRadius:6, fontSize:13, marginTop:12 }}>{success} → Redirection plateau...</div>}

          <button onClick={rejoindre} disabled={loading} style={{ width:'100%', marginTop:16, padding:16, background:'#14171B', color:'#FBF8EF', borderRadius:6, fontWeight:700, fontSize:15 }}>
            {loading? 'Vérification Supabase...' : 'Rejoindre la session →'}
          </button>

          <div style={{ fontSize:11, opacity:0.5, marginTop:12, textAlign:'center' }}>
            Vérifie: sessions.code EXISTS + status=active → INSERT session_players (session_id, nick)
          </div>
        </div>

        <div style={{ marginTop:20, padding:16, background:'#FFF', border:'1px solid #eee', borderRadius:8, fontSize:12, opacity:0.7 }}>
          <b>Flux production complet:</b><br/>
          1. Super Admin crée FACI-001 dans facilitators<br/>
          2. Facilitateur entre FACI-001 → crée SESS-XXX dans sessions<br/>
          3. Joueur entre SESS-XXX → crée entrée dans session_players<br/>
          4. Cartes jouées → session_depots + session_paris<br/>
          5. Super Admin voit tout: COUNT sessions, joueurs, cartes
        </div>
      </div>
    </div>
  );
}
