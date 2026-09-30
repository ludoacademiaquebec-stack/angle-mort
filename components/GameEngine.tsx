'use client';

// ============================================================
// ANGLE MORT v4.2.1 — Fix race condition broadcast/poll
// Mécanique : pion = position · vote = opinion
// Signal : dépôt neutre → Réaction : 2 boutons (Bouger/Rester)
// Vote : 3 boutons OU clic cadran (bouge implicite)
// ============================================================

import { useState, useMemo, useEffect, useRef } from 'react';
import { PunctumBoard } from './PunctumBoard';
import { CardVisual } from './CardVisual';
import { ArgumentTimerFacilitator, ArgumentTimerPlayer } from './ArgumentTimer';
import { AudioPermission } from './AudioPermission';
import { AllView } from './AllView';
import { SyntheseView } from './SyntheseView';

import { CARTES_DIAG, CARTES_ALL } from '../lib/cards';
import {
  construireResultat,
  LIBELLE_CONDITION,
  DESCRIPTION_CONDITION,
  COULEUR_CONDITION,
} from '../lib/resolution';
import { tirerCartesPourVersion } from '../lib/versions';
import { tirerCartesAllIntelligent, syntheseGenerale } from '../lib/aller';
import type {
  Pion,
  Vote,
  Quadrant,
  PhaseProtocole,
  Joueur,
  ResultatCarte,
  Version,
  CarteDiagnostique,
  CarteAll,
  Engagement,
} from '../lib/types';
import { useSessionSync } from '../lib/useSessionSync';
import {
  loadSession,
  saveSession,
  savePion,
  savePlayer,
  savePari,
  saveResultatCarte,
  saveEngagement,
} from '../lib/session-api';

type Role = 'facilitator' | 'player';

const PHASES_ORDER: PhaseProtocole[] = [
  'cadrage',
  'signal',
  'situation',
  'reaction',
  'argumentation',
  'vote',
  'decompte',
  'fermeture_all',
];

const PHASE_LABEL: Record<PhaseProtocole, string> = {
  cadrage: 'Cadrage',
  signal: 'Signal',
  situation: 'Situation',
  reaction: 'Réaction',
  argumentation: 'Argumentation',
  vote: 'Vote',
  decompte: 'Décompte',
  fermeture_all: 'Fermeture ALL',
};

// Fenêtre de grâce appliquée côté player quand un broadcast arrive,
// pour éviter qu'un poll en vol (avec données périmées) ne réécrase
// la phase reçue par broadcast.
const BROADCAST_GRACE_MS = 4000;

interface GameEngineProps {
  sessionId: string;
  role: Role;
  playerId?: string;
  playerNick?: string;
  joueurs?: Joueur[];
  versionInitiale?: Version;
}

