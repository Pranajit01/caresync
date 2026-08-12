import { createClient } from "@supabase/supabase-js";

/**
 * Browser-side (public) Supabase client.
 * Uses NEXT_PUBLIC_* env vars — safe to expose to the browser.
 * Safe fallback placeholder URL used if env vars are not set yet in .env.local.
 */

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
