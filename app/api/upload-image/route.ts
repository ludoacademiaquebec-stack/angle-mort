import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const carteId = formData.get('carteId') as string | null;
    const type = formData.get('type') as string | null;

    if (!file || !carteId || !type) {
      return NextResponse.json(
        { error: 'file, carteId et type sont requis' },
        { status: 400 }
      );
    }

    if (type !== 'signal' && type !== 'situation') {
      return NextResponse.json(
        { error: 'type doit être "signal" ou "situation"' },
        { status: 400 }
      );
    }

    const db = supabaseAdmin();
    const ext = (file.type.split('/')[1] || 'png').replace('svg+xml', 'svg');
    const fileName = `${carteId}-${type}-${Date.now()}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await db.storage
      .from('cartes-images')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data: urlData } = db.storage
      .from('cartes-images')
      .getPublicUrl(fileName);

    return NextResponse.json({
      ok: true,
      url: urlData.publicUrl,
      fileName,
    });
  } catch (e: any) {
    console.error('[upload-image] Erreur:', e);
    return NextResponse.json(
      { error: e?.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}
