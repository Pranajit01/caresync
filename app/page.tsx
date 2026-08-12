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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    async function checkSession() {
      const u = await getCurrentUser();
      if (u) {
        setCurrentUser({ role: u.role, fullName: u.fullName });
      }
    }
    checkSession();

    function checkMobile() {
      setIsMobile(window.innerWidth < 768);
    }
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-zinc-50 overflow-hidden font-sans">
      {/* LiquidEther Interactive Fluid Simulation Background (Optimized for Mobile Performance - 60 FPS 0 Lag) */}
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
        <LiquidEther
          colors={['#E63946', '#2A9D8F', '#1D3557']}
          mouseForce={isMobile ? 14 : 28}
          cursorSize={isMobile ? 80 : 130}
          autoDemo={true}
          autoSpeed={isMobile ? 0.4 : 0.7}
          autoIntensity={isMobile ? 1.5 : 2.5}
          resolution={isMobile ? 0.3 : 0.5}
          iterationsPoisson={isMobile ? 12 : 32}
          iterationsViscous={isMobile ? 12 : 32}
          BFECC={!isMobile}
        />
      </div>

      {/* Real Transparent Photo Human Connecting Hands (Mobile Top-Framed & Desktop Corner-Framed) */}
      <CaringHandsEmblem />

      {/* Header */}
      <header className="relative z-30 max-w-6xl mx-auto w-full px-6 py-4 flex items-center justify-between">
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
      <main className="relative z-30 max-w-4xl mx-auto px-6 py-4 text-center my-auto">
        <span className="inline-block px-3.5 py-1 bg-white/90 backdrop-blur-sm text-[#E63946] text-xs font-bold rounded-full border border-red-200 shadow-2xs mb-3 tracking-wide">
          Real-Time Smart OPD & Emergency Healthcare
        </span>

        {/* 1. Main Headline */}
        <h2 className="text-3xl sm:text-5xl font-extrabold text-zinc-900 tracking-tight leading-tight drop-shadow-2xs">
          Connected Care. <br />
          <span className="text-[#E63946]">Better Health.</span>
        </h2>

        {/* 2. Compact Glowing Heart & Teal ECG Wave */}
        <CaringHeartEmblem />

        {/* 3. Tagline Paragraph Card */}
        <p className="mt-1 text-sm sm:text-base text-zinc-700 max-w-xl mx-auto leading-relaxed font-semibold bg-white/65 backdrop-blur-sm p-3.5 rounded-xl border border-white/80 shadow-2xs">
          CareSync connects patients directly with live doctor OPD queues and
          emergency bed availability across hospitals in real time — reducing
          wait times and saving lives.
        </p>

        {/* 4. CTA Buttons */}
        <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/signup?role=patient"
            className="w-full sm:w-auto px-7 py-3 bg-[#E63946] hover:bg-[#d62837] text-white font-semibold text-sm rounded-xl transition-all shadow-sm hover:shadow-md text-center"
          >
            Patient Portal & Appointment Booking
          </Link>
          <Link
            href="/signup?role=hospital_admin"
            className="w-full sm:w-auto px-7 py-3 bg-white/95 backdrop-blur-sm hover:bg-zinc-100 border border-zinc-300 text-zinc-800 font-semibold text-sm rounded-xl transition-all text-center shadow-2xs"
          >
            Hospital Staff Portal
          </Link>
        </div>

        {/* 5. Trust Feature Cards */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left max-w-3xl mx-auto">
          <div className="bg-white/90 backdrop-blur-sm p-4 rounded-xl border border-zinc-200/80 shadow-xs">
            <h3 className="font-bold text-zinc-900 text-xs mb-0.5">
              Live Token Tracking
            </h3>
            <p className="text-[11px] text-zinc-600 leading-snug">
              Track your OPD queue status live from anywhere without standing in line.
            </p>
          </div>
          <div className="bg-white/90 backdrop-blur-sm p-4 rounded-xl border border-zinc-200/80 shadow-xs">
            <h3 className="font-bold text-zinc-900 text-xs mb-0.5">
              Emergency Bed Finder
            </h3>
            <p className="text-[11px] text-zinc-600 leading-snug">
              Instant visibility into ICU, General, and Emergency bed counts.
            </p>
          </div>
          <div className="bg-white/90 backdrop-blur-sm p-4 rounded-xl border border-zinc-200/80 shadow-xs">
            <h3 className="font-bold text-zinc-900 text-xs mb-0.5">
              Hospital Admin Hub
            </h3>
            <p className="text-[11px] text-zinc-600 leading-snug">
              One-tap doctor consultation queue management & bed updates.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-30 border-t border-zinc-200/80 bg-white/90 backdrop-blur-xs py-4 text-center text-xs text-zinc-500 font-medium">
        © {new Date().getFullYear()} CareSync Platform — Real-Time Smart OPD & Emergency Healthcare
      </footer>
    </div>
  );
}
