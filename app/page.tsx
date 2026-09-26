import Link from 'next/link';

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#F4EFE2', color: '#14171B' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid rgba(20,23,27,0.1)', padding: '20px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 22, letterSpacing: '-0.01em' }}>
            Angle Mort
          </div>
          <nav style={{ display: 'flex', gap: 24, fontSize: 14 }}>
            <a href="#concept" style={{ color: 'inherit', textDecoration: 'none' }}>Concept</a>
            <a href="#tarifs" style={{ color: 'inherit', textDecoration: 'none' }}>Tarifs</a>
            <Link href="/facilitateur" style={{ color: 'inherit', textDecoration: 'none', fontWeight: 600 }}>Se connecter</Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 24px 60px', textAlign: 'center' }}>
        <div style={{ fontSize: 13, letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.6, marginBottom: 20 }}>
          Formation en ligne · Diagnostic EDI
        </div>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 64, fontWeight: 700, lineHeight: 0.95, letterSpacing: '-0.03em', marginBottom: 24 }}>
          Le jeu qui révèle<br />
          <span style={{ fontStyle: 'italic', fontWeight: 300 }}>ce qu'on ne voit pas.</span>
        </h1>
        <p style={{ fontSize: 18, lineHeight: 1.6, maxWidth: 640, margin: '0 auto 40px', color: 'rgba(20,23,27,0.75)' }}>
          60 cartes diagnostiques. 15 leviers d'action. 4 quadrants sémantiques.<br />
          Un atelier de 70 minutes qui cartographie les angles morts de votre organisation.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="#tarifs" style={{ padding: '18px 32px', background: '#14171B', color: '#FBF8EF', textDecoration: 'none', borderRadius: 4, fontSize: 15, fontWeight: 600, letterSpacing: '0.02em' }}>
            Découvrir la formation
          </a>
          <Link href="/facilitateur" style={{ padding: '18px 32px', background: '#FDE047', color: '#14171B', textDecoration: 'none', borderRadius: 4, fontSize: 15, fontWeight: 700, border: '1px solid #14171B' }}>
            J'ai un code facilitateur
          </Link>
        </div>
      </section>

      {/* Concept */}
      <section id="concept" style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 24px', borderTop: '1px solid rgba(20,23,27,0.1)' }}>
        <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 40, fontWeight: 700, lineHeight: 1.1, marginBottom: 40, letterSpacing: '-0.02em' }}>
          Pourquoi Angle Mort ?
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 32 }}>
          {[
            { t: 'Un diagnostic, pas un quiz', d: 'Aucune bonne réponse. Le groupe dépose ses jetons, argumente, révèle l\'angle mort.' },
            { t: 'Cartographie collective', d: '4 quadrants sémantiques. Chaque carte est débattue, positionnée, puis révélée.' },
            { t: 'Action concrète', d: '15 cartes ALL pour transformer les zones rouges en engagements testables à 48h.' },
            { t: 'Multi-entreprises', d: 'Super admin, facilitateurs autonomes, joueurs partout dans le monde.' },
          ].map((item) => (
            <div key={item.t} style={{ background: '#FBF8EF', border: '1px solid rgba(20,23,27,0.1)', borderRadius: 8, padding: 28 }}>
              <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: 700, marginBottom: 12, lineHeight: 1.2 }}>{item.t}</h3>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: 'rgba(20,23,27,0.7)', margin: 0 }}>{item.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tarifs / Accès */}
      <section id="tarifs" style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 24px', borderTop: '1px solid rgba(20,23,27,0.1)' }}>
        <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 40, fontWeight: 700, lineHeight: 1.1, marginBottom: 16, letterSpacing: '-0.02em', textAlign: 'center' }}>
          Accéder à la formation
        </h2>
        <p style={{ fontSize: 16, textAlign: 'center', color: 'rgba(20,23,27,0.65)', marginBottom: 48 }}>
          Une seule offre. Tout inclus. Sans limite de session.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, maxWidth: 900, margin: '0 auto' }}>
          {/* Carte 1 — Acheter */}
          <div style={{ background: '#FBF8EF', border: '2px solid #14171B', borderRadius: 12, padding: 32 }}>
            <div style={{ fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.6, marginBottom: 12 }}>
              Nouvelle organisation
            </div>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 32, fontWeight: 700, lineHeight: 1, marginBottom: 8 }}>
              Licence complète
            </div>
            <div style={{ fontSize: 14, color: 'rgba(20,23,27,0.6)', marginBottom: 24 }}>
              Formation + plateforme + supervision
            </div>
            <a href="mailto:contact@lumiere.org?subject=Demande%20de%20licence%20Angle%20Mort" style={{ display: 'block', padding: '16px 24px', background: '#14171B', color: '#FBF8EF', textDecoration: 'none', borderRadius: 4, fontSize: 15, fontWeight: 600, textAlign: 'center' }}>
              Demander une démo →
            </a>
            <ul style={{ listStyle: 'none', padding: 0, margin: '24px 0 0', fontSize: 13, lineHeight: 2, color: 'rgba(20,23,27,0.75)' }}>
              <li>✓ 75 cartes numériques</li>
              <li>✓ Plateau Punctum interactif</li>
              <li>✓ Super admin + facilitateurs illimités</li>
              <li>✓ Sessions illimitées</li>
              <li>✓ Rapport automatique</li>
            </ul>
          </div>

          {/* Carte 2 — J'ai un code */}
          <div style={{ background: '#FDE047', border: '2px solid #14171B', borderRadius: 12, padding: 32 }}>
            <div style={{ fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.6, marginBottom: 12 }}>
              Déjà inscrit
            </div>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 32, fontWeight: 700, lineHeight: 1, marginBottom: 8 }}>
              J'ai un code
            </div>
            <div style={{ fontSize: 14, color: 'rgba(20,23,27,0.7)', marginBottom: 24 }}>
              Facilitateur ou participant
            </div>
            <Link href="/facilitateur" style={{ display: 'block', padding: '16px 24px', background: '#14171B', color: '#FBF8EF', textDecoration: 'none', borderRadius: 4, fontSize: 15, fontWeight: 600, textAlign: 'center', marginBottom: 12 }}>
              Espace facilitateur →
            </Link>
            <Link href="/joueur" style={{ display: 'block', padding: '16px 24px', background: '#FFFFFF', color: '#14171B', textDecoration: 'none', borderRadius: 4, fontSize: 15, fontWeight: 600, textAlign: 'center', border: '1px solid #14171B' }}>
              Espace joueur →
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(20,23,27,0.1)', padding: '32px 24px', textAlign: 'center', fontSize: 12, color: 'rgba(20,23,27,0.5)' }}>
        Angle Mort · Institut Ludopédagogique du Québec · 2026
      </footer>
    </div>
  );
}
