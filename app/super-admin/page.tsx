'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getCartesDiag, getCartesAll } from '@/lib/cards';
const CARTES_DIAG_STATIC = getCartesDiag();
const CARTES_ALL_STATIC = getCartesAll();

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
  version?: string | null;
  started_at: string;
  created_at?: string;
};

const FAMILLES = ['REC', 'MIC', 'PRI', 'CLI'] as const;
const ZONES = ['NO', 'NE', 'SO', 'SE', 'ALL'] as const;
const VERSIONS = ['rapide', 'moyen', 'long', 'complet'] as const;

export default function SuperAdminPage() {
  const [auth, setAuth] = useState(false);
  const [code, setCode] = useState('');
  const [facis, setFacis] = useState<Faci[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeTab, setActiveTab] = useState<'facilitators' | 'sessions' | 'cartes' | 'all' | 'rapport' | 'resultats'>('facilitators');
  const [diag, setDiag] = useState<any[]>([]);
  const [all, setAll] = useState<any[]>([]);
  const [familleDiag, setFamilleDiag] = useState('REC');
  const [selected, setSelected] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [newFaci, setNewFaci] = useState({ code: '', name: '', email: '' });
  const [resultats, setResultats] = useState<any[]>([]);
  const [engagements, setEngagements] = useState<any[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem('super_admin_ok');
    if (saved === '1') setAuth(true);
  }, []);

  const checkAuth = () => {
    if (code === 'ILQ-2026-ADMIN' || code === (process.env.NEXT_PUBLIC_SUPER_ADMIN_CODE as any)) {
      sessionStorage.setItem('super_admin_ok', '1');
      setAuth(true);
    } else alert('Code invalide');
  };

  const load = async () => {
    const { data: f } = await supabase.from('facilitators').select('*').order('created_at', { ascending: false });
    const { data: s } = await supabase.from('sessions').select('*').order('started_at', { ascending: false }).limit(100);
    if (f) setFacis(f);
    if (s) setSessions(s);

    const { data: d1 } = await supabase.from('cards_diag').select('*').order('ordre', { ascending: true });
    const { data: d2 } = await supabase.from('cards_all').select('*').order('ordre', { ascending: true });

    if (d1 && d1.length > 0) {
      setDiag(d1.map((r: any) => ({
        id: r.id,
        famille: r.famille,
        titre: r.titre,
        image: r.image,
        signal: r.signal,
        situation: r.situation,
        question: r.question,
        motPiege: r.mot_piege,
        compteur: r.compteur,
        compteurLabel: r.compteur_label,
        extra: r.extra_type ? { type: r.extra_type, texte: r.extra_texte } : r.extra || undefined,
        couleur: r.couleur,
        ordre: r.ordre,
      })));
    } else {
      setDiag(CARTES_DIAG_STATIC as any);
    }

    if (d2 && d2.length > 0) {
      setAll(d2.map((r: any) => ({
        id: r.id,
        famille: 'ALL',
        titre: r.titre,
        action: r.action,
        indicateur: r.indicateur,
        delai: r.delai,
        niveau: r.niveau,
        couleur: r.couleur,
        ordre: r.ordre,
        zoneCible: r.zone_cible || null,
      })));
    } else {
      setAll(CARTES_ALL_STATIC as any);
    }
  };

  useEffect(() => {
    if (auth) load();
  }, [auth]);

  const loadSessionDetails = async (sessionId: string) => {
    setSelectedSessionId(sessionId);
    const { data: r } = await supabase
      .from('session_resultats')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });
    const { data: e } = await supabase
      .from('session_engagements')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });
    setResultats(r || []);
    setEngagements(e || []);
  };

  const createFaci = async () => {
    if (!newFaci.code || !newFaci.name) return alert('Code + Nom requis');
    const { data, error } = await supabase
      .from('facilitators')
      .insert({ code: newFaci.code.toUpperCase(), name: newFaci.name, email: newFaci.email || null, active: true })
      .select()
      .single();
    if (error) alert(error.message);
    else {
      setFacis([data as any, ...facis]);
      setNewFaci({ code: '', name: '', email: '' });
    }
  };

  const toggleFaci = async (f: Faci) => {
    await supabase.from('facilitators').update({ active: !f.active }).eq('id', f.id);
    setFacis((prev) => prev.map((x) => (x.id === f.id ? { ...x, active: !x.active } : x)));
  };

  const saveCard = async () => {
    if (!selected) return;
    setSaving(true);
    if (activeTab === 'all') {
      const payload = {
        id: selected.id,
        famille: 'ALL',
        titre: selected.titre,
        action: selected.action,
        indicateur: selected.indicateur,
        delai: selected.delai,
        niveau: selected.niveau,
        couleur: selected.couleur,
        ordre: selected.ordre || 0,
        zone_cible: selected.zoneCible || null,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from('cards_all').upsert(payload, { onConflict: 'id' });
      if (error) alert(error.message);
      else setAll((prev) => prev.map((c) => (c.id === selected.id ? selected : c)));
    } else {
      const payloadDiag = {
        id: selected.id,
        famille: selected.famille,
        titre: selected.titre,
        image: selected.image,
        signal: selected.signal,
        situation: selected.situation,
        question: selected.question,
        mot_piege: selected.motPiege,
        compteur: selected.compteur,
        compteur_label: selected.compteurLabel,
        extra_type: selected.extra?.type || null,
        extra_texte: selected.extra?.texte || null,
        couleur: selected.couleur,
        ordre: selected.ordre || 0,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from('cards_diag').upsert(payloadDiag, { onConflict: 'id' });
      if (error) alert(error.message);
      await supabase.from('signal_cards').upsert(
        {
          id: selected.id,
          famille: selected.famille,
          titre: selected.titre,
          image: selected.image,
          signal: selected.signal,
          situation: selected.situation,
          question: selected.question,
          mot_piege: selected.motPiege,
          compteur: selected.compteur,
          compteur_label: selected.compteurLabel,
          extra: selected.extra || null,
          ordre: selected.ordre || 0,
        } as any,
        { onConflict: 'id' }
      );
      setDiag((prev) => prev.map((c) => (c.id === selected.id ? selected : c)));
    }
    setSaving(false);
  };

  if (!auth) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FFFEF9' }}>
        <div style={{ background: '#FFF', border: '2px solid #14171B', borderRadius: 12, padding: 32, width: 380 }}>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 22, marginBottom: 8 }}>Super Admin</h2>
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
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FFFEF9', color: '#14171B' }}>
      <header style={{ padding: '16px 24px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', background: '#FFF' }}>
        <div style={{ fontWeight: 800 }}>Super Admin · Angle Mort v4.0</div>
        <div style={{ display: 'flex', gap: 16, fontSize: 13 }}>
          <Link href="/">Landing</Link>
          <Link href="/facilitateur">Facilitateur</Link>
          <Link href="/super-admin">Super Admin</Link>
        </div>
      </header>
      <div style={{ maxWidth: 1500, margin: '0 auto', padding: 24 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          <button onClick={() => setActiveTab('facilitators')} style={{ padding: '10px 20px', background: activeTab === 'facilitators' ? '#14171B' : '#FFF', color: activeTab === 'facilitators' ? '#FFF' : '#14171B', border: '1px solid #14171B', borderRadius: 6 }}>
            Facilitateurs ({facis.length})
          </button>
          <button onClick={() => setActiveTab('sessions')} style={{ padding: '10px 20px', background: activeTab === 'sessions' ? '#14171B' : '#FFF', color: activeTab === 'sessions' ? '#FFF' : '#14171B', border: '1px solid #14171B', borderRadius: 6 }}>
            Sessions ({sessions.length})
          </button>
          <button onClick={() => setActiveTab('cartes')} style={{ padding: '10px 20px', background: activeTab === 'cartes' ? '#14171B' : '#FFF', color: activeTab === 'cartes' ? '#FFF' : '#14171B', border: '1px solid #14171B', borderRadius: 6 }}>
            Cartes Diag ({diag.length})
          </button>
          <button onClick={() => setActiveTab('all')} style={{ padding: '10px 20px', background: activeTab === 'all' ? '#14171B' : '#FFF', color: activeTab === 'all' ? '#FFF' : '#14171B', border: '1px solid #14171B', borderRadius: 6 }}>
            ALL ({all.length})
          </button>
          <button onClick={() => setActiveTab('resultats')} style={{ padding: '10px 20px', background: activeTab === 'resultats' ? '#14171B' : '#FFF', color: activeTab === 'resultats' ? '#FFF' : '#14171B', border: '1px solid #14171B', borderRadius: 6, fontWeight: 700 }}>
            Résultats & Engagements
          </button>
          <button onClick={() => setActiveTab('rapport')} style={{ padding: '10px 20px', background: activeTab === 'rapport' ? '#14171B' : '#FFF', color: activeTab === 'rapport' ? '#FFF' : '#14171B', border: '1px solid #14171B', borderRadius: 6, fontWeight: 700 }}>
            Rapport profond R/B/N
          </button>
        </div>

        {activeTab === 'facilitators' && (
          <div style={{ background: '#FFF', border: '1px solid #14171B', borderRadius: 12, padding: 20 }}>
            <h3 style={{ fontFamily: 'Georgia, serif' }}>Créer facilitateur</h3>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <input placeholder="CODE (ex FAC-RODRIGUE)" value={newFaci.code} onChange={(e) => setNewFaci({ ...newFaci, code: e.target.value })} style={{ padding: 10, border: '1px solid #14171B', borderRadius: 6, flex: 1 }} />
              <input placeholder="Nom" value={newFaci.name} onChange={(e) => setNewFaci({ ...newFaci, name: e.target.value })} style={{ padding: 10, border: '1px solid #14171B', borderRadius: 6, flex: 1 }} />
              <input placeholder="Email (optionnel)" value={newFaci.email} onChange={(e) => setNewFaci({ ...newFaci, email: e.target.value })} style={{ padding: 10, border: '1px solid #14171B', borderRadius: 6, flex: 1 }} />
              <button onClick={createFaci} style={{ padding: '10px 20px', background: '#14171B', color: '#FFF', borderRadius: 6 }}>
                Créer
              </button>
            </div>
            <div style={{ marginTop: 20, display: 'grid', gap: 8 }}>
              {facis.map((f) => (
                <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', border: '1px solid #eee', borderRadius: 8 }}>
                  <div>
                    <b style={{ fontFamily: 'monospace' }}>{f.code}</b> — {f.name} {f.email ? `(${f.email})` : ''}{' '}
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: f.active ? '#10B981' : '#eee' }}>{f.active ? 'actif' : 'inactif'}</span>
                  </div>
                  <button onClick={() => toggleFaci(f)} style={{ padding: '6px 12px', border: '1px solid #14171B', borderRadius: 6, fontSize: 12 }}>
                    {f.active ? 'Désactiver' : 'Activer'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'sessions' && (
          <div style={{ background: '#FFF', border: '1px solid #14171B', borderRadius: 12, padding: 20 }}>
            <h3>Sessions — chaque carte associée à chaque vote</h3>
            <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
              {sessions.map((sess) => (
                <div key={sess.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, border: '1px solid #eee', borderRadius: 8 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'monospace' }}>
                      {sess.code} • {sess.company || '—'} • {sess.phase || sess.status}
                      {sess.version && <span style={{ marginLeft: 8, fontSize: 10, padding: '2px 6px', borderRadius: 8, background: '#FDE047' }}>{sess.version}</span>}
                    </div>
                    <div style={{ fontSize: 10, opacity: 0.6 }}>
                      {sess.id.slice(0, 8)} • {new Date(sess.started_at || sess.created_at || '').toLocaleString()}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => { setActiveTab('resultats'); loadSessionDetails(sess.id); }}
                      style={{ padding: '8px 14px', background: '#FDE047', color: '#14171B', border: '1px solid #14171B', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                    >
                      Résultats & Engagements
                    </button>
                    <a href={`/rapport-profond?sessionId=${sess.id}`} style={{ padding: '8px 14px', background: '#14171B', color: '#FFF', borderRadius: 6, fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
                      Rapport 3 couleurs
                    </a>
                    <a href={`/board/${sess.code}`} style={{ padding: '8px 14px', background: '#FFF', border: '1px solid #14171B', borderRadius: 6, fontSize: 12, textDecoration: 'none', color: '#14171B' }}>
                      Board
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'resultats' && (
          <div style={{ background: '#FFF', border: '1px solid #14171B', borderRadius: 12, padding: 20 }}>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 20, marginBottom: 12 }}>Résultats & Engagements</h2>
            {!selectedSessionId ? (
              <div style={{ fontSize: 13, opacity: 0.6 }}>
                Sélectionne une session dans l'onglet <b>Sessions</b> puis clique sur "Résultats & Engagements".
              </div>
            ) : (
              <>
                <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 16 }}>
                  Session : <b style={{ fontFamily: 'monospace' }}>{selectedSessionId}</b>
                </div>

                <h3 style={{ fontSize: 15, marginTop: 20, marginBottom: 8 }}>Résultats par carte ({resultats.length})</h3>
                <div style={{ display: 'grid', gap: 6 }}>
                  {resultats.map((r) => (
                    <div key={r.id} style={{ padding: 10, border: '1px solid #eee', borderRadius: 6, fontSize: 12, fontFamily: 'ui-monospace, monospace' }}>
                      <b>{r.card_id}</b> ({r.card_famille || '—'}) • {r.condition} • Signal {r.position_signal} → Final {r.position_finale} • JAUNES {r.points_jaunes} / ROUGES {r.points_rouges} • Jeton {r.jeton_donne || '—'}
                      {r.votes_json && (
                        <span style={{ marginLeft: 8, opacity: 0.6 }}>
                          R:{r.votes_json.reste} B:{r.votes_json.bouge} N:{r.votes_json.neutre} → maj {r.votes_json.majorite}
                        </span>
                      )}
                    </div>
                  ))}
                  {resultats.length === 0 && <div style={{ opacity: 0.5, fontSize: 12 }}>Aucun résultat enregistré pour cette session.</div>}
                </div>

                <h3 style={{ fontSize: 15, marginTop: 24, marginBottom: 8 }}>Engagements 48h ({engagements.length})</h3>
                <div style={{ display: 'grid', gap: 6 }}>
                  {engagements.map((e) => (
                    <div key={e.id} style={{ padding: 10, border: '1px solid #eee', borderRadius: 6, fontSize: 12 }}>
                      <b style={{ fontFamily: 'monospace' }}>{e.all_card_id}</b> • Joueur {e.player_id?.slice(0, 8)} • Échéance {e.echeance}
                      <div style={{ marginTop: 4, opacity: 0.8 }}>{e.engagement_text || '(vide)'}</div>
                      {e.indicateur && <div style={{ fontSize: 11, opacity: 0.6, marginTop: 2 }}>Indicateur : {e.indicateur}</div>}
                    </div>
                  ))}
                  {engagements.length === 0 && <div style={{ opacity: 0.5, fontSize: 12 }}>Aucun engagement enregistré pour cette session.</div>}
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'rapport' && (
          <div style={{ background: '#FFF', border: '1px solid #14171B', borderRadius: 12, padding: 20 }}>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 20, marginBottom: 12 }}>Rapports profonds — R/B/N + Majorité neutre + Taux hésitation</h2>
            <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 16 }}>
              Chaque vote est lié à question_id = carte.id • session_events • graphique jaune/rouge/gris • R:3 B:2 N:5 → Majorité: neutre (abstention)
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              {sessions.slice(0, 20).map((sess: any) => (
                <div key={sess.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, border: '1px solid #eee', borderRadius: 8 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'monospace' }}>
                      {sess.code} • {sess.company || '—'}
                      {sess.version && <span style={{ marginLeft: 8, fontSize: 10, padding: '2px 6px', borderRadius: 8, background: '#FDE047' }}>{sess.version}</span>}
                    </div>
                    <div style={{ fontSize: 10, opacity: 0.6 }}>
                      {sess.id} • {new Date(sess.started_at || '').toLocaleString()}
                    </div>
                  </div>
                  <a href={`/rapport-profond?sessionId=${sess.id}`} style={{ padding: '10px 16px', background: '#14171B', color: '#FFF', borderRadius: 6, fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
                    Voir rapport 3 couleurs
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {(activeTab === 'cartes' || activeTab === 'all') && (
          <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 20 }}>
            <div style={{ background: '#FFF', border: '1px solid #14171B', borderRadius: 12, padding: 16, maxHeight: '85vh', overflowY: 'auto' }}>
              <input placeholder="Rechercher id/titre" value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: 4, border: '1px solid #14171B', fontSize: 12, marginBottom: 12, boxSizing: 'border-box' }} />
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                {activeTab === 'cartes' &&
                  FAMILLES.map((f) => (
                    <button key={f} onClick={() => setFamilleDiag(f)} style={{ padding: '6px 10px', borderRadius: 4, fontSize: 11, background: familleDiag === f ? '#14171B' : '#FFF', color: familleDiag === f ? '#FFF' : '#14171B', border: '1px solid #14171B' }}>
                      {f}
                    </button>
                  ))}
              </div>
              {(activeTab === 'cartes' ? diag.filter((c) => c.famille === familleDiag) : all)
                .filter((c) => !search || c.id.toLowerCase().includes(search.toLowerCase()) || c.titre.toLowerCase().includes(search.toLowerCase()))
                .map((c: any) => (
                  <button key={c.id} onClick={() => setSelected(c)} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: 6, background: selected?.id === c.id ? '#14171B' : '#F9F9F7', color: selected?.id === c.id ? '#FFF' : '#14171B', border: '1px solid #eee', marginBottom: 6, cursor: 'pointer' }}>
                    <div style={{ fontSize: 10, opacity: 0.6 }}>
                      {c.id} • {c.famille} • ordre {c.ordre}
                      {c.zoneCible && <span style={{ marginLeft: 6, background: '#FDE047', color: '#14171B', padding: '1px 6px', borderRadius: 8 }}>{c.zoneCible}</span>}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{c.titre}</div>
                    <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.question || c.action || ''}</div>
                  </button>
                ))}
            </div>
            <div style={{ background: '#FFF', border: '1px solid #14171B', borderRadius: 12, padding: 20 }}>
              {!selected ? (
                <div>Sélectionne une carte — recto verso complet affiché ici</div>
              ) : (
                <div>
                  <h2 style={{ fontFamily: 'Georgia, serif' }}>
                    {selected.id} — {selected.titre}
                  </h2>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
                    <label style={{ display: 'block', fontSize: 12 }}>
                      ID
                      <input value={selected.id} onChange={(e) => setSelected({ ...selected, id: e.target.value })} style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4, marginTop: 4 }} />
                    </label>
                    <label style={{ display: 'block', fontSize: 12 }}>
                      Famille
                      <input value={selected.famille} onChange={(e) => setSelected({ ...selected, famille: e.target.value })} style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4, marginTop: 4 }} />
                    </label>
                    <label style={{ display: 'block', fontSize: 12, gridColumn: '1 / span 2' }}>
                      Titre (recto)
                      <input value={selected.titre} onChange={(e) => setSelected({ ...selected, titre: e.target.value })} style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4, marginTop: 4 }} />
                    </label>
                    {activeTab === 'cartes' && (
                      <>
                        <label style={{ display: 'block', fontSize: 12, gridColumn: '1 / span 2' }}>
                          Image (URL)
                          <input value={selected.image || ''} onChange={(e) => setSelected({ ...selected, image: e.target.value })} style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4, marginTop: 4 }} />
                        </label>
                        <label style={{ display: 'block', fontSize: 12, gridColumn: '1 / span 2' }}>
                          Signal (verso haut)
                          <textarea value={selected.signal || ''} onChange={(e) => setSelected({ ...selected, signal: e.target.value })} style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4, marginTop: 4, minHeight: 60 }} />
                        </label>
                        <label style={{ display: 'block', fontSize: 12, gridColumn: '1 / span 2' }}>
                          Situation
                          <textarea value={selected.situation || ''} onChange={(e) => setSelected({ ...selected, situation: e.target.value })} style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4, marginTop: 4, minHeight: 80 }} />
                        </label>
                        <label style={{ display: 'block', fontSize: 12, gridColumn: '1 / span 2' }}>
                          Question (cœur du jeu — associée au vote)
                          <textarea value={selected.question || ''} onChange={(e) => setSelected({ ...selected, question: e.target.value })} style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4, marginTop: 4, minHeight: 60, fontWeight: 700 }} />
                        </label>
                        <label style={{ display: 'block', fontSize: 12 }}>
                          Mot piège
                          <input value={selected.motPiege || ''} onChange={(e) => setSelected({ ...selected, motPiege: e.target.value })} style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4, marginTop: 4 }} />
                        </label>
                        <label style={{ display: 'block', fontSize: 12 }}>
                          Compteur
                          <input value={selected.compteur || ''} onChange={(e) => setSelected({ ...selected, compteur: e.target.value })} style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4, marginTop: 4 }} />
                        </label>
                        <label style={{ display: 'block', fontSize: 12 }}>
                          Compteur Label
                          <input value={selected.compteurLabel || ''} onChange={(e) => setSelected({ ...selected, compteurLabel: e.target.value })} style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4, marginTop: 4 }} />
                        </label>
                        <label style={{ display: 'block', fontSize: 12 }}>
                          Couleur
                          <input value={selected.couleur || ''} onChange={(e) => setSelected({ ...selected, couleur: e.target.value })} style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4, marginTop: 4 }} />
                        </label>
                        <label style={{ display: 'block', fontSize: 12 }}>
                          Ordre
                          <input type="number" value={selected.ordre || 0} onChange={(e) => setSelected({ ...selected, ordre: parseInt(e.target.value) || 0 })} style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4, marginTop: 4 }} />
                        </label>
                        <label style={{ display: 'block', fontSize: 12 }}>
                          Extra type
                          <input value={selected.extra?.type || ''} onChange={(e) => setSelected({ ...selected, extra: { ...(selected.extra || {}), type: e.target.value } })} style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4, marginTop: 4 }} />
                        </label>
                        <label style={{ display: 'block', fontSize: 12, gridColumn: '1 / span 2' }}>
                          Extra texte
                          <textarea value={selected.extra?.texte || ''} onChange={(e) => setSelected({ ...selected, extra: { ...(selected.extra || {}), texte: e.target.value } })} style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4, marginTop: 4, minHeight: 60 }} />
                        </label>
                      </>
                    )}
                    {activeTab === 'all' && (
                      <>
                        <label style={{ display: 'block', fontSize: 12, gridColumn: '1 / span 2' }}>
                          Action (recto)
                          <textarea value={selected.action || ''} onChange={(e) => setSelected({ ...selected, action: e.target.value })} style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4, marginTop: 4, minHeight: 80 }} />
                        </label>
                        <label style={{ display: 'block', fontSize: 12, gridColumn: '1 / span 2' }}>
                          Indicateur
                          <textarea value={selected.indicateur || ''} onChange={(e) => setSelected({ ...selected, indicateur: e.target.value })} style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4, marginTop: 4, minHeight: 60 }} />
                        </label>
                        <label style={{ display: 'block', fontSize: 12 }}>
                          Délai
                          <input value={selected.delai || ''} onChange={(e) => setSelected({ ...selected, delai: e.target.value })} style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4, marginTop: 4 }} />
                        </label>
                        <label style={{ display: 'block', fontSize: 12 }}>
                          Niveau (1/2/3)
                          <input type="number" value={selected.niveau || 1} onChange={(e) => setSelected({ ...selected, niveau: parseInt(e.target.value) || 1 })} style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4, marginTop: 4 }} />
                        </label>
                        <label style={{ display: 'block', fontSize: 12 }}>
                          Zone cible (NO/NE/SO/SE/ALL)
                          <select
                            value={selected.zoneCible || ''}
                            onChange={(e) => setSelected({ ...selected, zoneCible: e.target.value || null })}
                            style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4, marginTop: 4 }}
                          >
                            <option value="">— Aucune —</option>
                            {ZONES.map((z) => (
                              <option key={z} value={z}>
                                {z}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label style={{ display: 'block', fontSize: 12 }}>
                          Couleur
                          <input value={selected.couleur || ''} onChange={(e) => setSelected({ ...selected, couleur: e.target.value })} style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4, marginTop: 4 }} />
                        </label>
                        <label style={{ display: 'block', fontSize: 12 }}>
                          Ordre
                          <input type="number" value={selected.ordre || 0} onChange={(e) => setSelected({ ...selected, ordre: parseInt(e.target.value) || 0 })} style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4, marginTop: 4 }} />
                        </label>
                      </>
                    )}
                  </div>
                  <button onClick={saveCard} disabled={saving} style={{ padding: '12px 20px', background: '#14171B', color: '#FFF', borderRadius: 6, marginTop: 20, fontWeight: 700 }}>
                    {saving ? 'Sauvegarde...' : 'Sauvegarder en prod (Supabase)'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
