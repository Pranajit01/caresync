import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

/**
 * GET /api/admin/beds?hospitalId=<uuid>
 * Returns bed counts per department for the specified hospital only.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const hospitalId = searchParams.get("hospitalId");

    if (!hospitalId) {
      return NextResponse.json(
        { error: "hospitalId is required" },
        { status: 400 }
      );
    }

    const { data: beds, error } = await supabaseAdmin
      .from("beds")
      .select("id, hospital_id, ward_type, total_beds, available_beds, updated_at")
      .eq("hospital_id", hospitalId)
      .order("ward_type", { ascending: true });

    if (error) {
      console.error("Error fetching hospital beds:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ beds: beds || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
