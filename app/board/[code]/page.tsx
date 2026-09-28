'use client';

import { useEffect, useState } from 'react';
import GameEngine from '../../../components/GameEngine';
import type { Joueur } from '../../../lib/types';
import { supabase } from '@/lib/supabase';

export default function BoardSallePage({ params }: { params: { code: string } }) {
  const [joueurs, setJoueurs] = useState<Joueur[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const facCode = localStorage.getItem('facilitator_code');
    if (!facCode) {
      window.location.href = '/facilitateur';
      return;
    }

    const load = async () => {
      const { data } = await supabase
        .from('session_players')
        .select('*')
        .eq('session_id', params.code)
        .order('created_at', { ascending: true });
      
      if (data) {
        setJoueurs(data.map((p: any) => ({
          id: p.id,
          sessionId: p.session_id,
          nick: p.nick,
          cartesQuestion: 0,
          cartesMesure: 0,
          lastSeenAt: Date.now(),
          connected: true,
        })));
      }
    };

    load();
    setReady(true);

    const ch = supabase
      .channel('board-' + params.code)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'session_players', filter: `session_id=eq.${params.code}` }, 
        load
      )
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, [params.code]);

  if (!ready) {
    return <div style={{ minHeight:'100vh', background:'#14171B', color:'#FBF8EF', display:'flex', alignItems:'center', justifyContent:'center' }}>Chargement plateau facilitateur...</div>;
  }

  return (
    <GameEngine
      sessionId={params.code}
      role="facilitator"
      joueurs={joueurs}
    />
  );
}
