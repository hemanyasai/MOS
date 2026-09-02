import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env["VITE_SUPABASE_URL"] as string;
const supabaseAnonKey = import.meta.env["VITE_SUPABASE_ANON_KEY"] as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("[MOS] Supabase credentials not found in environment variables.");
}

// Validate the key looks like a proper JWT (Supabase anon keys are JWTs starting with "eyJ")
if (supabaseAnonKey && !supabaseAnonKey.startsWith("eyJ")) {
  console.error(
    "[MOS] VITE_SUPABASE_ANON_KEY does not look like a valid Supabase JWT. " +
    "Get your anon key from: Supabase dashboard → Project Settings → API → anon public key. " +
    "It should start with 'eyJ...'."
  );
}

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder_key",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);

/** Returns true if the Supabase client is properly configured */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl !== "https://placeholder.supabase.co" &&
    supabaseAnonKey !== "placeholder_key" &&
    supabaseAnonKey.startsWith("eyJ")
  );
}
