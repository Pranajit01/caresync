import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const hospitalId = searchParams.get("hospitalId");

    let query = supabase.from("doctors").select("*");

    if (hospitalId) {
      query = query.eq("hospital_id", hospitalId);
    }

    const { data: doctors, error } = await query.order("full_name", { ascending: true });

    if (error) {
      console.error("Error fetching doctors:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ doctors });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
