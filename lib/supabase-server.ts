// ============================================================
// ANGLE MORT v3.3 — Client Supabase côté serveur
// À utiliser UNIQUEMENT dans les API Routes / Server Actions
// ⚠️ SINGLETON — ne jamais créer de client à la volée
// ============================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

let adminClient: SupabaseClient | null = null;

export function supabaseAdmin(): SupabaseClient {
  if (!url || !serviceKey) {
    throw new Error('Variables Supabase manquantes côté serveur');
  }
  if (adminClient) return adminClient;

  adminClient = createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        // Indique à PostgREST de ne pas garder de cache entre requêtes
        'x-connection-reuse': 'true',
      },
    },
    db: {
      schema: 'public',
    },
  });

  return adminClient;
}