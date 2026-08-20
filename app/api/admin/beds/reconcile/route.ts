import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/admin/beds/reconcile
 * Body: { bedId: string, actualCount: number, hospitalId: string }
 *
 * Updates the bed availability directly to actualCount and creates a manual_correction log.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Role check: must be staff
    const role = user.user_metadata?.role;
    if (!["hospital_admin", "admin", "doctor", "nurse"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { bedId, actualCount, hospitalId } = await request.json();

    if (!bedId || typeof actualCount !== "number" || !hospitalId) {
      return NextResponse.json(
        { error: "bedId, actualCount, and hospitalId are required" },
        { status: 400 }
      );
    }

    if (actualCount < 0) {
      return NextResponse.json(
        { error: "actualCount cannot be negative" },
        { status: 400 }
      );
    }

    // Fetch the current bed count to verify user belongs to the same hospital
    const { data: bed, error: getErr } = await supabaseAdmin
      .from("beds")
      .select("id, available_beds, total_beds, hospital_id")
      .eq("id", bedId)
      .single();

    if (getErr || !bed) {
      return NextResponse.json({ error: "Bed not found" }, { status: 404 });
    }

    if (bed.hospital_id !== hospitalId) {
      return NextResponse.json({ error: "Hospital mismatch" }, { status: 422 });
    }

    if (actualCount > bed.total_beds) {
      return NextResponse.json(
        { error: `Actual count cannot exceed total beds (${bed.total_beds})` },
        { status: 400 }
      );
    }

    // If counts match, do nothing, return success
    if (bed.available_beds === actualCount) {
      return NextResponse.json({ success: true, bed, msg: "Counts match. No changes made." });
    }

    // Perform reconciliation RPC
    const { data, error } = await supabaseAdmin.rpc("reconcile_bed_count", {
      p_bed_id: bedId,
      p_actual_count: actualCount,
      p_hospital_id: hospitalId,
      p_user_id: user.id,
    });

    if (error) {
      console.error("reconcile_bed_count RPC error:", error);
      return NextResponse.json(
        { error: error.message || "Failed to reconcile bed count" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, bed: data });
  } catch (err: any) {
    console.error("beds/reconcile exception:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
