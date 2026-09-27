'use client';
import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function JoueurPage() {
  const [sessionCode, setSessionCode] = useState('');
  const [pseudo, setPseudo] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const rejoindre = async () => {
    setError(''); setLoading(true);
    if(!sessionCode || !pseudo) { setError('Code + pseudo requis'); setLoading(false); return; }
    const { data: sess } = await supabase.from('sessions').select('*').eq('code', sessionCode).eq('status','active').single();
    if(!sess) { setError('Session '+sessionCode+' introuvable'); setLoading(false); return; }
    await supabase.from('session_players').upsert({ session_id: sess.id, nick: pseudo, points: 0, position: 0 }, { onConflict: 'session_id,nick' });
    setLoading(false);
    window.location.href = '/joueur/'+sessionCode+'?pseudo='+encodeURIComponent(pseudo);
  };

  return (
    <div style={{ minHeight:'100vh', background:'#FFFEF9', color:'#14171B', padding:40 }}>
      <div style={{ maxWidth:520, margin:'0 auto' }}>
        <Link href="/">← Landing</Link>
        <h1 style={{ fontFamily:'Georgia, serif', fontSize:32, marginTop:16 }}>Espace Joueur</h1>
        <div style={{ background:'#FBF8EF', border:'2px solid #14171B', borderRadius:12, padding:24, marginTop:24 }}>
          <input value={sessionCode} onChange={e=>setSessionCode(e.target.value.toUpperCase())} placeholder="SESS-IBEZ9K" style={{ width:'100%', padding:14, marginBottom:12, border:'1px solid #14171B', borderRadius:6, fontWeight:700 }} />
          <input value={pseudo} onChange={e=>setPseudo(e.target.value)} placeholder="Marie" style={{ width:'100%', padding:14, border:'1px solid #14171B', borderRadius:6 }} />
          {error && <div style={{ background:'#FEE2E2', color:'#DC2626', padding:10, borderRadius:6, marginTop:12 }}>{error}</div>}
          <button onClick={rejoindre} disabled={loading} style={{ width:'100%', marginTop:16, padding:16, background:'#14171B', color:'#FBF8EF', borderRadius:6, fontWeight:700 }}>
            {loading? 'Connexion...' : 'Rejoindre →'}
          </button>
        </div>
      </div>
    </div>
  );
}