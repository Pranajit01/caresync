"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signUpUser, UserRole } from "@/lib/auth";

export default function SignupPage() {
  const router = useRouter();

  const [role, setRole] = useState<UserRole>("patient");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [hospitalId, setHospitalId] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await signUpUser({
        email,
        password,
        fullName,
        role,
        phone,
        hospitalId: role === "hospital_admin" ? hospitalId : undefined,
      });

      if (data.session) {
        // Email confirmation is disabled in Supabase — user is logged in immediately
        router.push(role === "patient" ? "/patient/dashboard" : "/admin/dashboard");
        router.refresh();
      } else if (data.user) {
        // Email confirmation is enabled — show a "check your inbox" message
        setConfirmationSent(true);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        const msg = err.message;
        if (msg.includes("already registered") || msg.includes("already been registered")) {
          setError("An account with this email already exists. Please log in instead.");
        } else if (msg.includes("Password should be")) {
          setError("Password must be at least 6 characters long.");
        } else if (msg.toLowerCase().includes("fetch")) {
          setError("Unable to connect. Please check your internet connection and try again.");
        } else {
          setError(msg);
        }
      } else {
        setError("Failed to sign up. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Show confirmation-sent state
  if (confirmationSent) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-zinc-50 px-4 py-12">
        <div className="w-full max-w-md bg-white rounded-xl border border-zinc-200 shadow-sm p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-[#2A9D8F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-zinc-900 mb-2">Check your email</h2>
          <p className="text-sm text-zinc-500 mb-6">
            We sent a confirmation link to <strong className="text-zinc-700">{email}</strong>. Click the link in the email to activate your account and log in.
          </p>
          <Link
            href="/login"
            className="inline-block w-full py-2.5 px-4 bg-[#E63946] hover:bg-[#d62837] text-white font-medium text-sm rounded-lg transition-colors text-center"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-zinc-50 px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-xl border border-zinc-200 shadow-sm p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-block">
            <h1 className="text-2xl font-bold text-zinc-900">
              Care<span className="text-[#E63946]">Sync</span>
            </h1>
          </Link>
          <p className="text-sm text-zinc-500 mt-1">
            Create an account to get started
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-zinc-100 rounded-lg mb-6 text-sm font-medium">
          <button
            type="button"
            onClick={() => setRole("patient")}
            className={`py-2 rounded-md transition-all ${
              role === "patient"
                ? "bg-white text-zinc-900 shadow-xs font-semibold"
                : "text-zinc-500 hover:text-zinc-900"
            }`}
          >
            Patient
          </button>
          <button
            type="button"
            onClick={() => setRole("hospital_admin")}
            className={`py-2 rounded-md transition-all ${
              role === "hospital_admin"
                ? "bg-white text-zinc-900 shadow-xs font-semibold"
                : "text-zinc-500 hover:text-zinc-900"
            }`}
          >
            Hospital Admin
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-[#E63946]">
            {error}
          </div>
        )}

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E63946] focus:border-transparent text-sm text-zinc-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="rahul@example.com"
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E63946] focus:border-transparent text-sm text-zinc-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
              Phone Number (Optional)
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E63946] focus:border-transparent text-sm text-zinc-900"
            />
          </div>

          {role === "hospital_admin" && (
            <div>
              <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                Hospital ID / Code (Optional for MVP)
              </label>
              <input
                type="text"
                value={hospitalId}
                onChange={(e) => setHospitalId(e.target.value)}
                placeholder="e.g. apollo-saltlake"
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E63946] focus:border-transparent text-sm text-zinc-900"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
              Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E63946] focus:border-transparent text-sm text-zinc-900"
            />
            <p className="text-xs text-zinc-400 mt-1">Minimum 6 characters</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-[#E63946] hover:bg-[#d62837] text-white font-medium text-sm rounded-lg transition-colors shadow-xs disabled:opacity-50"
          >
            {loading
              ? "Creating account…"
              : `Sign Up as ${role === "patient" ? "Patient" : "Hospital Admin"}`}
          </button>
        </form>

        {/* Footer link */}
        <div className="mt-6 text-center text-sm text-zinc-500">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-[#E63946] font-medium hover:underline"
          >
            Log In
          </Link>
        </div>
      </div>
    </div>
  );
}
