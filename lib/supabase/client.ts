import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://ejxwayporwalikzpbhiq.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqeHdheXBvcndhbGlrenBiaGlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1MzYzMDYsImV4cCI6MjEwMjExMjMwNn0.QVpRJXPZCWk_hLODBMyn98D25XaVQlpwv6LG-W2jehk";

/**
 * Browser-side Supabase client using @supabase/ssr.
 * Includes fallback defaults for safe build-time static page generation on Vercel.
 */
export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

/**
 * Singleton instance for browser contexts and auth helpers.
 */
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
