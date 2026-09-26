// ============================================================
// ANGLE MORT v3.3 — Client Supabase côté serveur
// À utiliser UNIQUEMENT dans les API Routes / Server Actions
// ============================================================

import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

export function supabaseAdmin() {
  if (!url || !serviceKey) {
    throw new Error('Variables Supabase manquantes côté serveur');
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