export function GameEngine({
  sessionId,
  role,
  playerId,
  playerNick,
  joueurs = [],
  versionInitiale = 'complet',
}: GameEngineProps) {
  const [phase, setPhase] = useState<PhaseProtocole>('cadrage');
  const [cardIdx, setCardIdx] = useState(0);
  const [version, setVersion] = useState<Version>(versionInitiale);
  const [versionChargee, setVersionChargee] = useState(false);
  const [cartesTirees, setCartesTirees] = useState<CarteDiagnostique[]>([]);
  const [pions, setPions] = useState<Pion[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [resultat, setResultat] = useState<ResultatCarte | null>(null);
  const [resultatsCumules, setResultatsCumules] = useState<ResultatCarte[]>([]);
  const [allTirees, setAllTirees] = useState<CarteAll[]>([]);
  const [raisonnementsAll, setRaisonnementsAll] = useState<any[]>([]);
  const [dureeArgSec, setDureeArgSec] = useState(300);
  const [argumentationTerminee, setArgumentationTerminee] = useState(false);
  const [engagements, setEngagements] = useState<Record<string, string>>({});
  const [montrerSynthese, setMontrerSynthese] = useState(false);

  const cardShownAtRef = useRef<number>(Date.now());
  const lastMoverRef = useRef<string | null>(null);

  const phaseRef = useRef(phase);
  const cardIdxRef = useRef(cardIdx);
  phaseRef.current = phase;
  cardIdxRef.current = cardIdx;

  // ----- Chargement initial -----
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await loadSession(sessionId);
      if (cancelled || !data || data.empty) return;

      if (data.phase) setPhase(data.phase);
      if (typeof data.cardIdx === 'number' && data.cardIdx >= 0) setCardIdx(data.cardIdx);
      if (data.version) setVersion(data.version as Version);
      setVersionChargee(true);

      if (data.depots && data.depots.length > 0) {
        const p: Pion[] = data.depots.map((d: any) => ({
          playerId: d.player_id,
          nick: data.players?.find((pp: any) => pp.id === d.player_id)?.nick || 'Anonyme',
          quadrantInitial: d.quadrant,
          quadrantActuel: d.quadrant,
          couleur: d.canal === 'situation' ? 'rouge' : d.slot === 1 ? 'rouge' : 'jaune',
          nbDeplacements: d.nb_deplacements || 0,
        }));
        setPions(p);
      }
      if (data.paris && data.paris.length > 0) {
        const v: Vote[] = data.paris.map((p: any) => ({
          playerId: p.player_id,
          nick: data.players?.find((pp: any) => pp.id === p.player_id)?.nick || 'Anonyme',
          choix: p.pari,
          cardId: p.card_id || p.question_id || '',
          timestamp: new Date(p.created_at).getTime(),
        }));
        setVotes(v);
      }
    })();
    return () => { cancelled = true; };
  }, [sessionId]);

  // ----- Tirage cartes synchronisé -----
  useEffect(() => {
    if (!versionChargee) return;
    if (cartesTirees.length > 0) return;

    (async () => {
      const data = await loadSession(sessionId);
      if (data?.cards_tirees && Array.isArray(data.cards_tirees) && data.cards_tirees.length > 0) {
        const ids: string[] = data.cards_tirees;
        const cartes = ids
          .map((id) => CARTES_DIAG.find((c) => c.id === id))
          .filter(Boolean) as CarteDiagnostique[];
        if (cartes.length > 0) {
          setCartesTirees(cartes);
          return;
        }
      }

      const cartes = tirerCartesPourVersion(version, sessionId);
      setCartesTirees(cartes);

      if (role === 'facilitator') {
        try {
          await saveSession(sessionId, { cardsTirees: cartes.map((c) => c.id) } as any);
        } catch {}
      }
    })();
  }, [versionChargee, version, sessionId, role, cartesTirees.length]);

  // ----- Enregistrement joueur -----
  useEffect(() => {
    if (role === 'player' && playerId && playerNick) {
      savePlayer(sessionId, playerId, playerNick);
    }
  }, [role, playerId, playerNick, sessionId]);

  const sync = useSessionSync(sessionId, playerId, playerNick);
  const localUpdateRef = (typeof window !== 'undefined' && (window as any).__AM_GRACE__) || { until: 0 };
  if (typeof window !== 'undefined') (window as any).__AM_GRACE__ = localUpdateRef;
  const marquerChangementLocal = () => {
    localUpdateRef.until = Date.now() + 5000;
  };

  const logEvent = async (evt: any) => {
    try {
      const { getSupabaseBrowser } = await import('../lib/supabase');
      const supabase = getSupabaseBrowser();
      await supabase.from('session_events').insert({
        session_id: sessionId,
        player_id: playerId || null,
        nick: playerNick || (role === 'facilitator' ? 'FACILITATEUR' : null),
        latency_ms: evt.latency_ms ?? Date.now() - cardShownAtRef.current,
        ...evt,
      });
    } catch {}
  };

  const changePhase = (newPhase: PhaseProtocole) => {
    marquerChangementLocal();
    localUpdateRef.until = Date.now() + 10000;
    setPhase(newPhase);
    if (newPhase !== 'argumentation') setArgumentationTerminee(false);
    if (role === 'facilitator') {
      try { sync.sendPhase(newPhase); } catch {}
      try { saveSession(sessionId, { phase: newPhase, cardIdx }); } catch {}
      const carteCourante = cartesTirees[cardIdx];
      if (carteCourante) {
        logEvent({
          type: 'phase_change',
          from_quadrant: phase,
          to_quadrant: newPhase,
          question_id: carteCourante.id,
        });
      }
    }
  };

  const changeCardIdx = (newIdx: number) => {
    marquerChangementLocal();
    localUpdateRef.until = Date.now() + 10000;
    setCardIdx(newIdx);
    setPhase('signal');
    cardShownAtRef.current = Date.now();
    lastMoverRef.current = null;
    if (role === 'facilitator') {
      (async () => {
        try {
          const { getSupabaseBrowser } = await import('../lib/supabase');
          await getSupabaseBrowser()
            .from('sessions')
            .update({ elapsed_sec: 0, timer_running: false })
            .eq('id', sessionId);
        } catch {}
      })();
      try { sync.sendCarte(newIdx); } catch {}
      try { sync.sendPhase('signal'); } catch {}
      try { saveSession(sessionId, { phase: 'signal', cardIdx: newIdx }); } catch {}
    }
  };

  // ============================================================
  // FIX : Les effets qui appliquent les broadcasts côté player
  // posent désormais une fenêtre de grâce locale, pour empêcher
  // qu'un poll en vol (retournant une valeur périmée) ne réécrase
  // la phase/cardIdx qui vient d'être reçue par broadcast.
  // ============================================================

  useEffect(() => {
    if (role === 'player' && sync.remotePhase && sync.remotePhase !== phase) {
      // Grâce locale : protège contre les réponses de poll périmées
      localUpdateRef.until = Math.max(localUpdateRef.until, Date.now() + BROADCAST_GRACE_MS);
      setPhase(sync.remotePhase as PhaseProtocole);
    }
  }, [role, sync.remotePhase, phase]);

  useEffect(() => {
    if (role === 'player' && sync.remoteCardIdx !== null && sync.remoteCardIdx !== cardIdx) {
      // Grâce locale : protège contre les réponses de poll périmées
      localUpdateRef.until = Math.max(localUpdateRef.until, Date.now() + BROADCAST_GRACE_MS);
      setCardIdx(sync.remoteCardIdx);
      cardShownAtRef.current = Date.now();
    }
  }, [role, sync.remoteCardIdx, cardIdx]);

  useEffect(() => {
    if (role !== 'facilitator') return;
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

  useEffect(() => {
    if (role === 'player' && sync.remoteResultat) {
      setResultat(sync.remoteResultat as ResultatCarte);
    }
  }, [role, sync.remoteResultat]);

  // ----- Polling stabilisé -----
  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      if (cancelled) return;
      try {
        const data = await loadSession(sessionId);
        if (cancelled || !data || data.empty) return;

        const curPhase = phaseRef.current;
        const curCardIdx = cardIdxRef.current;
        const graceActive = Date.now() < localUpdateRef.until;

        if (data.phase && data.phase !== curPhase && !graceActive) {
          setPhase(data.phase);
        }

        if (
          typeof data.cardIdx === 'number' &&
          data.cardIdx >= 0 &&
          data.cardIdx !== curCardIdx &&
          !graceActive
        ) {
          setCardIdx(data.cardIdx);
        }

        if (data.depots && !graceActive) {
          const p: Pion[] = data.depots.map((d: any) => ({
            playerId: d.player_id,
            nick: data.players?.find((pp: any) => pp.id === d.player_id)?.nick || 'Anonyme',
            quadrantInitial: d.quadrant,
            quadrantActuel: d.quadrant,
            couleur: d.canal === 'situation' ? 'rouge' : d.slot === 1 ? 'rouge' : 'jaune',
            nbDeplacements: d.nb_deplacements || 0,
          }));
          setPions(p);
        }

        if (data.cards_tirees && Array.isArray(data.cards_tirees) && data.cards_tirees.length > 0) {
          const ids: string[] = data.cards_tirees;
          if (ids.length > 0 && (cartesTirees.length === 0 || cartesTirees[0]?.id !== ids[0])) {
            const cartesDB = ids
              .map((id: string) => CARTES_DIAG.find((c) => c.id === id))
              .filter(Boolean) as typeof CARTES_DIAG;
            if (cartesDB.length > 0) setCartesTirees(cartesDB);
          }
        }

        if (data.allSelectionnees && Array.isArray(data.allSelectionnees) && data.allSelectionnees.length > 0) {
          const ids = data.allSelectionnees;
          if (allTirees.length === 0) {
            const allDB = ids.map((id: string) => CARTES_ALL.find((c) => c.id === id)).filter(Boolean);
            if (allDB.length > 0) setAllTirees(allDB as CarteAll[]);
          }
        }

        if (data.paris) {
          const v: Vote[] = data.paris.map((p: any) => ({
            playerId: p.player_id,
            nick: data.players?.find((pp: any) => pp.id === p.player_id)?.nick || 'Anonyme',
            choix: p.pari,
            cardId: p.card_id || p.question_id || '',
            timestamp: new Date(p.created_at).getTime(),
          }));
          setVotes(v);
        }
      } catch {}
    };
    poll();
    const iv = setInterval(poll, 2500);
    return () => {
      cancelled = true;
      clearInterval(iv);
    };
  }, [sessionId]);

  const carte: CarteDiagnostique | undefined = cartesTirees[cardIdx];
  const totalCartes = cartesTirees.length || 1;

  const monPion = useMemo(() => {
    if (!playerId) return null;
    return pions.find((p) => p.playerId === playerId) || null;
  }, [pions, playerId]);

  // ----- Déplacement pion (signal / réaction / vote) -----
  const deplacerPion = (pid: string, nick: string, q: Quadrant) => {
    const existing = pions.find((p) => p.playerId === pid);
    const prevQ = existing?.quadrantActuel || null;
    const isFirst = pions.length === 0;
    const followedNick =
      lastMoverRef.current && lastMoverRef.current !== pid
        ? pions.find((p) => p.playerId === lastMoverRef.current)?.nick || null
        : null;

    let updated: Pion;
    if (existing) {
      const nbDepl = (existing.nbDeplacements || 0) + 1;
      const couleur =
        phase === 'reaction'
          ? 'rouge'
          : phase === 'vote'
          ? (existing.quadrantInitial === q ? 'jaune' : 'rouge')
          : existing.quadrantInitial && existing.quadrantInitial !== q
          ? 'rouge'
          : existing.couleur === 'neutre'
          ? 'neutre'
          : existing.couleur;
      updated = {
        ...existing,
        quadrantActuel: q,
        couleur,
        reactionFaite: phase === 'reaction' ? true : existing.reactionFaite,
        nbDeplacements: nbDepl,
      };
      setPions((prev) => prev.map((p) => (p.playerId === pid ? updated : p)));
    } else {
      updated = {
        playerId: pid,
        nick,
        quadrantInitial: q,
        quadrantActuel: q,
        couleur: 'neutre',
        reactionFaite: false,
        nbDeplacements: 0,
      };
      setPions((prev) => [...prev, updated]);
    }
    lastMoverRef.current = pid;

    if (pid === playerId) {
      try { sync.sendPion(updated); } catch {}
      if (carte) {
        savePion(sessionId, updated, carte.id, phase === 'reaction' ? 'bouge' : null).catch(() => {});

        // Phase vote : clic cadran = vote implicite
        if (phase === 'vote' && existing) {
          const voteAuto: 'reste' | 'bouge' =
            existing.quadrantInitial === q ? 'reste' : 'bouge';
          const newVote: Vote = {
            playerId: pid,
            nick,
            choix: voteAuto,
            cardId: carte.id,
            timestamp: Date.now(),
          };
          setVotes((prev) => [...prev.filter((v) => v.playerId !== pid), newVote]);
          try { sync.sendVote(newVote); } catch {}
          savePari(sessionId, pid, nick, carte.id, voteAuto).catch(() => {});
        }

        logEvent({
          type: prevQ ? 'change_quadrant' : 'move',
          from_quadrant: prevQ,
          to_quadrant: q,
          question_id: carte.id,
          latency_ms: Date.now() - cardShownAtRef.current,
          metadata: {
            is_first: isFirst,
            followed_nick: followedNick,
            followed_someone: !!followedNick,
            hesitation: !!prevQ && prevQ !== q,
          },
        });
      }
    }
  };

  const verrouillerPions = () => {
    setPions((prev) =>
      prev.map((p) => ({ ...p, couleur: p.couleur === 'neutre' ? 'jaune' : p.couleur }))
    );
    if (carte) {
      logEvent({
        type: 'lock_pions',
        question_id: carte.id,
        metadata: { pions_count: pions.length },
      });
    }
  };

  // ----- Vote final (opinion) -----
  const voter = (pid: string, nick: string, choix: 'reste' | 'bouge' | 'neutre') => {
    const newVote: Vote = {
      playerId: pid,
      nick,
      choix,
      cardId: carte?.id || 'unknown',
      timestamp: Date.now(),
    };
    setVotes((prev) => [...prev.filter((v) => v.playerId !== pid), newVote]);

    if (choix === 'neutre') {
      setPions((prev) => {
        const updatedPions = prev.map((p) =>
          p.playerId === pid ? { ...p, couleur: 'neutre' as const } : p
        );
        if (pid === playerId && carte) {
          const monPionUpdated = updatedPions.find((p) => p.playerId === pid);
          if (monPionUpdated) {
            try { sync.sendPion(monPionUpdated); } catch {}
            savePion(sessionId, monPionUpdated, carte.id, 'neutre').catch(() => {});
          }
        }
        return updatedPions;
      });
    }

    if (choix === 'reste') {
      setPions((prev) => {
        const updatedPions = prev.map((p) =>
          p.playerId === pid ? { ...p, couleur: 'jaune' as const } : p
        );
        if (pid === playerId && carte) {
          const monPionUpdated = updatedPions.find((p) => p.playerId === pid);
          if (monPionUpdated) {
            try { sync.sendPion(monPionUpdated); } catch {}
            savePion(sessionId, monPionUpdated, carte.id, 'reste').catch(() => {});
          }
        }
        return updatedPions;
      });
    }

    if (choix === 'bouge') {
      setPions((prev) => {
        const updatedPions = prev.map((p) =>
          p.playerId === pid ? { ...p, couleur: 'rouge' as const } : p
        );
        if (pid === playerId && carte) {
          const monPionUpdated = updatedPions.find((p) => p.playerId === pid);
          if (monPionUpdated) {
            try { sync.sendPion(monPionUpdated); } catch {}
            savePion(sessionId, monPionUpdated, carte.id, 'bouge').catch(() => {});
          }
        }
        return updatedPions;
      });
    }

    if (pid === playerId) {
      try { sync.sendVote(newVote); } catch {}
      if (carte) {
        savePari(sessionId, pid, nick, carte.id, choix).catch(() => {});
        logEvent({
          type: 'pari',
          to_quadrant: choix,
          question_id: carte.id,
          metadata: { choix, mon_quadrant: monPion?.quadrantActuel },
        });
      }
    }
  };

  // ----- Réaction (2 boutons : Bouger / Rester) -----
  const reaction = (pid: string, nick: string, choix: 'bouge' | 'reste') => {
    marquerChangementLocal();
    localUpdateRef.until = Date.now() + 30000;
    const existing = pions.find((p) => p.playerId === pid);
    if (!existing) return;

    if (choix === 'bouge') {
      return;
    }

    const updated: Pion = { ...existing, reactionFaite: true, couleur: 'jaune' };
    setPions((prev) => prev.map((p) => (p.playerId === pid ? updated : p)));
    if (pid === playerId) {
      try { sync.sendPion(updated); } catch {}
      if (carte) {
        savePion(sessionId, updated, carte.id, 'reste').catch(() => {});
        logEvent({ type: 'reaction', to_quadrant: 'reste', question_id: carte.id, metadata: { choix: 'reste' } });
      }
    }
  };

  const monVote = useMemo(
    () => (playerId ? votes.find((v) => v.playerId === playerId && v.cardId === carte?.id) || null : null),
    [votes, playerId, carte]
  );

  // ----- Décompte -----
  const lancerDecompte = async () => {
    if (!carte) return;

    let votesAJour = votes.filter((v) => v.cardId === carte.id);
    try {
      const data = await loadSession(sessionId);
      if (data?.paris) {
        votesAJour = data.paris
          .filter((p: any) => (p.card_id || p.question_id) === carte.id)
          .map((p: any) => ({
            playerId: p.player_id,
            nick: data.players?.find((pp: any) => pp.id === p.player_id)?.nick || 'Anonyme',
            choix: p.pari,
            cardId: p.card_id || p.question_id || '',
            timestamp: new Date(p.created_at).getTime(),
          }));
        setVotes(votesAJour);
      }
    } catch {}

    const res = construireResultat(carte, pions, votesAJour);
    if (!res) {
      alert('Aucun vote ou aucun pion enregistré. Impossible de décompter.');
      return;
    }
    setResultat(res);
    setResultatsCumules((prev) => [...prev, res]);
    changePhase('decompte');
    try { sync.sendResultat(res); } catch {}
    saveResultatCarte(sessionId, res).catch(() => {});
    logEvent({ type: 'decompte', question_id: carte.id, metadata: { resultat: res } });
  };

  // ----- Carte suivante -----
  const carteSuivante = async () => {
    const newIdx = cardIdx + 1;
    if (newIdx >= totalCartes) {
      const { cartes, raisonnements } = tirerCartesAllIntelligent(pions, votes, resultatsCumules);
      setAllTirees(cartes);
      setRaisonnementsAll(raisonnements);
      setMontrerSynthese(true);
      changePhase('fermeture_all');
      try {
        await saveSession(sessionId, {
          phase: 'fermeture_all',
          allSelectionnees: cartes.map((c) => c.id),
        });
      } catch {}
      return;
    }

    try {
      const supabase = (await import('../lib/supabase')).getSupabaseBrowser();
      await supabase.from('session_depots').delete().eq('session_id', sessionId);
      await supabase.from('session_paris').delete().eq('session_id', sessionId);
    } catch (e) {
      console.warn('[carteSuivante] Erreur suppression:', e);
    }

    changeCardIdx(newIdx);
    setPions([]);
    setVotes([]);
    setResultat(null);
  };

  // ----- Engagement -----
  const enregistrerEngagement = (allCardId: string, texte: string) => {
    setEngagements((prev) => ({ ...prev, [allCardId]: texte }));
    if (playerId && playerNick && texte.trim()) {
      const carteAll = allTirees.find((c) => c.id === allCardId);
      const engagement: Engagement = {
        sessionId,
        playerId,
        allCardId,
        engagementText: texte,
        indicateur: carteAll?.indicateur || '',
        echeance: carteAll?.delai || 'J+7',
      };
      saveEngagement(engagement).catch((e) => console.error('[enregistrerEngagement]', e));
    }
  };

  if (role === 'player' && playerId && playerNick) {
    return (
      <PlayerView
        phase={phase}
        carte={carte}
        monPion={monPion}
        playerNick={playerNick}
        playerId={playerId}
        joueurs={joueurs}
        onDeplacer={(q: Quadrant) => deplacerPion(playerId, playerNick, q)}
        onVoter={(choix: 'reste' | 'bouge' | 'neutre') => voter(playerId, playerNick, choix)}
        onReaction={(choix: 'bouge' | 'reste') => reaction(playerId, playerNick, choix)}
        monVote={monVote}
        resultat={resultat}
        dureeArgSec={dureeArgSec}
        allTirees={allTirees}
        sessionId={sessionId}
        engagements={engagements}
        onEngagement={enregistrerEngagement}
      />
    );
  }

  return (
    <FacilitatorView
      sessionId={sessionId}
      cardIdx={cardIdx}
      totalCartes={totalCartes}
      phase={phase}
      carte={carte}
      version={version}
      pions={pions}
      votes={votes}
      joueurs={joueurs}
      resultat={resultat}
      dureeArgSec={dureeArgSec}
      setDureeArgSec={setDureeArgSec}
      argumentationTerminee={argumentationTerminee}
      setArgumentationTerminee={setArgumentationTerminee}
      onVerrouillerPions={verrouillerPions}
      onLancerDecompte={lancerDecompte}
      onCarteSuivante={carteSuivante}
      onSetPhase={changePhase}
      allTirees={allTirees}
      raisonnementsAll={raisonnementsAll}
      montrerSynthese={montrerSynthese}
      setMontrerSynthese={setMontrerSynthese}
      resultatsCumules={resultatsCumules}
    />
  );
}

