import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server-side Supabase client using @supabase/ssr.
 * Uses the anon key + cookie-based session for Server Components and
 * Route Handlers that need to act as the authenticated user.
 *
 * MUST be called inside a Server Component or Route Handler (not client).
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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
            // setAll called from a Server Component — cookies will be set
            // by the middleware instead. Safe to ignore this error.
          }
        },
      },
    }
  );
}

/**
 * Server-side Supabase client using the service-role key.
 * This bypasses RLS — use ONLY inside Route Handlers where elevated
 * access is required (e.g. queue engine writes, admin operations).
 *
 * NEVER import this from a Client Component.
 */
export async function createAdminClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
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
    }
  );
}

/**
 * Legacy export for backward compatibility — server-side admin client
 * without cookie context (for scripts and non-request contexts).
 */
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
