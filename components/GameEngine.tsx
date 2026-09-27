'use client';

// ============================================================
// ANGLE MORT v3.4.2 — GameEngine PROD
// Fix: facilitateur bloqué carte 2 (saveSession manquant)
// Opti: useCallback, grace period, no-revert facilitateur
// ============================================================

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { PunctumBoard } from './PunctumBoard';
import { CardVisual } from './CardVisual';
import { ArgumentTimerFacilitator, ArgumentTimerPlayer } from './ArgumentTimer';
import { AudioPermission } from './AudioPermission';

import { CARTES_DIAG } from '../lib/cards';
import {
  construireResultat,
  LIBELLE_CONDITION,
  DESCRIPTION_CONDITION,
} from '../lib/resolution';
import type {
  Pion,
  Vote,
  Quadrant,
  PhaseProtocole,
  Joueur,
  ResultatCarte,
} from '../lib/types';
import { useSessionSync } from '../lib/useSessionSync';
import { loadSession, saveSession, savePion, savePlayer, savePari } from '../lib/session-api';

type Role = 'facilitator' | 'player';

const PHASES_ORDER: PhaseProtocole[] = [
  'cadrage',
  'signal',
  'situation',
  'argumentation',
  'vote',
  'decompte',
  'fermeture_all',
];

const PHASE_LABEL: Record<PhaseProtocole, string> = {
  cadrage: 'Cadrage',
  signal: 'Signal',
  situation: 'Situation',
  argumentation: 'Argumentation',
  vote: 'Vote',
  decompte: 'Décompte',
  fermeture_all: 'Fermeture ALL',
};

