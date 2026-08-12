import { supabase } from "@/lib/supabase/client";

export type UserRole = "patient" | "hospital_admin" | "super_admin";

export interface SignUpParams {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  phone?: string;
  hospitalId?: string;
}

export interface SignInParams {
  email: string;
  password: string;
}

/**
 * Sign up a new user with Supabase Auth storing metadata (role, full_name, etc.)
 *
 * Note: If Supabase email confirmation is enabled, the user will receive an
 * email and data.session will be null until they confirm. For MVP, disable
 * "Confirm email" in Supabase Dashboard → Authentication → Providers → Email.
 */
export async function signUpUser({
  email,
  password,
  fullName,
  role,
  phone = "",
  hospitalId = "",
}: SignUpParams) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role: role,
        phone: phone,
        hospital_id: hospitalId || null,
      },
      // Redirect back to the app after email confirmation
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Sign in existing user using email + password.
 * Uses cookie-based sessions via @supabase/ssr — session persists across
 * page navigations and server requests.
 */
export async function signInUser({ email, password }: SignInParams) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Sign out current user and clear the session cookie.
 */
export async function signOutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Get current authenticated user session and role from user_metadata.
 * Uses getUser() (not getSession()) which verifies the token server-side.
 */
export async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const role = (user.user_metadata?.role as UserRole) || "patient";
  const fullName =
    (user.user_metadata?.full_name as string) || user.email || "";

  return {
    ...user,
    role,
    fullName,
  };
}
