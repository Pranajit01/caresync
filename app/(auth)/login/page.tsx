"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signInUser, sendPasswordReset } from "@/lib/auth";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered");
  const initialEmail = searchParams.get("email") || "";
  const initialRole = searchParams.get("role") || "";

  // Common authentication state
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Forgot password view toggle
  const [showForgot, setShowForgot] = useState(false);
  const [linkSent, setLinkSent] = useState(false);

  // Handle Standard Password Login
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      const data = await signInUser({ email, password });

      if (data.user) {
        const role = data.user.user_metadata?.role || initialRole || "patient";
        if (role !== "patient") {
          router.push("/admin/dashboard");
        } else {
          router.push("/patient/dashboard");
        }
        router.refresh();
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        const msg = err.message;
        if (msg.includes("Invalid login credentials")) {
          setError("Incorrect email or password. Please try again.");
        } else if (msg.includes("Email not confirmed")) {
          setError(
            "Account registered! Please click the confirmation link in your email to log in."
          );
        } else if (msg.toLowerCase().includes("fetch")) {
          setError(
            "Unable to connect. Please check your internet connection and try again."
          );
        } else {
          setError(msg);
        }
      } else {
        setError("Failed to sign in. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Forgot Password — just send the reset link
  const handleSendResetLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await sendPasswordReset(email);
      setLinkSent(true);
    } catch (err: unknown) {
      if (err instanceof Error) {
        const msg = err.message;
        if (msg.includes("User not found") || msg.includes("Signups not allowed")) {
          setError("This email is not registered. Please sign up first.");
        } else if (msg.toLowerCase().includes("fetch")) {
          setError("Unable to connect. Check your internet connection.");
        } else {
          setError(msg);
        }
      } else {
        setError("Failed to send reset link. Try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-xl border border-zinc-200 shadow-sm p-8">
      {/* Header */}
      <div className="text-center mb-6">
        <Link href="/" className="inline-block">
          <h1 className="text-2xl font-bold text-zinc-900">
            Care<span className="text-[#E63946]">Sync</span>
          </h1>
        </Link>
        <p className="text-sm text-zinc-500 mt-1">
          {showForgot ? "Reset your password" : "Sign in to access your portal"}
        </p>
      </div>

      {/* Success alert on registration */}
      {registered === "true" && !showForgot && !successMessage && (
        <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-[#2A9D8F] font-medium">
          Account created successfully! Enter your password to log in.
        </div>
      )}

      {/* Success message after password reset */}
      {successMessage && (
        <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-[#2A9D8F] font-medium">
          {successMessage}
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-[#E63946]">
          {error}
        </div>
      )}

      {/* ── STANDARD LOGIN FORM ── */}
      {!showForgot && (
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E63946] focus:border-transparent text-sm text-zinc-900"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider">
                Password
              </label>
              <button
                type="button"
                onClick={() => {
                  setShowForgot(true);
                  setLinkSent(false);
                  setError(null);
                  setSuccessMessage(null);
                }}
                className="text-xs text-[#E63946] font-semibold hover:underline"
              >
                Forgot Password?
              </button>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E63946] focus:border-transparent text-sm text-zinc-900"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-[#E63946] hover:bg-[#d62837] text-white font-medium text-sm rounded-lg transition-colors shadow-xs disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Log In"}
          </button>
        </form>
      )}

      {/* ── FORGOT PASSWORD SECTION ── */}
      {showForgot && (
        <>
          {/* State A: Email form — before sending */}
          {!linkSent && (
            <form onSubmit={handleSendResetLink} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                  Your Registered Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E63946] focus:border-transparent text-sm text-zinc-900"
                />
                <p className="text-[11px] text-zinc-400 mt-1">
                  We will send a secure password reset link to this email address.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-[#E63946] hover:bg-[#d62837] text-white font-medium text-sm rounded-lg transition-colors shadow-xs disabled:opacity-50"
              >
                {loading ? "Sending…" : "Send Reset Link"}
              </button>

              <div className="text-center mt-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgot(false);
                    setError(null);
                  }}
                  className="text-xs text-zinc-500 hover:text-zinc-800 font-medium hover:underline"
                >
                  &larr; Back to login
                </button>
              </div>
            </form>
          )}

          {/* State B: Link sent — show clear instructions */}
          {linkSent && (
            <div className="space-y-4">
              {/* Big confirmation icon */}
              <div className="flex justify-center">
                <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-2xl">
                  📧
                </div>
              </div>

              <div className="text-center space-y-2">
                <h2 className="text-base font-bold text-zinc-800">Check your inbox!</h2>
                <p className="text-sm text-zinc-600">
                  A confirmation email has been sent to{" "}
                  <span className="font-semibold text-zinc-900">{email}</span>.
                </p>
              </div>

              {/* Instruction box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                <p className="text-sm font-semibold text-blue-800">What to do next:</p>
                <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                  <li>Open your email inbox</li>
                  <li>Find the email from <strong>Supabase Auth</strong></li>
                  <li>Click the <strong>&ldquo;Reset password&rdquo;</strong> link inside</li>
                  <li>You will be taken directly to the website to set your new password</li>
                </ol>
              </div>

              <p className="text-xs text-zinc-400 text-center">
                The link expires in 1 hour. Didn&apos;t receive it? Check your spam folder.
              </p>

              {/* Resend + back buttons */}
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setLinkSent(false);
                    setError(null);
                  }}
                  className="w-full py-2 px-4 border border-zinc-300 text-zinc-700 text-sm font-medium rounded-lg hover:bg-zinc-50 transition-colors"
                >
                  Resend link to a different email
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgot(false);
                    setLinkSent(false);
                    setError(null);
                  }}
                  className="w-full py-2 px-4 text-zinc-500 text-sm font-medium hover:text-zinc-800 hover:underline"
                >
                  &larr; Back to login
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Footer link */}
      <div className="mt-6 text-center text-sm text-zinc-500">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-[#E63946] font-medium hover:underline">
          Sign Up
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-zinc-50 px-4 py-12">
      <Suspense fallback={<div className="text-zinc-500 text-sm">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
