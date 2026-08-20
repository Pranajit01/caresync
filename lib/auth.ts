import { supabase } from "@/lib/supabase/client";

export type UserRole = "patient" | "hospital_admin" | "super_admin" | "doctor" | "nurse" | "admin";
export const STAFF_ROLES: UserRole[] = ["hospital_admin", "super_admin", "doctor", "nurse", "admin"];

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
 */
export async function signUpUser({
  email,
  password,
  fullName,
  role,
  phone = "",
  hospitalId = "",
}: SignUpParams) {
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || "https://caresync.vercel.app";

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
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Sign in existing user using email + password.
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
 * Sign out current user and clear session.
 */
export async function signOutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Get current authenticated user session and role.
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

/**
 * Send a 6-digit one-time passcode to the user's email.
 * shouldCreateUser: false ensures OTP can't be used to bypass verified registration.
 */
export async function sendSignInOtp(email: string) {
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Verify the 6-digit OTP code submitted by the user.
 */
export async function verifySignInOtp(email: string, token: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
