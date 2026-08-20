import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

/**
 * POST /api/admin/queue/skip
 * Body: { appointmentId: string }
 *
 * Manually skips a token that is in 'called' status.
 * Calls manual_skip_token() RPC which:
 *   - Sets the appointment to 'skipped'
 *   - Creates a brand-new 'booked' appointment for the same patient (re-entry)
 *     unless skipped_requeued_at is already set (idempotency guard)
 *
 * Returns the new appointment id and new token number so the admin UI
 * can display "Re-queued as #N".
 */
export async function POST(request: Request) {
  try {
    const { appointmentId } = await request.json();

    if (!appointmentId) {
      return NextResponse.json(
        { error: "appointmentId is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin.rpc("manual_skip_token", {
      p_appointment_id: appointmentId,
    });

    if (error) {
      console.error("manual_skip_token RPC error:", error);
      return NextResponse.json(
        { error: error.message || "Failed to skip token" },
        { status: 500 }
      );
    }

    const result = Array.isArray(data) ? data[0] : data;

    return NextResponse.json({
      success: true,
      skipped_id: result?.skipped_id,
      new_appointment_id: result?.new_appointment_id ?? null,
      new_token_number: result?.new_token_number ?? null,
      requeued: result?.requeued ?? false,
    });
  } catch (err: any) {
    console.error("skip route exception:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
