'use client';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { loadCardsDiagFromDB, loadCardsAllFromDB } from '@/lib/cards';
import { compterVotes, construireResultat, positionMajoritaire } from '@/lib/resolution';
import { savePari } from '@/lib/session-api';
import type { Quadrant, Pion, Vote, ResultatCarte } from '@/lib/types';

type Phase = 'signal' | 'situation' | 'question' | 'argumentation' | 'vote' | 'decompte' | 'resultat' | 'fermeture_all' | 'fermeture';

const QUADRANTS: Quadrant[] = ['NO','NE','SO','SE'];
const LABELS: Record<Quadrant, string> = { NO: 'NO - Nord-Ouest', NE: 'NE - Nord-Est', SO: 'SO - Sud-Ouest', SE: 'SE - Sud-Est' };

export default function GameEngine({ sessionId, code, isFacilitator = false, playerId, nick, sync }: any) {
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

  useEffect(()=>{
    loadCardsDiagFromDB().then(setCartesDiag);
    loadCardsAllFromDB().then(setCartesAll);
  },[]);

  useEffect(()=>{
    if(!sessionId) return;
    const fetchPions = async ()=>{
      const { data } = await supabase.from('session_pions').select('*').eq('session_id', sessionId);
      if(data) setPions(data as any);
    };
    const fetchVotes = async ()=>{
      const { data } = await supabase.from('session_events').select('*').eq('session_id', sessionId).eq('type','pari');
      if(data){
        const v: Vote[] = data.map((e:any)=>({ playerId: e.player_id, choix: e.to_quadrant, cardId: e.question_id, timestamp: new Date(e.created_at).getTime() }));
        setVotes(v);
      }
    };
    fetchPions(); fetchVotes();
    const ch = supabase.channel(`session-${sessionId}`)
     .on('postgres_changes', { event:'*', schema:'public', table:'session_pions', filter:`session_id=eq.${sessionId}` }, fetchPions)
     .on('postgres_changes', { event:'*', schema:'public', table:'session_events', filter:`session_id=eq.${sessionId}` }, fetchVotes)
     .subscribe();
    return ()=>{ supabase.removeChannel(ch); };
  },[sessionId]);

  useEffect(()=>{
    if(phase!=='argumentation') return;
    const id = setInterval(()=> setTimer(t=> Math.max(0, t-1)), 1000);
    return ()=> clearInterval(id);
  },[phase]);

  const counts = useMemo(()=> compterVotes(votes.filter(v=> v.cardId===carte?.id)), [votes, carte]);

  const logEvent = async (payload:any)=>{
    try{ await supabase.from('session_events').insert({ session_id: sessionId, type: payload.type, to_quadrant: payload.to_quadrant, question_id: payload.question_id, player_id: playerId||null, metadata: payload.metadata||{} }); }catch{}
  };

  const handleVote = async (choix: 'reste' | 'bouge' | 'neutre')=>{
    if(!carte) return;
    const pid = playerId || 'anon';
    const newVote: Vote = { playerId: pid, choix, cardId: carte.id, timestamp: Date.now() };
    setVotes(prev=> [...prev.filter(v=>!(v.playerId===pid && v.cardId===carte.id)), newVote]);
    try{ sync?.sendVote?.(newVote); }catch{}
    try{ await savePari(sessionId, pid, nick||'Joueur', carte.id, choix); }catch{}
    await logEvent({ type:'pari', to_quadrant: choix, question_id: carte.id, metadata:{ choix, mon_quadrant: pions.find(p=>p.playerId===pid)?.quadrantActuel } });
  };

  const handleDecompte = ()=>{
    if(!carte) return;
    const res = construireResultat(carte.id, pions, votes.filter(v=> v.cardId===carte.id));
    setResultat(res);
    setPhase('resultat');
    logEvent({ type:'resultat', question_id: carte.id, metadata: res });
    supabase.from('session_resultats').insert({ session_id: sessionId, card_id: carte.id, card_index: cardIdx, position_signal: res.positionSignal, position_finale: res.positionFinale, pari_gagnant: res.pariGagnant, condition: res.condition, reste: res.reste, bouge: res.bouge, neutre: (res as any).neutre, majorite: res.majorite, gagnants: res.gagnants, perdants: res.perdants }).then(()=>{});
  };

  const tirerAll = ()=>{
    const n1 = cartesAll.filter(c=>c.niveau===1);
    const n2 = cartesAll.filter(c=>c.niveau===2);
    const n3 = cartesAll.filter(c=>c.niveau===3);
    const pick = (arr:any[])=> arr.length? arr[Math.floor(Math.random()*arr.length)] : null;
    const tirees = [pick(n1), pick(n2), pick(n3)].filter(Boolean);
    setAllTirees(tirees);
    setPhase('fermeture_all');
    logEvent({ type:'phase', to_quadrant: 'fermeture_all' as any, metadata:{ all: tirees.map((c:any)=>c.id) } });
  };

  if(!carte){
    return <div style={{ padding:40, background:'#FFFEF9', minHeight:'100vh' }}>Chargement cartes... {cartesDiag.length} diag / {cartesAll.length} ALL</div>;
  }

  const posSig = positionMajoritaire(pions, 'quadrantInitial');
  const posFin = positionMajoritaire(pions, 'quadrantActuel');

  return (
    <div style={{ minHeight:'100vh', background:'#FFFEF9', color:'#14171B', padding:16 }}>
      <div style={{ maxWidth:1300, margin:'0 auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12, background:'#FFF', border:'1px solid #14171B', borderRadius:8, padding:'10px 16px' }}>
          <div style={{ fontWeight:800, fontFamily:'Georgia, serif' }}>{code} • Carte {cardIdx+1}/{cartesDiag.length} • {carte.id} — {carte.famille}</div>
          <div style={{ display:'flex', gap:12, alignItems:'center', fontSize:12 }}>
            <span>Phase: <b>{phase}</b></span>
            <span>Signal: <b>{posSig||'—'}</b> → Finale: <b>{posFin||'—'}</b></span>
            <span style={{ padding:'4px 10px', borderRadius:20, background:'#14171B', color:'#FFF' }}>R:{counts.reste} B:{counts.bouge} N:{counts.neutre} → {counts.majorite} • {votes.filter(v=>v.cardId===carte.id).length} votes</span>
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:16 }}>
          <div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gridTemplateRows:'1fr 1fr', gap:8, height:520, marginBottom:12 }}>
              {QUADRANTS.map(q=>(
                <div key={q} style={{ border:`2px solid ${posSig===q? '#FDE047':'#14171B'}`, background: posFin===q? '#f9fafb':'#FFF', borderRadius:10, padding:10, position:'relative' }}>
                  <div style={{ fontSize:11, fontWeight:800, opacity:0.6 }}>{LABELS[q]} {posSig===q?'• SIGNAL':''} {posFin===q?'• FINALE':''}</div>
                  <div style={{ marginTop:8, display:'flex', flexWrap:'wrap', gap:6 }}>
                    {pions.filter(p=> (phase==='signal'? p.quadrantInitial : p.quadrantActuel)===q).map(p=>(
                      <div key={p.playerId} style={{ width:28, height:28, borderRadius:14, background: p.couleur==='jaune'? '#FDE047' : p.couleur==='rouge'? '#EF4444':'#E5E7EB', border:'1px solid #14171B', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:800 }}>{p.playerId.slice(0,2).toUpperCase()}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ background:'#FFF', border:'1px solid #14171B', borderRadius:12, padding:16 }}>
              {phase==='signal' && (<><div style={{ fontSize:11, opacity:0.6 }}>SIGNAL</div><h2 style={{ fontFamily:'Georgia, serif', fontSize:20 }}>{carte.signal}</h2><div style={{ marginTop:8 }}>{carte.situation}</div><button onClick={()=>setPhase('question')} style={{ marginTop:16, padding:'10px 20px', background:'#14171B', color:'#FFF', borderRadius:6 }}>Passer à la question</button></>)}
              {phase==='question' && (<><h2 style={{ fontFamily:'Georgia, serif', fontSize:20 }}>{carte.question}</h2><div style={{ marginTop:8, fontSize:13, opacity:0.7 }}>Mot piège: {carte.motPiege||'—'} • Compteur: {carte.compteur||''} {carte.compteurLabel||''}</div><button onClick={()=>{ setPhase('argumentation'); setTimer(300); }} style={{ marginTop:16, padding:'10px 20px', background:'#14171B', color:'#FFF', borderRadius:6 }}>Lancer argumentation 5min</button></>)}
              {phase==='argumentation' && (<><div style={{ display:'flex', justifyContent:'space-between' }}><h2>Argumentation</h2><div style={{ fontWeight:800 }}>{Math.floor(timer/60)}:{String(timer%60).padStart(2,'0')}</div></div><button onClick={()=>setPhase('vote')} style={{ marginTop:16, padding:'10px 20px', background:'#FDE047', border:'1px solid #14171B', borderRadius:6, fontWeight:700 }}>Passer au vote</button></>)}
              {phase==='vote' && (
                <div>
                  <h2 style={{ fontFamily:'Georgia, serif' }}>Vote : Est-ce que ça reste ou ça bouge?</h2>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginTop:16 }}>
                    <button onClick={()=>handleVote('reste')} style={{ padding:'18px 12px', background:'#FDE047', border:'2px solid #14171B', borderRadius:10, fontWeight:800, fontSize:16 }}>RESTE</button>
                    <button onClick={()=>handleVote('bouge')} style={{ padding:'18px 12px', background:'#EF4444', color:'#FFF', border:'2px solid #14171B', borderRadius:10, fontWeight:800, fontSize:16 }}>BOUGE</button>
                    <button onClick={()=>handleVote('neutre')} style={{ padding:'18px 12px', background:'#E5E7EB', border:'2px solid #14171B', borderRadius:10, fontWeight:800, fontSize:16 }}>NEUTRE</button>
                  </div>
                  <div style={{ marginTop:12, fontSize:12, opacity:0.7 }}>Abstention = j'hésite / je ne sais pas. Compte dans la majorité.</div>
                  {isFacilitator && <button onClick={handleDecompte} style={{ marginTop:16, padding:'10px 20px', background:'#14171B', color:'#FFF', borderRadius:6 }}>Décompte → Résultat</button>}
                </div>
              )}
              {phase==='resultat' && resultat && (
                <div>
                  <h2 style={{ fontFamily:'Georgia, serif', fontSize:22, marginBottom:8 }}>Résultat : {resultat.condition}</h2>
                  <div style={{ display:'flex', gap:8, marginBottom:12, fontSize:12 }}>
                    <span>Signal: <b>{resultat.positionSignal}</b></span><span>→</span><span>Finale: <b>{resultat.positionFinale}</b></span>
                    <span style={{ padding:'2px 10px', borderRadius:20, background:'#14171B', color:'#FFF' }}>Majorité: {resultat.majorite} {resultat.majorite==='neutre'?' (abstention)':''}</span>
                    <span style={{ padding:'2px 10px', borderRadius:20, background: resultat.pariGagnant==='jaune'? '#FDE047':'#EF4444', color: resultat.pariGagnant==='jaune'? '#14171B':'#FFF' }}>Gagnant: {resultat.pariGagnant==='jaune'?'Jaune':'Rouge'}</span>
                  </div>
                  <div style={{ display:'flex', height:22, borderRadius:8, overflow:'hidden', border:'1px solid #14171B', marginBottom:12 }}>
                    {(()=>{
                      const total = (resultat.reste||0)+(resultat.bouge||0)+((resultat as any).neutre||0) || 1;
                      const pr = Math.round(((resultat.reste||0)/total)*100);
                      const pb = Math.round(((resultat.bouge||0)/total)*100);
                      const pn = 100-pr-pb;
                      return (<>
                        <div style={{ width:`${pr}%`, background:'#FDE047', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700 }}>{pr>10? `RESTE ${resultat.reste} ${pr}%`:''}</div>
                        <div style={{ width:`${pb}%`, background:'#EF4444', color:'#FFF', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700 }}>{pb>10? `BOUGE ${resultat.bouge} ${pb}%`:''}</div>
                        <div style={{ width:`${pn}%`, background:'#E5E7EB', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700 }}>{pn>10? `NEUTRE ${(resultat as any).neutre} ${pn}%`:''}</div>
                      </>)
                    })()}
                  </div>
                  <div style={{ fontSize:12, marginBottom:12 }}>{resultat.gagnants.length} gagnants • {resultat.perdants.length} perdants</div>
                  {isFacilitator && (
                    <div style={{ display:'flex', gap:8 }}>
                      <button onClick={tirerAll} style={{ padding:'12px 20px', background:'#14171B', color:'#FFF', borderRadius:6, fontWeight:700 }}>Plan d'action ALL → 3 cartes</button>
                      <button onClick={()=>{ if(cardIdx < cartesDiag.length-1){ setCardIdx(i=>i+1); setPhase('signal'); setResultat(null); setVotes([]); } else { setPhase('fermeture'); } }} style={{ padding:'12px 20px', background:'#FFF', border:'1px solid #14171B', borderRadius:6 }}>Carte suivante</button>
                    </div>
                  )}
                </div>
              )}
              {phase==='fermeture_all' && (
                <div>
                  <h2 style={{ fontFamily:'Georgia, serif', fontSize:24, marginBottom:16 }}>Plan d'action — 3 cartes ALL (Niveau 1/2/3)</h2>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:12 }}>
                    {allTirees.map((c:any)=>(
                      <div key={c.id} style={{ border:`2px solid ${c.couleur||'#14171B'}`, borderRadius:10, padding:14, background:'#FFF' }}>
                        <div style={{ fontSize:10, fontFamily:'monospace', opacity:0.6 }}>{c.id} • N{c.niveau} • {c.delai}</div>
                        <div style={{ fontWeight:800, fontSize:14, margin:'6px 0' }}>{c.titre}</div>
                        <div style={{ fontSize:12 }}>{c.action}</div>
                        <div style={{ fontSize:10, marginTop:8, opacity:0.6 }}>Indicateur: {c.indicateur}</div>
                      </div>
                    ))}
                  </div>
                  <button onClick={()=>setPhase('fermeture')} style={{ marginTop:20, padding:'12px 24px', background:'#14171B', color:'#FFF', borderRadius:6 }}>Terminer session → Rapport</button>
                </div>
              )}
              {phase==='fermeture' && (<div><h2>Session terminée</h2><a href={`/rapport-profond?sessionId=${sessionId}`} style={{ display:'inline-block', marginTop:12, padding:'10px 20px', background:'#14171B', color:'#FFF', borderRadius:6, textDecoration:'none' }}>Voir rapport profond avec neutre</a></div>)}
            </div>
          </div>

          <div>
            <div style={{ background:'#FFF', border:'1px solid #14171B', borderRadius:12, padding:12 }}>
              <div style={{ fontSize:11, fontWeight:700, marginBottom:8 }}>VOTES EN DIRECT — 3 COULEURS</div>
              <div style={{ display:'flex', height:14, borderRadius:6, overflow:'hidden', border:'1px solid #14171B', marginBottom:8 }}>
                {(()=>{
                  const tot = counts.reste+counts.bouge+counts.neutre || 1;
                  return (<>
                    <div style={{ width:`${(counts.reste/tot)*100}%`, background:'#FDE047' }} />
                    <div style={{ width:`${(counts.bouge/tot)*100}%`, background:'#EF4444' }} />
                    <div style={{ width:`${(counts.neutre/tot)*100}%`, background:'#E5E7EB' }} />
                  </>)
                })()}
              </div>
              <div style={{ fontSize:12, display:'flex', justifyContent:'space-between' }}><span>R: {counts.reste}</span><span>B: {counts.bouge}</span><span>N: {counts.neutre}</span></div>
              <div style={{ fontSize:11, marginTop:6, fontWeight:700 }}>Majorité: {counts.majorite} {counts.majorite==='neutre'?' (abstention → égalité pour condition)':''}</div>
              <div style={{ marginTop:10, fontSize:11, maxHeight:200, overflowY:'auto' }}>{votes.filter(v=>v.cardId===carte?.id).map((v,i)=>(<div key={i} style={{ display:'flex', justifyContent:'space-between', borderBottom:'1px solid #f5f5f5', padding:'4px 0' }}><span>{v.playerId.slice(0,6)}</span><span style={{ padding:'1px 8px', borderRadius:10, background: v.choix==='reste'? '#FDE047': v.choix==='bouge'? '#EF4444':'#E5E7EB', color: v.choix==='bouge'? '#FFF':'#14171B', fontWeight:700, fontSize:10 }}>{v.choix}</span></div>))}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
