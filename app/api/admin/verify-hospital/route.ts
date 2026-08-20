import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/admin/verify-hospital
 * Returns all hospitals in 'pending' status with license and contact info.
 * Only accessible to super_admin.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.user_metadata?.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: hospitals, error } = await supabaseAdmin
      .from("hospitals")
      .select("id, name, address, status, license_number, contact_info, latitude, longitude")
      .eq("status", "pending")
      .order("name", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ hospitals: hospitals || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * POST /api/admin/verify-hospital
 * Body: { hospitalId: string, action: "approve" | "reject" }
 * Sets the hospital status to 'verified' or 'rejected'.
 * Only accessible to super_admin.
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

    if (user.user_metadata?.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { hospitalId, action } = body;

    if (!hospitalId || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "hospitalId and action ('approve' or 'reject') are required" },
        { status: 400 }
      );
    }

    const newStatus = action === "approve" ? "verified" : "rejected";

    const { data: hospital, error: updErr } = await supabaseAdmin
      .from("hospitals")
      .update({ status: newStatus })
      .eq("id", hospitalId)
      .select("id, name, status")
      .single();

    if (updErr || !hospital) {
      return NextResponse.json(
        { error: updErr?.message || "Hospital not found" },
        { status: 500 }
      );
    }

    return NextResponse.json({ hospital });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