// ============================================================
// VUE FACILITATEUR
// ============================================================
function FacilitatorView({
  sessionId,
  cardIdx,
  totalCartes,
  phase,
  carte,
  version,
  pions,
  votes,
  joueurs,
  resultat,
  dureeArgSec,
  setDureeArgSec,
  argumentationTerminee,
  onVerrouillerPions,
  onLancerDecompte,
  onCarteSuivante,
  onSetPhase,
  allTirees,
  raisonnementsAll,
  montrerSynthese,
  setMontrerSynthese,
  resultatsCumules,
}: any) {
  const indexPhase = PHASES_ORDER.indexOf(phase);

  if (montrerSynthese) {
    const synth = syntheseGenerale(pions, votes, resultatsCumules);
    return (
      <div style={{ minHeight: '100vh', background: '#F4EFE2', padding: 20 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <SyntheseView
            company=""
            version={version}
            nbJoueurs={joueurs.length}
            zonesRouges={synth.zonesRouges}
            famillesChaudes={synth.famillesChaudes}
            resultats={resultatsCumules}
            tensionGlobale={synth.tensionGlobale}
            onContinuer={() => setMontrerSynthese(false)}
          />
        </div>
      </div>
    );
  }

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
            {sessionId} • {joueurs.length} joueurs • {carte?.id || '—'} [{cardIdx + 1}/{totalCartes}]
          </span>
          <a
            href={`/rapport-profond?sessionId=${sessionId}`}
            target="_blank"
            rel="noreferrer"
            style={{
              fontSize: 10,
              background: '#FDE047',
              color: '#14171B',
              padding: '4px 8px',
              borderRadius: 3,
              textDecoration: 'none',
              fontWeight: 700,
            }}
          >
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
                background: i === indexPhase ? '#FDE047' : 'rgba(255,255,255,0.08)',
                color: i === indexPhase ? '#14171B' : '#FBF8EF',
                fontWeight: i === indexPhase ? 700 : 400,
              }}
            >
              {i + 1}. {PHASE_LABEL[p as PhaseProtocole]}
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          maxWidth: 1400,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '340px 1fr 320px',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {carte && (
            <CardVisual
              card={carte}
              face={phase === 'signal' || phase === 'cadrage' ? 'signal' : 'situation'}
              size="xs"
            />
          )}
          <ControlsFacilitator
            phase={phase}
            onSetPhase={onSetPhase}
            onVerrouiller={onVerrouillerPions}
            onLancerDecompte={onLancerDecompte}
            onCarteSuivante={onCarteSuivante}
            cardIdx={cardIdx}
            totalCartes={totalCartes}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <PhaseBar phase={phase} onSetPhase={onSetPhase} nbJoueurs={joueurs.length} />
          {phase === 'fermeture_all' && allTirees.length > 0 ? (
            <AllView cartes={allTirees} raisonnements={raisonnementsAll} role="facilitator" sessionId={sessionId} />
          ) : (
            carte && (
              <PunctumBoard
                pions={pions}
                retineLabel={carte.id}
                retineSublabel={PHASE_LABEL[phase as PhaseProtocole]}
                showCompteur={phase !== 'cadrage'}
              />
            )
          )}
          {phase === 'argumentation' && (
            <ArgumentTimerFacilitator dureeTotalSec={dureeArgSec} joueurs={joueurs} sessionId={sessionId} />
          )}
          {phase === 'vote' && <VotePanel votes={votes} joueurs={joueurs} />}
          {phase === 'decompte' && resultat && (
            <ResultatPanel resultat={resultat} carte={carte} showArbitrage />
          )}
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

// ============================================================
// VUE JOUEUR
// ============================================================
function PlayerView({
  phase,
  carte,
  monPion,
  playerNick,
  playerId,
  joueurs,
  onDeplacer,
  onVoter,
  onReaction,
  monVote,
  resultat,
  dureeArgSec,
  allTirees,
  sessionId,
  engagements,
  onEngagement,
}: any) {
  return (
    <div style={{ minHeight: '100vh', background: '#F4EFE2', padding: 12 }}>
      <div style={{ maxWidth: 520, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            background: '#14171B',
            color: '#FBF8EF',
            borderRadius: 6,
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 600 }}>{playerNick}</span>
          <span style={{ fontSize: 10, fontFamily: 'ui-monospace, monospace', opacity: 0.7 }}>
            {PHASE_LABEL[phase as PhaseProtocole]} • {carte?.id || '—'}
          </span>
        </div>

        {phase === 'fermeture_all' && allTirees.length > 0 ? (
          <AllView
            cartes={allTirees}
            raisonnements={[]}
            role="player"
            sessionId={sessionId}
            playerId={playerId}
            engagements={engagements}
            onEngagement={onEngagement}
          />
        ) : (
          <>
            {carte && (
              <CardVisual
                card={carte}
                face={phase === 'signal' || phase === 'cadrage' ? 'signal' : 'situation'}
                size="xs"
              />
            )}
            <PunctumBoard
              pions={monPion ? [monPion] : []}
              onQuadrantClick={
                ['cadrage', 'signal', 'reaction', 'vote'].includes(phase) ? onDeplacer : undefined
              }
              selectedQuadrant={monPion?.quadrantActuel}
              retineLabel={carte?.id || ''}
              retineSublabel={PHASE_LABEL[phase as PhaseProtocole]}
            />
          </>
        )}

        {phase === 'argumentation' && (
          <ArgumentTimerPlayer dureeTotalSec={dureeArgSec} joueurs={joueurs} playerId={playerId} sessionId={sessionId} />
        )}

        {phase === 'reaction' && (
          <div style={{ padding: 16, background: '#FBF8EF', borderRadius: 6, border: '1px solid rgba(20,23,27,0.15)' }}>
            <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.6, textAlign: 'center' }}>
              Réaction
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, marginTop: 8, textAlign: 'center' }}>
              Veux-tu déplacer ton pion après lecture de la situation ?
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
              <button
                onClick={() => onReaction('bouge')}
                disabled={monPion?.reactionFaite}
                style={{ padding: 14, background: monPion?.reactionFaite ? '#E5E7EB' : '#FFFFFF', color: '#14171B', border: '2px solid rgba(20,23,27,0.3)', borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: monPion?.reactionFaite ? 'not-allowed' : 'pointer' }}
              >
                🔄 Bouger
              </button>
              <button
                onClick={() => onReaction('reste')}
                disabled={monPion?.reactionFaite}
                style={{ padding: 14, background: monPion?.reactionFaite ? '#E5E7EB' : '#FFFFFF', color: '#14171B', border: '2px solid rgba(20,23,27,0.3)', borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: monPion?.reactionFaite ? 'not-allowed' : 'pointer' }}
              >
                ✋ Rester
              </button>
            </div>
            <div style={{ fontSize: 11, opacity: 0.6, textAlign: 'center', marginTop: 8 }}>
              {monPion?.reactionFaite
                ? `✓ Choix enregistré${monPion?.nbDeplacements ? ' — ' + monPion.nbDeplacements + ' déplacement(s)' : ''}`
                : '⚠️ Clique "Bouger" puis un cadran — chaque clic compte'}
            </div>
            {monPion?.nbDeplacements && monPion.nbDeplacements > 0 ? (
              <div style={{ marginTop: 6, fontSize: 11, fontWeight: 700, color: '#DC2626', textAlign: 'center' }}>
                ⚠️ {monPion.nbDeplacements} changement(s) — hésitation enregistrée
              </div>
            ) : null}
          </div>
        )}

        {phase === 'vote' && <VotePlayer monVote={monVote} onVoter={onVoter} />}
        {phase === 'decompte' && resultat && (
          <>
            <ResultatPanel resultat={resultat} compact />
            {(() => {
              const monScore = resultat.scoresIndividuels?.find((s: any) => s.playerId === playerId);
              if (!monScore) return null;
              const profils: Record<string, { label: string; couleur: string; desc: string }> = {
                intuition: { label: '🏆 Punctum instantané', couleur: '#10B981', desc: 'Tu as vu juste dès le signal. Intuition pure.' },
                construit: { label: '🎯 Punctum construit', couleur: '#3B82F6', desc: 'Tu as trouvé après quelques déplacements.' },
                tardif: { label: '💭 Punctum tardif', couleur: '#EAB308', desc: 'Tu as trouvé après plusieurs déplacements.' },
                perdu: { label: '❌ Angle mort', couleur: '#EF4444', desc: 'Tu es resté dans le mauvais cadran. Tu reçois le jeton Violet (droit de question).' },
                abandon: { label: '⚪ Abandon', couleur: '#6B7280', desc: 'Tu as choisi neutre. Le pion n\'est pas compté.' },
              };
              const p = profils[monScore.profil] || profils.abandon;
              return (
                <div style={{ padding: 16, background: '#FBF8EF', borderRadius: 6, border: `2px solid ${p.couleur}` }}>
                  <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.6 }}>
                    Ton profil individuel
                  </div>
                  <div style={{ fontFamily: 'Georgia, serif', fontSize: 16, fontWeight: 700, marginTop: 6, color: p.couleur }}>
                    {p.label}
                  </div>
                  <div style={{ fontSize: 12, marginTop: 4, color: '#14171B', opacity: 0.8 }}>
                    {p.desc}
                  </div>
                  <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 11, fontFamily: 'ui-monospace, monospace', opacity: 0.6 }}>
                    <span>Position finale : <b>{monScore.positionFinale || '—'}</b></span>
                    <span>Déplacements : <b>{monScore.nbDeplacements}</b></span>
                    <span>{monScore.dansLeBonCadran ? '✅ Dans le juste' : '❌ Hors du juste'}</span>
                  </div>
                </div>
              );
            })()}
          </>
        )}
        <AudioPermission label="Visio joueur" />
      </div>
    </div>
  );
}

