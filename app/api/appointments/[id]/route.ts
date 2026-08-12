import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

/**
 * GET /api/appointments/[id]
 * Returns full details of a single appointment including joined hospital & doctor.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: appointment, error } = await supabaseAdmin
      .from("appointments")
      .select(`
        id,
        token_number,
        status,
        created_at,
        patient_id,
        doctor_id,
        hospital_id,
        hospitals ( id, name, address ),
        doctors ( id, full_name, specialization )
      `)
      .eq("id", id)
      .single();

    if (error || !appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    return NextResponse.json({ appointment });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
