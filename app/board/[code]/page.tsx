'use client';

import { GameEngine } from '../../../components/GameEngine';
import type { Joueur } from '../../../lib/types';

export default function BoardSallePage({ params }: { params: { code: string } }) {
  const joueurs: Joueur[] = [];

  return (
    <GameEngine
      sessionId={params.code}
      role="facilitator"
      joueurs={joueurs}
    />
  );
}
