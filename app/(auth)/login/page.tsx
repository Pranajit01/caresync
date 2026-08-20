"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signInUser } from "@/lib/auth";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackError = searchParams.get("error");
  const registered = searchParams.get("registered");
  const initialEmail = searchParams.get("email") || "";
  const initialRole = searchParams.get("role") || "";

  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    callbackError === "auth_callback_failed"
      ? "Email confirmation failed. Please try logging in directly."
      : null
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
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
          Sign in to access your portal
        </p>
      </div>

      {/* Success alert on registration */}
      {registered === "true" && (
        <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-[#2A9D8F] font-medium">
          Account created successfully! Enter your password to log in.
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-[#E63946]">
          {error}
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
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
          <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
            Password
          </label>
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
