import { NextResponse } from "next/server";
import { createClient, supabaseAdmin } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patientId");

    if (!patientId) {
      return NextResponse.json(
        { error: "patientId parameter is required" },
        { status: 400 }
      );
    }

    // 1. Try authenticated server client using cookies
    const supabase = await createClient();
    let { data: appointments, error } = await supabase
      .from("appointments")
      .select(`
        id,
        appointment_date,
        token_number,
        status,
        created_at,
        hospitals ( id, name, address ),
        doctors ( id, full_name, specialization )
      `)
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false });

    // 2. Fallback to admin client if empty or error
    if (error || !appointments || appointments.length === 0) {
      const adminRes = await supabaseAdmin
        .from("appointments")
        .select(`
          id,
          appointment_date,
          token_number,
          status,
          created_at,
          hospitals ( id, name, address ),
          doctors ( id, full_name, specialization )
        `)
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false });

      if (!adminRes.error && adminRes.data && adminRes.data.length > 0) {
        appointments = adminRes.data;
      }
    }

    return NextResponse.json({ appointments: appointments || [] });
  } catch (err: any) {
    console.error("my-tokens route exception:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
