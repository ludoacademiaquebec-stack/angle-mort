import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase env manquante: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY'
  );
}

// ============================================================
// CLIENT BROWSER — SINGLETON
// ⚠️ Un seul client Supabase doit exister côté navigateur.
// En créer plusieurs casse le Realtime (broadcasts, channels,
// reconnexions) et fuit en mémoire.
// ============================================================

let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowser(): SupabaseClient {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase env manquante côté browser');
  }
  if (browserClient) return browserClient;

  browserClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    realtime: {
      params: {
        // Limite la fréquence de heartbeat pour la stabilité
        eventsPerSecond: 20,
      },
    },
  });

  return browserClient;
}

// ============================================================
// EXPORT SINGLETON — pour les imports directs
// Compatible avec le code existant (`import { supabase } from '@/lib/supabase'`)
// Initialisé paresseusement pour tolérer les environnements sans env.
// ============================================================

export const supabase: SupabaseClient = (() => {
  if (!supabaseUrl || !supabaseAnonKey) {
    // Retourne un proxy inerte pour ne pas crasher l'import au build
    return new Proxy({} as SupabaseClient, {
      get() {
        throw new Error(
          'Supabase non configuré (env manquante). Utilise getSupabaseBrowser() dans un useEffect.'
        );
      },
    });
  }
  return getSupabaseBrowser();
})();

// ============================================================
// CLIENT SERVER (service role) — SINGLETON aussi
// À utiliser UNIQUEMENT dans les routes API / server-side.
// ============================================================

let serverClient: SupabaseClient | null = null;

export function getSupabaseServer(): SupabaseClient {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY manquante');
  }
  if (serverClient) return serverClient;

  serverClient = createClient(supabaseUrl, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return serverClient;
}