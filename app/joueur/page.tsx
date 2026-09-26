'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type SessionActive = {
  id: string;
  code: string;
  company: string | null;
  phase: string;
  player_count: number;
  created_at: string;
};

export default function JoueurPage() {
  const [sessions, setSessions] = useState<SessionActive[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/sessions-actives');
        const data = await res.json();
        setSessions(data.sessions || []);
      } catch {}
      setLoading(false);
    })();
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#F4EFE2', padding: '40px 20px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 32, fontWeight: 700, marginBottom: 8 }}>Sessions en cours</div>
          <div style={{ fontSize: 14, color: 'rgba(20,23,27,0.6)' }}>
            Rejoignez une session active de votre organisation
          </div>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: 40, color: 'rgba(20,23,27,0.5)', fontSize: 14 }}>
            Chargement...
          </div>
        )}

        {!loading && sessions.length === 0 && (
          <div style={{ background: '#FBF8EF', border: '1px solid rgba(20,23,27,0.15)', borderRadius: 8, padding: 40, textAlign: 'center' }}>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Aucune session active</div>
            <div style={{ fontSize: 13, color: 'rgba(20,23,27,0.6)', marginBottom: 24 }}>
              Attendez qu'un facilitateur démarre une session
            </div>
            <div style={{ fontSize: 12, color: 'rgba(20,23,27,0.5)' }}>
              Vous avez un code à 6 chiffres ?
            </div>
            <a href="/rejoindre" style={{ display: 'inline-block', marginTop: 12, padding: '10px 20px', background: '#14171B', color: '#FBF8EF', textDecoration: 'none', borderRadius: 4, fontSize: 13, fontWeight: 600 }}>
              Entrer le code →
            </a>
          </div>
        )}

        {!loading && sessions.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => router.push(`/play/${s.id}`)}
                style={{
                  background: '#FBF8EF',
                  border: '2px solid #14171B',
                  borderRadius: 8,
                  padding: 24,
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 16,
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
                    {s.company || s.id}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(20,23,27,0.5)', fontFamily: 'ui-monospace, monospace' }}>
                    {s.id} · phase {s.phase} · {s.player_count} joueur{s.player_count > 1 ? 's' : ''}
                  </div>
                </div>
                <div style={{ padding: '8px 16px', background: '#FDE047', border: '1px solid #14171B', borderRadius: 4, fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>
                  Rejoindre →
                </div>
              </button>
            ))}

            <div style={{ marginTop: 24, textAlign: 'center', fontSize: 12, color: 'rgba(20,23,27,0.5)' }}>
              Vous ne voyez pas votre session ? <a href="/rejoindre" style={{ color: '#14171B', textDecoration: 'underline' }}>Entrez le code à 6 chiffres</a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
