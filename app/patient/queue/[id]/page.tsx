"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { getCurrentUser } from "@/lib/auth";
import {
  ArrowLeft as ArrowLeftIcon,
  Clock as ClockIcon,
  CheckCircle as CheckCircleIcon,
  AlertCircle as AlertCircleIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
} from "lucide-react";

interface AppointmentDetail {
  id: string;
  token_number: number;
  status: string;
  created_at: string;
  doctor_id: string;
  hospital_id: string;
  hospitals?: { id: string; name: string; address: string };
  doctors?: { id: string; full_name: string; specialization: string };
}

interface QueueState {
  doctor_id: string;
  date: string;
  now_serving_token: number;
}

/**
 * Average consultation time per patient in minutes.
 * TODO: In a future release, calculate this from historical appointment data
 * (median time between start_consultation and complete_consultation events
 * for each doctor over the past 30 days) rather than this hardcoded constant.
 */
const AVG_CONSULTATION_MINUTES = 10;

export default function PatientQueueScreen() {
  const router = useRouter();
  const params = useParams();
  const appointmentId = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [appointment, setAppointment] = useState<AppointmentDetail | null>(null);
  const [queueState, setQueueState] = useState<QueueState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [realtimeConnected, setRealtimeConnected] = useState(false);

  // Ref to hold the Supabase Realtime channel so we can cleanly unsubscribe
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Load user auth
  useEffect(() => {
    getCurrentUser().then((u) => {
      if (!u) {
        router.push("/login");
        return;
      }
      setUser(u);
    });
  }, [router]);

  // Load appointment details + initial queue_state
  useEffect(() => {
    if (!appointmentId) return;

    async function fetchAppointment() {
      try {
        const res = await fetch(`/api/appointments/${appointmentId}`);
        const json = await res.json();

        if (!res.ok || !json.appointment) {
          setError("Appointment not found.");
          setLoading(false);
          return;
        }

        const appt: AppointmentDetail = json.appointment;
        setAppointment(appt);

        // Fetch current queue_state for this doctor + today
        const today = new Date(appt.created_at).toISOString().split("T")[0];
        const { data: qs, error: qsErr } = await supabase
          .from("queue_state")
          .select("*")
          .eq("doctor_id", appt.doctor_id)
          .eq("date", today)
          .single();

        if (!qsErr && qs) {
          setQueueState(qs);
        }
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }

    fetchAppointment();
  }, [appointmentId]);

  // Set up Supabase Realtime subscription on queue_state for this doctor
  // Per Section 6: "Patient's queue screen subscribes to queue_state via
  // Supabase Realtime — no polling needed."
  useEffect(() => {
    if (!appointment) return;

    const today = new Date(appointment.created_at).toISOString().split("T")[0];

    // Subscribe to INSERT / UPDATE events on queue_state for this doctor + date
    const channel = supabase
      .channel(`queue_state:${appointment.doctor_id}:${today}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "queue_state",
          filter: `doctor_id=eq.${appointment.doctor_id}`,
        },
        (payload) => {
          const updated = payload.new as QueueState;
          if (updated && updated.date === today) {
            setQueueState(updated);
          }
        }
      )
      .subscribe((status) => {
        setRealtimeConnected(status === "SUBSCRIBED");
      });

    channelRef.current = channel;

    // Also subscribe to appointments changes so the status badge updates live
    const apptChannel = supabase
      .channel(`appointment:${appointmentId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "appointments",
          filter: `id=eq.${appointmentId}`,
        },
        (payload) => {
          const updated = payload.new as AppointmentDetail;
          if (updated) {
            setAppointment((prev) =>
              prev ? { ...prev, status: updated.status } : prev
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(apptChannel);
    };
  }, [appointment, appointmentId]);

  // Derived values
  const myToken = appointment?.token_number ?? 0;
  const nowServing = queueState?.now_serving_token ?? 0;
  const tokensAhead = Math.max(0, myToken - nowServing);

  /**
   * Estimated wait time in minutes.
   * Formula: (your_token - now_serving_token) * AVG_CONSULTATION_MINUTES
   * Note: AVG_CONSULTATION_MINUTES is hardcoded at 10 for MVP.
   * Future improvement: derive this from historical consultation duration data.
   */
  const estimatedWaitMins = tokensAhead * AVG_CONSULTATION_MINUTES;

  const statusBadge = () => {
    const s = appointment?.status;
    if (s === "completed") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
          <CheckCircleIcon className="w-3.5 h-3.5" /> Completed
        </span>
      );
    }
    if (s === "in_progress") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full animate-pulse">
          <span className="w-2 h-2 bg-amber-500 rounded-full inline-block" /> In Consultation
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full">
        <span className="w-2 h-2 bg-blue-400 rounded-full inline-block" /> Booked
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <p className="text-sm text-zinc-500 animate-pulse">
          Loading live queue tracker...
        </p>
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="text-center p-8">
          <AlertCircleIcon className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-zinc-800 font-semibold">{error || "Appointment not found."}</p>
          <Link
            href="/patient/dashboard"
            className="mt-4 inline-block text-sm font-semibold text-[#E63946] hover:underline"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link
            href="/patient/dashboard"
            className="text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold text-zinc-900">
            Care<span className="text-[#E63946]">Sync</span>
          </h1>
          <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
            Live Queue Tracker
          </span>
        </div>

        {/* Realtime connection indicator */}
        <div className="flex items-center gap-1.5 text-xs font-medium">
          {realtimeConnected ? (
            <>
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse inline-block" />
              <span className="text-emerald-700 hidden sm:inline">Live</span>
              <WifiIcon className="w-4 h-4 text-emerald-600" />
            </>
          ) : (
            <>
              <span className="w-2 h-2 bg-zinc-400 rounded-full inline-block" />
              <WifiOffIcon className="w-4 h-4 text-zinc-400" />
            </>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto w-full px-4 py-8 flex-1 space-y-5">
        {/* Appointment Identity Card */}
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h2 className="text-xl font-bold text-zinc-900">
                {appointment.doctors?.full_name}
              </h2>
              <p className="text-xs text-emerald-700 font-semibold mt-0.5">
                {appointment.doctors?.specialization}
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                {appointment.hospitals?.name}
              </p>
            </div>
            {statusBadge()}
          </div>
          <div className="text-xs text-zinc-400 border-t border-zinc-100 pt-3">
            Appointment ID: <span className="font-mono text-zinc-600">{appointment.id}</span>
          </div>
        </div>

        {/* Live Queue Progress Panel */}
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-5">
            Live Queue Status
          </h3>

          {/* Now Serving vs Your Token */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-[#2A9D8F]/10 border border-[#2A9D8F]/20 rounded-xl p-4 text-center">
              <span className="block text-xs font-semibold text-[#2A9D8F] uppercase tracking-wide mb-1">
                Now Serving
              </span>
              <span className="block text-5xl font-black text-[#2A9D8F]">
                {String(nowServing).padStart(2, "0")}
              </span>
            </div>
            <div
              className={`rounded-xl p-4 text-center border ${
                myToken === nowServing && appointment.status === "in_progress"
                  ? "bg-amber-50 border-amber-200"
                  : "bg-zinc-50 border-zinc-200"
              }`}
            >
              <span className="block text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1">
                Your Token
              </span>
              <span
                className={`block text-5xl font-black ${
                  myToken === nowServing && appointment.status === "in_progress"
                    ? "text-amber-600 animate-pulse"
                    : "text-zinc-800"
                }`}
              >
                {String(myToken).padStart(2, "0")}
              </span>
            </div>
          </div>

          {/* Progress bar: visual gap between now_serving and your token */}
          <div className="mb-5">
            <div className="flex justify-between text-xs text-zinc-500 mb-1.5">
              <span>Tokens ahead of you</span>
              <span className="font-semibold text-zinc-700">
                {tokensAhead} token{tokensAhead !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="w-full h-3 bg-zinc-100 rounded-full overflow-hidden">
              {myToken > 0 && (
                <div
                  className="h-full bg-[#2A9D8F] rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${Math.min(100, Math.max(5, (nowServing / myToken) * 100))}%`,
                  }}
                />
              )}
            </div>
          </div>

          {/* Estimated wait time */}
          <div className="flex items-center gap-3 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3">
            <ClockIcon className="w-5 h-5 text-zinc-500 shrink-0" />
            <div>
              {appointment.status === "completed" ? (
                <p className="text-sm font-semibold text-emerald-700">
                  Consultation complete. Thank you!
                </p>
              ) : appointment.status === "in_progress" ? (
                <p className="text-sm font-semibold text-amber-700">
                  Your consultation is in progress now!
                </p>
              ) : tokensAhead === 0 ? (
                <p className="text-sm font-semibold text-[#2A9D8F]">
                  You&apos;re next — please proceed to the doctor&apos;s room.
                </p>
              ) : (
                <>
                  <p className="text-sm font-semibold text-zinc-800">
                    Estimated wait:{" "}
                    <strong>~{estimatedWaitMins} min</strong>
                  </p>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {tokensAhead} token{tokensAhead !== 1 ? "s" : ""} ahead ×{" "}
                    {AVG_CONSULTATION_MINUTES} min avg
                    {/* TODO: Replace AVG_CONSULTATION_MINUTES (hardcoded 10 min) with
                        doctor-specific median consultation time derived from historical
                        completed appointment data (start → complete timestamps). */}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Realtime status info box */}
        <div className="flex items-center gap-2 text-xs text-zinc-500 px-1">
          {realtimeConnected ? (
            <>
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shrink-0" />
              This screen updates automatically via Supabase Realtime — no refresh needed.
            </>
          ) : (
            <>
              <span className="w-2 h-2 bg-zinc-300 rounded-full shrink-0" />
              Connecting to live queue feed...
            </>
          )}
        </div>

        <div className="text-center pb-4">
          <Link
            href="/patient/dashboard"
            className="text-sm font-semibold text-zinc-500 hover:text-zinc-800 transition-colors"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}
