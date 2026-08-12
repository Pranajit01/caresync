import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

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

    const { data: appointments, error } = await supabaseAdmin
      .from("appointments")
      .select(`
        id,
        token_number,
        status,
        created_at,
        hospitals ( id, name, address ),
        doctors ( id, full_name, specialization )
      `)
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching patient tokens:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ appointments: appointments || [] });
  } catch (err: any) {
    console.error("my-tokens route exception:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
