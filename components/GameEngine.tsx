'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';

// --- CARTES ANGLE MORT - adapte si tu as une table cards ---
const CARTES = [
  { id: 'c1', titre: 'Cadrage', question: "Qu'est-ce qu'on évite de dire depuis 3 mois?", consigne: "Place ton pion là où tu ressens le non-dit." },
  { id: 'c2', titre: 'Révélation', question: "Où se cache notre plus grande peur collective?", consigne: "Déplace-toi vite, sans réfléchir." },
  { id: 'c3', titre: 'Tension', question: "Quelle vérité ferait mal mais ferait avancer?", consigne: "Parie sur qui n'osera pas." },
  { id: 'c4', titre: 'Angle Mort', question: "Quel quadrant personne n'a exploré?", consigne: "Ose l'angle mort." },
];

const QUADRANTS = [
  { id: 'Q1', label: 'On sait qu\'on sait', color: '#FDE047', desc: 'Certitudes partagées' },
  { id: 'Q2', label: 'On sait qu\'on ne sait pas', color: '#FB923C', desc: 'Manques assumés' },
  { id: 'Q3', label: 'On ne sait pas qu\'on sait', color: '#A3E635', desc: 'Talents cachés' },
  { id: 'Q4', label: 'On ne sait pas qu\'on ne sait pas', color: '#F87171', desc: 'ANGLE MORT' },
];

type Props = {
  sessionId: string;
  isFacilitator?: boolean;
  playerId?: string; // pour vue joueur
  playerNick?: string;
};

