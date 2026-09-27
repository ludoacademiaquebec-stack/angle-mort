'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function RapportProfond({ searchParams }: { searchParams: { code?: string } }) {
  const code = searchParams.code;
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!code) return;
    (async () => {
      const { data: session } = await supabase.from('sessions').select('*').eq('id', code).single();
      const { data: depots } = await supabase.from('session_depots').select('*').eq('session_id', code);
      const { data: events } = await supabase.from('session_events').select('*').eq('session_id', code).order('created_at');
      const { data: players } = await supabase.from('session_players').select('*').eq('session_id', code);

      const QUADRANTS = ['JAUNE','VERT','ROUGE','BLEU'];
      const allUsed = [...new Set((depots||[]).map(d=>d.quadrant))];
      const angleMort = QUADRANTS.filter(q=>!allUsed.includes(q));
      const hesitations = (events||[]).filter(e=>e.type==='change_quadrant').length;

      setData({ session, depots, players, angleMort, hesitations, events });
    })();
  }, [code]);

  if (!code) return <div style={{padding:40}}>Utilise: /rapport-profond?code=SESS-XXXXXX</div>;
  if (!data) return <div style={{padding:40}}>Chargement {code}...</div>;

  return (
    <div style={{minHeight:'100vh', background:'#FFFEF9', padding:40, fontFamily:'ui-monospace'}}>
      <h1 style={{fontFamily:'Georgia', fontSize:32}}>Rapport Profond {code}</h1>
      <div style={{marginTop:20, display:'grid', gridTemplateColumns:'1fr 1fr', gap:16}}>
        <div style={{border:'2px solid #14171B', padding:20, background:'#FDE047'}}>Angle mort collectif: {data.angleMort.join(', ')||'aucun - exploration complète'}</div>
        <div style={{border:'2px solid #14171B', padding:20, background:'#FBF8EF'}}>{data.hesitations} hésitations invisibles en présentiel - ce que tu ne vois pas</div>
      </div>
      <h3 style={{marginTop:30}}>Joueurs ({data.players?.length||0})</h3>
      {(data.players||[]).map((p:any)=><div key={p.id} style={{border:'1px solid #14171B', padding:8, marginTop:8}}>{p.nick}</div>)}
      <div style={{marginTop:20}}><a href={`/board/${code}`} style={{textDecoration:'underline'}}>← Retour plateau</a></div>
    </div>
  );
}