'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getCartesDiag, getCartesAll } from '@/lib/cards';
const CARTES_DIAG_STATIC = getCartesDiag();
const CARTES_ALL_STATIC = getCartesAll();
type Faci = { id: string; code: string; name: string; email: string | null; active: boolean; created_at: string; last_login_at: string | null; };
type Session = { id: string; code: string; company: string | null; facilitator_id: string | null; phase: string; status: string; started_at: string; };
const FAMILLES = ['REC','MIC','PRI','CLI'] as const;

const getRapportLink = (id: string) => `/rapport-profond?sessionId=${id}`;


function SessionsRapportList(){
  const [sessions, setSessions] = React.useState<any[]>([]);
  React.useEffect(()=>{
    const { supabase } = require('@/lib/supabase');
    supabase.from('sessions').select('id, code, company, created_at').order('created_at', {ascending:false}).limit(20).then((r:any)=> setSessions(r.data||[]));
  },[]);
  return (
    <div style={{ display:'grid', gap:8 }}>
      {sessions.map((sess:any)=>(
        <div key={sess.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 12px', border:'1px solid #eee', borderRadius:8 }}>
          <div><div style={{fontSize:12, fontWeight:700, fontFamily:'monospace'}}>{sess.code} • {sess.company||'—'}</div><div style={{fontSize:10, opacity:0.6}}>{sess.id.slice(0,8)} • {new Date(sess.created_at).toLocaleDateString()}</div></div>
          <a href={`/rapport-profond?sessionId=${sess.id}`} style={{ padding:'8px 14px', background:'#14171B', color:'#FFF', borderRadius:6, fontSize:12, fontWeight:700, textDecoration:'none' }}>Rapport 3 couleurs</a>
        </div>
      ))}
      {sessions.length===0 && <div style={{fontSize:12, opacity:0.6}}>Aucune session</div>}
    </div>
  )
}


export default function SuperAdminPage() {
  const [auth, setAuth] = useState(false);
  const [code, setCode] = useState('');
  const [facis, setFacis] = useState<Faci[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeTab, setActiveTab] = useState<'facilitators' | 'sessions' | 'cartes' | 'all'>('facilitators');
  const [diag, setDiag] = useState<any[]>([]);
  const [all, setAll] = useState<any[]>([]);
  const [familleDiag, setFamilleDiag] = useState('REC');
  const [selected, setSelected] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [newFamilleName, setNewFamilleName] = useState('');
  useEffect(() => { const saved = sessionStorage.getItem('super_admin_ok'); if (saved === '1') setAuth(true); }, []);
  const checkAuth = () => { if (code === 'ILQ-2026-ADMIN' || code === (process.env.NEXT_PUBLIC_SUPER_ADMIN_CODE as any)) { sessionStorage.setItem('super_admin_ok', '1'); setAuth(true); } else alert('Code invalide'); };
  const load = async () => {
    const { data: f } = await supabase.from('facilitators').select('*').order('created_at', { ascending: false });
    const { data: s } = await supabase.from('sessions').select('*').order('started_at', { ascending: false });
    if (f) setFacis(f); if (s) setSessions(s);
    const { data: d1 } = await supabase.from('cards_diag').select('*').order('ordre', { ascending: true });
    const { data: d2 } = await supabase.from('cards_all').select('*').order('ordre', { ascending: true });
    if (d1 && d1.length>0) setDiag(d1.map((r:any)=>({ id:r.id, famille:r.famille, titre:r.titre, image:r.image, signal:r.signal, situation:r.situation, question:r.question, motPiege:r.mot_piege, compteur:r.compteur, compteurLabel:r.compteur_label, extra: r.extra_type? {type:r.extra_type, texte:r.extra_texte}: r.extra||undefined, couleur:r.couleur, ordre:r.ordre })));
    else setDiag(CARTES_DIAG_STATIC as any);
    if (d2 && d2.length>0) setAll(d2.map((r:any)=>({ id:r.id, famille:'ALL', titre:r.titre, action:r.action, indicateur:r.indicateur, delai:r.delai, niveau:r.niveau, couleur:r.couleur, ordre:r.ordre })));
    else setAll(CARTES_ALL_STATIC as any);
  };
  useEffect(()=>{ if(auth) load(); },[auth]);
  const saveCard = async () => {
    if(!selected) return; setSaving(true);
    if(activeTab==='all'){
      const payload={ id:selected.id, famille:'ALL', titre:selected.titre, action:selected.action, indicateur:selected.indicateur, delai:selected.delai, niveau:selected.niveau, couleur:selected.couleur, ordre:selected.ordre||0, updated_at:new Date().toISOString() };
      await supabase.from('cards_all').upsert(payload,{onConflict:'id'});
      setAll(prev=>prev.map(c=>c.id===selected.id? selected:c));
    } else {
      const payloadDiag={ id:selected.id, famille:selected.famille, titre:selected.titre, image:selected.image, signal:selected.signal, situation:selected.situation, question:selected.question, mot_piege:selected.motPiege, compteur:selected.compteur, compteur_label:selected.compteurLabel, extra_type:selected.extra?.type||null, extra_texte:selected.extra?.texte||null, couleur:selected.couleur, ordre:selected.ordre||0, updated_at:new Date().toISOString() };
      const payloadSignal={ id:selected.id, famille:selected.famille, titre:selected.titre, image:selected.image, signal:selected.signal, situation:selected.situation, question:selected.question, mot_piege:selected.motPiege, compteur:selected.compteur, compteur_label:selected.compteurLabel, extra:selected.extra||null, ordre:selected.ordre||0 };
      await supabase.from('cards_diag').upsert(payloadDiag,{onConflict:'id'});
      await supabase.from('signal_cards').upsert(payloadSignal as any,{onConflict:'id'});
      setDiag(prev=>prev.map(c=>c.id===selected.id? selected:c));
    }
    setSaving(false);
  };
  if(!auth){ return (<div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#FFFEF9' }}><div style={{ background:'#FFF', border:'2px solid #14171B', borderRadius:12, padding:32, width:380 }}><h2 style={{ fontFamily:'Georgia, serif', fontSize:22, marginBottom:8 }}>Super Admin</h2><input value={code} onChange={e=>setCode(e.target.value)} placeholder="Code Super Admin" style={{ width:'100%', padding:12, border:'1px solid #14171B', borderRadius:6, marginBottom:12, boxSizing:'border-box' }} /><button onClick={checkAuth} style={{ width:'100%', padding:12, background:'#14171B', color:'#FFF', borderRadius:6, fontWeight:700, border:'none', cursor:'pointer' }}>Entrer</button></div></div>); }
  return (
    <div style={{ minHeight:'100vh', background:'#FFFEF9', color:'#14171B' }}>
      <header style={{ padding:'16px 24px', borderBottom:'1px solid #eee', display:'flex', justifyContent:'space-between', background:'#FFF' }}><div style={{ fontWeight:800 }}>Super Admin · Angle Mort</div><div style={{ display:'flex', gap:16, fontSize:13 }}><Link href="/">Landing</Link><Link href="/facilitateur">Facilitateur</Link></div></header>
      <div style={{ maxWidth:1400, margin:'0 auto', padding:24 }}>
        <div style={{ display:'flex', gap:8, marginBottom:20 }}><button onClick={()=>setActiveTab('cartes')} style={{ padding:'10px 20px', background:activeTab==='cartes'? '#14171B':'#FFF', color:activeTab==='cartes'? '#FFF':'#14171B', border:'1px solid #14171B', borderRadius:6 }}>Cartes Diag ({diag.length})</button><button onClick={()=>setActiveTab('all')} style={{ padding:'10px 20px', background:activeTab==='all'? '#14171B':'#FFF', color:activeTab==='all'? '#FFF':'#14171B', border:'1px solid #14171B', borderRadius:6 }}>ALL ({all.length})</button></div>
        <div style={{ display:'grid', gridTemplateColumns:'340px 1fr', gap:20 }}>
          <div style={{ background:'#FFF', border:'1px solid #14171B', borderRadius:12, padding:16, maxHeight:'80vh', overflowY:'auto' }}>
            <input placeholder="Rechercher" value={search} onChange={e=>setSearch(e.target.value)} style={{ width:'100%', padding:'8px 10px', borderRadius:4, border:'1px solid #14171B', fontSize:12, marginBottom:12, boxSizing:'border-box' }} />
            <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:12 }}>{FAMILLES.map(f=>(<button key={f} onClick={()=>setFamilleDiag(f)} style={{ padding:'6px 10px', borderRadius:4, fontSize:11, background:familleDiag===f? '#14171B':'#FFF', color:familleDiag===f? '#FFF':'#14171B', border:'1px solid #14171B' }}>{f}</button>))}</div>
            {(activeTab==='cartes'? diag.filter(c=>c.famille===familleDiag) : all).filter(c=>!search||c.id.toLowerCase().includes(search.toLowerCase())).map((c:any)=>(<button key={c.id} onClick={()=>setSelected(c)} style={{ display:'block', width:'100%', textAlign:'left', padding:'10px 12px', borderRadius:6, background:selected?.id===c.id? '#14171B':'#F9F9F7', color:selected?.id===c.id? '#FFF':'#14171B', border:'1px solid #eee', marginBottom:6, cursor:'pointer' }}><div style={{ fontSize:10, opacity:0.6 }}>{c.id}</div><div style={{ fontSize:13, fontWeight:600 }}>{c.titre}</div></button>))}
          </div>
          <div style={{ background:'#FFF', border:'1px solid #14171B', borderRadius:12, padding:20 }}>{!selected? <div>Selectionne une carte</div> : (<div><h2>{selected.id} — {selected.titre}</h2><button onClick={saveCard} disabled={saving} style={{ padding:'10px 18px', background:'#14171B', color:'#FFF', borderRadius:6, marginTop:12 }}>{saving? 'Sauvegarde...' : 'Sauvegarder en prod'}</button></div>)}</div>
        </div>

      <div style={{ marginTop:30, background:'#FFF', border:'1px solid #14171B', borderRadius:12, padding:20 }}>
        <h3 style={{ fontFamily:'Georgia, serif', marginBottom:12 }}>Sessions → Rapports profonds (avec neutre)</h3>
        <SessionsRapportList />
      </div>

      </div>
    </div>
  );
}
