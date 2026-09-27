import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Pour compatibilité avec ton code existant useSessionSync.ts
export function getSupabaseBrowser() {
  return createClient(supabaseUrl, supabaseAnonKey)
}

// Pour nouveau code super-admin / facilitateur / joueur
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Pour server-side si tu as besoin
export function getSupabaseServer() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(supabaseUrl, serviceKey)
}
