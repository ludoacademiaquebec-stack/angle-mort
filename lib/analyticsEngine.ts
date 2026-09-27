import { supabase } from './supabase';

export type PlayerDynamics = {
  nick: string;
  totalMoves: number;
  avgLatency: number; // ms
  hesitations: number; // nombre de changements d'avis avant dépôt final
  quadrantsVisited: string[];
  quadrantNeverVisited: string[]; // ANGLE MORT perso
  conformityScore: number; // 0-100 % suit le groupe
  leadershipScore: number; // 0-100 % premier à bouger
  riskScore: number; // parie souvent à contre-courant
  stability: number; // reste sur même quadrant
};

export type CollectiveDynamics = {
  convergence: number; // % groupe se rejoint sur même quadrant
  fragmentation: number;
  influenceMap: { from: string, to: string, count: number }[];
  angleMortCollectif: string[]; // quadrant jamais exploré par personne
  timeToConsensus: number;
  polarisation: boolean;
};

export async function computeAnalytics(sessionId: string) {
  const { data: players } = await supabase.from('session_players').select('*').eq('session_id', sessionId);
  const { data: depots } = await supabase.from('session_depots').select('*').eq('session_id', sessionId).order('created_at', { ascending: true });
  const { data: paris } = await supabase.from('session_paris').select('*').eq('session_id', sessionId);
  const { data: events } = await supabase.from('session_events').select('*').eq('session_id', sessionId).order('created_at');

  if (!players) return null;

  const QUADRANTS = ['Q1', 'Q2', 'Q3', 'Q4']; // adapte à tes vrais noms: ex ['Force','Faiblesse','Opportunité','Menace']

  // --- Calculs individuels ---
  const playerDynamics: PlayerDynamics[] = players.map(p => {
    const myDepots = depots?.filter(d => d.player_id === p.id) || [];
    const myEvents = events?.filter(e => e.player_id === p.id) || [];

    const quadrantsVisited = [...new Set(myDepots.map(d => d.quadrant))];
    const hesitations = myEvents.filter(e => e.type === 'change_quadrant').length;
    const avgLatency = myEvents.length? myEvents.reduce((s,e) => s + (e.latency_ms||0),0) / myEvents.length : 0;

    // Leadership: est premier à poser sur une carte
    const leadershipCount = myEvents.filter(e => e.type === 'move' && e.metadata?.is_first).length;

    // Conformité: suit le dernier joueur
    const conformity = myEvents.filter(e => e.metadata?.followed_someone).length;

    return {
      nick: p.nick,
      totalMoves: myDepots.length,
      avgLatency: Math.round(avgLatency),
      hesitations,
      quadrantsVisited,
      quadrantNeverVisited: QUADRANTS.filter(q =>!quadrantsVisited.includes(q)),
      conformityScore: myDepots.length? Math.round((conformity / myDepots.length)*100) : 0,
      leadershipScore: myDepots.length? Math.round((leadershipCount / myDepots.length)*100) : 0,
      riskScore: 0, // calculé depuis paris
      stability: 100 - (hesitations * 10),
    };
  });

  // --- Calculs collectifs ---
  const allQuadrantsUsed = [...new Set(depots?.map(d => d.quadrant) || [])];
  const angleMortCollectif = QUADRANTS.filter(q =>!allQuadrantsUsed.includes(q));

  // Matrice d'influence: qui suit qui
  const influenceMap: any[] = [];
  events?.forEach(e => {
    if (e.metadata?.followed_nick) {
      influenceMap.push({ from: e.metadata.followed_nick, to: e.nick, count: 1 });
    }
  });

  const collective: CollectiveDynamics = {
    convergence: 0, // à calculer par carte
    fragmentation: allQuadrantsUsed.length,
    influenceMap,
    angleMortCollectif,
    timeToConsensus: 0,
    polarisation: allQuadrantsUsed.length >= 3,
  };

  return { players: playerDynamics, collective, raw: { depots, paris, events } };
}

export function generateNarrative(analytics: any, company: string) {
  if (!analytics) return null;

  const { collective, players } = analytics;

  return {
    pourFacilitateur: {
      ceQueTuVois: `Le groupe a exploré ${4 - collective.angleMortCollectif.length}/4 quadrants. Fragmentation: ${collective.fragmentation}.`,
      ceQueTuNeVoisPas: `Hésitations cachées: ${players.reduce((s,p)=>s+p.hesitations,0)} changements d'avis avant dépôt final. Ces hésitations sont invisibles en présentiel, elles révèlent la peur de se tromper.`,
      angleMort: collective.angleMortCollectif.length? `ANGLE MORT COLLECTIF: Personne n'est allé en ${collective.angleMortCollectif.join(', ')}. C'est votre angle mort organisationnel.` : 'Aucun angle mort collectif, exploration complète.'
    },
    pourEmployes: players.map(p => ({
      nick: p.nick,
      message: `Tu as mis ${p.avgLatency/1000}s en moyenne à te positionner. ${p.hesitations > 2? 'Tu as hésité plusieurs fois: tu perçois la complexité, mais tu n'oses pas toujours l'assumer.' : 'Tu décides vite, tu es ancré.'} Ton angle mort perso: ${p.quadrantNeverVisited.join(', ') || 'aucun'}. ${p.leadershipScore > 50? 'Tu es souvent premier, tu prends le risque de l'initiative.' : ''} ${p.conformityScore > 60? 'Tu as tendance à suivre le groupe après, attention à ne pas t'effacer.' : ''}`
    })),
    pourEntreprise: {
      diagnostic: collective.polarisation? 'Groupe polarisé: désaccord structurel sur la lecture de la situation.' : 'Groupe convergent: alignement rapide mais risque de pensée unique.',
      recommandation: collective.angleMortCollectif.length? `Votre entreprise évite systématiquement ${collective.angleMortCollectif.join(', ')}. Ce n'est pas un oubli, c'est une stratégie d'évitement. Il faut aller y mettre de la lumière.` : 'Exploration complète: vous avez une culture qui ose tous les quadrants.',
      risque: `Leadership concentré sur ${players.filter(p=>p.leadershipScore>50).map(p=>p.nick).join(', ') || 'personne'}: risque de dépendance.`
    }
  };
}