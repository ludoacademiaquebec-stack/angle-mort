'use client';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { loadCardsDiagFromDB, loadCardsAllFromDB } from '@/lib/cards';
import { compterVotes, construireResultat, positionMajoritaire } from '@/lib/resolution';
import { savePari } from '@/lib/session-api';
import type { Quadrant, Pion, Vote, ResultatCarte } from '@/lib/types';

type Phase = 'signal' | 'situation' | 'question' | 'argumentation' | 'vote' | 'decompte' | 'resultat' | 'fermeture_all' | 'fermeture';
const QUADRANTS: Quadrant[] = ['NO','NE','SO','SE'];

function GameEngine({ sessionId, code, isFacilitator = false, playerId, nick, sync }: any) {
  const [pions, setPions] = useState<Pion[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [cartesDiag, setCartesDiag] = useState<any[]>([]);
  const [cartesAll, setCartesAll] = useState<any[]>([]);
  const [cardIdx, setCardIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>('signal');
  const [resultat, setResultat] = useState<ResultatCarte | null>(null);
  const [allTirees, setAllTirees] = useState<any[]>([]);
  const [timer, setTimer] = useState(300);

  const carte = cartesDiag[cardIdx];

  useEffect(()=>{ loadCardsDiagFromDB().then(setCartesDiag); loadCardsAllFromDB().then(setCartesAll); },[]);

  useEffect(()=>{
    if(!sessionId) return;
    const fetchPions = async ()=>{ const {data}=await supabase.from('session_pions').select('*').eq('session_id', sessionId); if(data) setPions(data as any); };
    const fetchVotes = async ()=>{
      const {data}=await supabase.from('session_events').select('*').eq('session_id', sessionId).eq('type','pari').order('created_at',{ascending:true});
      if(data){
        const v: Vote[] = data.map((e:any)=>({ playerId: e.player_id, choix: e.to_quadrant as any, cardId: e.question_id || e.metadata?.cardId || e.metadata?.question_id, question_id: e.question_id, timestamp: new Date(e.created_at).getTime(), sessionId }));
        setVotes(v);
      }
    };
    fetchPions(); fetchVotes();
    const ch = supabase.channel(`sess-${sessionId}`)
     .on('postgres_changes',{event:'*',schema:'public',table:'session_pions',filter:`session_id=eq.${sessionId}`}, fetchPions)
     .on('postgres_changes',{event:'*',schema:'public',table:'session_events',filter:`session_id=eq.${sessionId}`}, fetchVotes)
     .subscribe();
    return ()=>{ supabase.removeChannel(ch); };
  },[sessionId]);

  useEffect(()=>{ if(phase!=='argumentation') return; const id=setInterval(()=> setTimer(t=>Math.max(0,t-1)),1000); return ()=>clearInterval(id); },[phase]);

  // VOTES DE CETTE CARTE UNIQUEMENT
  const votesDeLaCarte = useMemo(()=> votes.filter(v=> v.cardId===carte?.id), [votes, carte]);
  const counts = useMemo(()=> compterVotes(votesDeLaCarte as any), [votesDeLaCarte]);

  const logEvent = async (payload:any)=>{
    try{ await supabase.from('session_events').insert({ session_id: sessionId, type: payload.type, to_quadrant: payload.to_quadrant, question_id: payload.question_id, player_id: playerId||null, metadata: payload.metadata||{} }); }catch{}
  };

  const handleVote = async (choix: 'reste'|'bouge'|'neutre')=>{
    if(!carte) return;
    const pid = playerId||'anon';
    const newVote: Vote = { playerId: pid, choix, cardId: carte.id, question_id: carte.id, timestamp: Date.now(), sessionId };
    // Remplace vote précédent du même joueur sur CETTE carte
    setVotes(prev=> [...prev.filter(v=>!(v.playerId===pid && v.cardId===carte.id)), newVote]);
    try{ sync?.sendVote?.(newVote); }catch{}
    await savePari(sessionId, pid, nick||'Joueur', carte.id, choix);
    await logEvent({ type:'pari', to_quadrant: choix, question_id: carte.id, metadata:{ choix, cardId: carte.id, question_id: carte.id, mon_quadrant: pions.find(p=>p.playerId===pid)?.quadrantActuel } });
  };

  const handleDecompte = ()=>{
    if(!carte) return;
    const res = construireResultat(carte.id, pions, votesDeLaCarte as any);
    setResultat(res);
    setPhase('resultat');
    logEvent({ type:'resultat', question_id: carte.id, metadata: res as any });
    supabase.from('session_resultats').insert({ session_id: sessionId, card_id: carte.id, card_index: cardIdx, position_signal: res.positionSignal, position_finale: res.positionFinale, pari_gagnant: res.pariGagnant, condition: res.condition, reste: (res as any).reste, bouge: (res as any).bouge, neutre: (res as any).neutre, majorite: res.majorite, gagnants: res.gagnants, perdants: res.perdants }).then(()=>{});
  };

  const tirerAll = ()=>{
    const n1 = cartesAll.filter(c=>c.niveau===1); const n2 = cartesAll.filter(c=>c.niveau===2); const n3 = cartesAll.filter(c=>c.niveau===3);
    const pick = (arr:any[])=> arr.length? arr[Math.floor(Math.random()*arr.length)] : null;
    const tirees = [pick(n1), pick(n2), pick(n3)].filter(Boolean);
    setAllTirees(tirees); setPhase('fermeture_all');
    logEvent({ type:'phase', to_quadrant: 'fermeture_all' as any, question_id: carte?.id, metadata:{ all: tirees.map((c:any)=>c.id) } });
  };

  if(!carte) return <div style={{padding:40}}>Chargement {cartesDiag.length} cartes diag / {cartesAll.length} ALL...</div>;
  const posSig = positionMajoritaire(pions, 'quadrantInitial'); const posFin = positionMajoritaire(pions, 'quadrantActuel');

  return (
    <div style={{ minHeight:'100vh', background:'#FFFEF9', padding:16 }}>
      <div style={{ maxWidth:1300, margin:'0 auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', background:'#FFF', border:'1px solid #14171B', borderRadius:8, padding:'10px 16px', marginBottom:12 }}>
          <div style={{fontWeight:800}}>{code} • Carte {cardIdx+1}/{cartesDiag.length} • {carte.id}</div>
          <div style={{fontSize:12, display:'flex', gap:12}}><span>Phase:{phase}</span><span style={{padding:'2px 10px', background:'#14171B', color:'#FFF', borderRadius:20}}>R:{counts.reste} B:{counts.bouge} N:{counts.neutre} → {counts.majorite}</span></div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:16 }}>
          <div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gridTemplateRows:'1fr 1fr', gap:8, height:420, marginBottom:12 }}>
              {QUADRANTS.map(q=>(
                <div key={q} style={{ border:`2px solid ${posSig===q?'#FDE047':'#14171B'}`, borderRadius:10, padding:10, background: posFin===q?'#f9fafb':'#FFF' }}>
                  <div style={{fontSize:11, fontWeight:800}}>{q} {posSig===q?'• SIGNAL':''} {posFin===q?'• FINALE':''}</div>
                  <div style={{display:'flex', flexWrap:'wrap', gap:6, marginTop:8}}>{pions.filter(p=> (phase==='signal'? p.quadrantInitial : p.quadrantActuel)===q).map(p=><div key={p.playerId} style={{width:28,height:28,borderRadius:14,background:p.couleur==='jaune'?'#FDE047':p.couleur==='rouge'?'#EF4444':'#E5E7EB',border:'1px solid #14171B',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:800}}>{p.playerId.slice(0,2).toUpperCase()}</div>)}</div>
                </div>
              ))}
            </div>
            <div style={{ background:'#FFF', border:'1px solid #14171B', borderRadius:12, padding:16 }}>
              {phase==='signal' && <><h2>{carte.signal}</h2><div>{carte.situation}</div><button onClick={()=>setPhase('question')} style={{marginTop:12,padding:'10px 20px',background:'#14171B',color:'#FFF',borderRadius:6}}>Question</button></>}
              {phase==='question' && <><h2>{carte.question}</h2><button onClick={()=>{setPhase('argumentation'); setTimer(300);}} style={{marginTop:12,padding:'10px 20px',background:'#14171B',color:'#FFF',borderRadius:6}}>Argumentation 5min</button></>}
              {phase==='argumentation' && <><h2>Argumentation {Math.floor(timer/60)}:{String(timer%60).padStart(2,'0')}</h2><button onClick={()=>setPhase('vote')} style={{marginTop:12,padding:'10px 20px',background:'#FDE047',border:'1px solid #14171B',borderRadius:6,fontWeight:700}}>Passer au vote — Carte {carte.id}</button></>}
              {phase==='vote' && (
                <div>
                  <h2>Vote pour {carte.id} — Reste ou Bouge?</h2>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginTop:16}}>
                    <button onClick={()=>handleVote('reste')} style={{padding:18,background:'#FDE047',border:'2px solid #14171B',borderRadius:10,fontWeight:800}}>RESTE</button>
                    <button onClick={()=>handleVote('bouge')} style={{padding:18,background:'#EF4444',color:'#FFF',border:'2px solid #14171B',borderRadius:10,fontWeight:800}}>BOUGE</button>
                    <button onClick={()=>handleVote('neutre')} style={{padding:18,background:'#E5E7EB',border:'2px solid #14171B',borderRadius:10,fontWeight:800}}>NEUTRE</button>
                  </div>
                  <div style={{marginTop:12,fontSize:12}}>Vote associé à: <b>{carte.id}</b> • Joueur: {playerId||'anon'} • {votesDeLaCarte.length} votes sur cette carte</div>
                  {isFacilitator && <button onClick={handleDecompte} style={{marginTop:16,padding:'10px 20px',background:'#14171B',color:'#FFF',borderRadius:6}}>Décompte {carte.id} → R:{counts.reste} B:{counts.bouge} N:{counts.neutre}</button>}
                </div>
              )}
              {phase==='resultat' && resultat && (
                <div>
                  <h2>Résultat {carte.id} — {resultat.condition} — Majorité {resultat.majorite}</h2>
                  <div style={{display:'flex',height:22,borderRadius:8,overflow:'hidden',border:'1px solid #14171B',margin:'12px 0'}}>
                    {(()=>{ const tot=(resultat as any).reste+(resultat as any).bouge+(resultat as any).neutre||1; const pr=Math.round((resultat as any).reste/tot*100); const pb=Math.round((resultat as any).bouge/tot*100); const pn=100-pr-pb; return <><div style={{width:`${pr}%`,background:'#FDE047',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700}}>{pr>10?`R ${pr}%`:''}</div><div style={{width:`${pb}%`,background:'#EF4444',color:'#FFF',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700}}>{pb>10?`B ${pb}%`:''}</div><div style={{width:`${pn}%`,background:'#E5E7EB',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700}}>{pn>10?`N ${pn}%`:''}</div></>; })()}
                  </div>
                  <div style={{display:'flex',gap:8}}><button onClick={tirerAll} style={{padding:'12px 20px',background:'#14171B',color:'#FFF',borderRadius:6,fontWeight:700}}>Plan ALL 1/2/3</button><button onClick={()=>{ if(cardIdx<cartesDiag.length-1){ setCardIdx(i=>i+1); setPhase('signal'); setResultat(null); } else setPhase('fermeture_all'); }} style={{padding:'12px 20px',background:'#FFF',border:'1px solid #14171B',borderRadius:6}}>Carte suivante</button></div>
                </div>
              )}
              {phase==='fermeture_all' && (
                <div><h2>Plan d'action ALL — 3 cartes</h2><div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginTop:12}}>{allTirees.map((c:any)=><div key={c.id} style={{border:`2px solid ${c.couleur||'#14171B'}`,borderRadius:10,padding:14}}><div style={{fontSize:10,fontFamily:'monospace'}}>{c.id} N{c.niveau} {c.delai}</div><div style={{fontWeight:800,margin:'6px 0'}}>{c.titre}</div><div style={{fontSize:12}}>{c.action}</div><div style={{fontSize:10,opacity:0.6,marginTop:6}}>{c.indicateur}</div></div>)}</div><a href={`/rapport-profond?sessionId=${sessionId}`} style={{display:'inline-block',marginTop:20,padding:'12px 24px',background:'#14171B',color:'#FFF',borderRadius:6,textDecoration:'none'}}>Rapport profond avec neutre →</a></div>
              )}
            </div>
          </div>
          <div style={{ background:'#FFF', border:'1px solid #14171B', borderRadius:12, padding:12 }}>
            <div style={{fontSize:11,fontWeight:700,marginBottom:8}}>VOTES CARTE {carte.id} — {votesDeLaCarte.length}/{pions.length||'?'} joueurs</div>
            <div style={{display:'flex',height:14,borderRadius:6,overflow:'hidden',border:'1px solid #14171B',marginBottom:8}}>{(()=>{ const tot=counts.reste+counts.bouge+counts.neutre||1; return <><div style={{width:`${counts.reste/tot*100}%`,background:'#FDE047'}}/><div style={{width:`${counts.bouge/tot*100}%`,background:'#EF4444'}}/><div style={{width:`${counts.neutre/tot*100}%`,background:'#E5E7EB'}}/></>; })()}</div>
            <div style={{fontSize:12,display:'flex',justifyContent:'space-between'}}><span>R:{counts.reste}</span><span>B:{counts.bouge}</span><span>N:{counts.neutre}</span><span><b>{counts.majorite}</b></span></div>
            <div style={{marginTop:10,fontSize:11,maxHeight:300,overflowY:'auto'}}>{votesDeLaCarte.map((v,i)=><div key={i} style={{display:'flex',justifyContent:'space-between',borderBottom:'1px solid #f5f5f5',padding:'4px 0'}}><span>{v.playerId.slice(0,6)} → {v.cardId}</span><span style={{padding:'1px 8px',borderRadius:10,background:v.choix==='reste'?'#FDE047':v.choix==='bouge'?'#EF4444':'#E5E7EB',color:v.choix==='bouge'?'#FFF':'#14171B',fontWeight:700,fontSize:10}}>{v.choix}</span></div>)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
export { GameEngine };
export default GameEngine;
