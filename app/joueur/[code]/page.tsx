'use client';
import { useEffect, useState } from 'react';
import GameEngine from '../../../components/GameEngine';
import { supabase } from '@/lib/supabase';

export default function JoueurPage({ params }: { params: { code: string } }){
  const [session, setSession] = useState<any>(null);
  useEffect(()=>{ supabase.from('sessions').select('*').eq('code', params.code).single().then(r=> setSession(r.data)); },[params.code]);
  if(!session) return <div style={{padding:40}}>Chargement joueur {params.code}...</div>;
  return <GameEngine sessionId={session.id} code={params.code} isFacilitator={false} />;
}
