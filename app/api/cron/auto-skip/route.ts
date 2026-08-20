import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

/**
 * GET /api/cron/auto-skip
 *
 * Cron endpoint called by Vercel Cron every minute (see vercel.json).
 * Calls auto_skip_called_tokens() Postgres RPC which:
 *   - Finds all appointments in 'called' status past their doctor's
 *     no_show_threshold_seconds (default 180s / 3 min)
 *   - Marks them 'skipped'
 *   - Re-inserts them as a new 'booked' appointment (exactly once,
 *     guarded by skipped_requeued_at idempotency stamp)
 *   - Uses FOR UPDATE SKIP LOCKED to be safe under concurrent executions
 *
 * Protected by CRON_SECRET header to prevent unauthorized calls.
 */
export async function GET(request: Request) {
  // Verify the cron secret to prevent unauthorised trigger
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data, error } = await supabaseAdmin.rpc("auto_skip_called_tokens");

    if (error) {
      console.error("auto_skip_called_tokens RPC error:", error);
      return NextResponse.json(
        { error: error.message || "Auto-skip failed" },
        { status: 500 }
      );
    }

    const result = Array.isArray(data) ? data[0] : data;
    const skippedCount = result?.skipped_count ?? 0;

    if (skippedCount > 0) {
      console.log(`[auto-skip] Skipped ${skippedCount} no-show token(s).`);
    }

    return NextResponse.json({
      ok: true,
      skipped: skippedCount,
      ran_at: result?.ran_at ?? new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("auto-skip cron route exception:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
