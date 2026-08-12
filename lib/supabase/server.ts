import { createClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client using the service-role key.
 * This bypasses RLS — use ONLY inside Next.js Route Handlers and
 * Server Components where elevated access is required (e.g. admin
 * operations, queue engine writes).
 *
 * NEVER import this file from a Client Component.
 */

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-service-role-key";

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
