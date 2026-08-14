import { NextResponse } from "next/server";
import { createClient, supabaseAdmin } from "@/lib/supabase/server";

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

    // 1. Try authenticated server client
    const supabase = await createClient();
    let { data: appointment, error } = await supabase
      .from("appointments")
      .select(`
        id,
        appointment_date,
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
      .maybeSingle();

    // 2. Fallback to admin client if null or error
    if (error || !appointment) {
      const { data: adminAppt } = await supabaseAdmin
        .from("appointments")
        .select(`
          id,
          appointment_date,
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
        .maybeSingle();

      if (adminAppt) {
        appointment = adminAppt;
      }
    }

    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    return NextResponse.json({ appointment });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
