import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client using @supabase/ssr.
 * This correctly handles cookie-based session persistence for the
 * Next.js App Router (client components, hooks, etc.).
 *
 * Call this function inside client components — do NOT call at module level.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/**
 * Singleton instance for use in non-component files (lib/auth.ts, etc.)
 * where we know we're always in a browser context.
 */
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
