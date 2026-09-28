'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { savePari } from '@/lib/session-api';

type Props = { sessionId: string; code: string; isFacilitator?: boolean };

export default function GameEngine({ sessionId, code, isFacilitator=false }: Props){
  const [phase, setPhase] = useState<'diag'|'vote'|'result'|'all'|'engagement'|'fini'>('diag');
  const [cartesDiag, setCartesDiag] = useState<any[]>([]);
  const [cartesAll, setCartesAll] = useState<any[]>([]);
  const [index, setIndex] = useState(0);
  const [votes, setVotes] = useState<Record<string, {reste:number, bouge:number, neutre:number}>>({});
  const [jetons, setJetons] = useState(0);
  const [scoreR, setScoreR] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [scoreN, setScoreN] = useState(0);
  const [pions, setPions] = useState<any[]>([]);
  const [selectedAll, setSelectedAll] = useState<string[]>([]);

  useEffect(()=>{
    (async()=>{
      const { data: d1 } = await supabase.from('cards_diag').select('*').order('ordre',{ascending:true});
      const { data: d2 } = await supabase.from('cards_all').select('*').order('ordre',{ascending:true}).limit(12);
      setCartesDiag(d1||[]);
      setCartesAll(d2||[]);
      const { data: pi } = await supabase.from('session_pions').select('*').eq('session_id', sessionId);
      setPions(pi||[]);
    })();
  },[sessionId]);

  const carteActuelle = cartesDiag[index];

  const voter = async (choix:'reste'|'bouge'|'neutre')=>{
    if(!carteActuelle) return;
    // sauvegarde pari associé à la carte
    await savePari(sessionId, 'player-local', 'local', carteActuelle.id, choix);

    // mise à jour locale votes
    setVotes(prev=>{
      const cur = prev[carteActuelle.id]||{reste:0,bouge:0,neutre:0};
      return {...prev, [carteActuelle.id]: {...cur, [choix]: (cur as any)[choix]+1}};
    });
    if(choix==='reste') setScoreR(s=>s+1);
    if(choix==='bouge') setScoreB(s=>s+1);
    if(choix==='neutre') setScoreN(s=>s+1);

    // calcul jetons : 1 jeton si pari gagnant (majorité), bonus si neutre
    // on simplifie : 1 jeton par vote, +1 si neutre (hésitation = révélation)
    setJetons(j=> j + (choix==='neutre'? 2 : 1));

    // enregistre resultat
    await supabase.from('session_resultats').upsert({
      session_id: sessionId,
      card_id: carteActuelle.id,
      card_index: index,
      votes_reste: choix==='reste'?1:0,
      votes_bouge: choix==='bouge'?1:0,
      votes_neutre: choix==='neutre'?1:0,
      updated_at: new Date().toISOString()
    } as any, {onConflict:'session_id,card_id'});

    // passe à carte suivante ou phase ALL
    if(index < cartesDiag.length-1){
      setIndex(i=>i+1);
      setPhase('diag');
    } else {
      // FIN DIAG -> ALL
      await supabase.from('sessions').update({ phase:'all', jetons_total: jetons+1 } as any).eq('id', sessionId);
      setPhase('all');
    }
  };

  const choisirALL = async (cardAllId:string)=>{
    if(selectedAll.includes(cardAllId)) return;
    const newSel = [...selectedAll, cardAllId];
    setSelectedAll(newSel);
    await supabase.from('session_depots').insert({
      session_id: sessionId,
      card_id: cardAllId,
      type: 'engagement_all',
      created_at: new Date().toISOString()
    } as any);
    // Si 3 engagements ou jetons épuisés -> fini
    if(newSel.length>=3 || newSel.length>=Math.min(jetons,5)){
      await supabase.from('sessions').update({ phase:'fini', status:'completed' } as any).eq('id', sessionId);
      setPhase('fini');
    }
  };

  if(!carteActuelle && phase==='diag') return <div style={{padding:40}}>Chargement cartes DIAG...</div>;

  return (
    <div style={{ minHeight:'100vh', background:'#FFFEF9', color:'#14171B' }}>
      <header style={{ padding:'12px 20px', borderBottom:'1px solid #eee', display:'flex', justifyContent:'space-between', background:'#FFF' }}>
        <div style={{ fontFamily:'monospace', fontSize:12 }}>{code} • {sessionId.slice(0,8)} • Phase {phase.toUpperCase()} • Jetons {jetons} • R:{scoreR} B:{scoreB} N:{scoreN}</div>
        <div style={{ fontSize:11 }}>Carte {index+1}/{cartesDiag.length} DIAG {phase==='all'? `+ ${selectedAll.length} ALL choisis`:''}</div>
      </header>

      {phase==='diag' && carteActuelle && (
        <div style={{ maxWidth:900, margin:'0 auto', padding:24 }}>
          <div style={{ background:'#FFF', border:'2px solid #14171B', borderRadius:16, padding:20 }}>
            <div style={{ fontSize:10, fontFamily:'monospace', opacity:0.6 }}>{carteActuelle.id} • {carteActuelle.famille} • {carteActuelle.couleur} • {carteActuelle.compteur_label||carteActuelle.compteur}</div>
            <h2 style={{ fontFamily:'Georgia, serif', fontSize:26, margin:'8px 0' }}>{carteActuelle.titre}</h2>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginTop:12 }}>
              <div style={{ background:'#FFFEF9', border:'1px solid #eee', borderRadius:8, padding:12 }}><div style={{fontSize:10, fontWeight:800}}>SIGNAL</div><div style={{marginTop:6}}>{carteActuelle.signal}</div></div>
              <div style={{ background:'#F9FAFB', border:'1px solid #eee', borderRadius:8, padding:12 }}><div style={{fontSize:10, fontWeight:800}}>SITUATION</div><div style={{marginTop:6, fontSize:13}}>{carteActuelle.situation}</div></div>
              <div style={{ gridColumn:'1 / span 2', border:'2px solid #14171B', borderRadius:10, padding:14 }}><div style={{fontSize:10, fontWeight:800}}>QUESTION (associée au vote)</div><div style={{marginTop:6, fontWeight:700, fontSize:16}}>{carteActuelle.question}</div></div>
            </div>
            <div style={{ display:'flex', gap:12, marginTop:20 }}>
              <button onClick={()=>voter('reste')} style={{ flex:1, padding:'14px', background:'#FDE047', border:'2px solid #14171B', borderRadius:10, fontWeight:800 }}>RESTE (jaune)</button>
              <button onClick={()=>voter('bouge')} style={{ flex:1, padding:'14px', background:'#EF4444', color:'#FFF', border:'2px solid #14171B', borderRadius:10, fontWeight:800 }}>BOUGE (rouge)</button>
              <button onClick={()=>voter('neutre')} style={{ flex:1, padding:'14px', background:'#E5E7EB', border:'2px dashed #14171B', borderRadius:10, fontWeight:800 }}>NEUTRE (gris) +2 jetons</button>
            </div>
            <div style={{ marginTop:12, fontSize:11, opacity:0.6 }}>Vote associé à {carteActuelle.id} • jetons actuels {jetons} • ce vote débloquera les cartes ALL à la fin du DIAG</div>
          </div>
        </div>
      )}

      {phase==='all' && (
        <div style={{ maxWidth:1100, margin:'0 auto', padding:24 }}>
          <div style={{ background:'#14171B', color:'#FFF', borderRadius:16, padding:20, marginBottom:20 }}>
            <h2 style={{ fontFamily:'Georgia, serif', fontSize:28 }}>Phase ACTION — Cartes ALL</h2>
            <div style={{ marginTop:8, fontSize:13, opacity:0.8 }}>Vous avez obtenu {jetons} jetons (R:{scoreR} B:{scoreB} N:{scoreN} — neutre = 2 jetons). Selon les scores et les jetons, choisissez vos engagements.</div>
            <div style={{ marginTop:12, display:'flex', gap:8 }}>{Array.from({length:jetons}).map((_,i)=><div key={i} style={{ width:24, height:24, borderRadius:12, background:'#FDE047', border:'1px solid #FFF' }} />)}</div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
            {cartesAll.map((c:any)=>(
              <div key={c.id} style={{ background:'#FFF', border: selectedAll.includes(c.id)? '3px solid #14171B':'1px solid #14171B', borderRadius:12, padding:16, opacity: selectedAll.includes(c.id)? 0.6:1 }}>
                <div style={{ fontSize:10, fontFamily:'monospace' }}>{c.id} • Niveau {c.niveau} • Délai {c.delai} • {c.couleur}</div>
                <div style={{ fontWeight:800, marginTop:6, fontSize:15 }}>{c.titre}</div>
                <div style={{ fontSize:13, marginTop:8 }}>{c.action}</div>
                <div style={{ fontSize:11, marginTop:8, opacity:0.6 }}>Indicateur: {c.indicateur}</div>
                <button disabled={selectedAll.includes(c.id)} onClick={()=> choisirALL(c.id)} style={{ marginTop:12, width:'100%', padding:'10px', background: selectedAll.includes(c.id)? '#E5E7EB':'#14171B', color: selectedAll.includes(c.id)? '#14171B':'#FFF', borderRadius:8, fontWeight:700, cursor: selectedAll.includes(c.id)? 'not-allowed':'pointer' }}>{selectedAll.includes(c.id)? 'Engagé ✓':'S’engager — coûte 1 jeton'}</button>
              </div>
            ))}
          </div>
          <div style={{ marginTop:20, textAlign:'center' }}><button onClick={()=> setPhase('fini')} style={{ padding:'12px 24px', background:'#FDE047', border:'2px solid #14171B', borderRadius:8, fontWeight:800 }}>Terminer → Voir rapport profond complet</button></div>
        </div>
      )}

      {phase==='fini' && (
        <div style={{ maxWidth:800, margin:'0 auto', padding:40, textAlign:'center' }}>
          <h1 style={{ fontFamily:'Georgia, serif', fontSize:32 }}>Partie terminée</h1>
          <div style={{ marginTop:12 }}>Jetons {jetons} • R:{scoreR} B:{scoreB} N:{scoreN} • {selectedAll.length} actions choisies</div>
          <div style={{ marginTop:20, display:'flex', gap:12, justifyContent:'center' }}>
            <a href={`/rapport-profond?sessionId=${sessionId}`} style={{ padding:'12px 20px', background:'#14171B', color:'#FFF', borderRadius:8, textDecoration:'none', fontWeight:700 }}>Voir rapport profond complet (entreprise, date, joueurs, cartes, révélations)</a>
            <a href={`/rapport/${sessionId}`} style={{ padding:'12px 20px', background:'#FDE047', border:'1px solid #14171B', borderRadius:8, textDecoration:'none', color:'#14171B', fontWeight:700 }}>Rapport court</a>
          </div>
        </div>
      )}
    </div>
  )
}
