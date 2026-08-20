
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
      .eq("status", "verified")
      .order("name", { ascending: true });

    if (hospErr) {
      console.error("Error fetching emergency beds:", hospErr);
      return NextResponse.json({ error: hospErr.message }, { status: 500 });
    }

    // Fetch the last audit log for each hospital
    const { data: logs } = await supabaseAdmin
      .from("bed_audit_log")
      .select("hospital_id, created_at")
      .order("created_at", { ascending: false });

    const lastVerifiedMap: Record<string, string> = {};
    if (logs) {
      for (const log of logs) {
        if (!lastVerifiedMap[log.hospital_id]) {
          lastVerifiedMap[log.hospital_id] = log.created_at;
        }
      }
    }

    const hospitalsWithLog = (hospitals || []).map((h) => ({
      ...h,
      last_verified_at: lastVerifiedMap[h.id] || null,
    }));

    return NextResponse.json({ hospitals: hospitalsWithLog });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
