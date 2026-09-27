'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function JoueurPage() {
  const [sessionCode, setSessionCode] = useState('');
  const [pseudo, setPseudo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const rejoindre = async () => {
    if (!sessionCode.trim() || !pseudo.trim()) {
      setError('Code session et pseudo requis');
      return;
    }
    setLoading(true);
    setError(null);

    const code = sessionCode.trim().toUpperCase();
    const { data, error: err } = await supabase
      .from('sessions')
      .select('id, code, status')
      .or(`code.eq.${code},id.eq.${code}`)
      .eq('status', 'active')
      .single();

    if (err || !data) {
      setError(`Session ${code} introuvable ou inactive. Vérifie avec facilitateur.`);
      setLoading(false);
      return;
    }

    // 1. Crée le joueur dans session_players (pour que le facilitateur le voie)
    const playerId = crypto.randomUUID();
    const { error: insertErr } = await supabase
      .from('session_players')
      .upsert({
        id: playerId,
        session_id: data.id, // ton schéma: session_id = text (ex: SESS-IBEZ9K)
        nick: pseudo.trim(),
        points: 0,
        jetons: [],
        current_quadrant: null,
      }, { onConflict: 'session_id,nick' });

    if (insertErr && !insertErr.message.includes('duplicate')) {
      setError(insertErr.message);
      setLoading(false);
      return;
    }

    // 2. Sauve en local pour retrouver son id
    const finalPlayerId = playerId;
    localStorage.setItem('anglemort-' + data.id, JSON.stringify({
      playerId: finalPlayerId,
      nick: pseudo.trim(),
    }));

    // 3. Redirige vers LA VUE JOUEUR, pas vers board facilitateur
    router.push('/joueur/' + data.id + '?pseudo=' + encodeURIComponent(pseudo.trim()));
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F4EFE2', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ maxWidth: 420, width: '100%', background: '#FBF8EF', border: '2px solid #14171B', borderRadius: 12, padding: 32 }}>
        <div style={{ fontSize: 14, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.6, marginBottom: 8 }}>
          Espace joueur
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 700, lineHeight: 1.1, marginBottom: 8 }}>
          Rejoindre une session
        </h1>
        <p style={{ fontSize: 14, color: 'rgba(20,23,27,0.6)', marginBottom: 24 }}>
          Code fourni par votre facilitateur (ex: SESS-IBEZ9K)
        </p>

        <label style={{ fontSize: 12, color: 'rgba(20,23,27,0.6)', display: 'block', marginBottom: 6 }}>Code session</label>
        <input
          value={sessionCode}
          onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
          placeholder="SESS-IBEZ9K"
          style={{ width: '100%', padding: 14, marginBottom: 16, border: '2px solid #14171B', borderRadius: 6, fontWeight: 700, fontFamily: 'monospace', letterSpacing: '0.15em', textAlign: 'center', boxSizing: 'border-box' }}
        />

        <label style={{ fontSize: 12, color: 'rgba(20,23,27,0.6)', display: 'block', marginBottom: 6 }}>Votre pseudo</label>
        <input
          value={pseudo}
          onChange={(e) => setPseudo(e.target.value)}
          placeholder="Marie"
          style={{ width: '100%', padding: 14, marginBottom: 16, border: '1px solid rgba(20,23,27,0.3)', borderRadius: 6, boxSizing: 'border-box' }}
        />

        {error && <div style={{ background: '#FEE2E2', color: '#DC2626', padding: 10, borderRadius: 6, marginBottom: 12, fontSize: 13 }}>{error}</div>}

        <button
          onClick={rejoindre}
          disabled={loading}
          style={{ width: '100%', padding: 16, background: '#14171B', color: '#FBF8EF', border: 'none', borderRadius: 6, fontWeight: 700, fontSize: 15, cursor: loading ? 'wait' : 'pointer' }}
        >
          {loading ? 'Connexion...' : 'Rejoindre →'}
        </button>

        <div style={{ fontSize: 11, opacity: 0.5, marginTop: 12, textAlign: 'center' }}>
          Vérifie: sessions.code EXISTS + status=active → INSERT session_players
        </div>
      </div>
    </div>
  );
}