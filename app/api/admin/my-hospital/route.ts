import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

/**
 * GET /api/admin/my-hospital?userId=<uuid>
 * Returns the hospital profile for the currently logged-in hospital_admin.
 * Looks up public.users then joins to hospitals.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const { data: userRow, error: userErr } = await supabaseAdmin
      .from("users")
      .select("id, full_name, role, hospital_id")
      .eq("id", userId)
      .single();

    if (userErr || !userRow) {
      return NextResponse.json(
        { error: "User not found in public.users" },
        { status: 404 }
      );
    }

    if (!userRow.hospital_id) {
      return NextResponse.json(
        { error: "This user has no hospital_id assigned" },
        { status: 422 }
      );
    }

    const { data: hospital, error: hospErr } = await supabaseAdmin
      .from("hospitals")
      .select("id, name, address, status, license_number, contact_info")
      .eq("id", userRow.hospital_id)
      .single();

    if (hospErr || !hospital) {
      return NextResponse.json({ error: "Hospital not found" }, { status: 404 });
    }

    return NextResponse.json({ hospital });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