// ============================================================
// SOUS-COMPOSANTS
// ============================================================
function ControlsFacilitator({
  phase,
  onSetPhase,
  onVerrouiller,
  onLancerDecompte,
  onCarteSuivante,
  cardIdx,
  totalCartes,
}: any) {
  const btnStyle: React.CSSProperties = {
    padding: '10px 14px',
    border: '1px solid #14171B',
    background: '#14171B',
    color: '#FBF8EF',
    borderRadius: 4,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div
        style={{
          padding: 12,
          background: '#FBF8EF',
          borderRadius: 6,
          border: '1px solid rgba(20,23,27,0.15)',
          fontSize: 11,
          fontFamily: 'ui-monospace, monospace',
        }}
      >
        Carte {cardIdx + 1} / {totalCartes}
      </div>
      {phase === 'cadrage' && (
        <button style={btnStyle} onClick={() => onSetPhase('signal')}>
          ▶ Démarrer la partie
        </button>
      )}
      {phase === 'signal' && (
        <button
          style={btnStyle}
          onClick={() => {
            onVerrouiller();
            onSetPhase('situation');
          }}
        >
          ✓ Verrouiller les pions (jaune)
        </button>
      )}
      {phase === 'situation' && (
        <button style={btnStyle} onClick={() => onSetPhase('reaction')}>
          ▶ Lancer la réaction
        </button>
      )}
      {phase === 'reaction' && (
        <button style={btnStyle} onClick={() => onSetPhase('argumentation')}>
          ▶ Lancer l'argumentation
        </button>
      )}
      {phase === 'argumentation' && (
        <button style={btnStyle} onClick={() => onSetPhase('vote')}>
          ▶ Passer au vote
        </button>
      )}
      {phase === 'vote' && (
        <button style={btnStyle} onClick={onLancerDecompte}>
          ✓ Révéler le résultat
        </button>
      )}
      {phase === 'decompte' && (
        <button style={btnStyle} onClick={onCarteSuivante}>
          {cardIdx + 1 >= totalCartes ? '▶ Fermer avec les 3 ALL' : '▶ Carte suivante'}
        </button>
      )}
    </div>
  );
}

