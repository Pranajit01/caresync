import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

/**
 * POST /api/auth/signup
 *
 * Supports three registration flows:
 *
 * 1. Patient:      { flow: "patient", email, password, fullName, phone }
 * 2. Staff:        { flow: "staff", email, password, fullName, phone, inviteCode }
 *    - Validates invite code (unused, not expired, valid)
 *    - Assigns role and hospital_id from invite
 *    - Marks invite as used atomically
 * 3. Hospital:     { flow: "hospital", email, password, fullName, phone,
 *                    hospitalName, hospitalAddress, latitude, longitude,
 *                    licenseNumber, contactInfo }
 *    - Creates hospital row with status = 'pending'
 *    - Creates hospital_admin user linked to that hospital
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { flow, email, password, fullName, phone } = body;

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: "Email, password, and full name are required." },
        { status: 400 }
      );
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    // ─── Flow: Patient ────────────────────────────────────────────────────────
    if (flow === "patient" || !flow) {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          role: "patient",
          phone: phone || "",
          hospital_id: null,
        },
      });

      if (error) return _signupError(error.message);
      return NextResponse.json({ success: true, user: data.user });
    }

    // ─── Flow: Staff via Invite Code ──────────────────────────────────────────
    if (flow === "staff") {
      const { inviteCode } = body;
      if (!inviteCode) {
        return NextResponse.json({ error: "Invite code is required." }, { status: 400 });
      }

      // Look up invite
      const { data: invite, error: invErr } = await supabaseAdmin
        .from("staff_invites")
        .select("id, hospital_id, role, used, expires_at")
        .eq("code", inviteCode.trim().toUpperCase())
        .single();

      if (invErr || !invite) {
        return NextResponse.json({ error: "Invalid invite code." }, { status: 400 });
      }
      if (invite.used) {
        return NextResponse.json({ error: "This invite code has already been used." }, { status: 400 });
      }
      if (new Date(invite.expires_at) < new Date()) {
        return NextResponse.json({ error: "This invite code has expired." }, { status: 400 });
      }

      // Verify hospital is still in 'verified' status
      const { data: hospital } = await supabaseAdmin
        .from("hospitals")
        .select("id, status")
        .eq("id", invite.hospital_id)
        .single();

      if (!hospital || hospital.status !== "verified") {
        return NextResponse.json(
          { error: "The hospital associated with this invite is not active." },
          { status: 400 }
        );
      }

      // Create the user with role and hospital_id from the invite
      const { data, error: signupErr } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          role: invite.role,
          phone: phone || "",
          hospital_id: invite.hospital_id,
        },
      });

      if (signupErr) return _signupError(signupErr.message);

      // Mark invite as used
      await supabaseAdmin
        .from("staff_invites")
        .update({ used: true })
        .eq("id", invite.id);

      return NextResponse.json({ success: true, user: data.user });
    }

    // ─── Flow: Hospital Registration ──────────────────────────────────────────
    if (flow === "hospital") {
      const {
        hospitalName,
        hospitalAddress,
        latitude,
        longitude,
        licenseNumber,
        contactInfo,
      } = body;

      if (!hospitalName || !licenseNumber || !contactInfo) {
        return NextResponse.json(
          { error: "Hospital name, license number, and contact info are required." },
          { status: 400 }
        );
      }

      // Create hospital row in 'pending' status
      const { data: hospital, error: hospErr } = await supabaseAdmin
        .from("hospitals")
        .insert({
          name: hospitalName,
          address: hospitalAddress || "",
          latitude: parseFloat(latitude) || 0,
          longitude: parseFloat(longitude) || 0,
          status: "pending",
          license_number: licenseNumber,
          contact_info: contactInfo,
        })
        .select("id, name, status")
        .single();

      if (hospErr || !hospital) {
        return NextResponse.json(
          { error: hospErr?.message || "Failed to create hospital." },
          { status: 500 }
        );
      }

      // Create the hospital_admin user linked to this hospital
      const { data, error: signupErr } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          role: "hospital_admin",
          phone: phone || "",
          hospital_id: hospital.id,
        },
      });

      if (signupErr) {
        // Rollback hospital creation to keep DB clean
        await supabaseAdmin.from("hospitals").delete().eq("id", hospital.id);
        return _signupError(signupErr.message);
      }

      return NextResponse.json({
        success: true,
        user: data.user,
        hospital: { id: hospital.id, name: hospital.name, status: hospital.status },
      });
    }

    return NextResponse.json({ error: "Invalid signup flow." }, { status: 400 });
  } catch (err: any) {
    console.error("Signup route exception:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error during registration." },
      { status: 500 }
    );
  }
}

function _signupError(message: string) {
  const msg = message || "";
  if (msg.includes("already registered") || msg.includes("already been registered")) {
    return NextResponse.json(
      { error: "An account with this email already exists. Please log in instead." },
      { status: 400 }
    );
  }
  return NextResponse.json({ error: msg || "Failed to create account." }, { status: 400 });
}
