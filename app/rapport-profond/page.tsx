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
  return {reste:r,bouge:b,neutre:n,total:r+b+n, pr:Math.round(r/tot*100), pb:Math.round(b/tot*100), pn:Math.round(n/tot*100), majorite };
}

function RapportContent(){
  const params = useSearchParams();
  const sessionId = params.get('sessionId') || params.get('id') || '';
  const [inputId, setInputId] = useState(sessionId);
  const [sess, setSess] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [pions, setPions] = useState<any[]>([]);
  const [depots, setDepots] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [resultats, setResultats] = useState<any[]>([]);
  const [cardsDiag, setCardsDiag] = useState<Record<string, any>>({});
  const [cardsAll, setCardsAll] = useState<Record<string, any>>({});
  const [facilitator, setFacilitator] = useState<any>(null);

  const load = async (sid:string)=>{
    if(!sid) return;
    const { data: s } = await supabase.from('sessions').select('*').eq('id', sid).single();
    const { data: ev } = await supabase.from('session_events').select('*').eq('session_id', sid).order('created_at',{ascending:true});
    const { data: pi } = await supabase.from('session_pions').select('*').eq('session_id', sid);
    const { data: de } = await supabase.from('session_depots').select('*').eq('session_id', sid);
    const { data: pl } = await supabase.from('session_players').select('*').eq('session_id', sid);
    const { data: res } = await supabase.from('session_resultats').select('*').eq('session_id', sid).order('card_index',{ascending:true});
    const { data: cd } = await supabase.from('cards_diag').select('*');
    const { data: ca } = await supabase.from('cards_all').select('*');
    setSess(s); setEvents(ev||[]); setPions(pi||[]); setDepots(de||[]); setPlayers(pl||[]); setResultats(res||[]);
    if(cd){ const m:Record<string,any>={}; cd.forEach((c:any)=> m[c.id]=c); setCardsDiag(m); }
    if(ca){ const m:Record<string,any>={}; ca.forEach((c:any)=> m[c.id]=c); setCardsAll(m); }
    if(s?.facilitator_id){ const {data:f}=await supabase.from('facilitators').select('*').eq('id', s.facilitator_id).single(); setFacilitator(f); }
  };

  useEffect(()=>{ if(sessionId) load(sessionId); },[sessionId]);

  const byCard = useMemo(()=>{
    const paris = events.filter(e=>e.type==='pari');
    const map = new Map<string, any[]>();
    for(const e of paris){
      const cid = e.question_id || e.metadata?.question_id || e.metadata?.cardId || 'unknown';
      if(!map.has(cid)) map.set(cid, []);
      map.get(cid)!.push(e);
    }
    return Array.from(map.entries()).map(([cardId, votes])=>{
      const stats = compter3(votes);
      const res = resultats.find((r:any)=> r.card_id===cardId);
      const card = cardsDiag[cardId] || {};
      return { cardId, card, res, votes,...stats };
    });
  },[events, resultats, cardsDiag]);

  const global = useMemo(()=> compter3(events.filter(e=>e.type==='pari')), [events]);

  if(!sessionId){
    return (
      <div style={{ minHeight:'100vh', background:'#FFFEF9', padding:40 }}>
        <h1 style={{ fontFamily:'Georgia, serif', fontSize:28 }}>Rapport Profond — Angle Mort</h1>
        <div style={{ marginTop:20, display:'flex', gap:10 }}>
          <input value={inputId} onChange={e=>setInputId(e.target.value)} placeholder="UUID session" style={{ padding:10, border:'1px solid #14171B', borderRadius:6, width:400 }} />
          <button onClick={()=>{ if(inputId) window.location.href=`/rapport-profond?sessionId=${inputId}`; }} style={{ padding:'10px 20px', background:'#14171B', color:'#FFF', borderRadius:6 }}>Charger</button>
        </div>
      </div>
    )
  }

  if(!sess) return <div style={{padding:40}}>Chargement session {sessionId}...</div>;

  return (
    <div style={{ minHeight:'100vh', background:'#FFFEF9', color:'#14171B', padding:24 }}>
      <div style={{ maxWidth:1280, margin:'0 auto' }}>
        {/* EN-TÊTE ENTREPRISE */}
        <div style={{ background:'#14171B', color:'#FFF', borderRadius:16, padding:24, marginBottom:20 }}>
          <div style={{ display:'flex', justifyContent:'space-between' }}>
            <div>
              <div style={{ fontSize:11, letterSpacing:'0.2em', opacity:0.6 }}>ANGLE MORT — RAPPORT PROFOND</div>
              <h1 style={{ fontFamily:'Georgia, serif', fontSize:36, margin:'8px 0' }}>{sess.company || 'Entreprise non renseignée'}</h1>
              <div style={{ fontSize:14, opacity:0.8 }}>{sess.code} • {new Date(sess.started_at||sess.created_at).toLocaleString('fr-CA', { dateStyle:'full', timeStyle:'short' })} • {players.length||pions.length} joueurs</div>
              <div style={{ fontSize:12, opacity:0.6, marginTop:4 }}>ID {sess.id} • Facilitateur {facilitator?.name||facilitator?.code||sess.facilitator_id?.slice(0,8)||'—'} • Phase {sess.phase} • Status {sess.status}</div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:11, opacity:0.6 }}>VOTES</div>
              <div style={{ fontSize:32, fontWeight:800 }}>{global.total}</div>
              <div style={{ fontSize:11 }}>Hésitation {global.total? Math.round(global.neutre/global.total*100):0}% • Neutre {global.neutre}</div>
            </div>
          </div>
        </div>

        {/* CHIFFRES CLÉS */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12, marginBottom:20 }}>
          <div style={{ background:'#FFF', border:'1px solid #14171B', borderRadius:12, padding:16 }}><div style={{fontSize:10, opacity:0.6}}>ENTREPRISE</div><div style={{fontWeight:800}}>{sess.company||'—'}</div><div style={{fontSize:11, opacity:0.6}}>{sess.code}</div></div>
          <div style={{ background:'#FFF', border:'1px solid #14171B', borderRadius:12, padding:16 }}><div style={{fontSize:10, opacity:0.6}}>JOUEURS</div><div style={{fontSize:24, fontWeight:800}}>{players.length||pions.length||0}</div><div style={{fontSize:11}}>{depots.length} dépôts</div></div>
          <div style={{ background:'#FDE047', border:'1px solid #14171B', borderRadius:12, padding:16 }}><div style={{fontSize:10}}>CARTES DIAG</div><div style={{fontSize:24, fontWeight:800}}>{byCard.length}</div><div style={{fontSize:11}}>{byCard.map((c:any)=>c.card?.famille||c.cardId.slice(0,3)).join(', ')}</div></div>
          <div style={{ background:'#14171B', color:'#FFF', borderRadius:12, padding:16 }}><div style={{fontSize:10, opacity:0.6}}>TOTAL PARIS</div><div style={{fontSize:24, fontWeight:800}}>{global.total}</div><div style={{fontSize:11}}>R:{global.reste} B:{global.bouge} N:{global.neutre}</div></div>
          <div style={{ background: global.neutre>0? '#E5E7EB':'#FFF3CD', border:'1px solid #14171B', borderRadius:12, padding:16 }}><div style={{fontSize:10}}>HÉSITATION</div><div style={{fontSize:24, fontWeight:800}}>{global.neutre} ({global.total? Math.round(global.neutre/global.total*100):0}%)</div><div style={{fontSize:11}}>{global.neutre===0? 'Aucun vote neutre — engagement tranché':'Forte abstention — sujet sensible'}</div></div>
        </div>

        {/* GLOBAL 3 COULEURS TOUJOURS VISIBLE */}
        <div style={{ background:'#FFF', border:'2px solid #14171B', borderRadius:12, padding:16, marginBottom:20 }}>
          <div style={{ fontWeight:800, marginBottom:10 }}>RÉPARTITION GLOBALE — Chaque carte associée à chaque vote (question_id = carte.id)</div>
          <div style={{ display:'flex', height:36, borderRadius:10, overflow:'hidden', border:'2px solid #14171B' }}>
            <div style={{ width:`${global.pr}%`, minWidth: global.reste>0? '80px':'2px', background:'#FDE047', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:13 }}>RESTE {global.pr}% ({global.reste})</div>
            <div style={{ width:`${global.pb}%`, minWidth: global.bouge>0? '80px':'2px', background:'#EF4444', color:'#FFF', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:13 }}>BOUGE {global.pb}% ({global.bouge})</div>
            <div style={{ width:`${global.pn}%`, minWidth:'120px', background: global.neutre===0? '#F3F4F6':'#E5E7EB', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:13, borderLeft: global.neutre===0? '2px dashed #999':'' }}>{global.neutre===0? `NEUTRE 0% (0) — personne n’a voté neutre`: `NEUTRE ${global.pn}% (${global.neutre})`}</div>
          </div>
          <div style={{ marginTop:8, fontSize:12 }}>Majorité globale : <b>{global.majorite}</b> {global.neutre===0? '— 0% neutre car aucun joueur n’a cliqué NEUTRE (ou session jouée avant ajout bouton neutre)':''}</div>
        </div>

        {/* PAR CARTE — CONTENU COMPLET + DYNAMIQUE + RÉVÉLATION */}
        <div style={{ display:'grid', gap:18 }}>
          {byCard.map((c:any, idx:number)=>{
            const card = c.card||{};
            const res = c.res;
            return (
              <div key={c.cardId} style={{ background:'#FFF', border:'1px solid #14171B', borderRadius:16, padding:20 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div>
                    <div style={{ fontSize:10, fontFamily:'monospace', opacity:0.6 }}>CARTE {idx+1} / {byCard.length} • {c.cardId} • {card.famille||'—'} • {card.couleur||''} • Ordre {card.ordre||''}</div>
                    <h2 style={{ fontFamily:'Georgia, serif', fontSize:22, margin:'4px 0' }}>{card.titre||c.cardId}</h2>
                    <div style={{ fontSize:12, opacity:0.7 }}>{card.compteur_label||card.compteur||''} {card.mot_piege? `• Mot piège: ${card.mot_piege}`:''}</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:11, padding:'4px 12px', borderRadius:20, background:'#14171B', color:'#FFF', fontWeight:700 }}>{c.majorite} • {c.total} votes • R:{c.reste} B:{c.bouge} N:{c.neutre}</div>
                    {res && <div style={{ fontSize:10, marginTop:6, opacity:0.6 }}>Signal {res.position_signal} → Finale {res.position_finale} • {res.condition} • Pari gagnant {res.pari_gagnant}</div>}
                  </div>
                </div>

                {/* CONTENU RECTO VERSO */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginTop:16 }}>
                  <div style={{ background:'#FFFEF9', border:'1px solid #eee', borderRadius:10, padding:12 }}><div style={{fontSize:10, fontWeight:800, letterSpacing:'0.1em'}}>SIGNAL</div><div style={{marginTop:6}}>{card.signal||'—'}</div></div>
                  <div style={{ background:'#F9FAFB', border:'1px solid #eee', borderRadius:10, padding:12 }}><div style={{fontSize:10, fontWeight:800, letterSpacing:'0.1em'}}>SITUATION</div><div style={{marginTop:6, fontSize:13}}>{card.situation||'—'}</div></div>
                  <div style={{ gridColumn:'1 / span 2', background:'#FFF', border:'2px solid #14171B', borderRadius:10, padding:12 }}><div style={{fontSize:10, fontWeight:800}}>QUESTION — associée au vote (question_id = carte.id)</div><div style={{marginTop:6, fontWeight:700, fontSize:15}}>{card.question||'—'}</div>{card.extra_texte && <div style={{marginTop:8, fontSize:12, opacity:0.8}}>Extra {card.extra_type}: {card.extra_texte}</div>}</div>
                </div>

                {/* GRAPHIQUE 3 COULEURS PAR CARTE TOUJOURS */}
                <div style={{ marginTop:14 }}>
                  <div style={{ display:'flex', height:28, borderRadius:8, overflow:'hidden', border:'1px solid #14171B' }}>
                    <div style={{ width:`${c.pr}%`, minWidth: c.reste>0? '40px':'2px', background:'#FDE047', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800 }}>{c.reste>0? `R ${c.pr}% (${c.reste})`:''}</div>
                    <div style={{ width:`${c.pb}%`, minWidth: c.bouge>0? '40px':'2px', background:'#EF4444', color:'#FFF', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800 }}>{c.bouge>0? `B ${c.pb}% (${c.bouge})`:''}</div>
                    <div style={{ width:`${c.pn}%`, minWidth:'90px', background: c.neutre===0? '#F3F4F6':'#E5E7EB', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, borderLeft: c.neutre===0? '1px dashed #aaa':'1px solid #14171B' }}>{c.neutre===0? `N 0% (0) — aucun neutre`: `N ${c.pn}% (${c.neutre})`}</div>
                  </div>
                </div>

                {/* DYNAMIQUE DE DÉPLACEMENT + RÉVÉLATION */}
                {res && (
                  <div style={{ marginTop:14, display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                    <div style={{ background:'#F9F9F7', borderRadius:8, padding:12 }}>
                      <div style={{ fontSize:11, fontWeight:800 }}>DYNAMIQUE DE DÉPLACEMENT</div>
                      <div style={{ fontSize:12, marginTop:6 }}>Position signal (majorité initiale pions) : <b>{res.position_signal}</b></div>
                      <div style={{ fontSize:12 }}>Position finale : <b>{res.position_finale}</b> {res.position_signal!==res.position_finale? '→ Mouvement collectif':''}</div>
                      <div style={{ fontSize:12 }}>Condition : {res.condition} • Pari gagnant : {res.pari_gagnant}</div>
                      <div style={{ fontSize:11, opacity:0.6, marginTop:4 }}>Gagnants {res.gagnants?.length||0} • Perdants {res.perdants?.length||0}</div>
                    </div>
                    <div style={{ background: c.neutre>0? '#FFF3CD':'#FDE047', border:'1px solid #14171B', borderRadius:8, padding:12 }}>
                      <div style={{ fontSize:11, fontWeight:800 }}>RÉVÉLATION — LIEN CONTENU / MOUVEMENT</div>
                      <div style={{ fontSize:12, marginTop:6 }}>
                        {c.majorite==='neutre (abstention)'? `Sujet ${card.famille||c.cardId} sensible : ${c.neutre} joueurs n’ont pas voulu trancher. Question "${card.question||''}" touche un angle mort.`
                        : c.majorite==='reste'? `Majorité RESTE (${c.reste}) : le collectif veut maintenir ${card.titre||''}. Signal ${card.signal||''} = résistance au changement.`
                        : c.majorite==='bouge'? `Majorité BOUGE (${c.bouge}) : volonté de transformation sur ${card.titre||''}.`
                        : `Égalité — polarisation sur ${card.famille||''}.`}
                        {res.position_signal!==res.position_finale? ` Déplacement ${res.position_signal}→${res.position_finale} confirme que le vote ${c.majorite} a fait bouger les pions.`: ' Pas de déplacement majeur — cohérence signal/final.'}
                      </div>
                    </div>
                  </div>
                )}

                {/* VOTES DÉTAIL */}
                <div style={{ marginTop:12, fontSize:10, opacity:0.6, maxHeight:80, overflowY:'auto' }}>
                  {c.votes.slice(-10).map((v:any,i:number)=><span key={i} style={{ marginRight:8, padding:'2px 6px', borderRadius:10, background: v.to_quadrant==='reste'? '#FDE047': v.to_quadrant==='bouge'? '#EF4444':'#E5E7EB', color: v.to_quadrant==='bouge'? '#FFF':'#14171B' }}>{v.player_nick||v.player_id?.slice(0,6)}:{v.to_quadrant}</span>)}
                </div>
              </div>
            )
          })}
        </div>

        <div style={{ marginTop:24, fontSize:11, opacity:0.5, borderTop:'1px solid #eee', paddingTop:12 }}>
          Chaque vote est associé à sa carte via session_events.question_id = {byCard[0]?.cardId||'carte.id'} • Source: session_events type=pari + session_pions + session_resultats + cards_diag • Si N=0 c'est que personne n'a cliqué NEUTRE sur cette carte (session avant ajout bouton ou engagement tranché)
        </div>
      </div>
    </div>
  )
}

export default function Page(){
  return <Suspense fallback={<div style={{padding:40}}>Chargement rapport profond...</div>}><RapportContent/></Suspense>
}
