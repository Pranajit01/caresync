"use client";

import { useEffect, useState, useRef, useCallback } from "react";
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
  Bell as BellIcon,
  RotateCcw as RotateCcwIcon,
} from "lucide-react";

interface AppointmentDetail {
  id: string;
  appointment_date?: string;
  token_number: number;
  status: string;
  called_at?: string | null;
  skipped_requeued_at?: string | null;
  created_at: string;
  doctor_id: string;
  hospital_id: string;
  hospitals?: { id: string; name: string; address: string };
  doctors?: {
    id: string;
    full_name: string;
    specialization: string;
    no_show_threshold_seconds?: number;
  };
}

interface QueueState {
  doctor_id: string;
  date: string;
  now_serving_token: number;
}

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

  // PWA/Offline state
  const [cachedTime, setCachedTime] = useState<number | null>(null);
  const [offlineAgeText, setOfflineAgeText] = useState<string>("");
  const [reconnectDelay, setReconnectDelay] = useState<number>(2000);
  const [reconnectTrigger, setReconnectTrigger] = useState(0);

  // Countdown state for the 'called' alert
  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Ref to hold the Supabase Realtime channel so we can cleanly unsubscribe
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  /** Start or reset the countdown timer when called_at is set */
  const startCountdown = useCallback((calledAt: string, thresholdSeconds: number) => {
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    const update = () => {
      const elapsed = Math.floor((Date.now() - new Date(calledAt).getTime()) / 1000);
      const left = Math.max(0, thresholdSeconds - elapsed);
      setCountdown(left);
      if (left === 0 && countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };
    update();
    countdownIntervalRef.current = setInterval(update, 1000);
  }, []);

  /** Stop countdown when no longer needed */
  const stopCountdown = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setCountdown(null);
  }, []);

  // Initialize: Attempt to restore safe state from localStorage cache
  useEffect(() => {
    const cacheKey = `caresync:queue:${appointmentId}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setCachedTime(parsed.timestamp);
        setAppointment({
          id: appointmentId,
          token_number: parsed.token_number,
          status: parsed.status,
          called_at: parsed.called_at,
          skipped_requeued_at: parsed.skipped_requeued_at,
          doctor_id: parsed.doctor_id,
          hospital_id: parsed.hospital_id,
          created_at: new Date(parsed.timestamp).toISOString(),
        });
        setQueueState({
          doctor_id: parsed.doctor_id,
          date: new Date(parsed.timestamp).toISOString().split("T")[0],
          now_serving_token: parsed.now_serving_token,
        });
        // We can display the cached data instantly, so we can set loading to false!
        setLoading(false);
      } catch (e) {
        console.error("[cache] Failed to restore state:", e);
      }
    }
  }, [appointmentId]);

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

  // Load appointment details + initial queue_state from network
  useEffect(() => {
    if (!appointmentId) return;

    async function fetchAppointment() {
      try {
        const res = await fetch(`/api/appointments/${appointmentId}`);
        const json = await res.json();

        if (!res.ok || !json.appointment) {
          // If we had cache, don't show full page error unless there is absolutely no data
          if (!localStorage.getItem(`caresync:queue:${appointmentId}`)) {
            setError("Appointment not found.");
          }
          return;
        }

        const appt: AppointmentDetail = json.appointment;
        setAppointment(appt);

        // If already in 'called' state on load, start countdown immediately
        if (appt.status === "called" && appt.called_at) {
          const threshold = appt.doctors?.no_show_threshold_seconds ?? 180;
          startCountdown(appt.called_at, threshold);
        }

        // Fetch current queue_state for this doctor + appointment date
        const apptDate =
          appt.appointment_date ||
          new Date(appt.created_at).toISOString().split("T")[0];
        const { data: qs, error: qsErr } = await supabase
          .from("queue_state")
          .select("*")
          .eq("doctor_id", appt.doctor_id)
          .eq("date", apptDate)
          .single();

        if (!qsErr && qs) {
          setQueueState(qs);
        }
      } catch (e: any) {
        console.error("Network fetch failed:", e.message);
      } finally {
        setLoading(false);
      }
    }

    fetchAppointment();

    return () => stopCountdown();
  }, [appointmentId, startCountdown, stopCountdown]);

  // Update Cache in LocalStorage when fresh data arrives
  // Caches only safe metrics (queue position, status, timestamps). NO patient name/phone.
  useEffect(() => {
    if (!appointment) return;
    const cacheKey = `caresync:queue:${appointmentId}`;
    const payload = {
      token_number: appointment.token_number,
      status: appointment.status,
      called_at: appointment.called_at,
      skipped_requeued_at: appointment.skipped_requeued_at,
      doctor_id: appointment.doctor_id,
      hospital_id: appointment.hospital_id,
      now_serving_token: queueState?.now_serving_token ?? 0,
      timestamp: Date.now(),
    };
    localStorage.setItem(cacheKey, JSON.stringify(payload));
    setCachedTime(payload.timestamp);
  }, [appointment, queueState, appointmentId]);

  // Keep calculating cached data age for the offline/reconnecting banner
  useEffect(() => {
    if (cachedTime === null) return;
    const updateAge = () => {
      const diffMs = Date.now() - cachedTime;
      const diffSecs = Math.max(0, Math.floor(diffMs / 1000));
      if (diffSecs < 60) {
        setOfflineAgeText(`${diffSecs}s ago`);
      } else {
        const diffMins = Math.floor(diffSecs / 60);
        setOfflineAgeText(`${diffMins} min ago`);
      }
    };
    updateAge();
    const interval = setInterval(updateAge, 5000);
    return () => clearInterval(interval);
  }, [cachedTime]);

  // Set up Supabase Realtime subscription with Exponential Backoff Reconnection
  useEffect(() => {
    if (!appointment) return;

    const apptDate =
      appointment.appointment_date ||
      new Date(appointment.created_at).toISOString().split("T")[0];

    let active = true;
    let reconnectTimeout: ReturnType<typeof setTimeout>;

    const handleReconnect = () => {
      if (!active) return;
      console.log(`[realtime] Connection dropped. Retrying in ${reconnectDelay}ms...`);
      reconnectTimeout = setTimeout(() => {
        setReconnectTrigger((prev) => prev + 1);
        setReconnectDelay((prev) => Math.min(prev * 2, 30000));
      }, reconnectDelay);
    };

    // Subscribe to queue_state changes (now_serving_token updates)
    const channel = supabase
      .channel(`queue_state:${appointment.doctor_id}:${apptDate}`)
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
          if (updated && updated.date === apptDate) {
            setQueueState(updated);
            setReconnectDelay(2000); // Reset delay
          }
        }
      )
      .subscribe((status) => {
        if (!active) return;
        if (status === "SUBSCRIBED") {
          setRealtimeConnected(true);
          setReconnectDelay(2000); // Reset delay
        } else {
          setRealtimeConnected(false);
          handleReconnect();
        }
      });

    channelRef.current = channel;

    // Subscribe to own appointment changes (status updates)
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
          if (!updated) return;

          setAppointment((prev) => {
            if (!prev) return prev;
            const next = { ...prev, ...updated };

            // Entered 'called' state — start countdown
            if (updated.status === "called" && updated.called_at) {
              const threshold = prev.doctors?.no_show_threshold_seconds ?? 180;
              startCountdown(updated.called_at, threshold);
            }

            // Left 'called' state — stop countdown
            if (prev.status === "called" && updated.status !== "called") {
              stopCountdown();
            }

            setReconnectDelay(2000); // Reset delay
            return next;
          });
        }
      )
      .subscribe((status) => {
        if (!active) return;
        if (status === "SUBSCRIBED") {
          setRealtimeConnected(true);
        } else {
          setRealtimeConnected(false);
        }
      });

    return () => {
      active = false;
      clearTimeout(reconnectTimeout);
      supabase.removeChannel(channel);
      supabase.removeChannel(apptChannel);
    };
  }, [appointment, appointmentId, startCountdown, stopCountdown, reconnectTrigger]);

  // Derived values
  const myToken = appointment?.token_number ?? 0;
  const nowServing = queueState?.now_serving_token ?? 0;
  const tokensAhead = Math.max(0, myToken - nowServing);
  const estimatedWaitMins = tokensAhead * AVG_CONSULTATION_MINUTES;

  const isCalled = appointment?.status === "called";
  const isInConsultation =
    appointment?.status === "in_consultation" || appointment?.status === "in_progress";
  const isCompleted = appointment?.status === "completed";
  const isSkipped = appointment?.status === "skipped";

  const statusBadge = () => {
    if (isCompleted) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
          <CheckCircleIcon className="w-3.5 h-3.5" /> Completed
        </span>
      );
    }
    if (isInConsultation) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full animate-pulse">
          <span className="w-2 h-2 bg-amber-500 rounded-full inline-block" /> In Consultation
        </span>
      );
    }
    if (isCalled) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-100 text-orange-800 text-xs font-bold rounded-full animate-pulse">
          <BellIcon className="w-3.5 h-3.5" /> Called
        </span>
      );
    }
    if (isSkipped) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-100 text-rose-700 text-xs font-bold rounded-full">
          <RotateCcwIcon className="w-3.5 h-3.5" /> Skipped
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full">
        <span className="w-2 h-2 bg-blue-400 rounded-full inline-block" /> Waiting
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

  const threshold = appointment.doctors?.no_show_threshold_seconds ?? 180;
  const countdownMins = countdown !== null ? Math.floor(countdown / 60) : 0;
  const countdownSecs = countdown !== null ? countdown % 60 : 0;
  const countdownExpired = countdown === 0;

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

      {/* ===== OFFLINE / RECONNECTING BANNER ===== */}
      {!realtimeConnected && cachedTime !== null && (
        <div className="bg-amber-500 text-white text-xs font-bold text-center py-2.5 px-4 flex items-center justify-center gap-2 animate-pulse sticky top-[61px] z-20">
          <AlertCircleIcon className="w-4 h-4 shrink-0" />
          <span>Showing last known data from {offlineAgeText} — reconnecting...</span>
        </div>
      )}

      {/* ===== CALLED ALERT OVERLAY ===== */}
      {isCalled && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-0">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-2xl border-2 border-orange-400 max-w-sm w-full mx-auto p-6 text-center space-y-4 z-10">
            {/* Pulsing bell icon */}
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center animate-bounce">
                <BellIcon className="w-8 h-8 text-orange-500" />
              </div>
            </div>

            <div>
              <h2 className="text-xl font-black text-zinc-900">You&apos;re Being Called!</h2>
              <p className="text-sm text-zinc-600 mt-1">
                Please proceed to the doctor&apos;s room immediately.
              </p>
            </div>

            {/* Countdown timer */}
            <div className={`rounded-xl px-4 py-3 ${countdownExpired ? "bg-red-50 border border-red-200" : "bg-orange-50 border border-orange-200"}`}>
              {countdownExpired ? (
                <p className="text-sm font-bold text-red-600">
                  Time&apos;s up — checking if you&apos;ve been re-queued…
                </p>
              ) : (
                <>
                  <p className={`text-4xl font-black tabular-nums ${countdown !== null && countdown <= 30 ? "text-red-600" : "text-orange-600"}`}>
                    {String(countdownMins).padStart(2, "0")}:{String(countdownSecs).padStart(2, "0")}
                  </p>
                  <p className="text-xs text-orange-700 font-semibold mt-1">
                    Time remaining to check in
                  </p>
                </>
              )}
            </div>

            <p className="text-xs text-zinc-500">
              Token #{String(myToken).padStart(2, "0")} &bull; {appointment.doctors?.full_name}
            </p>
          </div>
        </div>
      )}

      {/* ===== SKIPPED NOTIFICATION ===== */}
      {isSkipped && (
        <div className="mx-4 mt-4 px-4 py-3 bg-rose-50 border border-rose-300 rounded-xl flex items-start gap-3">
          <RotateCcwIcon className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-rose-800">You were marked absent</p>
            {appointment.skipped_requeued_at ? (
              <p className="text-xs text-rose-600 mt-0.5">
                You&apos;ve been re-queued at the end of the line. Check your new token below or refresh your dashboard.
              </p>
            ) : (
              <p className="text-xs text-rose-600 mt-0.5">
                Your token was skipped. Please contact the front desk if you&apos;re still at the hospital.
              </p>
            )}
          </div>
        </div>
      )}

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
                isCalled
                  ? "bg-orange-50 border-orange-200"
                  : isInConsultation
                  ? "bg-amber-50 border-amber-200"
                  : "bg-zinc-50 border-zinc-200"
              }`}
            >
              <span className="block text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1">
                Your Token
              </span>
              <span
                className={`block text-5xl font-black ${
                  isCalled
                    ? "text-orange-600 animate-pulse"
                    : isInConsultation
                    ? "text-amber-600 animate-pulse"
                    : "text-zinc-800"
                }`}
              >
                {String(myToken).padStart(2, "0")}
              </span>
            </div>
          </div>

          {/* Progress bar */}
          {!isCompleted && !isSkipped && (
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
          )}

          {/* Status message */}
          <div className="flex items-center gap-3 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3">
            <ClockIcon className="w-5 h-5 text-zinc-500 shrink-0" />
            <div>
              {isCompleted ? (
                <p className="text-sm font-semibold text-emerald-700">
                  Consultation complete. Thank you!
                </p>
              ) : isSkipped ? (
                <p className="text-sm font-semibold text-rose-600">
                  You were marked absent. Please check with the front desk.
                </p>
              ) : isInConsultation ? (
                <p className="text-sm font-semibold text-amber-700">
                  Your consultation is in progress now!
                </p>
              ) : isCalled ? (
                <p className="text-sm font-semibold text-orange-700">
                  🔔 You&apos;re being called — please go to the doctor&apos;s room!
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
                    {tokensAhead} token{tokensAhead !== 1 ? "s" : ""} ahead &bull;{" "}
                    {AVG_CONSULTATION_MINUTES} min avg
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
