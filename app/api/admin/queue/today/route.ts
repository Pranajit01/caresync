import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

/**
 * GET /api/admin/queue/today?hospitalId=<uuid>
 * Returns all appointments for today at the given hospital, ordered by token_number.
 * Used by the admin Queue Manager tab.
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

    const today = new Date().toISOString().split("T")[0];

    const { data: appointments, error } = await supabaseAdmin
      .from("appointments")
      .select(`
        id,
        token_number,
        status,
        created_at,
        patient_id,
        users ( id, full_name, phone ),
        doctors ( id, full_name, specialization )
      `)
      .eq("hospital_id", hospitalId)
      .gte("created_at", `${today}T00:00:00Z`)
      .lte("created_at", `${today}T23:59:59Z`)
      .order("token_number", { ascending: true });

    if (error) {
      console.error("Error fetching today queue:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ appointments: appointments || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
