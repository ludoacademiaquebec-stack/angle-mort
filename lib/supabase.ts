import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase env manquante: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

export function getSupabaseBrowser() {
  if (!supabaseUrl || !supabaseAnonKey) throw new Error('Supabase env manquante côté browser')
  return createClient(supabaseUrl, supabaseAnonKey)
}

// Garde pour les pages qui l'utilisaient déjà - ne casse rien
export const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null as any

export function getSupabaseServer() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY manquante')
  return createClient(supabaseUrl, serviceKey)
}