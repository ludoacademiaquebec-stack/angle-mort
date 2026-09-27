'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function RapportProfondPage() {
  const [sessionId, setSessionId] = useState('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const load = async (sid: string) => {
    if(!sid) return;
    setLoading(true);
    const { data: sess } = await supabase.from('sessions').select('*').eq('id', sid).single();
    const { data: events } = await supabase.from('session_events').select('*').eq('session_id', sid).order('created_at', {ascending: true});
    const { data: depots } = await supabase.from('session_depots').select('*').eq('session_id', sid);
    const { data: players } = await supabase.from('session_players').select('*').eq('session_id', sid);
    const { data: resultats } = await supabase.from('session_resultats').select('*').eq('session_id', sid).order('card_index', {ascending: true});

    // Calcul analytics pari par carte
    const paris = (events||[]).filter((e:any)=> e.type==='pari');
    const byCard: Record<string, {reste:number, bouge:number, neutre:number, total:number, majorite:string}> = {};
    paris.forEach((e:any)=>{
      const cardId = e.question_id || e.metadata?.question_id || 'unknown';
      if(!byCard[cardId]) byCard[cardId] = {reste:0, bouge:0, neutre:0, total:0, majorite:'egalite'};
      const choix = e.to_quadrant || e.metadata?.choix;
      if(choix==='reste') byCard[cardId].reste++;
      else if(choix==='bouge') byCard[cardId].bouge++;
      else if(choix==='neutre') byCard[cardId].neutre++;
      byCard[cardId].total++;
      const {reste, bouge, neutre} = byCard[cardId];
      if(reste>bouge && reste>neutre) byCard[cardId].majorite='reste';
      else if(bouge>reste && bouge>neutre) byCard[cardId].majorite='bouge';
      else if(neutre>reste && neutre>bouge) byCard[cardId].majorite='neutre (abstention)';
      else byCard[cardId].majorite='egalite';
    });

    setData({ sess, events, depots, players, resultats, byCard });
    setLoading(false);
  };

  useEffect(()=>{
    const params = new URLSearchParams(window.location.search);
    const sid = params.get('sessionId') || params.get('id') || '';
    if(sid){ setSessionId(sid); load(sid); }
  },[]);

  if(!data){
    return (
      <div style={{ minHeight:'100vh', background:'#FFFEF9', padding:40 }}>
        <h1 style={{ fontFamily:'Georgia, serif', fontSize:28 }}>Rapport Profond</h1>
        <div style={{ marginTop:20, display:'flex', gap:10 }}>
          <input value={sessionId} onChange={e=>setSessionId(e.target.value)} placeholder="ID session UUID" style={{ padding:10, border:'1px solid #14171B', borderRadius:6, width:400 }} />
          <button onClick={()=>load(sessionId)} style={{ padding:'10px 20px', background:'#14171B', color:'#FFF', borderRadius:6, fontWeight:700 }}>Charger</button>
        </div>
        {loading && <div style={{marginTop:20}}>Chargement...</div>}
      </div>
    )
  }

  const { sess, depots, players, resultats, byCard } = data;
  const totalPariss = Object.values(byCard as any).reduce((acc:any, v:any)=> acc + v.total, 0) as number;
  const totalNeutre = Object.values(byCard as any).reduce((acc:any, v:any)=> acc + v.neutre, 0) as number;
  const tauxHesitation = totalPariss>0? Math.round((totalNeutre/totalPariss)*100) : 0;

  return (
    <div style={{ minHeight:'100vh', background:'#FFFEF9', color:'#14171B', padding:24 }}>
      <div style={{ maxWidth:1200, margin:'0 auto' }}>
        <h1 style={{ fontFamily:'Georgia, serif', fontSize:32, marginBottom:8 }}>Rapport Profond — {sess?.company || sess?.code}</h1>
        <div style={{ fontSize:13, opacity:0.6, marginBottom:20 }}>{sess?.id} • {players?.length} joueurs • {depots?.length} dépôts • {totalPariss} paris • Hésitation {tauxHesitation}%</div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12, marginBottom:24 }}>
          <div style={{ background:'#14171B', color:'#FFF', borderRadius:8, padding:16 }}><div style={{fontSize:11, opacity:0.6}}>JOUEURS</div><div style={{fontSize:28, fontWeight:800}}>{players?.length||0}</div></div>
          <div style={{ background:'#FDE047', border:'1px solid #14171B', borderRadius:8, padding:16 }}><div style={{fontSize:11}}>TOTAL PARIS</div><div style={{fontSize:28, fontWeight:800}}>{totalPariss}</div></div>
          <div style={{ background:'#E5E7EB', border:'1px solid #14171B', borderRadius:8, padding:16 }}><div style={{fontSize:11}}>NEUTRE</div><div style={{fontSize:28, fontWeight:800}}>{totalNeutre} ({tauxHesitation}%)</div></div>
          <div style={{ background:'#FFF', border:'1px solid #14171B', borderRadius:8, padding:16 }}><div style={{fontSize:11}}>CARTES JOUÉES</div><div style={{fontSize:28, fontWeight:800}}>{Object.keys(byCard).length}</div></div>
        </div>

        <div style={{ background:'#FFF', border:'1px solid #14171B', borderRadius:12, padding:20, marginBottom:20 }}>
          <h3 style={{ fontFamily:'Georgia, serif', marginBottom:12 }}>Répartition des votes — 3 couleurs</h3>
          {Object.entries(byCard).map(([cardId, stats]: any)=>{
            const total = stats.total || 1;
            const pr = Math.round((stats.reste/total)*100);
            const pb = Math.round((stats.bouge/total)*100);
            const pn = 100 - pr - pb;
            return (
              <div key={cardId} style={{ marginBottom:16, borderBottom:'1px solid #f5f5f5', paddingBottom:12 }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:6 }}>
                  <span style={{ fontFamily:'monospace', fontWeight:700 }}>{cardId}</span>
                  <span style={{ fontWeight:700 }}>R:{stats.reste} B:{stats.bouge} N:{stats.neutre} → Majorité: {stats.majorite}</span>
                </div>
                <div style={{ display:'flex', height:18, borderRadius:6, overflow:'hidden', border:'1px solid #14171B' }}>
                  <div style={{ width:`${pr}%`, background:'#FDE047', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700 }}>{pr>15? `RESTE ${pr}%`:''}</div>
                  <div style={{ width:`${pb}%`, background:'#EF4444', color:'#FFF', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700 }}>{pb>15? `BOUGE ${pb}%`:''}</div>
                  <div style={{ width:`${pn}%`, background:'#E5E7EB', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700 }}>{pn>15? `NEUTRE ${pn}%`:''}</div>
                </div>
              </div>
            )
          })}
        </div>

        <div style={{ background:'#FFF', border:'1px solid #14171B', borderRadius:12, padding:20 }}>
          <h3 style={{ fontFamily:'Georgia, serif', marginBottom:12 }}>Historique paris (session_events)</h3>
          <table style={{ width:'100%', fontSize:12, borderCollapse:'collapse' }}>
            <thead><tr style={{ textAlign:'left', borderBottom:'1px solid #eee' }}><th>Heure</th><th>Joueur</th><th>Carte</th><th>Choix</th><th>Quadrant</th></tr></thead>
            <tbody>{(data.events||[]).filter((e:any)=>e.type==='pari').slice(-50).reverse().map((e:any,i:number)=>(
              <tr key={i} style={{ borderBottom:'1px solid #f9f9f9' }}><td>{new Date(e.created_at).toLocaleTimeString()}</td><td>{e.player_nick||e.player_id?.slice(0,6)}</td><td style={{fontFamily:'monospace'}}>{e.question_id||e.metadata?.question_id}</td><td><span style={{ padding:'2px 8px', borderRadius:10, fontWeight:700, background: e.to_quadrant==='reste'? '#FDE047' : e.to_quadrant==='bouge'? '#EF4444' : '#E5E7EB', color: e.to_quadrant==='bouge'? '#FFF':'#14171B' }}>{e.to_quadrant}</span></td><td>{e.metadata?.mon_quadrant||'—'}</td></tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