export default function GameEngine({ sessionId, isFacilitator = false, playerId, playerNick }: Props) {
  const [players, setPlayers] = useState<any[]>([]);
  const [depots, setDepots] = useState<any[]>([]);
  const [paris, setParis] = useState<any[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [cardShownAt, setCardShownAt] = useState<number>(Date.now());
  const [lastMover, setLastMover] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [myQuadrant, setMyQuadrant] = useState<string | null>(null);

  const currentCard = CARTES[currentCardIndex];

  // --- CHARGEMENT INITIAL ---
  useEffect(() => {
    (async () => {
      const { data: sess } = await supabase.from('sessions').select('*').eq('id', sessionId).single();
      if (sess) setCurrentCardIndex(CARTES.findIndex(c => c.id === sess.current_card) || 0);

      const { data: pls } = await supabase.from('session_players').select('*').eq('session_id', sessionId);
      if (pls) setPlayers(pls);

      const { data: dps } = await supabase.from('session_depots').select('*').eq('session_id', sessionId);
      if (dps) setDepots(dps);

      const { data: prs } = await supabase.from('session_paris').select('*').eq('session_id', sessionId);
      if (prs) setParis(prs);

      setLoading(false);
    })();
  }, [sessionId]);

  // --- TEMPS D'AFFICHAGE CARTE POUR LATENCE ---
  useEffect(() => {
    setCardShownAt(Date.now());
  }, [currentCardIndex]);

  // --- REALTIME - ne casse rien, lecture seule ---
  useEffect(() => {
    const channel = supabase
     .channel(`session-${sessionId}`)
     .on('postgres_changes', { event: '*', schema: 'public', table: 'session_players', filter: `session_id=eq.${sessionId}` }, payload => {
        if (payload.eventType === 'INSERT') setPlayers(p => [...p, payload.new]);
        if (payload.eventType === 'DELETE') setPlayers(p => p.filter(x => x.id!== payload.old.id));
      })
     .on('postgres_changes', { event: '*', schema: 'public', table: 'session_depots', filter: `session_id=eq.${sessionId}` }, payload => {
        if (payload.eventType === 'INSERT') {
          setDepots(d => [...d.filter(x =>!(x.player_id === payload.new.player_id && x.question_id === payload.new.question_id)), payload.new]);
          setLastMover(payload.new.player_id);
        }
        if (payload.eventType === 'DELETE') setDepots(d => d.filter(x => x.session_id!== sessionId)); // reset carte
      })
     .on('postgres_changes', { event: '*', schema: 'public', table: 'session_paris', filter: `session_id=eq.${sessionId}` }, payload => {
        if (payload.eventType === 'INSERT') setParis(p => [...p, payload.new]);
      })
     .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [sessionId]);

  // --- DEPOT PION JOUEUR - avec LOG ANALYTICS ---
  const handleDepot = async (quadrantId: string) => {
    if (!playerId || isFacilitator) return;

    const prev = depots.find(d => d.player_id === playerId && d.question_id === currentCard.id);
    const prevQuadrant = prev?.quadrant || null;
    const latency = Date.now() - cardShownAt;
    const isFirst = depots.filter(d => d.question_id === currentCard.id).length === 0;

    // 1. Upsert dépôt (jeu normal)
    const { error } = await supabase.from('session_depots').upsert({
      session_id: sessionId,
      player_id: playerId,
      question_id: currentCard.id,
      quadrant: quadrantId,
      nick: playerNick,
    }, { onConflict: 'session_id,player_id,question_id' });

    if (error) { console.error(error); return; }

    setMyQuadrant(quadrantId);

    // 2. LOG ANALYTICS - NE CASSE JAMAIS LE JEU (try/catch silencieux)
    try {
      await supabase.from('session_events').insert({
        session_id: sessionId,
        player_id: playerId,
        nick: playerNick,
        type: prevQuadrant? 'change_quadrant' : 'move',
        from_quadrant: prevQuadrant,
        to_quadrant: quadrantId,
        question_id: currentCard.id,
        latency_ms: latency,
        metadata: {
          is_first: isFirst,
          followed_nick: lastMover? players.find(p => p.id === lastMover)?.nick : null,
          followed_someone:!!lastMover && lastMover!== playerId,
          prev_quadrant: prevQuadrant,
          total_moves_this_card: depots.filter(d => d.question_id === currentCard.id).length + 1,
        }
      });
    } catch (e) { /* analytics ne doit jamais bloquer le jeu */ }
  };

  // --- CARTE SUIVANTE - FACILITATEUR UNIQUEMENT ---
  const handleNextCard = async () => {
    if (!isFacilitator) return;
    const nextIndex = (currentCardIndex + 1) % CARTES.length;
    const nextCard = CARTES[nextIndex];

    // 1. Update session
    await supabase.from('sessions').update({
      current_card: nextCard.id,
      phase: nextCard.titre.toLowerCase(),
    }).eq('id', sessionId);

    // 2. Reset dépôts et paris pour la nouvelle carte (comme ton code ligne 342)
    await supabase.from('session_depots').delete().eq('session_id', sessionId);
    await supabase.from('session_paris').delete().eq('session_id', sessionId);

    setCurrentCardIndex(nextIndex);
    setDepots([]);
    setParis([]);
    setLastMover(null);

    // 3. Log changement de carte
    try {
      await supabase.from('session_events').insert({
        session_id: sessionId,
        type: 'new_card',
        to_quadrant: nextCard.id,
        question_id: nextCard.id,
        metadata: { card_title: nextCard.titre }
      });
    } catch {}
  };

  const getPlayersInQuadrant = (qId: string) => depots.filter(d => d.quadrant === qId && d.question_id === currentCard.id);

  if (loading) return <div style={{ padding: 40 }}>Chargement plateau...</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#FFFEF9', color: '#14171B' }}>
      {/* HEADER CARTE */}
      <div style={{ background: '#14171B', color: '#FFFEF9', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: '0.15em', opacity: 0.6, fontWeight: 700 }}>{currentCard.titre.toUpperCase()} - {currentCardIndex + 1}/{CARTES.length}</div>
          <div style={{ fontSize: 20, fontFamily: 'Georgia', fontWeight: 700, marginTop: 4 }}>{currentCard.question}</div>
          <div style={{ fontSize: 13, opacity: 0.7, marginTop: 4 }}>{currentCard.consigne}</div>
        </div>
        {isFacilitator && (
          <button onClick={handleNextCard} style={{ background: '#FDE047', color: '#14171B', border: 'none', padding: '12px 20px', borderRadius: 6, fontWeight: 800, cursor: 'pointer' }}>
            Carte suivante →
          </button>
        )}
      </div>

      {/* PLATEAU 4 QUADRANTS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, background: '#14171B', padding: 2, maxWidth: 900, margin: '20px auto' }}>
        {QUADRANTS.map(q => {
          const playersHere = getPlayersInQuadrant(q.id);
          const isMyQuadrant = myQuadrant === q.id;
          return (
            <div
              key={q.id}
              onClick={() =>!isFacilitator && handleDepot(q.id)}
              style={{
                background: q.color,
                minHeight: 260,
                padding: 16,
                cursor: isFacilitator? 'default' : 'pointer',
                border: isMyQuadrant? '4px solid #14171B' : '4px solid transparent',
                position: 'relative',
              }}
            >
              <div style={{ fontWeight: 800, fontSize: 13, letterSpacing: '0.05em' }}>{q.label}</div>
              <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 12 }}>{q.desc}</div>

              {/* PIONS */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {playersHere.map((d: any) => (
                  <div key={d.player_id} style={{ background: '#14171B', color: '#FFF', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                    {d.nick}
                  </div>
                ))}
                {playersHere.length === 0 && <div style={{ fontSize: 12, opacity: 0.5, fontStyle: 'italic' }}>Aucun pion</div>}
              </div>

              {q.id === 'Q4' && playersHere.length === 0 && (
                <div style={{ position: 'absolute', bottom: 12, right: 12, fontSize: 10, fontWeight: 800, background: '#14171B', color: '#F87171', padding: '4px 8px', borderRadius: 4 }}>
                  ANGLE MORT COLLECTIF
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* LISTE JOUEURS + DYNAMIQUES TEMPS REEL */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 20px 40px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={{ background: '#FBF8EF', border: '2px solid #14171B', borderRadius: 12, padding: 16 }}>
          <div style={{ fontWeight: 800, fontSize: 12, letterSpacing: '0.1em', marginBottom: 12 }}>JOUEURS CONNECTÉS ({players.length})</div>
          {players.map(p => {
            const lastDepot = depots.filter(d => d.player_id === p.id).slice(-1)[0];
            return (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #E5E2D9', fontSize: 13 }}>
                <span style={{ fontWeight: 700 }}>{p.nick} {p.id === playerId && '(toi)'}</span>
                <span style={{ opacity: 0.6 }}>{lastDepot? lastDepot.quadrant : '—'}</span>
              </div>
            );
          })}
        </div>

        <div style={{ background: '#FFF', border: '2px solid #14171B', borderRadius: 12, padding: 16 }}>
          <div style={{ fontWeight: 800, fontSize: 12, letterSpacing: '0.1em', marginBottom: 12 }}>DYNAMIQUES EN ARRIÈRE-PLAN</div>
          <div style={{ fontSize: 12, lineHeight: 1.5 }}>
            <div>⏱️ Latence moyenne: {depots.length? 'calcul en cours' : '—'}</div>
            <div>🔄 Hésitations détectées: {depots.length? 'voir rapport' : '—'}</div>
            <div>👁️ Quadrant non exploré: {QUADRANTS.filter(q =>!depots.some(d => d.quadrant === q.id && d.question_id === currentCard.id)).map(q => q.id).join(', ') || 'aucun'}</div>
            <div style={{ marginTop: 10 }}>
              <a href={`/rapport/${sessionId}`} style={{ background: '#14171B', color: '#FFF', padding: '8px 12px', borderRadius: 6, textDecoration: 'none', fontSize: 12, fontWeight: 700 }}>
                Voir rapport profond →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}