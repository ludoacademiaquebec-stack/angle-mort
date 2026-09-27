'use client';

import { GameEngine } from '../../../components/GameEngine';
import type { Joueur } from '../../../lib/types';

export default function BoardPage({
  params,
}: {
  params: { sessionId: string };
}) {
  // TODO v2 : récupérer les joueurs via Supabase Realtime
  const joueurs: Joueur[] = [];

  return (
    <GameEngine
      sessionId={params.sessionId}
      role="facilitator"
      joueurs={joueurs}
    />
  );
}
