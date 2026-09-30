'use client';

import { useState } from 'react';

interface ImageGeneratorCardProps {
  carteId: string;
  titre: string;
  type: 'signal' | 'situation';
  famille: string;
  signalTexte: string;
  situationTexte: string;
  currentUrl?: string | null;
  onValidated: (url: string) => void;
}

export function ImageGeneratorCard({
  carteId,
  titre,
  type,
  famille,
  signalTexte,
  situationTexte,
  currentUrl,
  onValidated,
}: ImageGeneratorCardProps) {
  const [prompt, setPrompt] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(currentUrl || null);

  const couleurFamille: Record<string, string> = {
    REC: '#101E33',
    MIC: '#6B3620',
    PRI: '#37203A',
    CLI: '#123024',
    ALL: '#123024',
  };
  const couleur = couleurFamille[famille] || '#14171B';

  const promptParDefaut = type === 'signal'
    ? `Illustration minimaliste et éditoriale, ${titre}. ${signalTexte.slice(0, 120)}. Style sobre, palette douce, sans texte.`
    : `Illustration documentaire sobre, ${titre}. ${situationTexte.slice(0, 120)}. Style éditorial, palette sourde, sans texte.`;

  const generer = () => {
    setError(null);
    const texte = (prompt || promptParDefaut).trim();
    const seed = Math.floor(Math.random() * 999999);
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(texte)}?width=800&height=600&seed=${seed}&nologo=true`;
    setPreviewUrl(url);
  };

  const valider = async () => {
    if (!previewUrl) return;
    setUploading(true);
    setError(null);

    try {
      const imgRes = await fetch(previewUrl);
      if (!imgRes.ok) throw new Error('Impossible de télécharger l\'image générée');
      const blob = await imgRes.blob();

      const formData = new FormData();
      formData.append('file', new File([blob], `${carteId}-${type}.png`, { type: blob.type || 'image/png' }));
      formData.append('carteId', carteId);
      formData.append('type', type);

      const res = await fetch('/api/upload-image', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok || !data.url) throw new Error(data.error || 'Erreur upload');

      setUploadedUrl(data.url);
      onValidated(data.url);
      setPreviewUrl(null);
    } catch (e: any) {
      setError(e?.message || 'Erreur');
    } finally {
      setUploading(false);
    }
  };

  const uploadFichier = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('carteId', carteId);
      formData.append('type', type);

      const res = await fetch('/api/upload-image', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || 'Erreur upload');

      setUploadedUrl(data.url);
      onValidated(data.url);
    } catch (e: any) {
      setError(e?.message || 'Erreur');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ padding: 12, background: '#F7F2E9', borderRadius: 6, border: `2px solid ${couleur}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontWeight: 700, fontSize: 12, color: couleur, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          {type === 'signal' ? '📸 Image SIGNAL (recto)' : '📄 Image SITUATION (verso)'}
        </div>
        {uploadedUrl && (
          <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: '#10B981', color: '#FFF', fontWeight: 700 }}>
            ✓ Enregistrée
          </span>
        )}
      </div>

      {/* Aperçu actuel */}
      {uploadedUrl && !previewUrl && (
        <div style={{ marginBottom: 10 }}>
          <img
            src={uploadedUrl}
            alt={`Carte ${type}`}
            style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 4, border: '1px solid #ccc' }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        </div>
      )}

      {/* Prompt IA */}
      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, marginBottom: 4 }}>
        Prompt de génération
      </label>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder={promptParDefaut}
        style={{ width: '100%', minHeight: 60, padding: 8, border: '1px solid #ccc', borderRadius: 4, fontSize: 11, boxSizing: 'border-box', resize: 'vertical' }}
      />

      {/* Boutons génération */}
      <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
        <button
          onClick={generer}
          disabled={uploading}
          style={{ flex: 1, padding: '8px 12px', background: '#FDE047', color: '#14171B', border: '1px solid #14171B', borderRadius: 4, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
        >
          🎨 {previewUrl ? 'Régénérer' : 'Générer une image'}
        </button>
        <label style={{ padding: '8px 12px', background: '#FFF', color: '#14171B', border: '1px solid #14171B', borderRadius: 4, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
          📁 Upload
          <input
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFichier(f); }}
          />
        </label>
      </div>

      {/* Prévisualisation générée */}
      {previewUrl && (
        <div style={{ marginTop: 10, padding: 10, background: '#FFFFFF', borderRadius: 4, border: '1px dashed #14171B' }}>
          <div style={{ fontSize: 10, opacity: 0.6, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Prévisualisation — non enregistrée
          </div>
          <img
            src={previewUrl}
            alt="Prévisualisation"
            style={{ maxWidth: '100%', maxHeight: 220, borderRadius: 4, display: 'block' }}
            onError={() => setError('Erreur de chargement de l\'image (Pollinations.ai)')}
          />
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            <button
              onClick={valider}
              disabled={uploading}
              style={{ flex: 1, padding: '8px 12px', background: '#10B981', color: '#FFF', border: 'none', borderRadius: 4, fontSize: 11, fontWeight: 700, cursor: uploading ? 'wait' : 'pointer' }}
            >
              {uploading ? '⏳ Envoi...' : '✓ Valider et enregistrer'}
            </button>
            <button
              onClick={() => setPreviewUrl(null)}
              style={{ padding: '8px 12px', background: '#FFF', color: '#14171B', border: '1px solid #ccc', borderRadius: 4, fontSize: 11, cursor: 'pointer' }}
            >
              ✕ Annuler
            </button>
          </div>
        </div>
      )}

      {error && (
        <div style={{ marginTop: 8, padding: 8, background: '#FEE2E2', color: '#DC2626', borderRadius: 4, fontSize: 11 }}>
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}