function PhaseBar({ phase, onSetPhase, nbJoueurs }: any) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 8,
        padding: 12,
        background: '#FBF8EF',
        borderRadius: 6,
        border: '1px solid rgba(20,23,27,0.15)',
        flexWrap: 'wrap',
        alignItems: 'center',
      }}
    >
      <span
        style={{
          fontFamily: 'ui-monospace, monospace',
          fontSize: 10,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          opacity: 0.5,
          marginRight: 8,
        }}
      >
        Phase :
      </span>
      {['signal', 'situation', 'reaction', 'argumentation', 'vote', 'decompte'].map((p) => (
        <button
          key={p}
          onClick={() => onSetPhase(p)}
          style={{
            padding: '6px 12px',
            fontSize: 11,
            fontWeight: 600,
            border: phase === p ? '2px solid #14171B' : '1px solid rgba(20,23,27,0.2)',
            background: phase === p ? '#FDE047' : '#FFFFFF',
            color: '#14171B',
            borderRadius: 4,
            cursor: 'pointer',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          {p}
        </button>
      ))}
      <span style={{ marginLeft: 'auto', fontSize: 11, opacity: 0.5 }}>→ {nbJoueurs} joueurs</span>
    </div>
  );
}

function VotePanel({ votes, joueurs }: any) {
  const reste = votes.filter((v: Vote) => v.choix === 'reste').length;
  const bouge = votes.filter((v: Vote) => v.choix === 'bouge').length;
  const neutre = votes.filter((v: Vote) => v.choix === 'neutre').length;
  return (
    <div style={{ padding: 16, background: '#FBF8EF', borderRadius: 6, border: '1px solid rgba(20,23,27,0.15)' }}>
      <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 32, fontWeight: 700, color: '#EAB308' }}>{reste}</div>
          <div style={{ fontSize: 11, opacity: 0.6 }}>Reste</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 32, fontWeight: 700, color: '#EF4444' }}>{bouge}</div>
          <div style={{ fontSize: 11, opacity: 0.6 }}>Bouge</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 32, fontWeight: 700, color: '#6B7280' }}>{neutre}</div>
          <div style={{ fontSize: 11, opacity: 0.6 }}>Neutre</div>
        </div>
      </div>
      <div style={{ marginTop: 12, fontSize: 11, opacity: 0.6, textAlign: 'center' }}>
        {votes.length}/{joueurs.length} votes
      </div>
    </div>
  );
}

