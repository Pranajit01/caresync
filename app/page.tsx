"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getCurrentUser } from "@/lib/auth";

export default function Home() {
  const [currentUser, setCurrentUser] = useState<{
    role: string;
    fullName: string;
  } | null>(null);

  useEffect(() => {
    async function checkSession() {
      const u = await getCurrentUser();
      if (u) {
        setCurrentUser({ role: u.role, fullName: u.fullName });
      }
    }
    checkSession();
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-zinc-50 overflow-hidden font-sans">
      {/* Subtle Trust Motion Background Animation (Hands coming together SVG/CSS) */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-10">
        <svg
          className="w-[600px] h-[600px] animate-pulse text-[#E63946]"
          viewBox="0 0 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <style>{`
            @keyframes gentleHold {
              0%, 100% { transform: translateY(0px) scale(1); }
              50% { transform: translateY(-8px) scale(1.03); }
            }
            .trust-hands { animation: gentleHold 5s ease-in-out infinite; transform-origin: center; }
          `}</style>
          <g className="trust-hands">
            {/* Left Care Hand */}
            <path
              d="M40 110 C 60 90, 85 95, 100 110 C 95 125, 75 130, 45 120 Z"
              fill="currentColor"
            />
            {/* Right Support Hand */}
            <path
              d="M160 110 C 140 90, 115 95, 100 110 C 105 125, 125 130, 155 120 Z"
              fill="currentColor"
            />
            {/* Center Heart Emblem */}
            <path
              d="M100 95 C 95 85, 80 85, 80 97 C 80 105, 100 120, 100 120 C 100 120, 120 105, 120 97 C 120 85, 105 85, 100 95 Z"
              fill="#E63946"
            />
          </g>
        </svg>
      </div>

      {/* Header */}
      <header className="relative z-10 max-w-6xl mx-auto w-full px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            Care<span className="text-[#E63946]">Sync</span>
          </h1>
        </div>

        <div className="flex items-center gap-4">
          {currentUser ? (
            <Link
              href={
                currentUser.role === "patient"
                  ? "/patient/dashboard"
                  : "/admin/dashboard"
              }
              className="px-4 py-2 bg-[#E63946] text-white text-sm font-medium rounded-lg hover:bg-[#d62837] transition-colors shadow-xs"
            >
              Go to Dashboard ({currentUser.fullName})
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-zinc-700 hover:text-zinc-900 px-3 py-2 rounded-lg transition-colors"
              >
                Log In
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 bg-[#E63946] text-white text-sm font-medium rounded-lg hover:bg-[#d62837] transition-colors shadow-xs"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 max-w-4xl mx-auto px-6 py-16 text-center my-auto">
        <span className="inline-block px-3 py-1 bg-red-50 text-[#E63946] text-xs font-semibold rounded-full border border-red-100 mb-6">
          Real-Time Smart OPD & Emergency Healthcare
        </span>

        <h2 className="text-4xl sm:text-5xl font-extrabold text-zinc-900 tracking-tight leading-tight">
          Connected Care. <br />
          <span className="text-[#E63946]">Better Health.</span>
        </h2>

        <p className="mt-6 text-base sm:text-lg text-zinc-600 max-w-2xl mx-auto leading-relaxed">
          CareSync connects patients directly with live doctor OPD queues and
          emergency bed availability across hospitals in real time — reducing
          wait times and saving lives.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/signup?role=patient"
            className="w-full sm:w-auto px-8 py-3.5 bg-[#E63946] hover:bg-[#d62837] text-white font-medium text-sm rounded-xl transition-all shadow-sm hover:shadow-md text-center"
          >
            Patient Portal & Appointment Booking
          </Link>
          <Link
            href="/signup?role=hospital_admin"
            className="w-full sm:w-auto px-8 py-3.5 bg-white hover:bg-zinc-100 border border-zinc-300 text-zinc-800 font-medium text-sm rounded-xl transition-all text-center"
          >
            Hospital Staff Portal
          </Link>
        </div>

        {/* Trust Badges */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left max-w-3xl mx-auto">
          <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-xs">
            <h3 className="font-bold text-zinc-900 text-sm mb-1">
              Live Token Tracking
            </h3>
            <p className="text-xs text-zinc-500">
              Track your OPD queue status live from anywhere without standing in line.
            </p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-xs">
            <h3 className="font-bold text-zinc-900 text-sm mb-1">
              Emergency Bed Finder
            </h3>
            <p className="text-xs text-zinc-500">
              Instant visibility into ICU, General, and Emergency bed counts.
            </p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-xs">
            <h3 className="font-bold text-zinc-900 text-sm mb-1">
              Hospital Admin Hub
            </h3>
            <p className="text-xs text-zinc-500">
              One-tap doctor consultation queue management & bed updates.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-zinc-200 bg-white py-6 text-center text-xs text-zinc-500">
        CareSync Platform — MVP Built for Google Antigravity
      </footer>
    </div>
  );
}
