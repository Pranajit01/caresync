import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

/**
 * POST /api/admin/beds/update
 * Body: { bedId: string, delta: number, hospitalId: string }
 *
 * Per Section 7:
 *   - Bed updates always happen via atomic server-side delta updates (+1 or -1).
 *   - Frontend sends deltas (+1 / -1), never absolute available_beds numbers.
 *   - Validates that the bed belongs to the admin's hospitalId.
 */
export async function POST(request: Request) {
  try {
    const { bedId, delta, hospitalId } = await request.json();

    if (!bedId || typeof delta !== "number" || !hospitalId) {
      return NextResponse.json(
        { error: "bedId, delta (+1 or -1), and hospitalId are required" },
        { status: 400 }
      );
    }

    if (delta !== 1 && delta !== -1) {
      return NextResponse.json(
        { error: "delta must be either +1 or -1" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin.rpc("update_bed_count", {
      p_bed_id: bedId,
      p_delta: delta,
      p_hospital_id: hospitalId,
    });

    if (error) {
      console.error("update_bed_count RPC error:", error);
      return NextResponse.json(
        { error: error.message || "Failed to update bed count" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, bed: data });
  } catch (err: any) {
    console.error("beds/update exception:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
