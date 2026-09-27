'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

type Faci = {
  id: string;
  code: string;
  name: string;
  email: string | null;
  active: boolean;
  created_at: string;
  last_login_at: string | null;
};

type Session = {
  id: string;
  code: string;
  company: string | null;
  facilitator_id: string | null;
  phase: string;
  status: string;
  started_at: string;
};

export default function SuperAdminPage() {
  const [auth, setAuth] = useState(false);
  const [code, setCode] = useState('');
  const [facis, setFacis] = useState<Faci[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [playersCount, setPlayersCount] = useState(0);
  const [depotsCount, setDepotsCount] = useState(0);
  const [form, setForm] = useState({ name: '', email: '' });
  const [activeTab, setActiveTab] = useState<'facilitators' | 'sessions'>('facilitators');

  useEffect(() => {
    const saved = sessionStorage.getItem('super_admin_ok');
    if (saved === '1') setAuth(true);
  }, []);

  const checkAuth = () => {
    if (code === 'ILQ-2026-ADMIN' || code === process.env.NEXT_PUBLIC_SUPER_ADMIN_CODE) {
      sessionStorage.setItem('super_admin_ok', '1');
      setAuth(true);
    } else {
      alert('Code Super Admin invalide');
    }
  };

  const load = async () => {
    const { data: f } = await supabase.from('facilitators').select('*').order('created_at', { ascending: false });
    const { data: s } = await supabase.from('sessions').select('*').order('started_at', { ascending: false });
    const { count: pc } = await supabase.from('session_players').select('*', { count: 'exact', head: true });
    const { count: dc } = await supabase.from('session_depots').select('*', { count: 'exact', head: true });
    if (f) setFacis(f);
    if (s) setSessions(s);
    setPlayersCount(pc || 0);
    setDepotsCount(dc || 0);
  };

  useEffect(() => {
    if (auth) load();
  }, [auth]);

  const createFaci = async () => {
    if (!form.name.trim()) return alert('Nom requis');
    const nextNum = facis.length + 1;
    const nextCode = 'FACI-' + String(nextNum).padStart(3, '0');
    const { error } = await supabase.from('facilitators').insert({
      code: nextCode,
      name: form.name.trim(),
      email: form.email.trim() || null,
      active: true,
    });
    if (error) alert(error.message);
    else {
      setForm({ name: '', email: '' });
      load();
    }
  };

  const toggle = async (f: Faci) => {
    await supabase.from('facilitators').update({ active: !f.active }).eq('id', f.id);
    load();
  };

  const del = async (f: Faci) => {
    if (!confirm('Supprimer ' + f.code + ' ?')) return;
    await supabase.from('facilitators').delete().eq('id', f.id);
    load();
  };

  if (!auth) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FFFEF9' }}>
        <div style={{ background: '#FFF', border: '2px solid #14171B', borderRadius: 12, padding: 32, width: 380 }}>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 22, marginBottom: 8 }}>Super Admin</h2>
          <p style={{ fontSize: 13, opacity: 0.6, marginBottom: 16 }}>Accès protégé</p>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Code Super Admin"
            style={{ width: '100%', padding: 12, border: '1px solid #14171B', borderRadius: 6, marginBottom: 12, boxSizing: 'border-box' }}
          />
          <button
            onClick={checkAuth}
            style={{ width: '100%', padding: 12, background: '#14171B', color: '#FFF', borderRadius: 6, fontWeight: 700, border: 'none', cursor: 'pointer' }}
          >
            Entrer
          </button>
          <div style={{ fontSize: 11, opacity: 0.5, marginTop: 12, textAlign: 'center' }}>
            Code démo : ILQ-2026-ADMIN
          </div>
        </div>
      </div>
    );
  }

  const faciByCode: Record<string, string> = {};
  facis.forEach((f) => { faciByCode[f.id] = f.code; });

  return (
    <div style={{ minHeight: '100vh', background: '#FFFEF9', color: '#14171B' }}>
      <header style={{ padding: '16px 24px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', background: '#FFF' }}>
        <div style={{ fontWeight: 800, fontFamily: 'Georgia, serif' }}>Super Admin · Angle Mort</div>
        <div style={{ display: 'flex', gap: 16, fontSize: 13, alignItems: 'center' }}>
          <Link href="/">Landing</Link>
          <Link href="/facilitateur">Facilitateur</Link>
          <button
            onClick={() => { sessionStorage.clear(); setAuth(false); }}
            style={{ opacity: 0.6, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}
          >
            Déconnexion
          </button>
        </div>
      </header>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
          <div style={{ background: '#14171B', color: '#FFF', borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 11, opacity: 0.6, letterSpacing: '0.1em' }}>SESSIONS</div>
            <div style={{ fontSize: 28, fontWeight: 800 }}>{sessions.length}</div>
          </div>
          <div style={{ background: '#FDE047', border: '1px solid #14171B', borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 11, letterSpacing: '0.1em' }}>JOUEURS</div>
            <div style={{ fontSize: 28, fontWeight: 800 }}>{playersCount}</div>
          </div>
          <div style={{ background: '#FBF8EF', border: '1px solid #14171B', borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 11, letterSpacing: '0.1em' }}>JETONS DÉPOSÉS</div>
            <div style={{ fontSize: 28, fontWeight: 800 }}>{depotsCount}</div>
          </div>
          <div style={{ background: '#FFF', border: '1px solid #14171B', borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 11, letterSpacing: '0.1em' }}>FACILITATEURS</div>
            <div style={{ fontSize: 28, fontWeight: 800 }}>{facis.filter((f) => f.active).length}/{facis.length}</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <button
            onClick={() => setActiveTab('facilitators')}
            style={{ padding: '10px 20px', background: activeTab === 'facilitators' ? '#14171B' : '#FFF', color: activeTab === 'facilitators' ? '#FFF' : '#14171B', border: '1px solid #14171B', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}
          >
            Facilitateurs
          </button>
          <button
            onClick={() => setActiveTab('sessions')}
            style={{ padding: '10px 20px', background: activeTab === 'sessions' ? '#14171B' : '#FFF', color: activeTab === 'sessions' ? '#FFF' : '#14171B', border: '1px solid #14171B', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}
          >
            Sessions ({sessions.length})
          </button>
        </div>

        {activeTab === 'facilitators' && (
          <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 20 }}>
            <div style={{ background: '#FFF', border: '2px solid #14171B', borderRadius: 12, padding: 20, height: 'fit-content' }}>
              <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 16, marginBottom: 12 }}>Créer un facilitateur</h3>
              <input
                placeholder="Nom complet"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                style={{ width: '100%', padding: 10, marginBottom: 8, border: '1px solid #14171B', borderRadius: 4, boxSizing: 'border-box' }}
              />
              <input
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                style={{ width: '100%', padding: 10, marginBottom: 8, border: '1px solid #14171B', borderRadius: 4, boxSizing: 'border-box' }}
              />
              <button
                onClick={createFaci}
                style={{ width: '100%', padding: 12, background: '#14171B', color: '#FFF', borderRadius: 4, fontWeight: 600, border: 'none', cursor: 'pointer' }}
              >
                Créer (FACI-XXX)
              </button>
              <div style={{ fontSize: 11, opacity: 0.5, marginTop: 8 }}>
                Le code sera FACI-{String(facis.length + 1).padStart(3, '0')}
              </div>
            </div>

            <div style={{ background: '#FFF', border: '1px solid #eee', borderRadius: 12, padding: 20 }}>
              <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 16, marginBottom: 12 }}>Facilitateurs ({facis.length})</h3>
              {facis.length === 0 && <div style={{ fontSize: 13, opacity: 0.5 }}>Aucun facilitateur</div>}
              {facis.length > 0 && (
                <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>
                      <th style={{ padding: 8 }}>Code</th>
                      <th style={{ padding: 8 }}>Nom</th>
                      <th style={{ padding: 8 }}>Email</th>
                      <th style={{ padding: 8 }}>Statut</th>
                      <th style={{ padding: 8 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {facis.map((f) => (
                      <tr key={f.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                        <td style={{ padding: 8, background: '#FDE047', fontWeight: 800, fontFamily: 'monospace' }}>{f.code}</td>
                        <td style={{ padding: 8 }}>{f.name}</td>
                        <td style={{ padding: 8, fontSize: 12 }}>{f.email || '—'}</td>
                        <td style={{ padding: 8 }}>
                          <span style={{ padding: '4px 8px', borderRadius: 10, fontSize: 11, background: f.active ? '#DCFCE7' : '#FEE2E2' }}>
                            {f.active ? 'Actif' : 'Inactif'}
                          </span>
                        </td>
                        <td style={{ padding: 8 }}>
                          <button onClick={() => toggle(f)} style={{ fontSize: 11, marginRight: 6, cursor: 'pointer' }}>
                            {f.active ? 'Désactiver' : 'Activer'}
                          </button>
                          <button onClick={() => del(f)} style={{ fontSize: 11, color: '#DC2626', cursor: 'pointer' }}>
                            Suppr
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {activeTab === 'sessions' && (
          <div style={{ background: '#FFF', border: '1px solid #eee', borderRadius: 12, padding: 20 }}>
            <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 16, marginBottom: 12 }}>Sessions ({sessions.length})</h3>
            {sessions.length === 0 && <div style={{ fontSize: 13, opacity: 0.5 }}>Aucune session</div>}
            {sessions.length > 0 && (
              <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>
                    <th style={{ padding: 8 }}>Code</th>
                    <th style={{ padding: 8 }}>Entreprise</th>
                    <th style={{ padding: 8 }}>Facilitateur</th>
                    <th style={{ padding: 8 }}>Phase</th>
                    <th style={{ padding: 8 }}>Statut</th>
                    <th style={{ padding: 8 }}>Date</th>
                    <th style={{ padding: 8 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s) => (
                    <tr key={s.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                      <td style={{ padding: 8, fontFamily: 'monospace', fontWeight: 700 }}>{s.code}</td>
                      <td style={{ padding: 8 }}>{s.company || '—'}</td>
                      <td style={{ padding: 8, fontSize: 12 }}>{s.facilitator_id ? faciByCode[s.facilitator_id] || '—' : '—'}</td>
                      <td style={{ padding: 8 }}>{s.phase}</td>
                      <td style={{ padding: 8 }}>
                        <span style={{ padding: '4px 8px', borderRadius: 10, fontSize: 11, background: s.status === 'active' ? '#DCFCE7' : '#FEE2E2' }}>
                          {s.status}
                        </span>
                      </td>
                      <td style={{ padding: 8, fontSize: 12 }}>{s.started_at?.slice(0, 10) || '—'}</td>
                      <td style={{ padding: 8 }}>
                        <Link href={'/board/' + s.id} style={{ fontSize: 11, color: '#14171B' }}>
                          Ouvrir →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
