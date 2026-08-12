import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

/**
 * POST /api/admin/queue/start-consultation
 * Body: { appointmentId: string }
 *
 * Per Section 6:
 *   - Updates appointments.status = 'in_progress'
 *   - Updates queue_state.now_serving_token = this appointment's token_number
 *
 * Uses the atomic start_consultation() Postgres RPC to ensure both writes
 * happen in a single transaction — no partial updates possible.
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

    const { data, error } = await supabaseAdmin.rpc("start_consultation", {
      p_appointment_id: appointmentId,
    });

    if (error) {
      console.error("start_consultation RPC error:", error);
      return NextResponse.json(
        { error: error.message || "Failed to start consultation" },
        { status: 500 }
      );
    }

    const result = Array.isArray(data) ? data[0] : data;

    return NextResponse.json({
      success: true,
      now_serving_token: result?.now_serving,
      token_number: result?.token_number,
    });
  } catch (err: any) {
    console.error("start-consultation route exception:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
