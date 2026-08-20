import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

/**
 * GET /api/admin/queue/today?hospitalId=<uuid>
 * Returns all appointments for today at the given hospital, ordered by token_number.
 * Includes called_at and skipped_requeued_at for the no-show state machine.
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

    const dateParam = searchParams.get("date");
    const targetDate = dateParam || new Date().toISOString().split("T")[0];

    const { data: appointments, error } = await supabaseAdmin
      .from("appointments")
      .select(`
        id,
        appointment_date,
        token_number,
        status,
        called_at,
        skipped_requeued_at,
        created_at,
        patient_id,
        users ( id, full_name, phone ),
        doctors ( id, full_name, specialization, no_show_threshold_seconds )
      `)
      .eq("hospital_id", hospitalId)
      .eq("appointment_date", targetDate)
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
