'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { computeAnalytics, generateNarrative } from '@/lib/analyticsEngine';

export default function RapportPage({ params }: { params: { code: string } }) {
  const [analytics, setAnalytics] = useState<any>(null);
  const [narrative, setNarrative] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: session } = await supabase.from('sessions').select('*').eq('id', params.code).single();
      if (!session) { setLoading(false); return; }
      const a = await computeAnalytics(params.code);
      setAnalytics(a);
      setNarrative(generateNarrative(a, session.company));
      setLoading(false);
    })();
  }, [params.code]);

  if (loading) return <div style={{ padding: 40 }}>Calcul des dynamiques en arrière-plan...</div>;
  if (!analytics) return <div style={{ padding: 40 }}>Session {params.code} introuvable</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#FFFEF9', padding: 40, color: '#14171B' }}>
      <h1 style={{ fontFamily: 'Georgia', fontSize: 36 }}>Rapport Angle Mort - {params.code}</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 30 }}>
        <div style={{ border: '2px solid #14171B', padding: 20, borderRadius: 12, background: '#FDE047' }}>
          <h3>👁️ Ce que le facilitateur VOIT</h3>
          <p>{narrative.pourFacilitateur.ceQueTuVois}</p>
        </div>
        <div style={{ border: '2px solid #14171B', padding: 20, borderRadius: 12, background: '#FBF8EF' }}>
          <h3>🔍 Ce que même en présentiel il NE VOIT PAS</h3>
          <p>{narrative.pourFacilitateur.ceQueTuNeVoisPas}</p>
          <p style={{ fontWeight: 800, marginTop: 10 }}>{narrative.pourFacilitateur.angleMort}</p>
        </div>
      </div>

      <h2 style={{ marginTop: 40 }}>Dynamiques individuelles</h2>
      {analytics.players.map((p: any) => (
        <div key={p.nick} style={{ border: '1px solid #14171B', padding: 16, margin: '12px 0', borderRadius: 8 }}>
          <strong>{p.nick}</strong> - Latence {p.avgLatency}ms | Hésitations {p.hesitations} | Leadership {p.leadershipScore}% | Conformité {p.conformityScore}%
          <br/>Angles morts perso: {p.quadrantNeverVisited.join(', ') || 'aucun'} | Quadrants visités: {p.quadrantsVisited.join(', ')}
        </div>
      ))}

      <h2 style={{ marginTop: 40 }}>Pour les employés</h2>
      {narrative.pourEmployes.map((e: any) => (
        <div key={e.nick} style={{ background: '#FFF', padding: 16, margin: '8px 0', borderLeft: '4px solid #14171B' }}>
          <strong>{e.nick}:</strong> {e.message}
        </div>
      ))}

      <h2 style={{ marginTop: 40 }}>Pour l'entreprise - Diagnostic</h2>
      <div style={{ background: '#14171B', color: '#FFFEF9', padding: 24, borderRadius: 12 }}>
        <p><strong>Diagnostic:</strong> {narrative.pourEntreprise.diagnostic}</p>
        <p><strong>Recommandation:</strong> {narrative.pourEntreprise.recommandation}</p>
        <p><strong>Risque:</strong> {narrative.pourEntreprise.risque}</p>
        <p style={{ marginTop: 16, opacity: 0.7 }}>Angle mort collectif: {analytics.collective.angleMortCollectif.join(', ') || 'Aucun - exploration totale'}</p>
      </div>

      <div style={{ marginTop: 30 }}>
        <a href={`/board/${params.code}`} style={{ textDecoration: 'underline' }}>← Retour plateau</a>
      </div>
    </div>
  );
}
