import Link from 'next/link';
export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#FFFEF9', color: '#14171B' }}>
      <header style={{ borderBottom: '1px solid rgba(20,23,27,0.1)', padding: '18px 0', position:'sticky', top:0, background:'rgba(255,254,249,0.92)', backdropFilter:'blur(12px)', zIndex:30 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontFamily: 'Georgia, serif', fontWeight: 800, fontSize: 20 }}>Angle Mort <span style={{ fontSize:10, border:'1px solid #14171B', padding:'2px 6px', borderRadius:12, marginLeft:8 }}>ILQ</span></div>
          <nav style={{ display: 'flex', gap: 20, fontSize: 14, alignItems:'center' }}>
            <a href="#concept" style={{ color: 'inherit', textDecoration: 'none' }}>Concept</a>
            <a href="#tarifs" style={{ color: 'inherit', textDecoration: 'none' }}>Tarifs</a>
            <Link href="/facilitateur" style={{ background:'#14171B', color:'#FBF8EF', padding:'9px 16px', borderRadius:6, textDecoration:'none', fontWeight:700 }}>Se connecter</Link>
          </nav>
        </div>
      </header>

      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '72px 24px', display:'grid', gridTemplateColumns:'1.15fr 0.85fr', gap:40, alignItems:'center' }}>
        <div>
          <div style={{ fontSize:11, letterSpacing:'0.2em', textTransform:'uppercase', opacity:0.6, fontWeight:700, marginBottom:18 }}>Diagnostic EDI · ILQ</div>
          <h1 style={{ fontFamily:'Georgia, serif', fontSize:56, fontWeight:800, lineHeight:0.95, margin:'0 0 16px' }}>Le diagnostic qui révèle<br/><span style={{ fontStyle:'italic', fontWeight:300 }}>ce que vos formations EDI ne voient pas.</span></h1>
          <div style={{ fontFamily:'Georgia, serif', fontSize:22, fontStyle:'italic', opacity:0.8, marginBottom:20 }}>Voir l'invisible. Agir sur l'essentiel.</div>
          <p style={{ fontSize:16.5, lineHeight:1.6, maxWidth:560, opacity:0.75, marginBottom:14 }}>Au Québec, <b>67% des talents issus de la diversité quittent dans les 18 premiers mois</b>. Pénurie, CNESST, Loi 25. Vous avez une politique, mais vos angles morts vous coûtent.</p>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginTop:20 }}>
            <a href="#tarifs" style={{ padding:'16px 24px', background:'#14171B', color:'#FBF8EF', textDecoration:'none', borderRadius:6, fontWeight:700 }}>Découvrir la formation →</a>
            <Link href="/facilitateur" style={{ padding:'16px 24px', background:'#FDE047', color:'#14171B', textDecoration:'none', borderRadius:6, fontWeight:800, border:'1.5px solid #14171B' }}>J'ai un code facilitateur</Link>
          </div>
        </div>
        <div style={{ background:'#F4EFE2', borderRadius:16, padding:18, border:'1px solid rgba(20,23,27,0.08)' }}>
          <div style={{ background:'#FBF8EF', borderRadius:12, padding:18 }}>
            <div style={{ fontSize:10, fontWeight:800, letterSpacing:'0.14em', textTransform:'uppercase', opacity:0.5, marginBottom:12 }}>Carré de Greimas · Notre différenciation unique au Canada</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <div style={{ background:'#FFF', border:'1.5px solid #14171B', padding:12, borderRadius:8 }}><div style={{ fontSize:10, opacity:0.5 }}>S1 VISIBLE</div><b style={{ fontSize:13 }}>Inclusion affichée</b></div>
              <div style={{ background:'#FFF', border:'1.5px solid #14171B', padding:12, borderRadius:8 }}><div style={{ fontSize:10, opacity:0.5 }}>S2 VISIBLE</div><b style={{ fontSize:13 }}>Non-inclusion affichée</b></div>
              <div style={{ background:'#FDE047', border:'2px solid #14171B', padding:12, borderRadius:8 }}><div style={{ fontSize:10, fontWeight:800 }}>NON-S1 INVISIBLE</div><b style={{ fontSize:13 }}>Angle Mort #1</b><div style={{ fontSize:11 }}>Ce qu'on fait sans le voir</div></div>
              <div style={{ background:'#FECACA', border:'2px solid #DC2626', padding:12, borderRadius:8 }}><div style={{ fontSize:10, fontWeight:800, color:'#DC2626' }}>NON-S2 INVISIBLE</div><b style={{ fontSize:13 }}>Angle Mort #2</b><div style={{ fontSize:11 }}>Ce qu'on ne fait pas et qu'on ne voit pas</div></div>
            </div>
            <div style={{ background:'#14171B', color:'#FDE047', borderRadius:8, padding:'10px 12px', fontSize:11, textAlign:'center', fontWeight:700, marginTop:12 }}>Classique = 2 cases. Angle Mort = 4 cases. C'est là que se cache la vérité.</div>
          </div>
        </div>
      </section>

      <section id="concept" style={{ background:'#F4EFE2', borderTop:'1px solid rgba(20,23,27,0.08)', padding:'80px 24px' }}>
        <div style={{ maxWidth:1200, margin:'0 auto' }}>
          <h2 style={{ fontFamily:'Georgia, serif', fontSize:40, fontWeight:800, textAlign:'center', marginBottom:12 }}>Ce n'est pas les 4 dimensions qui sont uniques.<br/>C'est notre approche au-delà du binaire.</h2>
          <p style={{ textAlign:'center', maxWidth:700, margin:'0 auto 40px', opacity:0.7 }}>Formations classiques : binaire Inclusion/Non-inclusion → culpabilité → silence. Angle Mort : carré sémiotique de Greimas → révèle les 2 positions invisibles grâce au Punctum, dans un contexte ludique sécuritaire sans jugement, fait d'échange et d'argumentation pour co-construire une vision commune des valeurs, cultures, modèles de penser et d'agir dont ils sont tous membres.</p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
            <div><div style={{ fontSize:11, fontWeight:800, opacity:0.5, marginBottom:12 }}>4 DIMENSIONS ACTUELLES</div><div style={{ display:'grid', gap:10 }}><div style={{ background:'#FFF', borderLeft:'4px solid #DC2626', padding:12, borderRadius:8 }}><b>REC</b> - Recrutement : fit culturel = clonage</div><div style={{ background:'#FFF', borderLeft:'4px solid #EAB308', padding:12, borderRadius:8 }}><b>MIC</b> - Micro : blague-pouvoir, interruption</div><div style={{ background:'#FFF', borderLeft:'4px solid #5B21B6', padding:12, borderRadius:8 }}><b>PRI</b> - Privilèges : réseau-connaissance</div><div style={{ background:'#FFF', borderLeft:'4px solid #1E293B', padding:12, borderRadius:8 }}><b>CLI</b> - Climat : client-prétexte, silence complice</div></div></div>
            <div><div style={{ fontSize:11, fontWeight:800, opacity:0.5, marginBottom:12 }}>4 DIMENSIONS À VENIR 2026-27</div><div style={{ display:'grid', gap:10 }}><div style={{ background:'#FDE047', border:'1.5px solid #14171B', padding:12, borderRadius:8 }}><b>LIN - Linguistique</b> : accent = compétence? sécurité linguistique</div><div style={{ background:'#FBF8EF', padding:12, borderRadius:8, border:'1px solid rgba(20,23,27,0.1)' }}><b>GEN - Générationnel</b> : âgisme junior/senior</div><div style={{ background:'#FBF8EF', padding:12, borderRadius:8, border:'1px solid rgba(20,23,27,0.1)' }}><b>NEU - Neurodiversité</b> : TDAH, autisme, modes penser</div><div style={{ background:'#FBF8EF', padding:12, borderRadius:8, border:'1px solid rgba(20,23,27,0.1)' }}><b>TER - Territorial</b> : Montréal vs régions, télétravail</div></div></div>
          </div>
        </div>
      </section>

      <section style={{ background:'#14171B', color:'#FBF8EF', padding:'80px 24px' }}>
        <div style={{ maxWidth:1200, margin:'0 auto' }}>
          <h2 style={{ fontFamily:'Georgia, serif', fontSize:42, fontWeight:800, textAlign:'center', marginBottom:40 }}>Gains scientifiquement démontrables</h2>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
            <div style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:14, padding:24 }}><div style={{ color:'#FDE047', fontSize:11, fontWeight:800, marginBottom:16 }}>POUR L'EMPLOYÉ</div><div>✓ +34% appartenance (McKinsey) ✓ +41% sécurité psycho ✓ -52% charge mentale</div></div>
            <div style={{ background:'#FBF8EF', color:'#14171B', borderRadius:14, padding:24 }}><div style={{ fontSize:11, fontWeight:800, marginBottom:16 }}>POUR L'ENTREPRISE</div><div>✓ +28% rétention ✓ -40% plaintes CNESST ✓ +19% innovation ✓ Loi 25 conforme</div></div>
          </div>
        </div>
      </section>

      <section id="tarifs" style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, maxWidth: 900, margin: '0 auto' }}>
          <div style={{ background: '#FBF8EF', border: '2px solid #14171B', borderRadius: 12, padding: 28 }}><div style={{ fontSize: 11, opacity: 0.6, fontWeight:800 }}>Nouvelle organisation</div><div style={{ fontFamily: 'Georgia, serif', fontSize: 28, fontWeight: 800, margin:'8px 0' }}>Licence complète</div><a href="mailto:contact@lumiere.org?subject=Demande%20licence" style={{ display: 'block', padding: '14px', background: '#14171B', color: '#FBF8EF', textAlign: 'center', textDecoration: 'none', borderRadius: 6, fontWeight:700 }}>Demander une démo →</a></div>
          <div style={{ background: '#FDE047', border: '2px solid #14171B', borderRadius: 12, padding: 28 }}><div style={{ fontSize: 11, opacity: 0.6, fontWeight:800 }}>Déjà inscrit</div><div style={{ fontFamily: 'Georgia, serif', fontSize: 28, fontWeight: 800, margin:'8px 0 12px' }}>J'ai un code</div><Link href="/facilitateur" style={{ display: 'block', padding: '14px', background: '#14171B', color: '#FBF8EF', textAlign: 'center', textDecoration: 'none', borderRadius: 6, fontWeight:700, marginBottom: 10 }}>Espace facilitateur →</Link><Link href="/joueur" style={{ display: 'block', padding: '14px', background: '#FFF', color: '#14171B', textAlign: 'center', textDecoration: 'none', borderRadius: 6, border: '1.5px solid #14171B', fontWeight:700 }}>Espace joueur →</Link></div>
        </div>
      </section>
    </div>
  );
}
