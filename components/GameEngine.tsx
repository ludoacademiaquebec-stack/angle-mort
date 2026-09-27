'use client';

// ============================================================
// ANGLE MORT v3.4 — GameEngine
// Orchestre les 4 phases : Signal → Situation → Argumentation
// → Vote + Décompte.
// v3.3 : state local + Supabase Realtime
// v3.4 : + analytics arrière-plan session_events SANS RIEN CASSER
// ============================================================

import { useState, useMemo, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { PunctumBoard } from './PunctumBoard';
import { CardVisual } from './CardVisual';
import { ArgumentTimerFacilitator, ArgumentTimerPlayer } from './ArgumentTimer';
import { AudioPermission } from './AudioPermission';
// Jitsi désactivé - gardé pour compat mais non utilisé
const _JitsiRoom_unused = dynamic(() => import('./JitsiRoom').then((m) => m.JitsiRoom), {
  ssr: false,
  loading: () => (
    <div
      style={{
        width: '100%',
        height: 220,
        background: '#0A0A0A',
        borderRadius: 6,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#FBF8EF',
        fontSize: 12,
        fontFamily: 'ui-monospace, monospace',
        letterSpacing: '0.1em',
      }}
    >
      Chargement Jitsi...
    </div>
  ),
});
import { CARTES_DIAG, getCartesAll } from '../lib/cards';
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

// ------------------------------------------------------------
// Composant principal
// ------------------------------------------------------------
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
  // ----- État principal -----
  const [phase, setPhase] = useState<PhaseProtocole>('cadrage');
  const [cardIdx, setCardIdx] = useState(0);
  const [pions, setPions] = useState<Pion[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [resultat, setResultat] = useState<ResultatCarte | null>(null);
  const [dureeArgSec, setDureeArgSec] = useState(300);
  const [joueursConnus, setJoueursConnus] = useState<Joueur[]>([]);
  const [argumentationTerminee, setArgumentationTerminee] = useState(false);

  // ----- ANALYTICS ARRIÈRE-PLAN (NE CASSE RIEN) -----
  const cardShownAtRef = useRef<number>(Date.now());
  const lastMoverRef = useRef<string | null>(null);

  // Restauration de l'état au montage
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await loadSession(sessionId);
      if (cancelled ||!data || data.empty) return;

      if (data.phase) setPhase(data.phase);
      if (typeof data.cardIdx === 'number' && data.cardIdx >= 0) setCardIdx(data.cardIdx);

      if (data.depots && data.depots.length > 0) {
        const pions: Pion[] = data.depots.map((d: any) => ({
          playerId: d.player_id,
          nick: data.players?.find((p: any) => p.id === d.player_id)?.nick || 'Anonyme',
          quadrantInitial: d.quadrant,
          quadrantActuel: d.quadrant,
          couleur: d.canal === 'situation'? 'rouge' : d.slot === 1? 'rouge' : 'jaune',
        }));
        setPions(pions);
      }

      if (data.paris && data.paris.length > 0) {
        const votes: Vote[] = data.paris.map((p: any) => ({
          playerId: p.player_id,
          nick: data.players?.find((pp: any) => pp.id === p.player_id)?.nick || 'Anonyme',
          choix: p.pari,
          timestamp: new Date(p.created_at).getTime(),
        }));
        setVotes(votes);
      }
    })();
    return () => { cancelled = true; };
  }, [sessionId]);

  // Enregistrer le joueur une fois connecté
  useEffect(() => {
    if (role === 'player' && playerId && playerNick) {
      savePlayer(sessionId, playerId, playerNick);
    }
  }, [role, playerId, playerNick, sessionId]);

  // Sync temps réel Supabase Realtime
  const sync = useSessionSync(sessionId, playerId, playerNick);
  const localUpdateRef = (typeof window!== 'undefined' && (window as any).__AM_GRACE__) || { until: 0 };
  if (typeof window!== 'undefined') (window as any).__AM_GRACE__ = localUpdateRef;
  const marquerChangementLocal = () => { localUpdateRef.until = Date.now() + 5000; };

  const changePhase = (newPhase: PhaseProtocole) => {
    marquerChangementLocal();
    setPhase(newPhase);
    if (newPhase!== 'argumentation') setArgumentationTerminee(false);
    if (role === 'facilitator') {
      try { sync.sendPhase(newPhase); } catch (e) { console.warn('[sync] sendPhase', e); }
      try { saveSession(sessionId, { phase: newPhase, cardIdx }); } catch (e) { console.warn('[session-api] saveSession', e); }
      // LOG ANALYTICS - changement de phase
      logEvent({ type: 'phase_change', from_quadrant: phase, to_quadrant: newPhase, question_id: CARTES_DIAG[cardIdx]?.id });
    }
  };

  const changeCardIdx = (newIdx: number) => {
    marquerChangementLocal();
    setCardIdx(newIdx);
    cardShownAtRef.current = Date.now();
    lastMoverRef.current = null;
    if (role === 'facilitator') {
      try { sync.sendCarte(newIdx); } catch (e) { console.warn('[sync] sendCarte', e); }
    }
    // LOG nouvelle carte visible
    logEvent({ type: 'card_shown', question_id: CARTES_DIAG[newIdx]?.id, metadata: { famille: CARTES_DIAG[newIdx]?.famille } });
  };

  // Joueur : reçoit phase du facilitateur
  useEffect(() => {
    if (role === 'player' && sync.remotePhase && sync.remotePhase!== phase) {
      setPhase(sync.remotePhase as PhaseProtocole);
    }
  }, [role, sync.remotePhase, phase]);

  // Joueur : reçoit carte du facilitateur
  useEffect(() => {
    if (role === 'player' && sync.remoteCardIdx!== null && sync.remoteCardIdx!== cardIdx) {
      setCardIdx(sync.remoteCardIdx);
      cardShownAtRef.current = Date.now();
    }
  }, [role, sync.remoteCardIdx, cardIdx]);

  // Facilitateur : reçoit pions et votes des joueurs
  useEffect(() => {
    if (role!== 'facilitator') return;
    const remote = Object.values(sync.remotePlayers);
    if (remote.length === 0) return;
    setPions((prev) => {
      const map = new Map(prev.map((p) => [p.playerId, p]));
      for (const rp of remote) {
        if (rp.pion) map.set(rp.pion.playerId, rp.pion);
      }
      return Array.from(map.values());
    });
    setVotes((prev) => {
      const map = new Map(prev.map((v) => [v.playerId, v]));
      for (const rp of remote) {
        if (rp.vote) map.set(rp.vote.playerId, rp.vote);
      }
      return Array.from(map.values());
    });
  }, [role, sync.remotePlayers]);

  // Joueur : reçoit résultat
  useEffect(() => {
    if (role === 'player' && sync.remoteResultat) {
      setResultat(sync.remoteResultat);
    }
  }, [role, sync.remoteResultat]);

  // Polling : recharge l'état depuis Supabase toutes les 2 secondes
  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      if (cancelled) return;
      try {
        const data = await loadSession(sessionId);
        if (cancelled ||!data || data.empty) return;
        if (data.phase && data.phase!== phase) setPhase(data.phase);
        if (typeof data.cardIdx === 'number' && data.cardIdx >= 0 && data.cardIdx!== cardIdx) setCardIdx(data.cardIdx);
        if (data.depots && Date.now() > localUpdateRef.until) {
          const pions: Pion[] = data.depots.map((d: any) => ({
            playerId: d.player_id,
            nick: data.players?.find((p: any) => p.id === d.player_id)?.nick || 'Anonyme',
            quadrantInitial: d.quadrant,
            quadrantActuel: d.quadrant,
            couleur: d.canal === 'situation'? 'rouge' : d.slot === 1? 'rouge' : 'jaune',
          }));
          setPions(pions);
        }
        if (data.paris) {
          const votes: Vote[] = data.paris.map((p: any) => ({
            playerId: p.player_id,
            nick: data.players?.find((pp: any) => pp.id === p.player_id)?.nick || 'Anonyme',
            choix: p.pari,
            timestamp: new Date(p.created_at).getTime(),
          }));
          setVotes(votes);
        }
      } catch (e) {}
    };
    poll();
    const iv = setInterval(poll, 2000);
    return () => { cancelled = true; clearInterval(iv); };
  }, [sessionId]);

  // ----- FONCTION LOG ANALYTICS SANS JAMAIS CASSER -----
  const logEvent = async (evt: any) => {
    try {
      const { getSupabaseBrowser } = await import('../lib/supabase');
      const supabase = getSupabaseBrowser();
      await supabase.from('session_events').insert({
        session_id: sessionId,
        player_id: playerId || null,
        nick: playerNick || (role === 'facilitator'? 'FACILITATEUR' : null),
        latency_ms: evt.latency_ms?? (Date.now() - cardShownAtRef.current),
       ...evt,
      });
    } catch {
      // analytics ne bloque jamais le jeu
    }
  };

  // ----- Carte en cours -----
  const carte = useMemo(() => CARTES_DIAG[cardIdx], [cardIdx]);

  // ----- Pion du joueur local -----
  const monPion = useMemo(() => {
    if (!playerId) return null;
    return pions.find((p) => p.playerId === playerId) || null;
  }, [pions, playerId]);

  // ----- Actions -----
  const deplacerPion = (pid: string, nick: string, q: Quadrant) => {
    const existing = pions.find((p) => p.playerId === pid);
    const prevQ = existing?.quadrantActuel || null;
    const isFirst = pions.length === 0;
    const followedNick = lastMoverRef.current && lastMoverRef.current!== pid
     ? pions.find(p => p.playerId === lastMoverRef.current)?.nick || joueurs.find((j: any) => j.id === lastMoverRef.current)?.nick
      : null;

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
      try { sync.sendPion(updated); } catch (e) { console.warn('[sync] sendPion', e); }
      savePion(sessionId, updated, carte.id)
       .then((r) => console.log('[savePion] réponse:', r))
       .catch((e) => console.error('[savePion] ERREUR:', e));

      // LOG ANALYTICS DYNAMIQUE - ce que le facilitateur ne voit pas en présentiel
      logEvent({
        type: prevQ? 'change_quadrant' : 'move',
        from_quadrant: prevQ,
        to_quadrant: q,
        question_id: carte.id,
        latency_ms: Date.now() - cardShownAtRef.current,
        metadata: {
          is_first: isFirst,
          followed_nick: followedNick,
          followed_someone:!!followedNick,
          prev_quadrant: prevQ,
          hesitation:!!prevQ && prevQ!== q,
        }
      });
    }
  };

  const verrouillerPions = () => {
    setPions((prev) => prev.map((p) => ({...p, couleur: p.couleur === 'neutre'? 'jaune' : p.couleur })));
    logEvent({ type: 'lock_pions', question_id: carte.id, metadata: { pions_count: pions.length } });
  };

  const voter = (pid: string, nick: string, choix: 'reste' | 'bouge') => {
    const newVote: Vote = { playerId: pid, nick, choix, timestamp: Date.now() };
    setVotes((prev) => [...prev.filter((v) => v.playerId!== pid), newVote]);
    if (pid === playerId) {
      try { sync.sendVote(newVote); } catch (e) { console.warn('[sync] sendVote', e); }
      try { savePari(sessionId, pid, nick, carte.id, choix); } catch (e) { console.warn('[session-api] savePari', e); }
      logEvent({
        type: 'pari',
        to_quadrant: choix,
        question_id: carte.id,
        latency_ms: Date.now() - cardShownAtRef.current,
        metadata: { choix, mon_quadrant: monPion?.quadrantActuel }
      });
    }
  };

  const monVote = useMemo(
    () => (playerId? votes.find((v) => v.playerId === playerId) || null : null),
    [votes, playerId]
  );

  const lancerDecompte = () => {
    const res = construireResultat(carte.id, pions, votes);
    setResultat(res);
    changePhase('decompte');
    try { sync.sendResultat(res); } catch (e) { console.warn('[sync] sendResultat', e); }
    logEvent({ type: 'decompte', question_id: carte.id, metadata: { resultat: res } });
  };

  const carteSuivante = async () => {
    const newIdx = (cardIdx + 1) % CARTES_DIAG.length;

    try {
      const supabase = (await import('../lib/supabase')).getSupabaseBrowser();
      await supabase.from('session_depots').delete().eq('session_id', sessionId);
      await supabase.from('session_paris').delete().eq('session_id', sessionId);
    } catch (e) {
      console.warn('[carteSuivante] Erreur suppression:', e);
    }

    logEvent({ type: 'card_next', question_id: carte.id, metadata: { from: carte.id, to: CARTES_DIAG[newIdx].id } });

    changeCardIdx(newIdx);
    setPions([]);
    setVotes([]);
    setResultat(null);
    changePhase('signal');
  };

  // ----- Vue joueur -----
  if (role === 'player' && playerId && playerNick) {
    return (
      <PlayerView
        sessionId={sessionId}
        cardIdx={cardIdx}
        phase={phase}
        carte={carte}
        pions={pions}
        monPion={monPion}
        playerId={playerId}
        playerNick={playerNick}
        joueurs={joueurs}
        onDeplacer={(q) => deplacerPion(playerId, playerNick, q)}
        onVoter={(choix) => voter(playerId, playerNick, choix)}
        monVote={monVote}
        resultat={resultat}
        dureeArgSec={dureeArgSec}
      />
    );
  }

  // ----- Vue facilitateur -----
  return (
    <FacilitatorView
      sessionId={sessionId}
      cardIdx={cardIdx}
      phase={phase}
      carte={carte}
      pions={pions}
      votes={votes}
      joueurs={joueurs}
      resultat={resultat}
      dureeArgSec={dureeArgSec}
      setDureeArgSec={setDureeArgSec}
      argumentationTerminee={argumentationTerminee}
      setArgumentationTerminee={setArgumentationTerminee}
      onDeplacer={deplacerPion}
      onVerrouillerPions={verrouillerPions}
      onLancerDecompte={lancerDecompte}
      onCarteSuivante={carteSuivante}
      onSetPhase={changePhase}
      onSetCardIdx={changeCardIdx}
    />
  );
}

