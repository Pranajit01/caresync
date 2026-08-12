import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

/**
 * GET /api/admin/analytics?hospitalId=<uuid>
 * Returns read-only analytics for the specified hospital only:
 *   - Patients served today (appointments with status = 'completed')
 *   - Average wait time (in minutes)
 *   - Total OPD bookings today
 *   - Current in-progress consultations count
 *   - Bed occupancy metrics (total, available, occupied, percentage)
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

    // Fetch today's appointments for this hospital
    const { data: appts, error: apptErr } = await supabaseAdmin
      .from("appointments")
      .select("id, status, token_number, created_at")
      .eq("hospital_id", hospitalId)
      .gte("created_at", `${today}T00:00:00Z`)
      .lte("created_at", `${today}T23:59:59Z`);

    if (apptErr) {
      console.error("Error fetching analytics appointments:", apptErr);
      return NextResponse.json({ error: apptErr.message }, { status: 500 });
    }

    const appointmentsList = appts || [];
    const totalBookingsToday = appointmentsList.length;
    const completedAppts = appointmentsList.filter((a) => a.status === "completed");
    const patientsServedToday = completedAppts.length;
    const inProgressCount = appointmentsList.filter((a) => a.status === "in_progress").length;
    const bookedCount = appointmentsList.filter((a) => a.status === "booked").length;

    /**
     * Compute average wait time in minutes for today:
     * If there are completed appointments, calculate average tokens served * 10 min,
     * or estimate based on completed patient count.
     */
    let averageWaitTimeMins = 0;
    if (patientsServedToday > 0) {
      // Average wait = 10 mins per token served
      averageWaitTimeMins = Math.round(
        completedAppts.reduce((sum, a) => sum + Math.max(1, (a.token_number - 1) * 10), 0) /
          patientsServedToday
      );
    } else if (totalBookingsToday > 0) {
      // Estimate wait time based on queued patients
      averageWaitTimeMins = 10;
    }

    // Fetch bed counts for this hospital
    const { data: bedsList, error: bedsErr } = await supabaseAdmin
      .from("beds")
      .select("total_beds, available_beds, ward_type")
      .eq("hospital_id", hospitalId);

    if (bedsErr) {
      console.error("Error fetching analytics beds:", bedsErr);
    }

    const beds = bedsList || [];
    const totalBeds = beds.reduce((sum, b) => sum + (b.total_beds || 0), 0);
    const availableBeds = beds.reduce((sum, b) => sum + (b.available_beds || 0), 0);
    const occupiedBeds = Math.max(0, totalBeds - availableBeds);
    const occupancyPercentage =
      totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

    return NextResponse.json({
      analytics: {
        hospitalId,
        today,
        patientsServedToday,
        totalBookingsToday,
        inProgressCount,
        bookedCount,
        averageWaitTimeMins,
        beds: {
          totalBeds,
          availableBeds,
          occupiedBeds,
          occupancyPercentage,
          byWard: beds,
        },
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
