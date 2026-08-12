"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signInUser, UserRole } from "@/lib/auth";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 1. Call server-side signup route which auto-confirms user and bypasses email rate limits 100%
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          fullName,
          role,
          phone,
          hospitalId: role === "hospital_admin" ? hospitalId : undefined,
        }),
      });

      const json = await res.json();

      if (!res.ok || json.error) {
        setError(json.error || "Failed to create account. Please try again.");
        setLoading(false);
        return;
      }

      // 2. Perform instant login & session cookie establishment
      const loginData = await signInUser({ email, password });
      if (loginData.user) {
        const targetPath = role === "patient" ? "/patient/dashboard" : "/admin/dashboard";
        router.push(targetPath);
        router.refresh();
      } else {
        router.push(
          `/login?registered=true&email=${encodeURIComponent(email)}&role=${role}`
        );
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to sign up. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

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
