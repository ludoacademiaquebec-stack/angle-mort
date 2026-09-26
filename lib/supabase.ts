// ============================================================
// ANGLE MORT v3.3 — Clients Supabase
// ============================================================

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowser(): SupabaseClient {
  if (typeof window === 'undefined') {
    throw new Error('getSupabaseBrowser() ne peut être appelé que côté client');
  }
  if (!browserClient) {
    browserClient = createClient(url, anonKey, {
      realtime: { params: { eventsPerSecond: 10 } },
    });
  }
  return browserClient;
}

export function getSupabaseServer(): SupabaseClient {
  return createClient(url, anonKey, {
    auth: { persistSession: false },
  });
}

export function getSupabaseAdmin(): SupabaseClient {
  if (!serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY manquante');
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const SUPABASE_URL = url;
