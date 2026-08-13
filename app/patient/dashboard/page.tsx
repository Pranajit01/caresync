"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, signOutUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase/client";

interface Appointment {
  id: string;
  token_number: number;
  status: string;
  created_at: string;
  hospitals?: { id: string; name: string; address: string };
  doctors?: { id: string; full_name: string; specialization: string };
}

export default function PatientDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{
    email?: string;
    fullName: string;
    role: string;
    id: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [myTokens, setMyTokens] = useState<Appointment[]>([]);
  const [loadingTokens, setLoadingTokens] = useState(true);

  useEffect(() => {
    async function loadUserAndTokens() {
      const u = await getCurrentUser();
      if (!u) {
        router.push("/login");
        return;
      }
      setUser({
        email: u.email,
        fullName: u.fullName,
        role: u.role,
        id: u.id,
      });
      setLoading(false);

      // Fetch user's tokens via API route + direct Supabase client fallback
      try {
        let fetchedTokens: Appointment[] = [];

        // Primary: API Route
        const res = await fetch(`/api/appointments/my-tokens?patientId=${u.id}`);
        const json = await res.json();
        if (json.appointments && json.appointments.length > 0) {
          fetchedTokens = json.appointments;
        }

        // Secondary / Fallback: Direct Browser Client Query
        if (fetchedTokens.length === 0) {
          const { data: directData } = await supabase
            .from("appointments")
            .select(`
              id,
              token_number,
              status,
              created_at,
              hospitals ( id, name, address ),
              doctors ( id, full_name, specialization )
            `)
            .eq("patient_id", u.id)
            .order("created_at", { ascending: false });

          if (directData && directData.length > 0) {
            fetchedTokens = directData as unknown as Appointment[];
          }
        }

        setMyTokens(fetchedTokens);
      } catch (e) {
        console.error("Failed to load patient tokens:", e);
      } finally {
        setLoadingTokens(false);
      }
    }
    loadUserAndTokens();
  }, [router]);

  const handleLogout = async () => {
    await signOutUser();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <p className="text-sm text-zinc-500 animate-pulse">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header / Navbar */}
      <header className="bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-zinc-900">
            Care<span className="text-[#E63946]">Sync</span>
          </h1>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-[#2A9D8F]">
            Patient Portal
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/patient/book"
            className="px-4 py-2 text-sm font-semibold text-white bg-[#E63946] hover:bg-red-600 rounded-lg shadow-sm transition-colors"
          >
            + Book OPD Appointment
          </Link>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm font-medium text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* User Welcome Card */}
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-100 pb-4 mb-4 gap-2">
            <div>
              <h2 className="text-2xl font-bold text-zinc-900">
                Welcome, {user?.fullName || "Patient"}
              </h2>
              <p className="text-sm text-zinc-500 mt-0.5">{user?.email}</p>
            </div>
            <span className="self-start sm:self-auto px-3 py-1 bg-zinc-100 text-zinc-700 text-xs font-semibold rounded-lg">
              Role: {user?.role}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="p-4 rounded-lg bg-zinc-50 border border-zinc-100">
              <span className="text-xs uppercase text-zinc-400 font-semibold block mb-1">
                Account ID
              </span>
              <code className="text-xs font-mono text-zinc-800 break-all">
                {user?.id}
              </code>
            </div>
            <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-100">
              <span className="text-xs uppercase text-emerald-600 font-semibold block mb-1">
                Account Status
              </span>
              <p className="text-xs text-[#2A9D8F] font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#2A9D8F] animate-pulse inline-block" />
                Active Session &bull; OPD Booking & Emergency Beds Ready
              </p>
            </div>
          </div>
        </div>

        {/* Action Banner */}
        <div className="bg-gradient-to-r from-red-600 to-[#E63946] text-white p-6 rounded-xl shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold">OPD Consultation & Emergency Beds</h3>
            <p className="text-xs text-red-100 mt-1">
              Book doctor slots or view live emergency bed availability across Kolkata hospitals.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/patient/emergency-beds"
              className="px-4 py-2.5 bg-red-900/40 hover:bg-red-900/60 border border-white/30 text-white font-bold text-xs rounded-lg transition-colors shadow-sm"
            >
              Emergency Bed Finder →
            </Link>
            <Link
              href="/patient/book"
              className="px-4 py-2.5 bg-white text-[#E63946] font-bold text-xs rounded-lg hover:bg-zinc-100 transition-colors shadow-sm"
            >
              Book Appointment →
            </Link>
          </div>
        </div>

        {/* My Digital Tokens List */}
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-zinc-900 mb-4 flex items-center gap-2">
            <span>My Active Digital Tokens</span>
            <span className="text-xs px-2.5 py-0.5 bg-[#E63946] text-white rounded-full font-bold">
              {myTokens.length}
            </span>
          </h3>

          {loadingTokens ? (
            <div className="py-8 text-center text-zinc-400 text-sm animate-pulse">
              Loading your tokens...
            </div>
          ) : myTokens.length === 0 ? (
            <div className="py-8 text-center bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
              <p className="text-sm font-medium text-zinc-600">No active appointments yet.</p>
              <p className="text-xs text-zinc-400 mt-1">
                Book your first slot using the button above.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myTokens.map((t) => (
                <div
                  key={t.id}
                  className="p-5 rounded-xl border border-zinc-200 bg-white hover:border-[#E63946] transition-all space-y-3 relative overflow-hidden shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg">
                      Token #{String(t.token_number).padStart(2, "0")}
                    </span>
                    <span className="text-xs font-semibold text-zinc-500 capitalize">
                      Status: {t.status}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-zinc-900 text-base">
                      {t.doctors?.full_name || "Doctor Consultation"}
                    </h4>
                    <p className="text-xs text-emerald-700 font-medium">
                      {t.doctors?.specialization || "General OPD"}
                    </p>
                  </div>

                  <div className="border-t border-zinc-100 pt-2 text-xs text-zinc-500">
                    <p className="font-medium text-zinc-700">{t.hospitals?.name || "Hospital OPD"}</p>
                    <p className="text-[#a0a0a0] text-[11px] mt-0.5">
                      Booked on: {new Date(t.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Track Queue button — shown for active tokens */}
                  {(t.status === "booked" || t.status === "in_progress") && (
                    <Link
                      href={`/patient/queue/${t.id}`}
                      className="block w-full text-center px-3 py-2 text-xs font-bold text-white bg-[#2A9D8F] hover:bg-[#238377] rounded-lg transition-colors mt-1 shadow-2xs"
                    >
                      Track Live Queue →
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