function VotePlayer({ monVote, onVoter }: any) {
  const vR = monVote?.choix === 'reste';
  const vB = monVote?.choix === 'bouge';
  const vN = monVote?.choix === 'neutre';
  return (
    <div style={{ padding: 16, background: '#FBF8EF', borderRadius: 6, border: '1px solid rgba(20,23,27,0.15)', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.6, textAlign: 'center' }}>
        Vote final
      </div>
      <div style={{ fontSize: 11, opacity: 0.7, textAlign: 'center', marginBottom: 4 }}>
        💡 Clique un cadran pour bouger la carte · ou <b>Reste</b> / <b>Neutre</b>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        <button
          onClick={() => onVoter('reste')}
          style={{ padding: 14, background: vR ? '#FDE047' : '#FFFFFF', color: '#14171B', border: vR ? '3px solid #14171B' : '2px solid rgba(20,23,27,0.3)', borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
        >
          {vR ? '✓ Reste' : 'Reste'}
        </button>
        <button
          onClick={() => onVoter('bouge')}
          style={{ padding: 14, background: vB ? '#EF4444' : '#FFFFFF', color: vB ? '#FFFFFF' : '#14171B', border: vB ? '3px solid #14171B' : '2px solid rgba(20,23,27,0.3)', borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
        >
          {vB ? '✓ Bouge' : 'Bouge'}
        </button>
        <button
          onClick={() => onVoter('neutre')}
          style={{ padding: 14, background: vN ? '#6B7280' : '#FFFFFF', color: vN ? '#FFFFFF' : '#14171B', border: vN ? '3px solid #14171B' : '2px solid rgba(20,23,27,0.3)', borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
        >
          {vN ? '✓ Neutre' : 'Neutre'}
        </button>
      </div>
    </div>
  );
}

// ============================================================
// RESULTAT PANEL — enrichi avec arbitrage repliable (facilitateur)
// ============================================================
function ResultatPanel({
  resultat,
  carte,
  compact,
  showArbitrage = false,
}: {
  resultat: ResultatCarte;
  carte?: any;
  compact?: boolean;
  showArbitrage?: boolean;
}) {
  const [arbitrageOpen, setArbitrageOpen] = useState(false);
  const couleur = COULEUR_CONDITION[resultat.condition];
  const estVide = resultat.condition === 'en_attente' || resultat.condition === 'egalite';
  const arbitrage: string | undefined = carte?.arbitrage || (resultat as any)?.arbitrage;

  return (
    <div style={{ padding: compact ? 12 : 16, background: '#14171B', color: '#FBF8EF', borderRadius: 6 }}>
      <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.6 }}>
        Résultat • {resultat.cardId}
      </div>
      <div style={{ fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: 700, marginTop: 6, color: estVide ? '#9CA3AF' : couleur }}>
        {LIBELLE_CONDITION[resultat.condition]}
      </div>
      <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>{DESCRIPTION_CONDITION[resultat.condition]}</div>

      {!estVide && (
        <>
          <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 11, fontFamily: 'ui-monospace, monospace', opacity: 0.7 }}>
            <span>JAUNES : {resultat.pointsJaunes} pts{resultat.jetonDonne === 'lucidite' ? ' + Lucidité' : ''}</span>
            <span>ROUGES : {resultat.pointsRouges} pts{resultat.jetonDonne === 'priorite' ? ' + Priorité' : ''}</span>
            {resultat.jetonDonne === 'violet' && <span>+ Violet ?</span>}
          </div>

          {/* Couche QCM */}
          {resultat.quadrantCorrect && (
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.15)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 11, fontFamily: 'ui-monospace, monospace', opacity: 0.6 }}>
                  🎯 CADRAN CORRECT
                </span>
                <span style={{ padding: '3px 10px', borderRadius: 4, background: '#10B981', color: '#FFFFFF', fontSize: 13, fontWeight: 700, fontFamily: 'ui-monospace, monospace' }}>
                  {resultat.quadrantCorrect}
                </span>
                <span style={{ fontSize: 12, opacity: 0.7, marginLeft: 'auto', fontFamily: 'ui-monospace, monospace' }}>
                  {resultat.nbOntVuJuste || 0}/{resultat.totalJoueurs || 0} ont vu juste
                </span>
              </div>
              {resultat.explication && (
                <div style={{ marginTop: 10, padding: 10, background: 'rgba(255,255,255,0.05)', borderRadius: 4, fontSize: 12, lineHeight: 1.6, fontStyle: 'italic', opacity: 0.9 }}>
                  {resultat.explication}
                </div>
              )}

              {/* ARBITRAGE SCIENTIFIQUE — repliable, facilitateur uniquement */}
              {showArbitrage && arbitrage && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.15)' }}>
                  <button
                    onClick={() => setArbitrageOpen((v) => !v)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: arbitrageOpen ? '#FDE047' : 'rgba(255,255,255,0.08)',
                      color: arbitrageOpen ? '#14171B' : '#FBF8EF',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontFamily: 'ui-monospace, monospace',
                      letterSpacing: '0.08em',
                    }}
                  >
                    <span>🔍 VOIR L'ARBITRAGE SCIENTIFIQUE</span>
                    <span style={{ fontSize: 10 }}>{arbitrageOpen ? '▲ FERMER' : '▼ OUVRIR'}</span>
                  </button>
                  {arbitrageOpen && (
                    <div
                      style={{
                        marginTop: 10,
                        padding: 14,
                        background: '#F7F2E9',
                        color: '#14171B',
                        borderRadius: 4,
                        fontSize: 13,
                        lineHeight: 1.7,
                        fontStyle: 'italic',
                      }}
                    >
                      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.15em', marginBottom: 8, fontStyle: 'normal', opacity: 0.7 }}>
                        LIVRET DE RÉPONSES — FACILITATEUR
                      </div>
                      {arbitrage}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function JoueursList({ joueurs, pions, votes }: any) {
  return (
    <div style={{ padding: 12, background: '#FBF8EF', borderRadius: 6, border: '1px solid rgba(20,23,27,0.15)' }}>
      <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.5, marginBottom: 8 }}>
        Joueurs ({joueurs.length})
      </div>
      {joueurs.map((j: Joueur) => {
        const p = pions.find((pp: Pion) => pp.playerId === j.id);
        const v = votes.find((vv: Vote) => vv.playerId === j.id);
        const qLabel = p ? String(p.quadrantActuel || '—') : '—';
        const cLabel = p ? String(p.couleur || '—') : '—';
        const vLabel = v ? String(v.choix) : '';
        return (
          <div key={j.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px', fontSize: 12, borderBottom: '1px solid rgba(20,23,27,0.05)' }}>
            <span>{j.nick}</span>
            <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, opacity: 0.6 }}>
              <span>{qLabel}</span>
              <span>{' • '}</span>
              <span>{cLabel}</span>
              {vLabel ? <span>{' • '}</span> : null}
              {vLabel ? <span>{vLabel}</span> : null}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function DureeControl({ dureeArgSec, setDureeArgSec }: any) {
  return (
    <div style={{ padding: 12, background: '#FBF8EF', borderRadius: 6, border: '1px solid rgba(20,23,27,0.15)' }}>
      <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.5, marginBottom: 8 }}>
        Durée argumentation : {Math.floor(dureeArgSec / 60)} min
      </div>
      <input
        type="range"
        min={240}
        max={360}
        step={30}
        value={dureeArgSec}
        onChange={(e) => setDureeArgSec(parseInt(e.target.value, 10))}
        style={{ width: '100%' }}
      />
    </div>
  );
}