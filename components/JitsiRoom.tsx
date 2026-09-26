'use client';

// ============================================================
// ANGLE MORT v3.3 — JitsiRoom robuste
// - Demande les permissions caméra/micro AVANT de charger Jitsi
// - Fallback gracieux si permission refusée (Jitsi audio-only ou désactivé)
// - Fonctionne sur Safari, Chrome, Firefox, mobile
// ============================================================

import { JitsiMeeting } from '@jitsi/react-sdk';
import { useEffect, useState } from 'react';

type PermissionState = 'idle' | 'checking' | 'granted' | 'denied' | 'unsupported';

export function JitsiRoom({
  sessionId,
  displayName,
  moderator = false,
  height = 220,
}: {
  sessionId: string;
  displayName?: string;
  moderator?: boolean;
  height?: number;
}) {
  const [permission, setPermission] = useState<PermissionState>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const roomName = `AngleMort-${sessionId}-${moderator ? 'host' : 'play'}`;

  // Au montage : on vérifie si les permissions sont déjà accordées
  useEffect(() => {
    if (typeof navigator === 'undefined') return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setPermission('unsupported');
      return;
    }

    // Vérifier les permissions si l'API est dispo
    if (navigator.permissions && navigator.permissions.query) {
      Promise.all([
        navigator.permissions.query({ name: 'camera' as PermissionName }).catch(() => null),
        navigator.permissions.query({ name: 'microphone' as PermissionName }).catch(() => null),
      ]).then(([cam, mic]) => {
        const camState = cam?.state ?? 'prompt';
        const micState = mic?.state ?? 'prompt';
        if (camState === 'granted' && micState === 'granted') {
          setPermission('granted');
        } else if (camState === 'denied' && micState === 'denied') {
          setPermission('denied');
        } else {
          setPermission('idle');
        }
      }).catch(() => setPermission('idle'));
    }
  }, []);

  // Demander les permissions au clic
  const demanderPermissions = async () => {
    setPermission('checking');
    setErrorMsg(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      // On arrête immédiatement le stream — Jitsi va le redemander proprement
      stream.getTracks().forEach((t) => t.stop());
      setPermission('granted');
    } catch (err: any) {
      console.warn('[JitsiRoom] Permission refusée :', err);
      if (err.name === 'NotAllowedError') {
        setErrorMsg('Vous avez refusé l\'accès. Autorisez caméra et micro dans les paramètres du navigateur.');
      } else if (err.name === 'NotFoundError') {
        setErrorMsg('Aucune caméra ou micro détecté. Le jeu peut continuer sans.');
      } else {
        setErrorMsg('Impossible d\'accéder aux périphériques audio/vidéo.');
      }
      setPermission('denied');
    }
  };

  // Écran d'autorisation
  if (permission === 'idle' || permission === 'checking') {
    return (
      <div
        style={{
          width: '100%',
          height,
          borderRadius: 6,
          background: '#0A0A0A',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FBF8EF',
          padding: 20,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontFamily: 'ui-monospace, monospace',
            fontSize: 10,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            opacity: 0.6,
            marginBottom: 12,
          }}
        >
          Visioconférence
        </div>
        <div style={{ fontFamily: 'Georgia, serif', fontSize: 14, marginBottom: 16, opacity: 0.85 }}>
          Pour activer le son et la vidéo
        </div>
        <button
          onClick={demanderPermissions}
          disabled={permission === 'checking'}
          style={{
            padding: '12px 20px',
            background: '#FDE047',
            color: '#14171B',
            border: 'none',
            borderRadius: 4,
            fontSize: 13,
            fontWeight: 700,
            cursor: permission === 'checking' ? 'wait' : 'pointer',
          }}
        >
          {permission === 'checking' ? '...' : '🎤 Autoriser micro et caméra'}
        </button>
        <div style={{ fontSize: 11, opacity: 0.5, marginTop: 12, maxWidth: 280 }}>
          Facultatif — le jeu fonctionne sans visio
        </div>
      </div>
    );
  }

  // Fallback si permission refusée ou non supportée
  if (permission === 'denied' || permission === 'unsupported') {
    return (
      <div
        style={{
          width: '100%',
          height,
          borderRadius: 6,
          background: '#0A0A0A',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FBF8EF',
          padding: 20,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontFamily: 'ui-monospace, monospace',
            fontSize: 10,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            opacity: 0.6,
            marginBottom: 8,
          }}
        >
          Visio désactivée
        </div>
        <div style={{ fontSize: 12, opacity: 0.7, maxWidth: 320, lineHeight: 1.4 }}>
          {errorMsg || 'Le jeu continue sans visio.'}
        </div>
        <div
          style={{
            marginTop: 12,
            fontSize: 10,
            fontFamily: 'ui-monospace, monospace',
            opacity: 0.4,
          }}
        >
          Salle : {roomName}
        </div>
        <button
          onClick={() => setPermission('idle')}
          style={{
            marginTop: 12,
            padding: '8px 14px',
            background: 'transparent',
            color: '#FBF8EF',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: 4,
            fontSize: 11,
            cursor: 'pointer',
          }}
        >
          Réessayer
        </button>
      </div>
    );
  }

  // Permissions OK → on charge Jitsi
  return (
    <div
      style={{
        width: '100%',
        height,
        borderRadius: 6,
        overflow: 'hidden',
        border: '1px solid rgba(20,23,27,0.15)',
        background: '#0A0A0A',
        position: 'relative',
      }}
    >
      <JitsiMeeting
        domain="meet.jit.si"
        roomName={roomName}
        configOverwrite={{
          startWithAudioMuted: !moderator,
          startWithVideoMuted: !moderator,
          prejoinPageEnabled: false,
          disableDeepLinking: true,
          enableWelcomePage: false,
          enableClosePage: false,
        }}
        interfaceConfigOverwrite={{
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          SHOW_BRAND_WATERMARK: false,
          SHOW_POWERED_BY: false,
          DEFAULT_BACKGROUND: '#0A0A0A',
          DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
          MOBILE_APP_PROMO: false,
        }}
        userInfo={{
          displayName: displayName || (moderator ? 'Facilitateur' : 'Joueur'),
          email: `${(displayName || 'user').toLowerCase().replace(/\s+/g, '.')}@anglemort.local`,
        }}
        getIFrameRef={(iframeRef) => {
          iframeRef.style.height = '100%';
          iframeRef.style.width = '100%';
          iframeRef.style.border = '0';
        }}
      />
    </div>
  );
}
