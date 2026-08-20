import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://ejxwayporwalikzpbhiq.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqeHdheXBvcndhbGlrenBiaGlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1MzYzMDYsImV4cCI6MjEwMjExMjMwNn0.QVpRJXPZCWk_hLODBMyn98D25XaVQlpwv6LG-W2jehk";

/**
 * Server-side Supabase client using @supabase/ssr.
 * Uses cookie-based session for authenticated requests.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Safe to ignore from Server Components
        }
      },
    },
  });
}

/**
 * Server-side client using elevated/anon access for RPC and database queries.
 */
export async function createAdminClient() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Safe to ignore from Server Components
        }
      },
    },
  });
}

/**
 * True service-role admin client — bypasses RLS.
 * Uses SUPABASE_SERVICE_ROLE_KEY. Only call from server-side API routes.
 */
const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

export const supabaseAdmin = createSupabaseClient(
  supabaseUrl,
  supabaseServiceRoleKey
);