export function GameEngine({
  sessionId,
  role,
  playerId,
  playerNick,
  joueurs = [],
}: {
  sessionId: string;
  role: Role;
  playerId?: string;
  playerNick?: string;
  joueurs?: Joueur[];
}) {
  const [phase, setPhase] = useState<PhaseProtocole>('cadrage');
  const [cardIdx, setCardIdx] = useState(0);
  const [pions, setPions] = useState<Pion[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [resultat, setResultat] = useState<ResultatCarte | null>(null);
  const [dureeArgSec, setDureeArgSec] = useState(300);
  const [argumentationTerminee, setArgumentationTerminee] = useState(false);

  const cardShownAtRef = useRef<number>(Date.now());
  const lastMoverRef = useRef<string | null>(null);
  const localUpdateRef = useRef({ until: 0 });
  if (typeof window!== 'undefined') (window as any).__AM_GRACE__ = localUpdateRef.current;

  const marquerChangementLocal = useCallback(() => {
    localUpdateRef.current.until = Date.now() + 5000;
  }, []);

  const logEvent = useCallback(async (evt: any) => {
    try {
      const { getSupabaseBrowser } = await import('../lib/supabase');
      const supabase = getSupabaseBrowser();
      await supabase.from('session_events').insert({
        session_id: sessionId,
        player_id: playerId || null,
        nick: playerNick || (role === 'facilitator'? 'FACILITATEUR' : null),
        latency_ms: evt.latency_ms?? Date.now() - cardShownAtRef.current,
       ...evt,
      });
    } catch {}
  }, [sessionId, playerId, playerNick, role]);

  // Load initial
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await loadSession(sessionId);
      if (cancelled ||!data || data.empty) return;
      if (data.phase) setPhase(data.phase);
      if (typeof data.cardIdx === 'number' && data.cardIdx >= 0) setCardIdx(data.cardIdx);
      if (data.depots?.length > 0) {
        const p: Pion[] = data.depots.map((d: any) => ({
          playerId: d.player_id,
          nick: data.players?.find((p: any) => p.id === d.player_id)?.nick || 'Anonyme',
          quadrantInitial: d.quadrant,
          quadrantActuel: d.quadrant,
          couleur: d.canal === 'situation'? 'rouge' : d.slot === 1? 'rouge' : 'jaune',
        }));
        setPions(p);
      }
      if (data.paris?.length > 0) {
        const v: Vote[] = data.paris.map((p: any) => ({
          playerId: p.player_id,
          nick: data.players?.find((pp: any) => pp.id === p.player_id)?.nick || 'Anonyme',
          choix: p.pari,
          timestamp: new Date(p.created_at).getTime(),
        }));
        setVotes(v);
      }
    })();
    return () => { cancelled = true; };
  }, [sessionId]);

  useEffect(() => {
    if (role === 'player' && playerId && playerNick) {
      savePlayer(sessionId, playerId, playerNick);
    }
  }, [role, playerId, playerNick, sessionId]);

  const sync = useSessionSync(sessionId, playerId, playerNick);

  const changePhase = useCallback((newPhase: PhaseProtocole) => {
    marquerChangementLocal();
    setPhase(newPhase);
    if (newPhase!== 'argumentation') setArgumentationTerminee(false);
    if (role === 'facilitator') {
      try { sync.sendPhase(newPhase); } catch {}
      try { saveSession(sessionId, { phase: newPhase, cardIdx }); } catch {}
      logEvent({ type: 'phase_change', from_quadrant: phase, to_quadrant: newPhase, question_id: CARTES_DIAG[cardIdx]?.id });
    }
  }, [role, sessionId, cardIdx, phase, sync, logEvent, marquerChangementLocal]);

  const changeCardIdx = useCallback((newIdx: number) => {
    marquerChangementLocal();
    setCardIdx(newIdx);
    cardShownAtRef.current = Date.now();
    lastMoverRef.current = null;
    if (role === 'facilitator') {
      try { sync.sendCarte(newIdx); } catch {}
      try { saveSession(sessionId, { cardIdx: newIdx }); } catch {} // FIX BUG CARTE 2
    }
    logEvent({ type: 'card_shown', question_id: CARTES_DIAG[newIdx]?.id, metadata: { famille: CARTES_DIAG[newIdx]?.famille } });
  }, [role, sessionId, sync, logEvent, marquerChangementLocal]);

  // Joueur suit facilitateur
  useEffect(() => {
    if (role === 'player' && sync.remotePhase && sync.remotePhase!== phase) {
      setPhase(sync.remotePhase as PhaseProtocole);
    }
  }, [role, sync.remotePhase, phase]);

  useEffect(() => {
    if (role === 'player' && sync.remoteCardIdx!== null && sync.remoteCardIdx!== cardIdx) {
      setCardIdx(sync.remoteCardIdx);
      cardShownAtRef.current = Date.now();
    }
  }, [role, sync.remoteCardIdx, cardIdx]);

  // Facilitateur reçoit pions/votes
  useEffect(() => {
    if (role!== 'facilitator') return;
    const remote = Object.values(sync.remotePlayers);
    if (remote.length === 0) return;
    setPions((prev) => {
      const map = new Map(prev.map((p) => [p.playerId, p]));
      for (const rp of remote as any) if (rp.pion) map.set(rp.pion.playerId, rp.pion);
      return Array.from(map.values());
    });
    setVotes((prev) => {
      const map = new Map(prev.map((v) => [v.playerId, v]));
      for (const rp of remote as any) if (rp.vote) map.set(rp.vote.playerId, rp.vote);
      return Array.from(map.values());
    });
  }, [role, sync.remotePlayers]);

  useEffect(() => {
    if (role === 'player' && sync.remoteResultat) setResultat(sync.remoteResultat);
  }, [role, sync.remoteResultat]);

  // Poll backup - respect grace period, facilitateur ne se fait pas écraser
  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      if (cancelled) return;
      if (Date.now() <= localUpdateRef.current.until) return;
      try {
        const data = await loadSession(sessionId);
        if (cancelled ||!data || data.empty) return;
        // Facilitateur est maître : on ne le fait pas revenir en arrière sur cardIdx/phase via poll
        if (role!== 'facilitator') {
          if (data.phase && data.phase!== phase) setPhase(data.phase);
          if (typeof data.cardIdx === 'number' && data.cardIdx >= 0 && data.cardIdx!== cardIdx) setCardIdx(data.cardIdx);
        }
        if (data.depots) {
          const p: Pion[] = data.depots.map((d: any) => ({
            playerId: d.player_id,
            nick: data.players?.find((p: any) => p.id === d.player_id)?.nick || 'Anonyme',
            quadrantInitial: d.quadrant,
            quadrantActuel: d.quadrant,
            couleur: d.canal === 'situation'? 'rouge' : d.slot === 1? 'rouge' : 'jaune',
          }));
          setPions(p);
        }
        if (data.paris) {
          const v: Vote[] = data.paris.map((p: any) => ({
            playerId: p.player_id,
            nick: data.players?.find((pp: any) => pp.id === p.player_id)?.nick || 'Anonyme',
            choix: p.pari,
            timestamp: new Date(p.created_at).getTime(),
          }));
          setVotes(v);
        }
      } catch {}
    };
    const iv = setInterval(poll, 3000);
    return () => { cancelled = true; clearInterval(iv); };
  }, [sessionId, role, phase, cardIdx]);

  const carte = useMemo(() => CARTES_DIAG[cardIdx]?? CARTES_DIAG[0], [cardIdx]);

  const monPion = useMemo(() => {
    if (!playerId) return null;
    return pions.find((p) => p.playerId === playerId) || null;
  }, [pions, playerId]);

  const deplacerPion = useCallback((pid: string, nick: string, q: Quadrant) => {
    const existing = pions.find((p) => p.playerId === pid);
    const prevQ = existing?.quadrantActuel || null;
    const isFirst = pions.length === 0;
    const followedNick = lastMoverRef.current && lastMoverRef.current!== pid? pions.find(p => p.playerId === lastMoverRef.current)?.nick || null : null;

    let updated: Pion;
    if (existing) {
      const couleur = existing.quadrantInitial && existing.quadrantInitial!== q? 'rouge' : existing.couleur === 'neutre'? 'neutre' : existing.couleur;
      updated = {...existing, quadrantActuel: q, couleur };
      setPions((prev) => prev.map((p) => (p.playerId === pid? updated : p)));
    } else {
      updated = { playerId: pid, nick, quadrantInitial: q, quadrantActuel: q, couleur: 'neutre' };
      setPions((prev) => [...prev, updated]);
    }
    lastMoverRef.current = pid;

    if (pid === playerId) {
      try { sync.sendPion(updated); } catch {}
      savePion(sessionId, updated, carte.id).catch(() => {});
      logEvent({
        type: prevQ? 'change_quadrant' : 'move',
        from_quadrant: prevQ,
        to_quadrant: q,
        question_id: carte.id,
        latency_ms: Date.now() - cardShownAtRef.current,
        metadata: { is_first: isFirst, followed_nick: followedNick, followed_someone:!!followedNick, hesitation:!!prevQ && prevQ!== q },
      });
    }
  }, [pions, playerId, sessionId, carte, sync, logEvent]);

  const verrouillerPions = useCallback(() => {
    setPions((prev) => prev.map((p) => ({...p, couleur: p.couleur === 'neutre'? 'jaune' : p.couleur })));
    logEvent({ type: 'lock_pions', question_id: carte.id, metadata: { pions_count: pions.length } });
  }, [carte, pions.length, logEvent]);

  const voter = useCallback((pid: string, nick: string, choix: 'reste' | 'bouge') => {
    const newVote: Vote = { playerId: pid, nick, choix, timestamp: Date.now() };
    setVotes((prev) => [...prev.filter((v) => v.playerId!== pid), newVote]);
    if (pid === playerId) {
      try { sync.sendVote(newVote); } catch {}
      try { savePari(sessionId, pid, nick, carte.id, choix); } catch {}
      logEvent({ type: 'pari', to_quadrant: choix, question_id: carte.id, metadata: { choix, mon_quadrant: monPion?.quadrantActuel } });
    }
  }, [playerId, sessionId, carte, monPion, sync, logEvent]);

  const monVote = useMemo(() => (playerId? votes.find((v) => v.playerId === playerId) || null : null), [votes, playerId]);

  const lancerDecompte = useCallback(() => {
    const res = construireResultat(carte.id, pions, votes);
    setResultat(res);
    changePhase('decompte');
    try { sync.sendResultat(res); } catch {}
    logEvent({ type: 'decompte', question_id: carte.id, metadata: { resultat: res } });
  }, [carte, pions, votes, changePhase, sync, logEvent]);

  const carteSuivante = useCallback(async () => {
    const newIdx = (cardIdx + 1) % CARTES_DIAG.length;
    try {
      const { getSupabaseBrowser } = await import('../lib/supabase');
      const supabase = getSupabaseBrowser();
      await supabase.from('session_depots').delete().eq('session_id', sessionId);
      await supabase.from('session_paris').delete().eq('session_id', sessionId);
    } catch (e) { console.warn('[carteSuivante]', e); }

    logEvent({ type: 'card_next', question_id: carte.id, metadata: { from: carte.id, to: CARTES_DIAG[newIdx].id } });

    if (role === 'facilitator') {
      try { await saveSession(sessionId, { phase: 'signal', cardIdx: newIdx }); } catch {}
      try { sync.sendCarte(newIdx); } catch {}
      try { sync.sendPhase('signal'); } catch {}
    }

    marquerChangementLocal();
    setCardIdx(newIdx);
    cardShownAtRef.current = Date.now();
    lastMoverRef.current = null;
    setPions([]);
    setVotes([]);
    setResultat(null);
    setPhase('signal');
  }, [cardIdx, carte, role, sessionId, sync, logEvent, marquerChangementLocal]);

  if (role === 'player' && playerId && playerNick) {
    return <PlayerView phase={phase} carte={carte} pions={pions} monPion={monPion} playerNick={playerNick} joueurs={joueurs} onDeplacer={(q: Quadrant) => deplacerPion(playerId, playerNick, q)} onVoter={(choix: any) => voter(playerId, playerNick, choix)} monVote={monVote} resultat={resultat} dureeArgSec={dureeArgSec} playerId={playerId} />;
  }

  return (
    <FacilitatorView sessionId={sessionId} cardIdx={cardIdx} phase={phase} carte={carte} pions={pions} votes={votes} joueurs={joueurs} resultat={resultat} dureeArgSec={dureeArgSec} setDureeArgSec={setDureeArgSec} argumentationTerminee={argumentationTerminee} setArgumentationTerminee={setArgumentationTerminee} onDeplacer={deplacerPion} onVerrouillerPions={verrouillerPions} onLancerDecompte={lancerDecompte} onCarteSuivante={carteSuivante} onSetPhase={changePhase} onSetCardIdx={changeCardIdx} />
  );
}

