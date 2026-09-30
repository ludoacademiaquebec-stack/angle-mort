'use client';
import React, { Suspense, useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// ============================================================
// UTILITAIRES D'ANALYSE
// ============================================================

function compter3(votes: any[]) {
  let r = 0, b = 0, n = 0;
  for (const v of votes) {
    const q = (v.to_quadrant || v.choix || '').toLowerCase();
    if (q === 'reste') r++;
    else if (q === 'bouge') b++;
    else if (q === 'neutre') n++;
  }
  const tot = r + b + n || 1;
  let majorite = 'egalite';
  if (r === 0 && b === 0 && n === 0) majorite = 'aucun vote';
  else if (r > b && r > n) majorite = 'reste';
  else if (b > r && b > n) majorite = 'bouge';
  else if (n > r && n > b) majorite = 'neutre (abstention)';
  return {
    reste: r, bouge: b, neutre: n, total: r + b + n,
    pr: Math.round(r / tot * 100),
    pb: Math.round(b / tot * 100),
    pn: Math.round(n / tot * 100),
    majorite,
  };
}

/**
 * Analyse complète d'un joueur : tendance, archétype, familles préférées, alignement.
 */
function analyserJoueur(votes: any[], cardsDiag: Record<string, any>, engagements: any[]) {
  const total = votes.length;
  let reste = 0, bouge = 0, neutre = 0;
  const parFamille: Record<string, { r: number; b: number; n: number }> = {};
  const cartesVotees = new Set<string>();

  for (const v of votes) {
    const q = (v.to_quadrant || v.choix || '').toLowerCase();
    const cardId = v.question_id || v.metadata?.question_id || 'unknown';
    cartesVotees.add(cardId);
    const card = cardsDiag[cardId];
    const fam = card?.famille || 'AUTRE';
    if (!parFamille[fam]) parFamille[fam] = { r: 0, b: 0, n: 0 };
    if (q === 'reste') { reste++; parFamille[fam].r++; }
    else if (q === 'bouge') { bouge++; parFamille[fam].b++; }
    else if (q === 'neutre') { neutre++; parFamille[fam].n++; }
  }

  const tauxHesitation = total ? Math.round(neutre / total * 100) : 0;
  const tauxBouge = total ? Math.round(bouge / total * 100) : 0;
  const tauxReste = total ? Math.round(reste / total * 100) : 0;

  let archetype = 'Équilibré';
  let archetypeEmoji = '⚖️';
  if (total === 0) { archetype = 'Silencieux'; archetypeEmoji = '🤐'; }
  else if (tauxHesitation >= 50) { archetype = 'Hésitant / Prudent'; archetypeEmoji = '🤔'; }
  else if (tauxBouge >= 60) { archetype = 'Progressiste / Transformateur'; archetypeEmoji = '🚀'; }
  else if (tauxReste >= 60) { archetype = 'Conservateur / Stabilisateur'; archetypeEmoji = '🛡️'; }
  else if (tauxBouge > tauxReste + 15) { archetype = 'Légèrement progressiste'; archetypeEmoji = '↗️'; }
  else if (tauxReste > tauxBouge + 15) { archetype = 'Légèrement conservateur'; archetypeEmoji = '↘️'; }

  // Famille la plus votée et famille la plus "hésitée"
  const familles = Object.entries(parFamille);
  let familleTop = '—';
  let familleSensible = '—';
  if (familles.length > 0) {
    familleTop = familles.reduce((a, b) => (a[1].r + a[1].b + a[1].n >= b[1].r + b[1].b + b[1].n ? a : b))[0];
    const sensibles = familles.filter(([, v]) => v.n > 0).sort((a, b) => b[1].n - a[1].n);
    if (sensibles.length > 0) familleSensible = sensibles[0][0];
  }

  // Engagements pris par ce joueur (session_depots peut contenir des engagements)
  const engagementsJoueur = engagements.length;

  // Verdict RH personnalisé
  let verdictRH = '';
  if (total === 0) verdictRH = "Ce joueur n'a pas participé aux votes — à re-engager sur la prochaine session.";
  else if (archetype.includes('Conservateur')) verdictRH = "Profil stable, prudent face au changement. Utile comme point d'ancrage, à sensibiliser sur les angles morts.";
  else if (archetype.includes('Progressiste')) verdictRH = "Profil moteur, prêt à transformer. Attention au risque d'aller plus vite que le collectif.";
  else if (archetype.includes('Hésitant')) verdictRH = "Beaucoup d'abstentions : soit sujet sensible pour ce profil, soit besoin de plus d'information avant de trancher.";
  else verdictRH = "Profil équilibré, capable de trancher selon le contexte. Bon candidat pour animer les débats.";

  return {
    total, reste, bouge, neutre,
    tauxHesitation, tauxBouge, tauxReste,
    archetype, archetypeEmoji,
    parFamille, familleTop, familleSensible,
    engagements: engagementsJoueur,
    verdictRH,
    cartesVotees: cartesVotees.size,
  };
}

/**
 * Analyse collective de l'entreprise (entité).
 */
function analyserEntreprise(byCard: any[], global: any, players: any[], events: any[]) {
  // Répartition par famille
  const parFamille: Record<string, { r: number; b: number; n: number; cartes: number }> = {};
  for (const c of byCard) {
    const fam = c.card?.famille || 'AUTRE';
    if (!parFamille[fam]) parFamille[fam] = { r: 0, b: 0, n: 0, cartes: 0 };
    parFamille[fam].r += c.reste;
    parFamille[fam].b += c.bouge;
    parFamille[fam].n += c.neutre;
    parFamille[fam].cartes += 1;
  }

  // Carte la plus "hésitée" (le plus de neutres)
  const carteSensible = byCard.slice().sort((a, b) => b.neutre - a.neutre)[0];
  // Carte la plus "bougée"
  const carteBouge = byCard.slice().sort((a, b) => b.bouge - a.bouge)[0];
  // Carte la plus "résistée"
  const carteReste = byCard.slice().sort((a, b) => b.reste - a.reste)[0];

  // Indice d'engagement : votes par joueur
  const nbJoueurs = players.length || new Set(events.map(e => e.player_id)).size || 1;
  const indiceEngagement = Math.round((global.total / nbJoueurs) * 10) / 10;

  // Verdict collectif
  let tendance = 'Équilibrée';
  let tendanceCouleur = '#E5E7EB';
  if (global.pr >= 55) { tendance = 'Conservatrice (Reste dominant)'; tendanceCouleur = '#FDE047'; }
  else if (global.pb >= 55) { tendance = 'Transformative (Bouge dominant)'; tendanceCouleur = '#FCA5A5'; }
  else if (global.pn >= 40) { tendance = 'Évitante (forte abstention)'; tendanceCouleur = '#D1D5DB'; }

  // Zone d'angle mort dominante (quadrant le plus fréquent parmi les cartes sensibles)
  const quadrantSensible = carteSensible?.card?.quadrant_correct || '—';

  return {
    parFamille,
    carteSensible,
    carteBouge,
    carteReste,
    nbJoueurs,
    indiceEngagement,
    tendance,
    tendanceCouleur,
    quadrantSensible,
  };
}

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================

function RapportContent() {
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

  const load = async (sid: string) => {
    if (!sid) return;
    const { data: s } = await supabase.from('sessions').select('*').eq('id', sid).single();
    const { data: ev } = await supabase.from('session_events').select('*').eq('session_id', sid).order('created_at', { ascending: true });
    const { data: pi } = await supabase.from('session_pions').select('*').eq('session_id', sid);
    const { data: de } = await supabase.from('session_depots').select('*').eq('session_id', sid);
    const { data: pl } = await supabase.from('session_players').select('*').eq('session_id', sid);
    const { data: res } = await supabase.from('session_resultats').select('*').eq('session_id', sid).order('card_index', { ascending: true });
    const { data: cd } = await supabase.from('cards_diag').select('*');
    const { data: ca } = await supabase.from('cards_all').select('*');
    setSess(s);
    setEvents(ev || []);
    setPions(pi || []);
    setDepots(de || []);
    setPlayers(pl || []);
    setResultats(res || []);
    if (cd) { const m: Record<string, any> = {}; cd.forEach((c: any) => m[c.id] = c); setCardsDiag(m); }
    if (ca) { const m: Record<string, any> = {}; ca.forEach((c: any) => m[c.id] = c); setCardsAll(m); }
    if (s?.facilitator_id) {
      const { data: f } = await supabase.from('facilitators').select('*').eq('id', s.facilitator_id).single();
      setFacilitator(f);
    }
  };

  useEffect(() => { if (sessionId) load(sessionId); }, [sessionId]);

  // ─── Agrégation par carte ─────────────────────────────────
  const byCard = useMemo(() => {
    const paris = events.filter(e => e.type === 'pari');
    const map = new Map<string, any[]>();
    for (const e of paris) {
      const cid = e.question_id || e.metadata?.question_id || e.metadata?.cardId || 'unknown';
      if (!map.has(cid)) map.set(cid, []);
      map.get(cid)!.push(e);
    }
    return Array.from(map.entries()).map(([cardId, votes]) => {
      const stats = compter3(votes);
      const res = resultats.find((r: any) => r.card_id === cardId);
      const card = cardsDiag[cardId] || {};
      return { cardId, card, res, votes, ...stats };
    });
  }, [events, resultats, cardsDiag]);

  // ─── Global ──────────────────────────────────────────────
  const global = useMemo(() => compter3(events.filter(e => e.type === 'pari')), [events]);

  // ─── Analyse entreprise ──────────────────────────────────
  const entreprise = useMemo(
    () => analyserEntreprise(byCard, global, players, events),
    [byCard, global, players, events]
  );

  // ─── Analyse joueur par joueur ───────────────────────────
  const profilsJoueurs = useMemo(() => {
    const paris = events.filter(e => e.type === 'pari');
    // Regroupe les votes par joueur
    const map = new Map<string, any[]>();
    for (const e of paris) {
      const pid = e.player_id || 'inconnu';
      if (!map.has(pid)) map.set(pid, []);
      map.get(pid)!.push(e);
    }
    // Récupère les infos des joueurs depuis session_players si dispo
    const infosPlayers = new Map<string, any>();
    for (const p of players) {
      if (p.id) infosPlayers.set(p.id, p);
      if (p.player_id) infosPlayers.set(p.player_id, p);
    }
    // Construit le profil de chaque joueur
    const profils: any[] = [];
    for (const [pid, votes] of map.entries()) {
      const info = infosPlayers.get(pid) || {};
      const engagementsJoueur = depots.filter((d: any) => d.player_id === pid);
      const analyse = analyserJoueur(votes, cardsDiag, engagementsJoueur);
      profils.push({
        playerId: pid,
        nick: info.nick || info.name || info.pseudo || (votes[0]?.player_nick) || `Joueur ${pid.slice(0, 6)}`,
        ...analyse,
      });
    }
    // Ajoute les joueurs sans vote
    for (const p of players) {
      const pid = p.id || p.player_id;
      if (pid && !map.has(pid)) {
        const analyse = analyserJoueur([], cardsDiag, []);
        profils.push({
          playerId: pid,
          nick: p.nick || p.name || p.pseudo || `Joueur ${pid.slice(0, 6)}`,
          ...analyse,
        });
      }
    }
    // Tri : par nombre de votes décroissant
    return profils.sort((a, b) => b.total - a.total);
  }, [events, players, depots, cardsDiag]);

  // ─── Observations automatiques ───────────────────────────
  const observations = useMemo(() => {
    const obs: string[] = [];
    if (global.total === 0) {
      obs.push("Aucun vote enregistré pour cette session — le rapport est structurel uniquement.");
      return obs;
    }
    // Tendance générale
    if (global.pr >= 55) obs.push(`Le collectif se positionne majoritairement en RESTE (${global.pr}%), signalant une culture prudente face au changement.`);
    else if (global.pb >= 55) obs.push(`Le collectif se positionne majoritairement en BOUGE (${global.pb}%), signalant une forte volonté de transformation.`);
    else if (global.pn >= 40) obs.push(`Taux d'abstention élevé (${global.pn}%) : le collectif évite de trancher, ce qui est souvent le symptôme d'un angle mort sensible.`);
    else obs.push(`Répartition équilibrée (R:${global.pr}% B:${global.pb}% N:${global.pn}%) — le collectif est polarisé sur les enjeux présentés.`);

    // Carte la plus sensible
    if (entreprise.carteSensible?.neutre > 0) {
      obs.push(`La carte "${entreprise.carteSensible.card?.titre || entreprise.carteSensible.cardId}" a généré le plus d'abstentions (${entreprise.carteSensible.neutre} neutres) — angle mort à explorer en priorité.`);
    }
    // Carte la plus transformée
    if (entreprise.carteBouge?.bouge > 0) {
      obs.push(`La carte "${entreprise.carteBouge.card?.titre || entreprise.carteBouge.cardId}" a le plus mobilisé vers le BOUGE (${entreprise.carteBouge.bouge} votes) — levier de transformation identifié.`);
    }
    // Famille dominante
    const famillesTriees = Object.entries(entreprise.parFamille)
      .map(([fam, v]) => ({ fam, total: v.r + v.b + v.n, n: v.n }))
      .sort((a, b) => b.total - a.total);
    if (famillesTriees[0]) {
      obs.push(`Famille la plus débattue : ${famillesTriees[0].fam} (${famillesTriees[0].total} votes).`);
    }
    // Indice d'engagement
    obs.push(`Indice d'engagement : ${entreprise.indiceEngagement} votes par joueur en moyenne (${entreprise.nbJoueurs} joueurs).`);
    // Archétypes joueurs
    const archetypes: Record<string, number> = {};
    for (const p of profilsJoueurs) archetypes[p.archetype] = (archetypes[p.archetype] || 0) + 1;
    const archetypeDominant = Object.entries(archetypes).sort((a, b) => b[1] - a[1])[0];
    if (archetypeDominant) obs.push(`Archétype joueur dominant : "${archetypeDominant[0]}" (${archetypeDominant[1]} joueurs).`);

    return obs;
  }, [global, entreprise, profilsJoueurs]);

  // ─── Rendu : pas de sessionId ────────────────────────────
  if (!sessionId) {
    return (
      <div style={{ minHeight: '100vh', background: '#FFFEF9', padding: 40 }}>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 28 }}>Rapport Profond — Angle Mort</h1>
        <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
          <input value={inputId} onChange={e => setInputId(e.target.value)} placeholder="UUID session" style={{ padding: 10, border: '1px solid #14171B', borderRadius: 6, width: 400 }} />
          <button onClick={() => { if (inputId) window.location.href = `/rapport-profond?sessionId=${inputId}`; }} style={{ padding: '10px 20px', background: '#14171B', color: '#FFF', borderRadius: 6 }}>Charger</button>
        </div>
      </div>
    );
  }

  if (!sess) return <div style={{ padding: 40 }}>Chargement session {sessionId}...</div>;

  // ─── Rendu principal ─────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#FFFEF9', color: '#14171B', padding: 24 }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>

        {/* ══════════════════════════════════════════════════ */}
        {/* EN-TÊTE ENTREPRISE                                  */}
        {/* ══════════════════════════════════════════════════ */}
        <div style={{ background: '#14171B', color: '#FFF', borderRadius: 16, padding: 24, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 11, letterSpacing: '0.2em', opacity: 0.6 }}>ANGLE MORT — RAPPORT PROFOND</div>
              <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 36, margin: '8px 0' }}>{sess.company || 'Entreprise non renseignée'}</h1>
              <div style={{ fontSize: 14, opacity: 0.8 }}>
                {sess.code} • {new Date(sess.started_at || sess.created_at).toLocaleString('fr-CA', { dateStyle: 'full', timeStyle: 'short' })} • {players.length || pions.length} joueurs
              </div>
              <div style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>
                ID {sess.id} • Facilitateur {facilitator?.name || facilitator?.code || sess.facilitator_id?.slice(0, 8) || '—'} • Phase {sess.phase} • Status {sess.status}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, opacity: 0.6 }}>VOTES</div>
              <div style={{ fontSize: 32, fontWeight: 800 }}>{global.total}</div>
              <div style={{ fontSize: 11 }}>Hésitation {global.total ? Math.round(global.neutre / global.total * 100) : 0}% • Neutre {global.neutre}</div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════ */}
        {/* CHIFFRES CLÉS                                       */}
        {/* ══════════════════════════════════════════════════ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 20 }}>
          <div style={{ background: '#FFF', border: '1px solid #14171B', borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 10, opacity: 0.6 }}>ENTREPRISE</div>
            <div style={{ fontWeight: 800 }}>{sess.company || '—'}</div>
            <div style={{ fontSize: 11, opacity: 0.6 }}>{sess.code}</div>
          </div>
          <div style={{ background: '#FFF', border: '1px solid #14171B', borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 10, opacity: 0.6 }}>JOUEURS</div>
            <div style={{ fontSize: 24, fontWeight: 800 }}>{players.length || pions.length || 0}</div>
            <div style={{ fontSize: 11 }}>{depots.length} dépôts</div>
          </div>
          <div style={{ background: '#FDE047', border: '1px solid #14171B', borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 10 }}>CARTES DIAG</div>
            <div style={{ fontSize: 24, fontWeight: 800 }}>{byCard.length}</div>
            <div style={{ fontSize: 11 }}>{byCard.map((c: any) => c.card?.famille || c.cardId.slice(0, 3)).join(', ')}</div>
          </div>
          <div style={{ background: '#14171B', color: '#FFF', borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 10, opacity: 0.6 }}>TOTAL PARIS</div>
            <div style={{ fontSize: 24, fontWeight: 800 }}>{global.total}</div>
            <div style={{ fontSize: 11 }}>R:{global.reste} B:{global.bouge} N:{global.neutre}</div>
          </div>
          <div style={{ background: global.neutre > 0 ? '#E5E7EB' : '#FFF3CD', border: '1px solid #14171B', borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 10 }}>HÉSITATION</div>
            <div style={{ fontSize: 24, fontWeight: 800 }}>{global.neutre} ({global.total ? Math.round(global.neutre / global.total * 100) : 0}%)</div>
            <div style={{ fontSize: 11 }}>{global.neutre === 0 ? 'Aucun vote neutre — engagement tranché' : 'Forte abstention — sujet sensible'}</div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════ */}
        {/* GLOBAL 3 COULEURS                                   */}
        {/* ══════════════════════════════════════════════════ */}
        <div style={{ background: '#FFF', border: '2px solid #14171B', borderRadius: 12, padding: 16, marginBottom: 20 }}>
          <div style={{ fontWeight: 800, marginBottom: 10 }}>RÉPARTITION GLOBALE — Chaque carte associée à chaque vote (question_id = carte.id)</div>
          <div style={{ display: 'flex', height: 36, borderRadius: 10, overflow: 'hidden', border: '2px solid #14171B' }}>
            <div style={{ width: `${global.pr}%`, minWidth: global.reste > 0 ? '80px' : '2px', background: '#FDE047', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13 }}>
              RESTE {global.pr}% ({global.reste})
            </div>
            <div style={{ width: `${global.pb}%`, minWidth: global.bouge > 0 ? '80px' : '2px', background: '#EF4444', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13 }}>
              BOUGE {global.pb}% ({global.bouge})
            </div>
            <div style={{ width: `${global.pn}%`, minWidth: '120px', background: global.neutre === 0 ? '#F3F4F6' : '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, borderLeft: global.neutre === 0 ? '2px dashed #999' : '' }}>
              {global.neutre === 0 ? `NEUTRE 0% (0) — personne n'a voté neutre` : `NEUTRE ${global.pn}% (${global.neutre})`}
            </div>
          </div>
          <div style={{ marginTop: 8, fontSize: 12 }}>
            Majorité globale : <b>{global.majorite}</b>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════ */}
        {/* NOUVEAU : PROFIL ENTREPRISE (ENTITÉ)                */}
        {/* ══════════════════════════════════════════════════ */}
        <div style={{ background: '#FFF', border: '2px solid #14171B', borderRadius: 16, padding: 24, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 24, margin: 0 }}>🏢 Profil de l'entreprise</h2>
            <div style={{ fontSize: 11, padding: '6px 14px', borderRadius: 20, background: entreprise.tendanceCouleur, border: '1px solid #14171B', fontWeight: 700 }}>
              {entreprise.tendance}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
            <div style={{ background: '#F9F9F7', borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 10, opacity: 0.6 }}>INDICE ENGAGEMENT</div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{entreprise.indiceEngagement}</div>
              <div style={{ fontSize: 11 }}>votes / joueur</div>
            </div>
            <div style={{ background: '#F9F9F7', borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 10, opacity: 0.6 }}>CARTE LA + SENSIBLE</div>
              <div style={{ fontSize: 13, fontWeight: 700, marginTop: 4 }}>{entreprise.carteSensible?.card?.titre || '—'}</div>
              <div style={{ fontSize: 11 }}>{entreprise.carteSensible?.neutre || 0} abstentions</div>
            </div>
            <div style={{ background: '#F9F9F7', borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 10, opacity: 0.6 }}>CARTE LA + TRANSFORMÉE</div>
              <div style={{ fontSize: 13, fontWeight: 700, marginTop: 4 }}>{entreprise.carteBouge?.card?.titre || '—'}</div>
              <div style={{ fontSize: 11 }}>{entreprise.carteBouge?.bouge || 0} votes BOUGE</div>
            </div>
            <div style={{ background: '#F9F9F7', borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 10, opacity: 0.6 }}>ZONE ANGLE MORT</div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{entreprise.quadrantSensible}</div>
              <div style={{ fontSize: 11 }}>quadrant dominant</div>
            </div>
          </div>

          {/* Répartition par famille */}
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Répartition par famille de cartes</div>
          <div style={{ display: 'grid', gap: 8 }}>
            {Object.entries(entreprise.parFamille).map(([fam, v]: any) => {
              const tot = v.r + v.b + v.n || 1;
              return (
                <div key={fam} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 60, fontWeight: 700, fontFamily: 'monospace', fontSize: 13 }}>{fam}</div>
                  <div style={{ flex: 1, height: 24, borderRadius: 6, overflow: 'hidden', border: '1px solid #14171B', display: 'flex' }}>
                    <div style={{ width: `${Math.round(v.r / tot * 100)}%`, background: '#FDE047', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>{v.r > 0 ? v.r : ''}</div>
                    <div style={{ width: `${Math.round(v.b / tot * 100)}%`, background: '#EF4444', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>{v.b > 0 ? v.b : ''}</div>
                    <div style={{ width: `${Math.round(v.n / tot * 100)}%`, background: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>{v.n > 0 ? v.n : ''}</div>
                  </div>
                  <div style={{ width: 100, fontSize: 11, opacity: 0.7 }}>{v.cartes} carte{v.cartes > 1 ? 's' : ''}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════ */}
        {/* NOUVEAU : PROFIL DES JOUEURS                        */}
        {/* ══════════════════════════════════════════════════ */}
        <div style={{ background: '#FFF', border: '2px solid #14171B', borderRadius: 16, padding: 24, marginBottom: 20 }}>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 24, margin: 0, marginBottom: 16 }}>
            👥 Profil des joueurs ({profilsJoueurs.length})
          </h2>
          <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 16 }}>
            Retour individuel pour chaque participant — utile pour un debrief RH personnalisé.
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 12 }}>
            {profilsJoueurs.map((p: any) => {
              const tot = p.reste + p.bouge + p.neutre || 1;
              return (
                <div key={p.playerId} style={{ background: '#F9F9F7', border: '1px solid #14171B', borderRadius: 12, padding: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 15 }}>{p.nick}</div>
                      <div style={{ fontSize: 10, opacity: 0.6, fontFamily: 'monospace' }}>{p.playerId?.slice(0, 12)}</div>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, padding: '4px 10px', background: '#FDE047', border: '1px solid #14171B', borderRadius: 20 }}>
                      {p.archetypeEmoji} {p.archetype}
                    </div>
                  </div>

                  {/* Mini barre R/B/N */}
                  <div style={{ display: 'flex', height: 20, borderRadius: 4, overflow: 'hidden', border: '1px solid #14171B', marginBottom: 8 }}>
                    <div style={{ width: `${Math.round(p.reste / tot * 100)}%`, background: '#FDE047', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>{p.reste > 0 ? p.reste : ''}</div>
                    <div style={{ width: `${Math.round(p.bouge / tot * 100)}%`, background: '#EF4444', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>{p.bouge > 0 ? p.bouge : ''}</div>
                    <div style={{ width: `${Math.round(p.neutre / tot * 100)}%`, background: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>{p.neutre > 0 ? p.neutre : ''}</div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 11 }}>
                    <div>Total votes : <b>{p.total}</b></div>
                    <div>Hésitation : <b>{p.tauxHesitation}%</b></div>
                    <div>Famille top : <b>{p.familleTop}</b></div>
                    <div>Famille sensible : <b>{p.familleSensible}</b></div>
                    <div>Engagements : <b>{p.engagements}</b></div>
                    <div>Cartes votées : <b>{p.cartesVotees}</b></div>
                  </div>

                  <div style={{ marginTop: 10, padding: 10, background: '#FFF', borderRadius: 6, fontSize: 12, lineHeight: 1.5, fontStyle: 'italic', borderLeft: '3px solid #14171B' }}>
                    {p.verdictRH}
                  </div>
                </div>
              );
            })}
            {profilsJoueurs.length === 0 && (
              <div style={{ opacity: 0.6, fontSize: 13 }}>Aucun joueur enregistré pour cette session.</div>
            )}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════ */}
        {/* NOUVEAU : OBSERVATIONS AUTOMATIQUES                 */}
        {/* ══════════════════════════════════════════════════ */}
        <div style={{ background: '#14171B', color: '#FFF', borderRadius: 16, padding: 24, marginBottom: 20 }}>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 22, margin: 0, marginBottom: 12 }}>🔎 Observations automatiques</h2>
          <ol style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8, fontSize: 14 }}>
            {observations.map((o, i) => (
              <li key={i} style={{ marginBottom: 6 }}>{o}</li>
            ))}
          </ol>
        </div>

        {/* ══════════════════════════════════════════════════ */}
        {/* PAR CARTE — DÉTAIL COMPLET + ARBITRAGE              */}
        {/* ══════════════════════════════════════════════════ */}
        <div style={{ display: 'grid', gap: 18 }}>
          {byCard.map((c: any, idx: number) => {
            const card = c.card || {};
            const res = c.res;
            return (
              <div key={c.cardId} style={{ background: '#FFF', border: '1px solid #14171B', borderRadius: 16, padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 10, fontFamily: 'monospace', opacity: 0.6 }}>
                      CARTE {idx + 1} / {byCard.length} • {c.cardId} • {card.famille || '—'} • {card.couleur || ''} • Ordre {card.ordre || ''}
                    </div>
                    <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 22, margin: '4px 0' }}>{card.titre || c.cardId}</h2>
                    <div style={{ fontSize: 12, opacity: 0.7 }}>
                      {card.compteur_label || card.compteur || ''} {card.mot_piege ? `• Mot piège: ${card.mot_piege}` : ''}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, padding: '4px 12px', borderRadius: 20, background: '#14171B', color: '#FFF', fontWeight: 700 }}>
                      {c.majorite} • {c.total} votes • R:{c.reste} B:{c.bouge} N:{c.neutre}
                    </div>
                    {res && (
                      <div style={{ fontSize: 10, marginTop: 6, opacity: 0.6 }}>
                        Signal {res.position_signal} → Finale {res.position_finale} • {res.condition} • Pari gagnant {res.pari_gagnant}
                      </div>
                    )}
                    {card.quadrant_correct && (
                      <div style={{ fontSize: 11, marginTop: 6, padding: '3px 10px', background: '#10B981', color: '#FFF', borderRadius: 20, display: 'inline-block', fontWeight: 700 }}>
                        ✓ Cadran : {card.quadrant_correct}
                      </div>
                    )}
                  </div>
                </div>

                {/* Contenu recto verso */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
                  <div style={{ background: '#FFFEF9', border: '1px solid #eee', borderRadius: 10, padding: 12 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em' }}>SIGNAL</div>
                    <div style={{ marginTop: 6 }}>{card.signal || '—'}</div>
                  </div>
                  <div style={{ background: '#F9FAFB', border: '1px solid #eee', borderRadius: 10, padding: 12 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em' }}>SITUATION</div>
                    <div style={{ marginTop: 6, fontSize: 13 }}>{card.situation || '—'}</div>
                  </div>
                  <div style={{ gridColumn: '1 / span 2', background: '#FFF', border: '2px solid #14171B', borderRadius: 10, padding: 12 }}>
                    <div style={{ fontSize: 10, fontWeight: 800 }}>QUESTION — associée au vote (question_id = carte.id)</div>
                    <div style={{ marginTop: 6, fontWeight: 700, fontSize: 15 }}>{card.question || '—'}</div>
                    {card.extra_texte && (
                      <div style={{ marginTop: 8, fontSize: 12, opacity: 0.8 }}>Extra {card.extra_type}: {card.extra_texte}</div>
                    )}
                  </div>
                </div>

                {/* Graphique 3 couleurs par carte */}
                <div style={{ marginTop: 14 }}>
                  <div style={{ display: 'flex', height: 28, borderRadius: 8, overflow: 'hidden', border: '1px solid #14171B' }}>
                    <div style={{ width: `${c.pr}%`, minWidth: c.reste > 0 ? '40px' : '2px', background: '#FDE047', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800 }}>
                      {c.reste > 0 ? `R ${c.pr}% (${c.reste})` : ''}
                    </div>
                    <div style={{ width: `${c.pb}%`, minWidth: c.bouge > 0 ? '40px' : '2px', background: '#EF4444', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800 }}>
                      {c.bouge > 0 ? `B ${c.pb}% (${c.bouge})` : ''}
                    </div>
                    <div style={{ width: `${c.pn}%`, minWidth: '90px', background: c.neutre === 0 ? '#F3F4F6' : '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, borderLeft: c.neutre === 0 ? '1px dashed #aaa' : '1px solid #14171B' }}>
                      {c.neutre === 0 ? `N 0% (0) — aucun neutre` : `N ${c.pn}% (${c.neutre})`}
                    </div>
                  </div>
                </div>

                {/* ═══ NOUVEAU : ARBITRAGE SCIENTIFIQUE COMPLET ═══ */}
                {card.arbitrage && (
                  <div style={{ marginTop: 16, background: '#F7F2E9', border: '2px solid #14171B', borderRadius: 12, padding: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.15em', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>🔍 ARBITRAGE SCIENTIFIQUE</span>
                      <span style={{ fontSize: 10, opacity: 0.6, fontStyle: 'italic' }}>Livret de réponses — facilitateur</span>
                    </div>
                    <div style={{ fontSize: 13.5, lineHeight: 1.7, fontStyle: 'italic', color: '#14171B' }}>
                      {card.arbitrage}
                    </div>
                  </div>
                )}

                {/* ═══ NOUVEAU : EXPLICATION COURTE (joueur) ═══ */}
                {card.explication && (
                  <div style={{ marginTop: 12, background: '#FFF', border: '1px dashed #14171B', borderRadius: 10, padding: 12 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', marginBottom: 6, opacity: 0.7 }}>
                      💬 EXPLICATION AFFICHÉE AUX JOUEURS
                    </div>
                    <div style={{ fontSize: 13, lineHeight: 1.6 }}>{card.explication}</div>
                  </div>
                )}

                {/* Dynamique de déplacement */}
                {res && (
                  <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div style={{ background: '#F9F9F7', borderRadius: 8, padding: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 800 }}>DYNAMIQUE DE DÉPLACEMENT</div>
                      <div style={{ fontSize: 12, marginTop: 6 }}>Position signal (majorité initiale pions) : <b>{res.position_signal}</b></div>
                      <div style={{ fontSize: 12 }}>Position finale : <b>{res.position_finale}</b> {res.position_signal !== res.position_finale ? '→ Mouvement collectif' : ''}</div>
                      <div style={{ fontSize: 12 }}>Condition : {res.condition} • Pari gagnant : {res.pari_gagnant}</div>
                      <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>Gagnants {res.gagnants?.length || 0} • Perdants {res.perdants?.length || 0}</div>
                    </div>
                    <div style={{ background: c.neutre > 0 ? '#FFF3CD' : '#FDE047', border: '1px solid #14171B', borderRadius: 8, padding: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 800 }}>RÉVÉLATION — LIEN CONTENU / MOUVEMENT</div>
                      <div style={{ fontSize: 12, marginTop: 6 }}>
                        {c.majorite === 'neutre (abstention)'
                          ? `Sujet ${card.famille || c.cardId} sensible : ${c.neutre} joueurs n'ont pas voulu trancher. Question "${card.question || ''}" touche un angle mort.`
                          : c.majorite === 'reste'
                          ? `Majorité RESTE (${c.reste}) : le collectif veut maintenir ${card.titre || ''}. Signal "${card.signal || ''}" = résistance au changement.`
                          : c.majorite === 'bouge'
                          ? `Majorité BOUGE (${c.bouge}) : volonté de transformation sur ${card.titre || ''}.`
                          : `Égalité — polarisation sur ${card.famille || ''}.`}
                        {res.position_signal !== res.position_finale
                          ? ` Déplacement ${res.position_signal}→${res.position_finale} confirme que le vote ${c.majorite} a fait bouger les pions.`
                          : ' Pas de déplacement majeur — cohérence signal/final.'}
                      </div>
                    </div>
                  </div>
                )}

                {/* Votes détail */}
                <div style={{ marginTop: 12, fontSize: 10, opacity: 0.6, maxHeight: 80, overflowY: 'auto' }}>
                  {c.votes.slice(-10).map((v: any, i: number) => (
                    <span key={i} style={{ marginRight: 8, padding: '2px 6px', borderRadius: 10, background: v.to_quadrant === 'reste' ? '#FDE047' : v.to_quadrant === 'bouge' ? '#EF4444' : '#E5E7EB', color: v.to_quadrant === 'bouge' ? '#FFF' : '#14171B' }}>
                      {v.player_nick || v.player_id?.slice(0, 6)}:{v.to_quadrant}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 24, fontSize: 11, opacity: 0.5, borderTop: '1px solid #eee', paddingTop: 12 }}>
          Chaque vote est associé à sa carte via session_events.question_id = {byCard[0]?.cardId || 'carte.id'} • Source : session_events type=pari + session_pions + session_resultats + cards_diag (explication + arbitrage) • Rapport généré automatiquement.
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div style={{ padding: 40 }}>Chargement rapport profond...</div>}>
      <RapportContent />
    </Suspense>
  );
}