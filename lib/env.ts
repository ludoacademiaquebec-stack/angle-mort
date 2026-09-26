// ============================================================
// ANGLE MORT v3.3 — Validation des variables d'environnement
// ============================================================

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Variable d'environnement manquante : ${name}`);
  return v;
}

export const env = {
  supabaseUrl: required('NEXT_PUBLIC_SUPABASE_URL'),
  supabaseAnonKey: required('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  databaseUrl: required('DATABASE_URL'),
};
