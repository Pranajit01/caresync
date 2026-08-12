import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://ejxwayporwalikzpbhiq.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqeHdheXBvcndhbGlrenBiaGlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1MzYzMDYsImV4cCI6MjEwMjExMjMwNn0.QVpRJXPZCWk_hLODBMyn98D25XaVQlpwv6LG-W2jehk";
const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqeHdheXBvcndhbGlrenBiaGlxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjUzNjYzMDYsImV4cCI6MjEwMjExMjMwNn0.lJ1Y_DPTXutKkBs3X5NXnt6MAjrY2HzcakerNiqtY0Q";

/**
 * Server-side Supabase client using @supabase/ssr.
 * Includes fallback defaults for safe build-time static page generation on Vercel.
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
 * Server-side Supabase client using the service-role key.
 */
export async function createAdminClient() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseServiceRoleKey, {
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
 * Legacy export for server-side admin operations without request cookie context.
 */
export const supabaseAdmin = createSupabaseClient(
  supabaseUrl,
  supabaseServiceRoleKey
);
