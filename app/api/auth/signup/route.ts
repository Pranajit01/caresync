import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";

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

    // 1. Primary signup attempt via Supabase Auth
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role || "patient",
          phone: phone || "",
          hospital_id: hospitalId || null,
        },
      },
    });

    if (signupError) {
      const msg = signupError.message;
      console.error("Signup Auth Error:", signupError);

      // Handle duplicate user error
      if (
        msg.includes("already registered") ||
        msg.includes("already been registered") ||
        signupError.status === 422
      ) {
        return NextResponse.json(
          { error: "An account with this email already exists. Please log in instead." },
          { status: 400 }
        );
      }

      // Handle rate limit or user not allowed: attempt fallback sign-in
      if (
        msg.toLowerCase().includes("rate limit") ||
        msg.toLowerCase().includes("user not allowed") ||
        msg.toLowerCase().includes("exceeded")
      ) {
        // Try sign in to check if the user account was already registered
        const { data: loginData, error: loginError } =
          await supabase.auth.signInWithPassword({
            email,
            password,
          });

        if (!loginError && loginData.user) {
          return NextResponse.json({
            success: true,
            user: loginData.user,
            session: loginData.session,
          });
        }

        return NextResponse.json(
          {
            error:
              "Account creation rate limit reached on auth server. Please log in directly if you registered earlier, or wait a few minutes.",
          },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { error: msg || "Failed to create user account." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      user: signupData.user,
      session: signupData.session,
    });
  } catch (err: any) {
    console.error("Signup route exception:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error during registration." },
      { status: 500 }
    );
  }
}
