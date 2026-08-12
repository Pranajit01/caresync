import { createBrowserClient } from "@supabase/ssr";
import { createClient as createStandardClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://ejxwayporwalikzpbhiq.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqeHdheXBvcndhbGlrenBiaGlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1MzYzMDYsImV4cCI6MjEwMjExMjMwNn0.QVpRJXPZCWk_hLODBMyn98D25XaVQlpwv6LG-W2jehk";

/**
 * Universal Supabase client function that safely detects browser vs non-browser runtimes.
 * Uses @supabase/ssr createBrowserClient in the browser, and standard Supabase client in SSR.
 */
export function createClient() {
  if (typeof window === "undefined") {
    return createStandardClient(supabaseUrl, supabaseAnonKey);
  }
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

/**
 * Universal singleton client instance for helpers.
 */
export const supabase =
  typeof window === "undefined"
    ? createStandardClient(supabaseUrl, supabaseAnonKey)
    : createBrowserClient(supabaseUrl, supabaseAnonKey);
