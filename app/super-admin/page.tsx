'use client';
import { useState } from 'react';
import Link from 'next/link';

type Facilitateur = { id: string; code: string; nom: string; email: string; org: string; actif: boolean; sessions: number; created: string; };
type Session = { id: string; code: string; facilitateur: string; date: string; joueurs: number; cartes: number; statut: 'En cours'|'Terminée'; };

export default function SuperAdminPage() {
  const [facs, setFacs] = useState<Facilitateur[]>([
    { id:'1', code:'FACI-001', nom:'Marie Tremblay', email:'marie@uqam.ca', org:'UQAM', actif:true, sessions:12, created:'2026-01-15' },
    { id:'2', code:'FACI-002', nom:'David Chen', email:'david@desjardins.com', org:'Desjardins', actif:true, sessions:8, created:'2026-02-01' },
    { id:'3', code:'FACI-003', nom:'Sophie Roy', email:'sophie@hydro.qc.ca', org:'Hydro-Québec', actif:false, sessions:3, created:'2026-02-20' },
  ]);
  const [sessions] = useState<Session[]>([
    { id:'1', code:'SESS-A1B2C3', facilitateur:'FACI-001', date:'2026-09-25', joueurs:8, cartes:42, statut:'Terminée' },
    { id:'2', code:'SESS-D4E5F6', facilitateur:'FACI-001', date:'2026-09-24', joueurs:6, cartes:35, statut:'Terminée' },
    { id:'3', code:'SESS-G7H8I9', facilitateur:'FACI-002', date:'2026-09-26', joueurs:12, cartes:28, statut:'En cours' },
  ]);
  const [form, setForm] = useState({ nom:'', email:'', org:'' });
  const [filterOrg, setFilterOrg] = useState('');
  const [selectedFac, setSelectedFac] = useState<string|null>(null);

  const totalSessions = sessions.length;
  const totalJoueurs = sessions.reduce((a,s)=>a+s.joueurs,0);
  const totalCartes = sessions.reduce((a,s)=>a+s.cartes,0);
  const actifs = facs.filter(f=>f.actif).length;

  const createFac = () => {
    if(!form.nom ||!form.email) return alert('Nom et email requis');
    const nextNum = String(facs.length+1).padStart(3,'0');
    const code = `FACI-${nextNum}`;
    setFacs([...facs, { id: Date.now().toString(), code, nom:form.nom, email:form.email, org:form.org, actif:true, sessions:0, created:new Date().toISOString().slice(0,10) }]);
    setForm({ nom:'', email:'', org:'' });
  };
  const toggleActif = (id:string) => setFacs(facs.map(f=> f.id===id? {...f, actif:!f.actif} : f));
  const deleteFac = (id:string) => { if(confirm('Supprimer ce facilitateur?')) setFacs(facs.filter(f=>f.id!==id)); };
  const copy = (t:string) => { navigator.clipboard.writeText(t); alert('Code copié: '+t); };

  const filtered = facs.filter(f=>!filterOrg || f.org.toLowerCase().includes(filterOrg.toLowerCase()));

  return (
    <div style={{ minHeight:'100vh', background:'#FFFEF9', color:'#14171B', padding:'0 0 40px' }}>
      <header style={{ borderBottom:'1px solid rgba(20,23,27,0.1)', padding:'16px 0', background:'#FFF', position:'sticky', top:0, zIndex:20 }}>
        <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 24px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ fontFamily:'Georgia, serif', fontWeight:800, fontSize:20 }}>Super Admin · Angle Mort</div>
          <div style={{ display:'flex', gap:12 }}><Link href="/" style={{ textDecoration:'none', color:'#14171B', fontSize:13, border:'1px solid rgba(20,23,27,0.15)', padding:'8px 12px', borderRadius:6 }}>Landing</Link><Link href="/facilitateur" style={{ textDecoration:'none', background:'#14171B', color:'#FFF', fontSize:13, padding:'8px 12px', borderRadius:6 }}>Espace Facilitateur</Link></div>
        </div>
      </header>

      <div style={{ maxWidth:1200, margin:'0 auto', padding:'24px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:28 }}>
          <div style={{ background:'#14171B', color:'#FBF8EF', borderRadius:12, padding:20 }}><div style={{ fontSize:11, opacity:0.6, letterSpacing:'0.1em' }}>SESSIONS TOTAL</div><div style={{ fontSize:32, fontWeight:800, marginTop:6 }}>{totalSessions}</div><div style={{ fontSize:12, opacity:0.6 }}>Toutes organisations</div></div>
          <div style={{ background:'#FDE047', border:'2px solid #14171B', borderRadius:12, padding:20 }}><div style={{ fontSize:11, opacity:0.7, fontWeight:800 }}>JOUEURS</div><div style={{ fontSize:32, fontWeight:800, marginTop:6 }}>{totalJoueurs}</div><div style={{ fontSize:12, opacity:0.7 }}>Participants uniques</div></div>
          <div style={{ background:'#FBF8EF', border:'1px solid rgba(20,23,27,0.1)', borderRadius:12, padding:20 }}><div style={{ fontSize:11, opacity:0.5, fontWeight:800 }}>CARTES JOUÉES</div><div style={{ fontSize:32, fontWeight:800, marginTop:6 }}>{totalCartes}</div><div style={{ fontSize:12, opacity:0.6 }}>Signaux déposés</div></div>
          <div style={{ background:'#FFF', border:'1px solid rgba(20,23,27,0.1)', borderRadius:12, padding:20 }}><div style={{ fontSize:11, opacity:0.5, fontWeight:800 }}>FACILITATEURS ACTIFS</div><div style={{ fontSize:32, fontWeight:800, marginTop:6 }}>{actifs}/{facs.length}</div><div style={{ fontSize:12, opacity:0.6 }}>{Math.round((actifs/facs.length)*100)}% actifs</div></div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1.5fr', gap:20, marginBottom:28 }}>
          <div style={{ background:'#FFF', border:'1px solid rgba(20,23,27,0.1)', borderRadius:12, padding:20 }}>
            <h3 style={{ fontFamily:'Georgia, serif', fontWeight:800, margin:'0 0 16px' }}>Créer facilitateur</h3>
            <div style={{ display:'grid', gap:12 }}>
              <input placeholder="Nom complet" value={form.nom} onChange={e=>setForm({...form, nom:e.target.value})} style={{ padding:'10px 12px', borderRadius:6, border:'1px solid rgba(20,23,27,0.2)' }} />
              <input placeholder="Email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} style={{ padding:'10px 12px', borderRadius:6, border:'1px solid rgba(20,23,27,0.2)' }} />
              <input placeholder="Organisation" value={form.org} onChange={e=>setForm({...form, org:e.target.value})} style={{ padding:'10px 12px', borderRadius:6, border:'1px solid rgba(20,23,27,0.2)' }} />
              <button onClick={createFac} style={{ background:'#14171B', color:'#FFF', padding:'12px', borderRadius:6, border:'none', fontWeight:700, cursor:'pointer' }}>+ Créer FACI-XXX</button>
              <div style={{ fontSize:11, opacity:0.5, textAlign:'center' }}>Code généré auto FACI-001, FACI-002... copiable</div>
            </div>
          </div>
          <div style={{ background:'#FFF', border:'1px solid rgba(20,23,27,0.1)', borderRadius:12, padding:20 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <h3 style={{ fontFamily:'Georgia, serif', fontWeight:800, margin:0 }}>Liste facilitateurs</h3>
              <input placeholder="Filtrer org..." value={filterOrg} onChange={e=>setFilterOrg(e.target.value)} style={{ padding:'6px 10px', borderRadius:6, border:'1px solid rgba(20,23,27,0.15)', fontSize:12 }} />
            </div>
            <div style={{ display:'grid', gap:8 }}>
              {filtered.map(f=>(
                <div key={f.id} style={{ display:'grid', gridTemplateColumns:'90px 1fr auto', gap:12, alignItems:'center', padding:'10px 12px', border:'1px solid rgba(20,23,27,0.08)', borderRadius:8, background: f.actif? '#FFF' : '#F4EFE2' }}>
                  <div><span style={{ background:'#FDE047', border:'1px solid #14171B', padding:'3px 8px', borderRadius:12, fontSize:11, fontWeight:800 }}>{f.code}</span><div style={{ fontSize:10, opacity:0.5, marginTop:4 }}>{f.created}</div></div>
                  <div><div style={{ fontWeight:700, fontSize:13 }}>{f.nom}</div><div style={{ fontSize:11, opacity:0.6 }}>{f.email} · {f.org} · {f.sessions} sessions</div></div>
                  <div style={{ display:'flex', gap:6 }}>
                    <button onClick={()=>copy(f.code)} style={{ fontSize:11, padding:'6px 8px', borderRadius:6, border:'1px solid #14171B', background:'#FFF', cursor:'pointer' }}>Copier</button>
                    <button onClick={()=>toggleActif(f.id)} style={{ fontSize:11, padding:'6px 8px', borderRadius:6, border:'none', background: f.actif? '#DC2626' : '#22C55E', color:'#FFF', cursor:'pointer' }}>{f.actif? 'Désactiver' : 'Activer'}</button>
                    <button onClick={()=>setSelectedFac(selectedFac===f.code? null : f.code)} style={{ fontSize:11, padding:'6px 8px', borderRadius:6, background:'#14171B', color:'#FFF', border:'none', cursor:'pointer' }}>Sessions</button>
                    <button onClick={()=>deleteFac(f.id)} style={{ fontSize:11, padding:'6px 8px', borderRadius:6, border:'1px solid #DC2626', color:'#DC2626', background:'#FFF', cursor:'pointer' }}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ background:'#FFF', border:'1px solid rgba(20,23,27,0.1)', borderRadius:12, padding:20 }}>
          <h3 style={{ fontFamily:'Georgia, serif', fontWeight:800, margin:'0 0 16px' }}>{selectedFac? `Sessions de ${selectedFac}` : 'Toutes les sessions par facilitateur'}</h3>
          <div style={{ display:'grid', gap:8 }}>
            {(selectedFac? sessions.filter(s=>s.facilitateur===selectedFac) : sessions).map(s=>(
              <div key={s.id} style={{ display:'grid', gridTemplateColumns:'110px 90px 1fr auto', gap:12, alignItems:'center', padding:'10px 12px', border:'1px solid rgba(20,23,27,0.08)', borderRadius:8 }}>
                <span style={{ background:'#14171B', color:'#FFF', padding:'4px 8px', borderRadius:6, fontSize:11, fontWeight:700 }}>{s.code}</span>
                <span style={{ fontSize:11, padding:'4px 8px', borderRadius:12, background: s.statut==='En cours'? '#FDE047' : '#E5E7EB', fontWeight:700 }}>{s.statut}</span>
                <div style={{ fontSize:12 }}><b>{s.facilitateur}</b> · {s.date} · {s.joueurs} joueurs · {s.cartes} cartes jouées</div>
                <div style={{ fontSize:11, opacity:0.6 }}>{s.joueurs*4} jetons déposés</div>
              </div>
            ))}
          </div>
          {selectedFac && <button onClick={()=>setSelectedFac(null)} style={{ marginTop:12, fontSize:12, padding:'8px 12px', borderRadius:6, border:'1px solid rgba(20,23,27,0.2)', background:'#FFF', cursor:'pointer' }}>Voir toutes les sessions</button>}
        </div>
      </div>
    </div>
  );
}
