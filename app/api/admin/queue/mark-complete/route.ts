import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

/**
 * POST /api/admin/queue/mark-complete
 * Body: { appointmentId: string }
 *
 * Per Section 6:
 *   - Updates appointments.status = 'completed'
 *
 * Uses atomic complete_consultation() Postgres RPC.
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

    const { error } = await supabaseAdmin.rpc("complete_consultation", {
      p_appointment_id: appointmentId,
    });

    if (error) {
      console.error("complete_consultation RPC error:", error);
      return NextResponse.json(
        { error: error.message || "Failed to complete consultation" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("mark-complete route exception:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
