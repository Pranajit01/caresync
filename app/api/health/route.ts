/**
 * GET /api/health
 * Quick health-check endpoint that verifies the Supabase connection.
 * Handles missing env vars gracefully (returns a helpful error instead of crashing).
 */
export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // 1. Check env vars are present
  if (!supabaseUrl || !serviceRoleKey) {
    const missing: string[] = [];
    if (!supabaseUrl) missing.push("NEXT_PUBLIC_SUPABASE_URL");
    if (!serviceRoleKey) missing.push("SUPABASE_SERVICE_ROLE_KEY");
    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
      missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");

    return Response.json(
      {
        status: "error",
        message: `Missing env vars: ${missing.join(", ")}. Add them to .env.local and restart.`,
      },
      { status: 500 }
    );
  }

  // 2. Attempt a live connection
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Use auth.getUser() as a lightweight connectivity check
    const { error } = await supabase.auth.getUser();

    // "not_authenticated" is expected when there's no session — it still
    // proves the HTTP round-trip to Supabase succeeded.
    if (error && error.message !== "User from sub claim in JWT does not exist") {
      // Accept common "no session" style errors as proof of connectivity
      const isConnectivityOk =
        error.status === 401 ||
        error.status === 403 ||
        error.message.includes("session") ||
        error.message.includes("JWT");

      if (!isConnectivityOk) {
        return Response.json(
          { status: "error", message: `Supabase error: ${error.message}` },
          { status: 500 }
        );
      }
    }

    return Response.json({
      status: "ok",
      message: "Supabase connected",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return Response.json(
      {
        status: "error",
        message:
          err instanceof Error
            ? err.message
            : "Unknown error connecting to Supabase",
      },
      { status: 500 }
    );
  }
}
