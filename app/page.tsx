"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getCurrentUser } from "@/lib/auth";
import { LiquidEther } from "@/components/LiquidEther";
import { CaringHandsEmblem, CaringHeartEmblem } from "@/components/CaringHandsEmblem";

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
      {/* LiquidEther Interactive Fluid Simulation Background */}
      <div className="absolute inset-0 z-0 opacity-45 pointer-events-none">
        <LiquidEther
          colors={['#E63946', '#2A9D8F', '#1D3557']}
          mouseForce={28}
          cursorSize={130}
          autoDemo={true}
          autoSpeed={0.7}
          autoIntensity={2.5}
          resolution={0.5}
          BFECC={true}
        />
      </div>

      {/* Real Transparent Photo Human Connecting Hands Corner Layer */}
      <CaringHandsEmblem />

      {/* Header */}
      <header className="relative z-30 max-w-6xl mx-auto w-full px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 drop-shadow-2xs">
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
                className="text-sm font-medium text-zinc-700 hover:text-zinc-900 px-3.5 py-2 rounded-lg transition-colors bg-white/80 backdrop-blur-sm border border-zinc-200/80 shadow-2xs"
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
      <main className="relative z-30 max-w-4xl mx-auto px-6 py-8 text-center my-auto">
        <span className="inline-block px-4 py-1.5 bg-white/90 backdrop-blur-sm text-[#E63946] text-xs font-bold rounded-full border border-red-200 shadow-2xs mb-4 tracking-wide">
          Real-Time Smart OPD & Emergency Healthcare
        </span>

        {/* 1. Main Headline */}
        <h2 className="text-4xl sm:text-6xl font-extrabold text-zinc-900 tracking-tight leading-tight drop-shadow-2xs">
          Connected Care. <br />
          <span className="text-[#E63946]">Better Health.</span>
        </h2>

        {/* 2. Featured Glowing Heart & ECG Pulse Wave (Placed right in the middle between title & tagline) */}
        <CaringHeartEmblem />

        {/* 3. Tagline Paragraph Text (Now 100% visible below the heart emblem) */}
        <p className="mt-2 text-base sm:text-lg text-zinc-700 max-w-2xl mx-auto leading-relaxed font-semibold bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-white/80 shadow-2xs">
          CareSync connects patients directly with live doctor OPD queues and
          emergency bed availability across hospitals in real time — reducing
          wait times and saving lives.
        </p>

        {/* 4. CTA Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/signup?role=patient"
            className="w-full sm:w-auto px-8 py-3.5 bg-[#E63946] hover:bg-[#d62837] text-white font-semibold text-sm rounded-xl transition-all shadow-sm hover:shadow-md text-center"
          >
            Patient Portal & Appointment Booking
          </Link>
          <Link
            href="/signup?role=hospital_admin"
            className="w-full sm:w-auto px-8 py-3.5 bg-white/95 backdrop-blur-sm hover:bg-zinc-100 border border-zinc-300 text-zinc-800 font-semibold text-sm rounded-xl transition-all text-center shadow-2xs"
          >
            Hospital Staff Portal
          </Link>
        </div>

        {/* Trust Badges */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left max-w-3xl mx-auto">
          <div className="bg-white/90 backdrop-blur-sm p-5 rounded-xl border border-zinc-200/80 shadow-xs">
            <h3 className="font-bold text-zinc-900 text-sm mb-1">
              Live Token Tracking
            </h3>
            <p className="text-xs text-zinc-600">
              Track your OPD queue status live from anywhere without standing in line.
            </p>
          </div>
          <div className="bg-white/90 backdrop-blur-sm p-5 rounded-xl border border-zinc-200/80 shadow-xs">
            <h3 className="font-bold text-zinc-900 text-sm mb-1">
              Emergency Bed Finder
            </h3>
            <p className="text-xs text-zinc-600">
              Instant visibility into ICU, General, and Emergency bed counts.
            </p>
          </div>
          <div className="bg-white/90 backdrop-blur-sm p-5 rounded-xl border border-zinc-200/80 shadow-xs">
            <h3 className="font-bold text-zinc-900 text-sm mb-1">
              Hospital Admin Hub
            </h3>
            <p className="text-xs text-zinc-600">
              One-tap doctor consultation queue management & bed updates.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-30 border-t border-zinc-200/80 bg-white/90 backdrop-blur-xs py-6 text-center text-xs text-zinc-500 font-medium">
        CareSync Platform — MVP Built for Google Antigravity
      </footer>
    </div>
  );
}
