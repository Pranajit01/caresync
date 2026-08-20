"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signInUser } from "@/lib/auth";
import { Suspense } from "react";

type SignupFlow = "patient" | "staff" | "hospital";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultRole = searchParams.get("role");

  const [flow, setFlow] = useState<SignupFlow>(
    defaultRole === "hospital_admin" ? "hospital" : "patient"
  );
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");

  // Staff-specific
  const [inviteCode, setInviteCode] = useState("");

  // Hospital registration fields
  const [hospitalName, setHospitalName] = useState("");
  const [hospitalAddress, setHospitalAddress] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [contactInfo, setContactInfo] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hospitalPending, setHospitalPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const body: Record<string, string> = {
        flow,
        email,
        password,
        fullName,
        phone,
      };

      if (flow === "staff") {
        body.inviteCode = inviteCode;
      } else if (flow === "hospital") {
        body.hospitalName = hospitalName;
        body.hospitalAddress = hospitalAddress;
        body.latitude = latitude;
        body.longitude = longitude;
        body.licenseNumber = licenseNumber;
        body.contactInfo = contactInfo;
      }

      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();

      if (!res.ok || json.error) {
        setError(json.error || "Failed to create account. Please try again.");
        setLoading(false);
        return;
      }

      // Hospital registration goes to pending – don't try to log in, just show notice
      if (flow === "hospital" && json.hospital?.status === "pending") {
        setHospitalPending(true);
        setLoading(false);
        return;
      }

      // Auto-login after successful patient or staff signup
      const loginData = await signInUser({ email, password });
      if (loginData.user) {
        const role = loginData.user.user_metadata?.role || "patient";
        router.push(role !== "patient" ? "/admin/dashboard" : "/patient/dashboard");
        router.refresh();
      } else {
        router.push(`/login?registered=true&email=${encodeURIComponent(email)}`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to sign up. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (hospitalPending) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-zinc-50 px-4 py-12">
        <div className="w-full max-w-md bg-white rounded-xl border border-zinc-200 shadow-sm p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-zinc-900 mb-2">Registration Submitted</h2>
          <p className="text-sm text-zinc-600 mb-6">
            Your hospital registration is under review. A CareSync super-admin will
            verify your license and contact details. You&apos;ll be able to log in and
            generate staff invite codes once your hospital is approved.
          </p>
          <Link
            href="/login"
            className="inline-block px-5 py-2.5 bg-[#E63946] text-white text-sm font-semibold rounded-lg hover:bg-[#d62837] transition-colors"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  const tabs: { id: SignupFlow; label: string }[] = [
    { id: "patient", label: "Patient" },
    { id: "staff", label: "Staff (Invite)" },
    { id: "hospital", label: "Register Hospital" },
  ];

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-zinc-50 px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-xl border border-zinc-200 shadow-sm p-8">
        <div className="text-center mb-6">
          <Link href="/" className="inline-block">
            <h1 className="text-2xl font-bold text-zinc-900">
              Care<span className="text-[#E63946]">Sync</span>
            </h1>
          </Link>
          <p className="text-sm text-zinc-500 mt-1">Create an account to get started</p>
        </div>

        {/* Flow Selector Tabs */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-zinc-100 rounded-lg mb-6 text-sm font-medium">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => { setFlow(tab.id); setError(null); }}
              className={`py-2 rounded-md transition-all text-xs ${
                flow === tab.id
                  ? "bg-white text-zinc-900 shadow-xs font-semibold"
                  : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Flow description */}
        {flow === "staff" && (
          <div className="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-700">
            Staff members must have an invite code issued by their hospital admin. You cannot self-assign a hospital or role.
          </div>
        )}
        {flow === "hospital" && (
          <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-700">
            Hospital registrations are reviewed by a CareSync admin before activation. You won&apos;t appear on patient-facing maps until approved.
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-[#E63946]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Common fields */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">Full Name</label>
            <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E63946] focus:border-transparent text-sm text-zinc-900" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">Email Address</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E63946] focus:border-transparent text-sm text-zinc-900" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">Phone (Optional)</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E63946] focus:border-transparent text-sm text-zinc-900" />
          </div>

          {/* Staff: Invite Code */}
          {flow === "staff" && (
            <div>
              <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">Invite Code</label>
              <input type="text" required value={inviteCode} onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="CS-XXXXXXXXXXXXXXXX"
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E63946] focus:border-transparent text-sm text-zinc-900 font-mono tracking-wider" />
              <p className="text-xs text-zinc-400 mt-1">Obtain this from your hospital administrator.</p>
            </div>
          )}

          {/* Hospital fields */}
          {flow === "hospital" && (
            <>
              <div>
                <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">Hospital Name</label>
                <input type="text" required value={hospitalName} onChange={(e) => setHospitalName(e.target.value)}
                  placeholder="e.g. City General Hospital"
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E63946] focus:border-transparent text-sm text-zinc-900" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">Hospital Address</label>
                <input type="text" value={hospitalAddress} onChange={(e) => setHospitalAddress(e.target.value)}
                  placeholder="Full address"
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E63946] focus:border-transparent text-sm text-zinc-900" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">Latitude</label>
                  <input type="number" step="any" value={latitude} onChange={(e) => setLatitude(e.target.value)}
                    placeholder="22.5726"
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E63946] focus:border-transparent text-sm text-zinc-900" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">Longitude</label>
                  <input type="number" step="any" value={longitude} onChange={(e) => setLongitude(e.target.value)}
                    placeholder="88.3639"
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E63946] focus:border-transparent text-sm text-zinc-900" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">Registration / License Number</label>
                <input type="text" required value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)}
                  placeholder="e.g. WB-HOS-2024-001234"
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E63946] focus:border-transparent text-sm text-zinc-900" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">Contact Info</label>
                <input type="text" required value={contactInfo} onChange={(e) => setContactInfo(e.target.value)}
                  placeholder="Phone or email for verification"
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E63946] focus:border-transparent text-sm text-zinc-900" />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">Password</label>
            <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E63946] focus:border-transparent text-sm text-zinc-900" />
            <p className="text-xs text-zinc-400 mt-1">Minimum 6 characters</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-[#E63946] hover:bg-[#d62837] text-white font-medium text-sm rounded-lg transition-colors shadow-xs disabled:opacity-50"
          >
            {loading
              ? "Creating account…"
              : flow === "patient"
              ? "Sign Up as Patient"
              : flow === "staff"
              ? "Sign Up with Invite Code"
              : "Submit Hospital Registration"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-zinc-500">
          Already have an account?{" "}
          <Link href="/login" className="text-[#E63946] font-medium hover:underline">
            Log In
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-zinc-500 text-sm">Loading...</div>}>
      <SignupForm />
    </Suspense>
  );
}
