'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const QUADRANTS = ['JAUNE','VERT','ROUGE','BLEU'] as const;

export default function RapportProfond() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!code) { setLoading(false); return; }
    (async () => {
      const { data: session } = await supabase.from('sessions').select('*').eq('id', code).single();
      const { data: depots } = await supabase.from('session_depots').select('*').eq('session_id', code);
      const { data: events } = await supabase.from('session_events').select('*').eq('session_id', code).order('created_at', { ascending: true });
      const { data: players } = await supabase.from('session_players').select('*').eq('session_id', code);

      const byQuadrant = QUADRANTS.map(q => ({
        q, count: (depots||[]).filter((d:any)=>d.quadrant===q).length
      }));
      const allUsed = [...new Set((depots||[]).map((d:any)=>d.quadrant))];
      const angleMort = QUADRANTS.filter(q =>!allUsed.includes(q as any));
      const hesitations = (events||[]).filter((e:any)=>e.type==='change_quadrant').length;
      const byPlayer = (players||[]).map((p:any)=>{
        const pEvents = (events||[]).filter((e:any)=>e.player_id===p.id);
        const pDepots = (depots||[]).filter((d:any)=>d.player_id===p.id);
        return {...p, events: pEvents.length, depots: pDepots.length, lastQuadrant: pDepots[pDepots.length-1]?.quadrant || 'aucun'};
      });
      const leaders = [...byPlayer].sort((a,b)=>b.events-a.events).slice(0,2);
      setData({ session, depots, events, players: byPlayer, byQuadrant, angleMort, hesitations, leaders });
      setLoading(false);
    })();
  }, [code]);

  if (!code) return <div style={{padding:40, fontFamily:'monospace'}}>Utilise : /rapport-profond?code=SESS-XXXXXX</div>;
  if (loading) return <div style={{padding:40}}>Analyse des dynamiques de {code}...</div>;
  if (!data?.session) return <div style={{padding:40}}>Session {code} introuvable</div>;

  return (
    <div style={{minHeight:'100vh', background:'#FFFEF9', color:'#14171B', padding:32, fontFamily:'ui-monospace'}}>
      <div style={{maxWidth:1100, margin:'0 auto'}}>
        <h1 style={{fontFamily:'Georgia', fontSize:38}}>Rapport Organisationnel<br/>{code}</h1>
        <p style={{marginTop:8, opacity:0.7}}>{data.session.created_at?.slice(0,10)} - {data.players.length} participants - {data.depots?.length||0} dépôts</p>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginTop:32}}>
          <div style={{border:'3px solid #14171B', background:'#FDE047', padding:20}}>
            <div style={{fontWeight:900, fontSize:12}}>ANGLE MORT COLLECTIF</div>
            <div style={{fontFamily:'Georgia', fontSize:22, marginTop:8}}>{data.angleMort.length? data.angleMort.join(' + ') : 'Aucun - exploration totale'}</div>
            <div style={{marginTop:8, fontSize:13}}>{data.angleMort.length? `Votre équipe évite ${data.angleMort.join(', ')}. C'est là où se cachent vos non-dits.` : `Tous les quadrants explorés.`}</div>
          </div>
          <div style={{border:'3px solid #14171B', background:'#FBF8EF', padding:20}}>
            <div style={{fontWeight:900, fontSize:12}}>CE QUE TU NE VOIS PAS EN PRESENTIEL</div>
            <div style={{fontFamily:'Georgia', fontSize:22, marginTop:8}}>{data.hesitations} hésitations tracées</div>
            <div style={{marginTop:8, fontSize:13}}>Chaque changement = un doute. En salle tu vois le final. Ici tu vois les doutes.</div>
          </div>
        </div>
        <div style={{marginTop:24, border:'3px solid #14171B', padding:20, background:'white'}}>
          <div style={{fontWeight:900, fontSize:12}}>CARTOGRAPHIE PAR QUADRANT</div>
          <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginTop:12}}>
            {data.byQuadrant.map((b:any)=>(
              <div key={b.q} style={{border:'2px solid #14171B', padding:12, background: b.count===0?'#FFE4E6':'white'}}>
                <div style={{fontWeight:800}}>{b.q}</div>
                <div style={{fontSize:28, fontFamily:'Georgia'}}>{b.count}</div>
                <div style={{fontSize:11}}>{b.count===0?'ANGLE MORT':`${b.count} dépôts`}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{marginTop:24, border:'3px solid #14171B', padding:20, background:'white'}}>
          <div style={{fontWeight:900, fontSize:12}}>DYNAMIQUES DE POUVOIR INVISIBLE</div>
          <div style={{marginTop:12, display:'grid', gap:8}}>
            {data.players.map((p:any)=>(
              <div key={p.id} style={{display:'flex', justifyContent:'space-between', border:'1px solid #14171B', padding:10, background: p.id===data.leaders[0]?.id?'#FDE047':'#FFFEF9'}}>
                <span><b>{p.nick}</b> → {p.lastQuadrant} | {p.depots} dépôts | {p.events} actions</span>
                <span style={{fontSize:11}}>{p.id===data.leaders[0]?.id?'LEADER INVISIBLE':''}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{marginTop:24, fontSize:12, opacity:0.6}}>
          <a href={`/board/${code}`} style={{textDecoration:'underline'}}>← Retour plateau</a>
        </div>
      </div>
    </div>
  );
}