import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, fullName, role, phone, hospitalId } = body;

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

    // Create and auto-confirm user server-side via Supabase Admin API
    // This bypasses Supabase's email rate limits and SMTP send constraints 100%
    const { data: newUser, error: createError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm email so no email is sent
        user_metadata: {
          full_name: fullName,
          role: role || "patient",
          phone: phone || "",
          hospital_id: hospitalId || null,
        },
      });

    if (createError) {
      console.error("Admin CreateUser Error:", createError);

      // Handle duplicate user error gracefully
      if (
        createError.message.includes("already registered") ||
        createError.message.includes("already been registered") ||
        createError.status === 422
      ) {
        return NextResponse.json(
          { error: "An account with this email already exists. Please log in instead." },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: createError.message || "Failed to create user account." },
        { status: 400 }
      );
    }

    // Also sync to public.users table if required by RLS triggers
    if (newUser?.user) {
      await supabaseAdmin.from("users").upsert({
        id: newUser.user.id,
        full_name: fullName,
        role: role || "patient",
        phone: phone || "",
        hospital_id: hospitalId || null,
      });
    }

    return NextResponse.json({
      success: true,
      user: newUser.user,
    });
  } catch (err: any) {
    console.error("Signup route exception:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error during registration." },
      { status: 500 }
    );
  }
}
