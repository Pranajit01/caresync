import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { patientId, doctorId, hospitalId, bookingDate } = body;

    if (!patientId || !doctorId || !hospitalId) {
      return NextResponse.json(
        { error: "Missing required fields: patientId, doctorId, and hospitalId are required." },
        { status: 400 }
      );
    }

    const dateToUse = bookingDate || new Date().toISOString().split("T")[0];

    // Call atomic Postgres RPC function to generate token and insert appointment
    const { data, error } = await supabaseAdmin.rpc("book_appointment", {
      p_patient_id: patientId,
      p_doctor_id: doctorId,
      p_hospital_id: hospitalId,
      p_booking_date: dateToUse,
    });

    if (error) {
      console.error("Booking RPC Error:", error);
      return NextResponse.json(
        { error: error.message || "Failed to book appointment" },
        { status: 500 }
      );
    }

    const result = Array.isArray(data) ? data[0] : data;

    if (!result) {
      return NextResponse.json(
        { error: "Booking failed to return token details" },
        { status: 500 }
      );
    }

    // Fetch full appointment details for the response
    const { data: appointmentDetails, error: fetchErr } = await supabaseAdmin
      .from("appointments")
      .select(`
        id,
        token_number,
        status,
        created_at,
        hospitals ( id, name, address ),
        doctors ( id, full_name, specialization )
      `)
      .eq("id", result.appointment_id)
      .single();

    if (fetchErr) {
      console.error("Fetch Appointment Details Error:", fetchErr);
    }

    return NextResponse.json({
      success: true,
      appointment: appointmentDetails || {
        id: result.appointment_id,
        token_number: result.token_number,
        status: "booked",
      },
    });
  } catch (err: any) {
    console.error("Appointment Booking Route Exception:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
