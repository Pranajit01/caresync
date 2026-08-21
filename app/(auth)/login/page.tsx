"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signInUser, sendPasswordReset, verifyRecoveryOtp } from "@/lib/auth";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackError = searchParams.get("error");
  const registered = searchParams.get("registered");
  const initialEmail = searchParams.get("email") || "";
  const initialRole = searchParams.get("role") || "";

  // Common authentication state
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    callbackError === "auth_callback_failed"
      ? "Email confirmation failed. Please try logging in directly."
      : null
  );
  const [loading, setLoading] = useState(false);

  // Passwordless OTP recovery/login states
  const [loginMethod, setLoginMethod] = useState<"password" | "otp">("password");
  const [otpStep, setOtpStep] = useState<1 | 2>(1); // 1: input email, 2: input 6-digit code
  const [otpToken, setOtpToken] = useState("");
  const [otpSentMessage, setOtpSentMessage] = useState<string | null>(null);

  // Handle Standard Password Login
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
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

  // Handle OTP request (Step 1)
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await sendPasswordReset(email);
      setOtpSentMessage(`A password reset link / code has been sent to ${email}.`);
      setOtpStep(2);
    } catch (err: unknown) {
      if (err instanceof Error) {
        const msg = err.message;
        if (msg.includes("User not found") || msg.includes("Signups not allowed")) {
          setError("Email not registered. Please sign up for an account first.");
        } else if (msg.toLowerCase().includes("fetch")) {
          setError("Unable to connect. Check your internet connection.");
        } else {
          setError(msg);
        }
      } else {
        setError("Failed to send reset code. Try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP verification (Step 2)
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await verifyRecoveryOtp(email, otpToken);

      if (data.user) {
        router.push("/login/reset-password");
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message.includes("invalid") ? "Incorrect or expired reset code. Please try again." : err.message);
      } else {
        setError("Verification failed. Please try again.");
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
          {loginMethod === "password" ? "Sign in to access your portal" : "Forgot password recovery & secure entry"}
        </p>
      </div>



      {/* Success alert on registration */}
      {registered === "true" && loginMethod === "password" && (
        <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-[#2A9D8F] font-medium">
          Account created successfully! Enter your password to log in.
        </div>
      )}

      {/* OTP code sent success alert */}
      {loginMethod === "otp" && otpSentMessage && (
        <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-[#2A9D8F] font-medium">
          {otpSentMessage}
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-[#E63946]">
          {error}
        </div>
      )}

      {/* Standard Password Login Form */}
      {loginMethod === "password" && (
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
                  setLoginMethod("otp");
                  setOtpStep(1);
                  setError(null);
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

      {/* Passwordless OTP Entry Form */}
      {loginMethod === "otp" && (
        <>
          {otpStep === 1 ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
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
                <p className="text-[11px] text-zinc-400 mt-1">
                  Enter your email. We will send a 6-digit password reset code / link to your inbox.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-[#E63946] hover:bg-[#d62837] text-white font-medium text-sm rounded-lg transition-colors shadow-xs disabled:opacity-50"
              >
                {loading ? "Sending Code…" : "Send Reset Code / Link"}
              </button>

              <div className="text-center mt-3">
                <button
                  type="button"
                  onClick={() => {
                    setLoginMethod("password");
                    setError(null);
                  }}
                  className="text-xs text-zinc-500 hover:text-zinc-800 transition-colors font-medium hover:underline"
                >
                  &larr; Back to password login
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                  6-Digit Reset Code
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  pattern="\d{6}"
                  value={otpToken}
                  onChange={(e) => setOtpToken(e.target.value)}
                  placeholder="123456"
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-center tracking-widest text-lg font-bold focus:outline-none focus:ring-2 focus:ring-[#E63946] focus:border-transparent text-zinc-900"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-[#2A9D8F] hover:bg-emerald-700 text-white font-medium text-sm rounded-lg transition-colors shadow-xs disabled:opacity-50"
              >
                {loading ? "Verifying…" : "Verify Code"}
              </button>

              <div className="flex justify-between items-center text-xs mt-3">
                <button
                  type="button"
                  onClick={() => {
                    setOtpStep(1);
                    setOtpToken("");
                    setError(null);
                  }}
                  className="text-zinc-500 hover:text-zinc-800 transition-colors font-medium hover:underline"
                >
                  &larr; Change Email
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLoginMethod("password");
                    setOtpStep(1);
                    setOtpToken("");
                    setError(null);
                  }}
                  className="text-zinc-500 hover:text-zinc-800 transition-colors font-medium hover:underline"
                >
                  Back to login
                </button>
              </div>

              <div className="text-right text-xs mt-3">
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={loading}
                  className="text-[#E63946] hover:underline font-semibold"
                >
                  Resend Code
                </button>
              </div>
            </form>
          )}
        </>
      )}

      {/* Footer link */}
      <div className="mt-6 text-center text-sm text-zinc-500">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="text-[#E63946] font-medium hover:underline"
        >
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
