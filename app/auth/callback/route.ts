import { createClient } from "@/lib/supabase/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

/**
 * Auth callback route handler.
 * Supports both PKCE `code` exchange and `token_hash` verification for email links.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/";

  const supabase = await createClient();

  // 1. Handle PKCE Code Flow
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      if (type === "recovery" || next === "/login/reset-password") {
        return NextResponse.redirect(`${origin}/login/reset-password`);
      }

      if (next && next !== "/" && next.startsWith("/")) {
        return NextResponse.redirect(`${origin}${next}`);
      }

      const role = data.user.user_metadata?.role ?? "patient";
      const redirectPath =
        role !== "patient"
          ? "/admin/dashboard"
          : "/patient/dashboard";

      return NextResponse.redirect(`${origin}${redirectPath}`);
    }
  }

  // 2. Handle Token Hash Flow (Recovery & Signup OTP links)
  if (token_hash && type) {
    const { data, error } = await supabase.auth.verifyOtp({ token_hash, type });

    if (!error && data.user) {
      if (type === "recovery" || next === "/login/reset-password") {
        return NextResponse.redirect(`${origin}/login/reset-password`);
      }

      if (next && next !== "/" && next.startsWith("/")) {
        return NextResponse.redirect(`${origin}${next}`);
      }

      const role = data.user.user_metadata?.role ?? "patient";
      const redirectPath =
        role !== "patient"
          ? "/admin/dashboard"
          : "/patient/dashboard";

      return NextResponse.redirect(`${origin}${redirectPath}`);
    }
  }

  // If something went wrong or token was invalid/expired
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}

