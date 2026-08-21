import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Auth callback route handler.
 *
 * After a user clicks the email confirmation link, Supabase redirects them
 * here with a `code` query parameter. This route exchanges the code for a
 * session and redirects to the appropriate dashboard based on role.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      if (next === "/login/reset-password") {
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

  // If something went wrong, redirect to login with error param
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
