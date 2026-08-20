import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

/**
 * POST /api/admin/queue/confirm-present
 * Body: { appointmentId: string }
 *
 * Two-step call flow — Step 2:
 *   - "Patient Present" confirms the patient arrived after being called.
 *   - Sets status: called → in_consultation
 *   - Advances queue_state.now_serving_token (via confirm_patient_present RPC)
 *
 * Only step 2 updates the live queue number — so the now-serving display
 * doesn't jump until the patient actually sits down.
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

    const { data, error } = await supabaseAdmin.rpc("confirm_patient_present", {
      p_appointment_id: appointmentId,
    });

    if (error) {
      console.error("confirm_patient_present RPC error:", error);
      return NextResponse.json(
        { error: error.message || "Failed to confirm patient present" },
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
    console.error("confirm-present route exception:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