// ------------------------------------------------------------
// VUE FACILITATEUR
// ------------------------------------------------------------
function FacilitatorView({
  sessionId,
  cardIdx,
  phase,
  carte,
  pions,
  votes,
  joueurs,
  resultat,
  dureeArgSec,
  setDureeArgSec,
  argumentationTerminee,
  setArgumentationTerminee,
  onVerrouillerPions,
  onLancerDecompte,
  onCarteSuivante,
  onSetPhase,
  onSetCardIdx,
}: any) {
  const indexPhase = PHASES_ORDER.indexOf(phase);

  return (
    <div style={{ minHeight: '100vh', background: '#F4EFE2', padding: 20 }}>
      <div
        style={{
          maxWidth: 1400,
          margin: '0 auto 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 20px',
          background: '#14171B',
          color: '#FBF8EF',
          borderRadius: 6,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 16 }}>Angle Mort</span>
          <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11, letterSpacing: '0.1em', opacity: 0.7 }}>
            {sessionId} • {joueurs.length} joueurs • {carte.id}
          </span>
          <a href={`/rapport/${sessionId}`} target="_blank" style={{ fontSize: 10, background: '#FDE047', color: '#14171B', padding: '4px 8px', borderRadius: 3, textDecoration: 'none', fontWeight: 700 }}>
            RAPPORT PROFOND →
          </a>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {PHASES_ORDER.slice(0, 6).map((p, i) => (
            <div
              key={p}
              style={{
                padding: '4px 10px',
                borderRadius: 3,
                fontSize: 10,
                fontFamily: 'ui-monospace, monospace',
                letterSpacing: '0.1em',
                background: i === indexPhase? '#FDE047' : 'rgba(255,255,255,0.08)',
                color: i === indexPhase? '#14171B' : '#FBF8EF',
                fontWeight: i === indexPhase? 700 : 400,
              }}
            >
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
            <button onClick={() => onSetPhase('vote')} style={{ padding: '10px 16px', fontSize: 13, fontWeight: 700, background: argumentationTerminee? '#14171B' : '#FDE047', color: argumentationTerminee? '#FBF8EF' : '#14171B', border: '1px solid #14171B', borderRadius: 4, cursor: 'pointer', textAlign: 'center' }}>
              {argumentationTerminee? '✓ Argumentation terminée — Passer au vote' : '⏱ Argumentation en cours — Cliquer pour passer au vote maintenant'}
            </button>
          )}

          <div style={{ display: 'flex', gap: 8, padding: 12, background: '#FBF8EF', borderRadius: 6, border: '1px solid rgba(20,23,27,0.15)', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.5, marginRight: 8 }}>Phase :</span>
            {['signal', 'situation', 'argumentation', 'vote', 'decompte'].map((p) => (
              <button key={p} onClick={() => onSetPhase(p)} style={{ padding: '6px 12px', fontSize: 11, fontWeight: 600, border: phase === p? '2px solid #14171B' : '1px solid rgba(20,23,27,0.2)', background: phase === p? '#FDE047' : '#FFFFFF', color: '#14171B', borderRadius: 4, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{p}</button>
            ))}
            <span style={{ marginLeft: 'auto', fontSize: 11, opacity: 0.5 }}>→ {joueurs.length} joueurs connectés</span>
          </div>

          <PunctumBoard pions={pions} retineLabel={carte.id} retineSublabel={PHASE_LABEL[phase]} instruction={phase === 'signal'? '👀 Regardez la carte Signal et placez votre pion' : phase === 'situation'? '🔍 Nouvelle information! Gardez ou déplacez' : phase === 'argumentation'? '🗣 Argumentation en cours' : undefined} showCompteur={phase!== 'cadrage'} />

          {phase === 'argumentation' && <ArgumentTimerFacilitator dureeTotalSec={dureeArgSec} joueurs={joueurs} />}
          {phase === 'vote' && <VotePanel votes={votes} joueurs={joueurs} resultat={resultat} />}
          {phase === 'decompte' && resultat && <ResultatPanel resultat={resultat} />}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <AudioPermission label="Visio facilitateur (optionnel)" />
          <JoueursList joueurs={joueurs} pions={pions} votes={votes} phase={phase} />
          <DureeControl dureeArgSec={dureeArgSec} setDureeArgSec={setDureeArgSec} />
          {/* RAPPORT LIVE - ce que tu ne vois pas en présentiel */}
          <div style={{ background: '#14171B', color: '#FBF8EF', padding: 12, borderRadius: 6, fontSize: 11 }}>
            <div style={{ fontWeight: 700, letterSpacing: '0.1em', marginBottom: 6 }}>🔍 LIVE ANALYTICS</div>
            <div>Angle mort: quadrant avec 0 pion = angle mort collectif</div>
            <div style={{ marginTop: 6 }}><a href={`/rapport/${sessionId}`} style={{ color: '#FDE047' }}>Voir rapport profond →</a></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// VUE JOUEUR - inchangée sauf log
// ------------------------------------------------------------
function PlayerView({ sessionId, phase, carte, monPion, playerId, playerNick, joueurs, onDeplacer, onVoter, monVote, resultat, dureeArgSec }: any) {
  return (
    <div style={{ minHeight: '100vh', background: '#F4EFE2', padding: 12 }}>
      <div style={{ maxWidth: 520, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#14171B', color: '#FBF8EF', borderRadius: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>{playerNick}</span>
          <span style={{ fontSize: 10, fontFamily: 'ui-monospace, monospace', opacity: 0.7 }}>{PHASE_LABEL[phase]} • {carte.id}</span>
        </div>

        <CardVisual card={carte} face={phase === 'signal' || phase === 'cadrage'? 'signal' : 'situation'} size="xs" />

        <PunctumBoard
          pions={monPion? [monPion] : []}
          onQuadrantClick={['cadrage', 'signal', 'situation', 'argumentation'].includes(phase)? onDeplacer : undefined}
          selectedQuadrant={monPion?.quadrantActuel}
          retineLabel={carte.id}
          retineSublabel={PHASE_LABEL[phase]}
          instruction={phase === 'signal'? '👀 Cliquez sur un quadrant pour placer votre pion' : phase === 'situation'? monPion?.couleur === 'neutre'? '⚠ Vous n\'avez pas encore déposé' : '🔍 Nouvelle info! Gardez ou déplacez' : phase === 'argumentation'? '🗣 Argumentation — écoutez et intervenez' : undefined}
        />

        {phase === 'argumentation' && <ArgumentTimerPlayer dureeTotalSec={dureeArgSec} joueurs={joueurs} playerId={playerId} />}
        {phase === 'vote' && <VotePlayer monVote={monVote} onVoter={onVoter} />}
        {phase === 'decompte' && resultat && <ResultatPanel resultat={resultat} compact />}
        <AudioPermission label="Visio joueur (optionnel)" />
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// Sous-composants inchangés
// [STRIPPED 68 bytes] ControlsFacilitator({ phase, onSetPhase, onVerrouiller, onLancerDecompte, onCarteSuivante, cardIdx, onSetCardIdx }: any) {
  const btnStyle: React.CSSProperties = { padding: '10px 14px', border: '1px solid #14171B', background: '#14171B', color: '#FBF8EF', borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: 'pointer' };
  const btnSecondary: React.CSSProperties = {...btnStyle, background: '#FBF8EF', color: '#14171B' };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ padding: 12, background: '#FBF8EF', borderRadius: 6, border: '1px solid rgba(20,23,27,0.15)' }}>
        <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(20,23,27,0.5)', marginBottom: 8 }}>Sélection carte</div>
        <input type="range" min={0} max={CARTES_DIAG.length - 1} value={cardIdx} onChange={(e) => onSetCardIdx(parseInt(e.target.value, 10))} style={{ width: '100%' }} />
      </div>
      {phase === 'cadrage' && <button style={btnStyle} onClick={() => onSetPhase('signal')}>▶ Démarrer la partie</button>}
      {phase === 'signal' && <button style={btnStyle} onClick={() => { onVerrouiller(); onSetPhase('situation'); }}>✓ Verrouiller les pions (passent en jaune)</button>}
      {phase === 'situation' && <button style={btnStyle} onClick={() => onSetPhase('argumentation')}>▶ Lancer l'argumentation</button>}
      {phase === 'vote' && <button style={btnStyle} onClick={onLancerDecompte}>✓ Révéler le résultat</button>}
      {phase === 'decompte' && <button style={btnStyle} onClick={onCarteSuivante}>▶ Carte suivante</button>}
    </div>
  );
}

function VotePanel({ votes, joueurs, resultat }: any) {
  const reste = votes.filter((v: Vote) => v.choix === 'reste').length;
  const bouge = votes.filter((v: Vote) => v.choix === 'bouge').length;
  return (
    <div style={{ padding: 16, background: '#FBF8EF', borderRadius: 6, border: '1px solid rgba(20,23,27,0.15)' }}>
      <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}><div style={{ fontFamily: 'Georgia, serif', fontSize: 32, fontWeight: 700 }}>{reste}</div><div style={{ fontSize: 11, opacity: 0.6 }}>Reste</div></div>
        <div style={{ textAlign: 'center' }}><div style={{ fontFamily: 'Georgia, serif', fontSize: 32, fontWeight: 700 }}>{bouge}</div><div style={{ fontSize: 11, opacity: 0.6 }}>Bouge</div></div>
      </div>
      <div style={{ marginTop: 12, fontSize: 11, opacity: 0.6, textAlign: 'center' }}>{votes.length}/{joueurs.length} votes reçus</div>
    </div>
  );
}

function VotePlayer({ monVote, onVoter }: any) {
  const voteReste = monVote?.choix === 'reste';
  const voteBouge = monVote?.choix === 'bouge';
  return (
    <div style={{ padding: 16, background: '#FBF8EF', borderRadius: 6, border: '1px solid rgba(20,23,27,0.15)', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.6, textAlign: 'center' }}>Vote final — la position collective va-t-elle rester ou bouger?</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <button onClick={() => onVoter('reste')} style={{ padding: 14, background: voteReste? '#FDE047' : '#FFFFFF', color: '#14171B', border: voteReste? '3px solid #14171B' : '2px solid rgba(20,23,27,0.3)', borderRadius: 6, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>{voteReste? '✓ Reste' : 'Reste'}</button>
        <button onClick={() => onVoter('bouge')} style={{ padding: 14, background: voteBouge? '#EF4444' : '#FFFFFF', color: voteBouge? '#FFFFFF' : '#14171B', border: voteBouge? '3px solid #14171B' : '2px solid rgba(20,23,27,0.3)', borderRadius: 6, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>{voteBouge? '✓ Bouge' : 'Bouge'}</button>
      </div>
      {monVote && <div style={{ fontSize: 11, textAlign: 'center', color: 'rgba(20,23,27,0.6)', marginTop: 4 }}>Votre vote : <strong>{monVote.choix}</strong></div>}
    </div>
  );
}

function ResultatPanel({ resultat, compact }: { resultat: ResultatCarte; compact?: boolean }) {
  return (
    <div style={{ padding: compact? 12 : 16, background: '#14171B', color: '#FBF8EF', borderRadius: 6 }}>
      <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.6 }}>Résultat • {resultat.cardId}</div>
      <div style={{ fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: 700, marginTop: 6 }}>{LIBELLE_CONDITION[resultat.condition]}</div>
      <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>{DESCRIPTION_CONDITION[resultat.condition]}</div>
      <div style={{ marginTop: 12, display: 'flex', gap: 16, fontSize: 12 }}>
        <div><span style={{ opacity: 0.6 }}>Signal : </span><strong>{resultat.positionSignal}</strong></div>
        <div><span style={{ opacity: 0.6 }}>Final : </span><strong>{resultat.positionFinale}</strong></div>
        <div><span style={{ opacity: 0.6 }}>Pari gagnant : </span><strong style={{ color: resultat.pariGagnant === 'jaune'? '#FDE047' : '#EF4444' }}>{resultat.pariGagnant}</strong></div>
      </div>
    </div>
  );
}

function JoueursList({ joueurs, pions, votes, phase }: any) {
  return (
    <div style={{ padding: 12, background: '#FBF8EF', borderRadius: 6, border: '1px solid rgba(20,23,27,0.15)' }}>
      <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.5, marginBottom: 8 }}>Joueurs ({joueurs.length})</div>
      {joueurs.map((j: Joueur) => {
        const p = pions.find((pp: Pion) => pp.playerId === j.id);
        const v = votes.find((vv: Vote) => vv.playerId === j.id);
        return (
          <div key={j.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px', fontSize: 12, borderBottom: '1px solid rgba(20,23,27,0.05)' }}>
            <span>{j.nick}</span>
            <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, opacity: 0.6 }}>{p? p.quadrantActuel || '—' : '—'} • {p?.couleur || '—'}{v && ` • ${v.choix}`}</span>
          </div>
        );
      })}
      {joueurs.length === 0 && <div style={{ fontSize: 11, opacity: 0.4, textAlign: 'center', padding: 8 }}>Aucun joueur connecté</div>}
    </div>
  );
}

function DureeControl({ dureeArgSec, setDureeArgSec }: any) {
  return (
    <div style={{ padding: 12, background: '#FBF8EF', borderRadius: 6, border: '1px solid rgba(20,23,27,0.15)' }}>
      <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.5, marginBottom: 8 }}>Durée argumentation : {Math.floor(dureeArgSec / 60)} min</div>
      <input type="range" min={240} max={360} step={30} value={dureeArgSec} onChange={(e) => setDureeArgSec(parseInt(e.target.value, 10))} style={{ width: '100%' }} />
    </div>
  );
}