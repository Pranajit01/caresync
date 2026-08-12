import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

/**
 * GET /api/hospitals/emergency-beds
 * Returns all 5 seeded hospitals with their joined live bed availability per ward type (ICU, General, Emergency).
 * Used by the Patient Emergency Bed Finder map & list view.
 */
export async function GET() {
  try {
    const { data: hospitals, error: hospErr } = await supabaseAdmin
      .from("hospitals")
      .select(`
        id,
        name,
        address,
        latitude,
        longitude,
        beds (
          id,
          ward_type,
          total_beds,
          available_beds,
          updated_at
        )
      `)
      .order("name", { ascending: true });

    if (hospErr) {
      console.error("Error fetching emergency beds:", hospErr);
      return NextResponse.json({ error: hospErr.message }, { status: 500 });
    }

    return NextResponse.json({ hospitals: hospitals || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
