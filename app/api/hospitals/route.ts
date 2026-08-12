import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";

export async function GET() {
  try {
    const { data: hospitals, error } = await supabase
      .from("hospitals")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching hospitals:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ hospitals });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
