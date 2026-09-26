import Link from 'next/link';

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#FFFEF9', color: '#14171B' }}>
      <header style={{ borderBottom: '1px solid rgba(20,23,27,0.1)', padding: '20px 0', position:'sticky', top:0, background:'#FFFEF9', zIndex:20 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 22 }}>Angle Mort · ILQ</div>
          <nav style={{ display: 'flex', gap: 24, fontSize: 14, alignItems:'center' }}>
            <a href="#concept" style={{ color: 'inherit', textDecoration: 'none' }}>Concept</a>
            <a href="#tarifs" style={{ color: 'inherit', textDecoration: 'none' }}>Tarifs</a>
            <Link href="/facilitateur" style={{ color: '#FBF8EF', textDecoration: 'none', fontWeight: 600, background:'#14171B', padding:'8px 16px', borderRadius:4 }}>Se connecter</Link>
          </nav>
        </div>
      </header>

      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 24px 60px', textAlign:'center' }}>
        <div style={{ fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.6, marginBottom: 20 }}>Diagnostic EDI · Institut Ludopédagogique du Québec</div>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 64, fontWeight: 700, lineHeight: 0.9, letterSpacing: '-0.03em', marginBottom: 24 }}>
          Le diagnostic qui révèle<br /><span style={{ fontStyle: 'italic', fontWeight: 300 }}>ce que vos formations EDI ne voient pas.</span>
        </h1>
        <p style={{ fontSize: 18, lineHeight: 1.6, maxWidth: 720, margin: '0 auto 16px', color: 'rgba(20,23,27,0.75)' }}>
          67% des talents issus de la diversité quittent en 18 mois. Pénurie, CNESST, risques Loi 25. Vous avez une politique EDI, mais les angles morts persistent.
        </p>
        <p style={{ fontSize: 16, maxWidth: 680, margin: '0 auto 40px', color: 'rgba(20,23,27,0.6)', fontStyle:'italic' }}>
          Pourquoi ? Formations binaires Inclusion / Non-inclusion qui culpabilisent sans outiller.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="#tarifs" style={{ padding: '18px 32px', background: '#14171B', color: '#FBF8EF', textDecoration: 'none', borderRadius: 4, fontWeight: 600 }}>Découvrir la formation →</a>
          <Link href="/facilitateur" style={{ padding: '18px 32px', background: '#FDE047', color: '#14171B', textDecoration: 'none', borderRadius: 4, fontWeight: 700, border: '1px solid #14171B' }}>J'ai un code facilitateur</Link>
        </div>
      </section>

      <section id="concept" style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 24px', background:'#FBF8EF', borderTop:'1px solid rgba(20,23,27,0.1)' }}>
        <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 36, fontWeight: 700, textAlign:'center', marginBottom: 8 }}>4 dimensions. Unique au Canada.</h2>
        <p style={{ textAlign:'center', maxWidth:700, margin:'0 auto 32px', opacity:0.65 }}>REC / MIC / PRI / CLI - Seul leur croisement révèle le Punctum.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          <div style={{ background:'#FFF', borderLeft:'4px solid #DC2626', padding:16, borderRadius:8 }}><b>REC - Recrutement</b><br/><span style={{ fontSize:13, opacity:0.7 }}>Fit culturel = clonage. Langue = compétence.</span></div>
          <div style={{ background:'#FFF', borderLeft:'4px solid #EAB308', padding:16, borderRadius:8 }}><b>MIC - Micro-comportements</b><br/><span style={{ fontSize:13, opacity:0.7 }}>Blague-pouvoir, interruption.</span></div>
          <div style={{ background:'#FFF', borderLeft:'4px solid #5B21B6', padding:16, borderRadius:8 }}><b>PRI - Privilèges</b><br/><span style={{ fontSize:13, opacity:0.7 }}>Réseau-connaissance, mérite-objectif.</span></div>
          <div style={{ background:'#FFF', borderLeft:'4px solid #1E293B', padding:16, borderRadius:8 }}><b>CLI - Climat</b><br/><span style={{ fontSize:13, opacity:0.7 }}>Client-prétexte, silence complice.</span></div>
        </div>
      </section>

      <section id="tarifs" style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 24px' }}>
        <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 36, fontWeight: 700, textAlign:'center', marginBottom: 16 }}>Accéder à la formation</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, maxWidth: 900, margin: '0 auto' }}>
          <div style={{ background: '#FBF8EF', border: '2px solid #14171B', borderRadius: 12, padding: 32 }}>
            <div style={{ fontSize: 12, textTransform: 'uppercase', opacity: 0.6, marginBottom: 12 }}>Nouvelle organisation</div>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 28, fontWeight: 700, marginBottom: 12 }}>Licence complète</div>
            <a href="mailto:contact@lumiere.org?subject=Demande%20de%20licence" style={{ display: 'block', padding: '14px', background: '#14171B', color: '#FBF8EF', textAlign: 'center', textDecoration: 'none', borderRadius: 4 }}>Demander une démo →</a>
          </div>
          <div style={{ background: '#FDE047', border: '2px solid #14171B', borderRadius: 12, padding: 32 }}>
            <div style={{ fontSize: 12, textTransform: 'uppercase', opacity: 0.6, marginBottom: 12 }}>Déjà inscrit</div>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 28, fontWeight: 700, marginBottom: 16 }}>J'ai un code</div>
            <Link href="/facilitateur" style={{ display: 'block', padding: '14px', background: '#14171B', color: '#FBF8EF', textAlign: 'center', textDecoration: 'none', borderRadius: 4, marginBottom: 10 }}>Espace facilitateur →</Link>
            <Link href="/joueur" style={{ display: 'block', padding: '14px', background: '#FFF', color: '#14171B', textAlign: 'center', textDecoration: 'none', borderRadius: 4, border: '1px solid #14171B' }}>Espace joueur →</Link>
          </div>
        </div>
      </section>

      <footer style={{ borderTop: '1px solid rgba(20,23,27,0.1)', padding: '24px', textAlign: 'center', fontSize: 12, opacity:0.5 }}>Angle Mort · ILQ · 2026</footer>
    </div>
  );
}
