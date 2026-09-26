'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

type Faci = { id:string, code:string, name:string, email:string, active:boolean, created_at:string };
type Session = { id:string, code:string, facilitator_id:string, company:string, status:string, started_at:string };

export default function SuperAdminPage() {
  const [auth, setAuth] = useState(false);
  const [code, setCode] = useState('');
  const [facis, setFacis] = useState<Faci[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [playersCount, setPlayersCount] = useState(0);
  const [depotsCount, setDepotsCount] = useState(0);
  const [form, setForm] = useState({ name:'', email:'', company:'' });

  // Protection simple MVP - code secret dans Vercel env
  useEffect(()=>{
    const saved = sessionStorage.getItem('super_admin_ok');
    if(saved === '1') setAuth(true);
  },[]);

  const checkAuth = () => {
    // En prod tu mettras SUPER_ADMIN_CODE dans Vercel
    if(code === process.env.NEXT_PUBLIC_SUPER_ADMIN_CODE || code === 'ILQ-2026-ADMIN') {
      sessionStorage.setItem('super_admin_ok','1');
      setAuth(true);
    } else alert('Code Super Admin invalide');
  };

  const load = async () => {
    const { data: f } = await supabase.from('facilitators').select('*').order('created_at', { ascending:false });
    const { data: s } = await supabase.from('sessions').select('*').order('started_at', { ascending:false });
    const { count: pc } = await supabase.from('session_players').select('*', { count:'exact', head:true });
    const { count: dc } = await supabase.from('session_depots').select('*', { count:'exact', head:true });
    if(f) setFacis(f); if(s) setSessions(s);
    setPlayersCount(pc||0); setDepotsCount(dc||0);
  };

  useEffect(()=>{ if(auth) load(); },[auth]);

  const createFaci = async () => {
    if(!form.name) return alert('Nom requis');
    const nextCode = `FACI-${String(facis.length+1).padStart(3,'0')}`;
    const { error } = await supabase.from('facilitators').insert({ code: nextCode, name: form.name, email: form.email, active: true });
    if(error) alert(error.message); else { setForm({ name:'', email:'', company:'' }); load(); }
  };

  const toggle = async (f:Faci) => {
    await supabase.from('facilitators').update({ active:!f.active }).eq('id', f.id);
    load();
  };

  const del = async (f:Faci) => {
    if(!confirm(`Supprimer ${f.code}?`)) return;
    await supabase.from('facilitators').delete().eq('id', f.id);
    load();
  };

  if(!auth) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#FFFEF9' }}>
        <div style={{ background:'#FFF', border:'2px solid #14171B', borderRadius:12, padding:32, width:380 }}>
          <h2 style={{ fontFamily:'Georgia, serif', fontSize:22, marginBottom:8 }}>Super Admin · Angle Mort</h2>
          <p style={{ fontSize:13, opacity:0.6, marginBottom:16 }}>Accès protégé. Entre le code secret configuré dans Vercel SUPER_ADMIN_CODE.</p>
          <input value={code} onChange={e=>setCode(e.target.value)} placeholder="Code Super Admin" style={{ width:'100%', padding:12, border:'1px solid #14171B', borderRadius:6, marginBottom:12 }} />
          <button onClick={checkAuth} style={{ width:'100%', padding:12, background:'#14171B', color:'#FFF', borderRadius:6, fontWeight:700 }}>Entrer →</button>
          <div style={{ fontSize:11, opacity:0.5, marginTop:12, textAlign:'center' }}>Dev temporaire: ILQ-2026-ADMIN</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight:'100vh', background:'#FFFEF9', color:'#14171B' }}>
      <header style={{ padding:'16px 24px', borderBottom:'1px solid #eee', display:'flex', justifyContent:'space-between', background:'#FFF' }}>
        <div style={{ fontWeight:800 }}>Super Admin · Production Supabase</div>
        <div style={{ display:'flex', gap:12, fontSize:13 }}><Link href="/">Landing</Link><Link href="/facilitateur">Facilitateur</Link><button onClick={()=>{ sessionStorage.clear(); setAuth(false); }} style={{ opacity:0.6 }}>Déconnexion</button></div>
      </header>
      <div style={{ maxWidth:1200, margin:'0 auto', padding:24 }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
          <div style={{ background:'#14171B', color:'#FFF', borderRadius:8, padding:16 }}><div style={{ fontSize:11, opacity:0.6 }}>SESSIONS</div><div style={{ fontSize:28, fontWeight:800 }}>{sessions.length}</div></div>
          <div style={{ background:'#FDE047', border:'1px solid #14171B', borderRadius:8, padding:16 }}><div style={{ fontSize:11 }}>JOUEURS</div><div style={{ fontSize:28, fontWeight:800 }}>{playersCount}</div></div>
          <div style={{ background:'#FBF8EF', border:'1px solid #14171B', borderRadius:8, padding:16 }}><div style={{ fontSize:11 }}>CARTES JOUÉES (depots)</div><div style={{ fontSize:28, fontWeight:800 }}>{depotsCount}</div></div>
          <div style={{ background:'#FFF', border:'1px solid #14171B', borderRadius:8, padding:16 }}><div style={{ fontSize:11 }}>FACILITATEURS ACTIFS</div><div style={{ fontSize:28, fontWeight:800 }}>{facis.filter(f=>f.active).length}/{facis.length}</div></div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'320px 1fr', gap:20 }}>
          <div style={{ background:'#FFF', border:'2px solid #14171B', borderRadius:12, padding:20, height:'fit-content' }}>
            <h3>Créer facilitateur → FACI-XXX</h3>
            <input placeholder="Nom complet" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} style={{ width:'100%', padding:10, marginBottom:8, border:'1px solid #14171B', borderRadius:4 }} />
            <input placeholder="Email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} style={{ width:'100%', padding:10, marginBottom:8, border:'1px solid #14171B', borderRadius:4 }} />
            <button onClick={createFaci} style={{ width:'100%', padding:12, background:'#14171B', color:'#FFF', borderRadius:4, fontWeight:600 }}>Créer dans Supabase →</button>
            <div style={{ fontSize:11, opacity:0.5, marginTop:8 }}>Insère dans public.facilitators avec code UNIQUE FACI-XXX</div>
          </div>
          <div style={{ background:'#FFF', border:'1px solid #eee', borderRadius:12, padding:20 }}>
            <h3>Facilitateurs (depuis Supabase)</h3>
            <table style={{ width:'100%', fontSize:13, borderCollapse:'collapse', marginTop:12 }}>
              <thead><tr style={{ textAlign:'left', borderBottom:'1px solid #eee' }}><th>Code</th><th>Nom</th><th>Email</th><th>Actif</th><th>Actions</th></tr></thead>
              <tbody>{facis.map(f=>(
                <tr key={f.id} style={{ borderBottom:'1px solid #f5f5f5' }}>
                  <td style={{ background:'#FDE047', fontWeight:800, padding:'6px 8px' }}>{f.code}</td>
                  <td>{f.name}</td><td>{f.email}</td>
                  <td><span style={{ padding:'4px 8px', borderRadius:10, fontSize:11, background: f.active? '#DCFCE7' : '#FEE2E2' }}>{f.active? 'Actif' : 'Inactif'}</span></td>
                  <td><button onClick={()=>toggle(f)} style={{ fontSize:11, marginRight:6 }}>{f.active? 'Désactiver' : 'Activer'}</button><button onClick={()=>del(f)} style={{ fontSize:11, color:'#DC2626' }}>Suppr</button></td>
                </tr>
              ))}</tbody>
            </table>

            <h3 style={{ marginTop:24 }}>Sessions par facilitateur (depuis Supabase)</h3>
            <table style={{ width:'100%', fontSize:12, borderCollapse:'collapse', marginTop:8 }}>
              <thead><tr style={{ textAlign:'left', borderBottom:'1px solid #eee' }}><th>Code Session</th><th>Facilitator_id</th><th>Company</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>{sessions.map(s=>(
                <tr key={s.id} style={{ borderBottom:'1px solid #f5f5f5' }}><td>{s.code}</td><td style={{ fontSize:10 }}>{s.facilitator_id?.slice(0,8)}</td><td>{s.company}</td><td>{s.status}</td><td>{s.started_at?.slice(0,10)}</td></tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
