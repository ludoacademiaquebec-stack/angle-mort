'use client';
import React, { Suspense, useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

function compter3(votes:any[]){
  let r=0,b=0,n=0;
  for(const v of votes){
    const q = (v.to_quadrant||v.choix||'').toLowerCase();
    if(q==='reste') r++; else if(q==='bouge') b++; else if(q==='neutre') n++;
  }
  const tot = r+b+n||1;
  let majorite = 'egalite';
  if(r===0&&b===0&&n===0) majorite='aucun vote';
  else if(r>b && r>n) majorite='reste';
  else if(b>r && b>n) majorite='bouge';
  else if(n>r && n>b) majorite='neutre (abstention)';
  return {reste:r,bouge:b,neutre:n,total:r+b+n, majorite, pr:Math.round(r/tot*100), pb:Math.round(b/tot*100), pn:Math.round(n/tot*100)};
}

function RapportContent(){
  const params = useSearchParams();
  const sessionId = params.get('sessionId') || params.get('id') || '';
  const [events, setEvents] = useState<any[]>([]);
  const [session, setSession] = useState<any>(null);
  const [inputId, setInputId] = useState(sessionId);

  const load = async (sid:string)=>{
    if(!sid) return;
    const { data: sess } = await supabase.from('sessions').select('*').eq('id', sid).single();
    const { data: ev } = await supabase.from('session_events').select('*').eq('session_id', sid).eq('type','pari').order('created_at',{ascending:true});
    setSession(sess); setEvents(ev||[]);
  };

  useEffect(()=>{ if(sessionId) load(sessionId); },[sessionId]);

  const byCard = useMemo(()=>{
    const map = new Map<string, any[]>();
    for(const e of events){
      const cid = e.question_id || e.metadata?.cardId || e.metadata?.question_id || 'unknown';
      if(!map.has(cid)) map.set(cid, []);
      map.get(cid)!.push(e);
    }
    return Array.from(map.entries()).map(([cardId, votes])=>({ cardId,...compter3(votes), votes }));
  },[events]);

  const global = useMemo(()=> compter3(events), [events]);

  if(!sessionId){
    return (
      <div style={{ minHeight:'100vh', background:'#FFFEF9', padding:40 }}>
        <h1 style={{ fontFamily:'Georgia, serif', fontSize:28 }}>Rapport Profond — 3 couleurs</h1>
        <div style={{ marginTop:20, display:'flex', gap:10 }}>
          <input value={inputId} onChange={e=>setInputId(e.target.value)} placeholder="ID session UUID" style={{ padding:10, border:'1px solid #14171B', borderRadius:6, width:400 }} />
          <button onClick={()=>{ if(inputId) window.location.href=`/rapport-profond?sessionId=${inputId}`; }} style={{ padding:'10px 20px', background:'#14171B', color:'#FFF', borderRadius:6, fontWeight:700 }}>Charger</button>
        </div>
        <div style={{ marginTop:16, fontSize:12, opacity:0.6 }}>Ajoute?sessionId=xxx dans l'URL — source session_events.question_id = carte.id</div>
      </div>
    )
  }

  return (
    <div style={{ minHeight:'100vh', background:'#FFFEF9', color:'#14171B', padding:24 }}>
      <div style={{ maxWidth:1200, margin:'0 auto' }}>
        <h1 style={{ fontFamily:'Georgia, serif', fontSize:32, marginBottom:8 }}>Rapport Profond — {session?.company || session?.code || sessionId.slice(0,8)}</h1>
        <div style={{ fontSize:13, opacity:0.6, marginBottom:20 }}>{session?.id} • {global.total} paris • {byCard.length} cartes • Hésitation {global.total>0? Math.round(global.neutre/global.total*100):0}%</div>

        <div style={{ background:'#FFF', border:'2px solid #14171B', borderRadius:12, padding:16, marginBottom:20 }}>
          <div style={{ fontWeight:800, marginBottom:10 }}>GLOBAL — {global.total} votes (chaque carte associée à chaque vote)</div>
          <div style={{ display:'flex', height:32, borderRadius:8, overflow:'hidden', border:'2px solid #14171B' }}>
            <div style={{ width:`${global.pr||0}%`, minWidth: global.reste>0? '60px':'2px', background:'#FDE047', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800 }}>R {global.pr}% ({global.reste})</div>
            <div style={{ width:`${global.pb||0}%`, minWidth: global.bouge>0? '60px':'2px', background:'#EF4444', color:'#FFF', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800 }}>B {global.pb}% ({global.bouge})</div>
            <div style={{ width:`${global.pn||0}%`, minWidth: '80px', background: global.neutre===0? '#F9FAF0':'#E5E7EB', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, borderLeft: global.neutre===0? '2px dashed #999':'1px solid #14171B' }}>{global.neutre===0? `N 0% (0) — aucun vote neutre` : `N ${global.pn}% (${global.neutre})`}</div>
          </div>
          <div style={{ marginTop:10, fontSize:12, display:'flex', gap:12, flexWrap:'wrap' }}>
            <span style={{ padding:'2px 8px', background:'#FDE047', borderRadius:10 }}>RESTE {global.reste}</span>
            <span style={{ padding:'2px 8px', background:'#EF4444', color:'#FFF', borderRadius:10 }}>BOUGE {global.bouge}</span>
            <span style={{ padding:'2px 8px', background: global.neutre===0? '#FFF3CD':'#E5E7EB', borderRadius:10, border: global.neutre===0? '1px dashed #999':'' }}>NEUTRE {global.neutre} {global.neutre===0? '— normal si session jouée avant ajout bouton neutre ou personne n’a cliqué NEUTRE':''}</span>
            <span style={{ fontWeight:800 }}>Majorité: {global.majorite}</span>
          </div>
        </div>

        <div style={{ display:'grid', gap:12 }}>
          {byCard.map((c:any)=>(
            <div key={c.cardId} style={{ background:'#FFF', border:'1px solid #14171B', borderRadius:12, padding:14 }}>
              <div style={{ display:'flex', justifyContent:'space-between' }}><div style={{ fontFamily:'monospace', fontWeight:700, fontSize:12 }}>{c.cardId}</div><div style={{ fontSize:11, padding:'2px 10px', borderRadius:20, background:'#14171B', color:'#FFF' }}>{c.majorite} — {c.total} votes</div></div>
              <div style={{ display:'flex', height:26, borderRadius:8, overflow:'hidden', border:'1px solid #14171B', marginTop:10 }}>
                <div style={{ width:`${c.pr}%`, minWidth: c.reste>0? '30px':'2px', background:'#FDE047', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700 }}>{c.pr>5? `R ${c.pr}%`:''}</div>
                <div style={{ width:`${c.pb}%`, minWidth: c.bouge>0? '30px':'2px', background:'#EF4444', color:'#FFF', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700 }}>{c.pb>5? `B ${c.pb}%`:''}</div>
                <div style={{ width:`${c.pn}%`, minWidth:'80px', background: c.neutre===0? '#F3F4F6':'#E5E7EB', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, borderLeft: c.neutre===0? '1px dashed #aaa':'1px solid #14171B' }}>{c.neutre===0? `N 0% (0)` : `N ${c.pn}% (${c.neutre})`}</div>
              </div>
              <div style={{ marginTop:6, fontSize:11, display:'flex', gap:12 }}><span>R:{c.reste}</span><span>B:{c.bouge}</span><span>N:{c.neutre} {c.neutre===0? '— aucun joueur n’a voté neutre sur cette carte':''}</span><span>Total carte: {c.total}</span></div>
            </div>
          ))}
          {byCard.length===0 && <div style={{ background:'#FFF', border:'1px dashed #999', borderRadius:12, padding:20, fontSize:13 }}>Aucun pari trouvé pour cette session — vérifie session_events.type='pari' et question_id = carte.id</div>}
        </div>
      </div>
    </div>
  )
}

export default function Page(){
  return <Suspense fallback={<div style={{padding:40}}>Chargement rapport...</div>}><RapportContent/></Suspense>
}
