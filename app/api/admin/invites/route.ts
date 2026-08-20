import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { randomBytes } from "crypto";

/**
 * GET /api/admin/invites
 * Returns invite codes for the admin's hospital.
 * Only accessible to hospital_admin or admin of a verified hospital.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = user.user_metadata?.role;
    if (!["hospital_admin", "admin"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: userRow, error: userErr } = await supabaseAdmin
      .from("users")
      .select("hospital_id")
      .eq("id", user.id)
      .single();

    if (userErr || !userRow?.hospital_id) {
      return NextResponse.json({ error: "No hospital linked to this account" }, { status: 422 });
    }

    const { data: hospital, error: hospErr } = await supabaseAdmin
      .from("hospitals")
      .select("id, status")
      .eq("id", userRow.hospital_id)
      .single();

    if (hospErr || !hospital) {
      return NextResponse.json({ error: "Hospital not found" }, { status: 404 });
    }

    if (hospital.status !== "verified") {
      return NextResponse.json(
        { error: "Your hospital must be verified before generating invite codes." },
        { status: 403 }
      );
    }

    const { data: invites, error: invErr } = await supabaseAdmin
      .from("staff_invites")
      .select("id, code, role, used, expires_at, created_at")
      .eq("hospital_id", userRow.hospital_id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (invErr) {
      return NextResponse.json({ error: invErr.message }, { status: 500 });
    }

    return NextResponse.json({ invites: invites || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * POST /api/admin/invites
 * Body: { role: "doctor" | "nurse" | "admin" }
 * Generates a single-use invite code valid for 48 hours.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = user.user_metadata?.role;
    if (!["hospital_admin", "admin"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const inviteRole = body.role;
    if (!["doctor", "nurse", "admin"].includes(inviteRole)) {
      return NextResponse.json(
        { error: "role must be one of: doctor, nurse, admin" },
        { status: 400 }
      );
    }

    const { data: userRow, error: userErr } = await supabaseAdmin
      .from("users")
      .select("hospital_id")
      .eq("id", user.id)
      .single();

    if (userErr || !userRow?.hospital_id) {
      return NextResponse.json({ error: "No hospital linked to this account" }, { status: 422 });
    }

    const { data: hospital, error: hospErr } = await supabaseAdmin
      .from("hospitals")
      .select("id, status")
      .eq("id", userRow.hospital_id)
      .single();

    if (hospErr || !hospital) {
      return NextResponse.json({ error: "Hospital not found" }, { status: 404 });
    }

    if (hospital.status !== "verified") {
      return NextResponse.json(
        { error: "Your hospital must be verified before generating invite codes." },
        { status: 403 }
      );
    }

    const code = "CS-" + randomBytes(8).toString("hex").toUpperCase();
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

    const { data: invite, error: insErr } = await supabaseAdmin
      .from("staff_invites")
      .insert({
        hospital_id: userRow.hospital_id,
        code,
        role: inviteRole,
        used: false,
        expires_at: expiresAt,
      })
      .select("id, code, role, used, expires_at, created_at")
      .single();

    if (insErr) {
      return NextResponse.json({ error: insErr.message }, { status: 500 });
    }

    return NextResponse.json({ invite }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