function FacilitatorView({ sessionId, cardIdx, phase, carte, pions, votes, joueurs, resultat, dureeArgSec, setDureeArgSec, argumentationTerminee, setArgumentationTerminee, onVerrouillerPions, onLancerDecompte, onCarteSuivante, onSetPhase, onSetCardIdx }: any) {
  const indexPhase = PHASES_ORDER.indexOf(phase);
  return (
    <div style={{ minHeight: '100vh', background: '#F4EFE2', padding: 20 }}>
      <div style={{ maxWidth: 1400, margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', background: '#14171B', color: '#FBF8EF', borderRadius: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 16 }}>Angle Mort</span>
          <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11, letterSpacing: '0.1em', opacity: 0.7 }}>{sessionId} • {joueurs.length} joueurs • {carte.id} [{cardIdx+1}/{CARTES_DIAG.length}]</span>
          <a href={`/rapport/${sessionId}`} target="_blank" style={{ fontSize: 10, background: '#FDE047', color: '#14171B', padding: '4px 8px', borderRadius: 3, textDecoration: 'none', fontWeight: 700 }}>RAPPORT →</a>
          <a href={`/rapport-profond?code=${sessionId}`} target="_blank" style={{ fontSize: 10, background: '#FFF', color: '#14171B', padding: '4px 8px', borderRadius: 3, textDecoration: 'none', fontWeight: 700 }}>PROFOND →</a>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {PHASES_ORDER.slice(0, 6).map((p, i) => (
            <div key={p} style={{ padding: '4px 10px', borderRadius: 3, fontSize: 10, fontFamily: 'ui-monospace, monospace', letterSpacing: '0.1em', background: i === indexPhase? '#FDE047' : 'rgba(255,255,255,0.08)', color: i === indexPhase? '#14171B' : '#FBF8EF', fontWeight: i === indexPhase? 700 : 400 }}>
              {i + 1}. {PHASE_LABEL[p]}
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1400, margin: '0 auto', display: 'grid', gridTemplateColumns: '340px 1fr 320px', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <CardVisual card={carte} face={phase === 'signal' || phase === 'cadrage'? 'signal' : 'situation'} size="xs" />
          <ControlsFacilitator phase={phase} onSetPhase={onSetPhase} onVerrouiller={onVerrouillerPions} onLancerDecompte={onLancerDecompte} onCarteSuivante={onCarteSuivante} cardIdx={cardIdx} onSetCardIdx={onSetCardIdx} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {phase === 'argumentation' && (
            <button onClick={() => onSetPhase('vote')} style={{ padding: '10px 16px', fontSize: 13, fontWeight: 700, background: argumentationTerminee? '#14171B' : '#FDE047', color: argumentationTerminee? '#FBF8EF' : '#14171B', border: '1px solid #14171B', borderRadius: 4, cursor: 'pointer' }}>
              {argumentationTerminee? '✓ Argumentation terminée — Passer au vote' : '⏱ Argumentation en cours — Cliquer pour passer au vote'}
            </button>
          )}
          <div style={{ display: 'flex', gap: 8, padding: 12, background: '#FBF8EF', borderRadius: 6, border: '1px solid rgba(20,23,27,0.15)', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, opacity: 0.5, marginRight: 8 }}>PHASE :</span>
            {['signal', 'situation', 'argumentation', 'vote', 'decompte'].map((p) => (
              <button key={p} onClick={() => onSetPhase(p as any)} style={{ padding: '6px 12px', fontSize: 11, fontWeight: 600, border: phase === p? '2px solid #14171B' : '1px solid rgba(20,23,27,0.2)', background: phase === p? '#FDE047' : '#FFF', color: '#14171B', borderRadius: 4, cursor: 'pointer', textTransform: 'uppercase' }}>{p}</button>
            ))}
            <span style={{ marginLeft: 'auto', fontSize: 11, opacity: 0.5 }}>{joueurs.length} joueurs</span>
          </div>
          <PunctumBoard pions={pions} retineLabel={carte.id} retineSublabel={PHASE_LABEL[phase]} showCompteur={phase!== 'cadrage'} />
          {phase === 'argumentation' && <ArgumentTimerFacilitator dureeTotalSec={dureeArgSec} joueurs={joueurs} />}
          {phase === 'vote' && <VotePanel votes={votes} joueurs={joueurs} />}
          {phase === 'decompte' && resultat && <ResultatPanel resultat={resultat} />}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <AudioPermission label="Visio facilitateur" />
          <JoueursList joueurs={joueurs} pions={pions} votes={votes} />
          <DureeControl dureeArgSec={dureeArgSec} setDureeArgSec={setDureeArgSec} />
        </div>
      </div>
    </div>
  );
}

function PlayerView({ phase, carte, monPion, playerNick, onDeplacer, onVoter, monVote, resultat, dureeArgSec, playerId, joueurs }: any) {
  return (
    <div style={{ minHeight: '100vh', background: '#F4EFE2', padding: 12 }}>
      <div style={{ maxWidth: 520, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#14171B', color: '#FBF8EF', borderRadius: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>{playerNick}</span>
          <span style={{ fontSize: 10, fontFamily: 'ui-monospace, monospace', opacity: 0.7 }}>{PHASE_LABEL[phase]} • {carte.id}</span>
        </div>
        <CardVisual card={carte} face={phase === 'signal' || phase === 'cadrage'? 'signal' : 'situation'} size="xs" />
        <PunctumBoard pions={monPion? [monPion] : []} onQuadrantClick={['cadrage', 'signal', 'situation', 'argumentation'].includes(phase)? onDeplacer : undefined} selectedQuadrant={monPion?.quadrantActuel} retineLabel={carte.id} retineSublabel={PHASE_LABEL[phase]} />
        {phase === 'argumentation' && <ArgumentTimerPlayer dureeTotalSec={dureeArgSec} joueurs={joueurs} playerId={playerId} />}
        {phase === 'vote' && <VotePlayer monVote={monVote} onVoter={onVoter} />}
        {phase === 'decompte' && resultat && <ResultatPanel resultat={resultat} compact />}
        <AudioPermission label="Visio joueur" />
      </div>
    </div>
  );
}

function ControlsFacilitator({ phase, onSetPhase, onVerrouiller, onLancerDecompte, onCarteSuivante, cardIdx, onSetCardIdx }: any) {
  const btn: React.CSSProperties = { padding: '8px 12px', fontSize: 11, fontWeight: 700, border: '1px solid #14171B', borderRadius: 4, cursor: 'pointer', background: '#FFF', color: '#14171B', textTransform: 'uppercase', letterSpacing: '0.05em' };
  const btnPrimary: React.CSSProperties = {...btn, background: '#14171B', color: '#FBF8EF' };
  const btnYellow: React.CSSProperties = {...btn, background: '#FDE047', color: '#14171B' };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 12, background: '#FBF8EF', borderRadius: 6, border: '1px solid rgba(20,23,27,0.15)' }}>
      <div style={{ fontSize: 10, fontFamily: 'ui-monospace, monospace', letterSpacing: '0.1em', opacity: 0.5 }}>CONTROLES</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <button onClick={() => onSetCardIdx(Math.max(0, cardIdx - 1))} style={btn}>← Précédente</button>
        <button onClick={onCarteSuivante} style={btnYellow}>Suivante →</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <button onClick={onVerrouiller} style={btn}>Verrouiller pions</button>
        <button onClick={onLancerDecompte} style={btnPrimary}>Décompte</button>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
        {PHASES_ORDER.map((p) => (
          <button key={p} onClick={() => onSetPhase(p)} style={{ padding: '4px 8px', fontSize: 9, border: phase === p? '2px solid #14171B' : '1px solid #ddd', background: phase === p? '#14171B' : '#FFF', color: phase === p? '#FFF' : '#14171B', borderRadius: 3, cursor: 'pointer' }}>{p}</button>
        ))}
      </div>
    </div>
  );
}

function VotePanel({ votes, joueurs }: any) {
  return (
    <div style={{ padding: 12, background: '#FBF8EF', borderRadius: 6, border: '1px solid rgba(20,23,27,0.15)' }}>
      <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 8 }}>{votes.length}/{joueurs.length} votes</div>
      {votes.map((v: any) => <div key={v.playerId} style={{ fontSize: 12, padding: '4px 0', borderBottom: '1px solid #eee' }}>{v.nick}: <b>{v.choix}</b></div>)}
    </div>
  );
}
function VotePlayer({ monVote, onVoter }: any) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      <button onClick={() => onVoter('reste')} style={{ padding: 16, background: monVote?.choix === 'reste'? '#14171B' : '#FFF', color: monVote?.choix === 'reste'? '#FFF' : '#14171B', border: '2px solid #14171B', borderRadius: 6, fontWeight: 700 }}>RESTE</button>
      <button onClick={() => onVoter('bouge')} style={{ padding: 16, background: monVote?.choix === 'bouge'? '#FDE047' : '#FFF', color: '#14171B', border: '2px solid #14171B', borderRadius: 6, fontWeight: 700 }}>BOUGE</button>
    </div>
  );
}
function ResultatPanel({ resultat, compact }: any) {
  if (!resultat) return null;
  return (
    <div style={{ padding: compact? 12 : 16, background: '#FBF8EF', borderRadius: 6, border: '1px solid rgba(20,23,27,0.15)' }}>
      <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>{LIBELLE_CONDITION[resultat.condition] || resultat.condition}</div>
      <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 8 }}>{DESCRIPTION_CONDITION[resultat.condition]}</div>
      <div style={{ fontSize: 11 }}>Reste: {resultat.reste} — Bouge: {resultat.bouge}</div>
    </div>
  );
}
function JoueursList({ joueurs, pions, votes }: any) {
  return (
    <div style={{ padding: 12, background: '#FBF8EF', borderRadius: 6, border: '1px solid rgba(20,23,27,0.15)' }}>
      <div style={{ fontSize: 10, letterSpacing: '0.1em', opacity: 0.5, marginBottom: 8 }}>JOUEURS ({joueurs.length})</div>
      {joueurs.map((j: any) => {
        const p = pions.find((pp: any) => pp.playerId === j.id);
        const v = votes.find((vv: any) => vv.playerId === j.id);
        return <div key={j.id} style={{ fontSize: 11, padding: '6px 0', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f0f0f0' }}><span>{j.nick}</span><span style={{ opacity: 0.6 }}>{p?.quadrantActuel || '-'} {v? `• ${v.choix}` : ''}</span></div>;
      })}
    </div>
  );
}
function DureeControl({ dureeArgSec, setDureeArgSec }: any) {
  return (
    <div style={{ padding: 12, background: '#FBF8EF', borderRadius: 6, border: '1px solid rgba(20,23,27,0.15)', display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 10, opacity: 0.5 }}>DURÉE ARG</span>
      <input type="range" min={60} max={600} step={30} value={dureeArgSec} onChange={(e) => setDureeArgSec(parseInt(e.target.value))} style={{ flex: 1 }} />
      <span style={{ fontSize: 11, fontWeight: 700 }}>{Math.floor(dureeArgSec/60)}m</span>
    </div>
  );
}