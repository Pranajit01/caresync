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
      : process.env.NEXT_PUBLIC_APP_URL || "https://caresync-india.vercel.app";

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

/**
 * Send a password reset magic link to the user's email.
 * On click, Supabase redirects to /auth/callback which then sends to /login/reset-password.
 */
export async function sendPasswordReset(email: string) {
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || "https://caresync-india.vercel.app";

  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/login/reset-password`,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}


/**
 * Verify recovery OTP (type: 'recovery')
 */
export async function verifyRecoveryOtp(email: string, token: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "recovery",
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Update current user's password.
 */
export async function updatePassword(password: string) {
  const { data, error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Complete password reset in one step:
 * 1. Verify the 6-digit OTP sent via signInWithOtp (type: 'email')
 * 2. Update password
 * 3. Sign out so user logs in fresh with new credentials
 */
export async function resetPasswordWithOtp(email: string, token: string, newPassword: string) {
  // 1. Verify the 6-digit OTP code (type must be 'email' to match signInWithOtp)
  const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });

  if (verifyError) {
    throw new Error(
      verifyError.message?.includes("expired") || verifyError.message?.includes("invalid")
        ? "Invalid or expired code. Please request a new 6-digit code."
        : verifyError.message || "Verification failed. Please try again."
    );
  }

  if (!verifyData.user) {
    throw new Error("Could not verify user. Please request a new code.");
  }

  // 2. Update user's password in Supabase database
  const { data: updateData, error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateError) {
    throw new Error(updateError.message || "Failed to update password. Please try again.");
  }

  // 3. Sign out — user must log in fresh with their new password
  await supabase.auth.signOut();

  return updateData;
}


