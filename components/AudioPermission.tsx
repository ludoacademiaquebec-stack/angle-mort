'use client';

import { useState } from 'react';

export function AudioPermission({ label = 'Visio' }: { label?: string }) {
  const [status, setStatus] = useState<'idle' | 'granted' | 'denied'>('idle');

  const demander = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      stream.getTracks().forEach((t) => t.stop());
      setStatus('granted');
    } catch {
      setStatus('denied');
    }
  };

  if (status === 'granted') {
    return (
      <div style={{ padding: 16, background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 6, textAlign: 'center', fontSize: 13 }}>
        ✅ Micro et caméra autorisés
      </div>
    );
  }

  if (status === 'denied') {
    return (
      <div style={{ padding: 16, background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 6, textAlign: 'center', fontSize: 13 }}>
        ⚠️ Autorisation refusée. Vérifie tes paramètres navigateur.
        <button onClick={() => setStatus('idle')} style={{ display: 'block', margin: '8px auto 0', padding: '6px 12px', background: '#FFF', border: '1px solid rgba(20,23,27,0.2)', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}>
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: 16, background: '#0A0A0A', color: '#FBF8EF', borderRadius: 6, textAlign: 'center' }}>
      <div style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.6, marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 13, marginBottom: 12 }}>Autorise ton micro et ta caméra</div>
      <button onClick={demander} style={{ padding: '12px 20px', background: '#FDE047', color: '#14171B', border: 'none', borderRadius: 4, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
        🎤 Autoriser micro et caméra
      </button>
      <div style={{ fontSize: 11, opacity: 0.5, marginTop: 8 }}>Facultatif</div>
    </div>
  );
}
