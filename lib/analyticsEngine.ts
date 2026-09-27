import { supabase } from './supabase';

export async function computeAnalytics(sessionId: string) {
  const { data: players } = await supabase.from('session_players').select('*').eq('session_id', sessionId);
  const { data: depots } = await supabase.from('session_depots').select('*').eq('session_id', sessionId).order('created_at');
  const { data: paris } = await supabase.from('session_paris').select('*').eq('session_id', sessionId);
  const { data: events } = await supabase.from('session_events').select('*').eq('session_id', sessionId).order('created_at');

  const QUADRANTS = ['JAUNE','VERT','ROUGE','BLEU'];

  const playerDynamics = (players||[]).map(p=>{
    const myDepots = (depots||[]).filter(d=>d.player_id===p.id);
    const myEvents = (events||[]).filter(e=>e.player_id===p.id);
    const quadrantsVisited = [...new Set(myDepots.map(d=>d.quadrant as string))];
    const hesitations = myEvents.filter(e=>e.type==='change_quadrant').length;
    const avgLatency = myEvents.length? Math.round(myEvents.reduce((s,e)=>s+(e.latency_ms||0),0)/myEvents.length):0;
    const leadership = myEvents.filter(e=>(e.metadata as any)?.is_first).length;
    const conformity = myEvents.filter(e=>(e.metadata as any)?.followed_someone).length;
    return {
      nick: p.nick,
      totalMoves: myDepots.length,
      avgLatency,
      hesitations,
      quadrantsVisited,
      quadrantNeverVisited: QUADRANTS.filter(q=>!quadrantsVisited.includes(q)),
      conformityScore: myDepots.length? Math.round(conformity/myDepots.length*100):0,
      leadershipScore: myDepots.length? Math.round(leadership/myDepots.length*100):0,
    };
  });

  const allUsed = [...new Set((depots||[]).map(d=>d.quadrant as string))];
  const counts: Record<string, number> = {};
  (depots||[]).forEach(d=>{ const q = d.quadrant as string; counts[q]=(counts[q]||0)+1; });
  const maxCount = Object.keys(counts).length? Math.max(...Object.values(counts).map(v=>v as number)) : 0;
  const convergence = (depots&&depots.length)? maxCount / depots.length : 0;

  const collective = {
    angleMortCollectif: QUADRANTS.filter(q=>!allUsed.includes(q)),
    convergence,
    fragmentation: allUsed.length,
  };

  return { players: playerDynamics, collective, raw: { depots, paris, events } };
}

export function generateNarrative(analytics: any) {
  if (!analytics) return null;
  return {
    pourFacilitateur: {
      ceQueTuVois: `Exploration ${4 - analytics.collective.angleMortCollectif.length}/4 quadrants. Convergence ${Math.round(analytics.collective.convergence*100)}%.`,
      ceQueTuNeVoisPas: `${analytics.players.reduce((s:number,p:any)=>s+p.hesitations,0)} changements d'avis invisibles en présentiel - révèle peur de se tromper.`,
      angleMort: analytics.collective.angleMortCollectif.length? `ANGLE MORT COLLECTIF: ${analytics.collective.angleMortCollectif.join(', ')} - votre évitement organisationnel.` : 'Exploration complète.',
    },
    pourEmployes: analytics.players.map((p:any)=>({
      nick: p.nick,
      message: `Tu mets ${p.avgLatency/1000}s à te positionner. ${p.hesitations>2?'Tu hésites - tu perçois la complexité.': 'Tu décides vite.'} Leadership ${p.leadershipScore}% - Conformité ${p.conformityScore}%. Angle mort perso: ${p.quadrantNeverVisited.join(', ')||'aucun'}.`
    })),
    pourEntreprise: {
      diagnostic: analytics.collective.convergence>0.7? 'Pensée unique - alignement rapide mais risque conformisme.' : 'Fragmentation - désaccord structurel fertile.',
      recommandation: analytics.collective.angleMortCollectif.length? `Vous évitez systématiquement ${analytics.collective.angleMortCollectif.join(', ')}. Allez y mettre de la lumière.` : 'Culture qui ose tous les quadrants.',
    }
  };
}