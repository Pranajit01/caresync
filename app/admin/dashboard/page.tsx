"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, signOutUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase/client";
import {
  Play as PlayIcon,
  CheckSquare as CheckSquareIcon,
  RefreshCw as RefreshCwIcon,
  AlertCircle as AlertCircleIcon,
  Building2 as BuildingIcon,
  BedDouble as BedIcon,
  Users as UsersIcon,
  Clock as ClockIcon,
  TrendingUp as TrendingUpIcon,
  Plus as PlusIcon,
  Minus as MinusIcon,
  CheckCircle2 as CheckCircleIcon,
  Info as InfoIcon,
} from "lucide-react";

interface Hospital {
  id: string;
  name: string;
  address: string;
}

interface QueueRow {
  id: string;
  token_number: number;
  status: "booked" | "in_progress" | "completed" | "cancelled";
  created_at: string;
  patient_id: string;
  users?: { id: string; full_name: string; phone: string };
  doctors?: { id: string; full_name: string; specialization: string };
}

interface BedRow {
  id: string;
  hospital_id: string;
  ward_type: "ICU" | "General" | "Emergency";
  total_beds: number;
  available_beds: number;
  updated_at: string;
}

interface AnalyticsData {
  patientsServedToday: number;
  totalBookingsToday: number;
  inProgressCount: number;
  bookedCount: number;
  averageWaitTimeMins: number;
  beds: {
    totalBeds: number;
    availableBeds: number;
    occupiedBeds: number;
    occupancyPercentage: number;
    byWard: BedRow[];
  };
}

type TabType = "queue" | "beds" | "analytics";

const STATUS_COLORS: Record<string, string> = {
  booked: "bg-blue-50 text-blue-700 border-blue-200",
  in_progress: "bg-amber-50 text-amber-700 border-amber-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-zinc-100 text-zinc-500 border-zinc-200",
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("queue");
  const [user, setUser] = useState<{
    email?: string;
    fullName: string;
    role: string;
    id: string;
  } | null>(null);

  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [hospitalNotice, setHospitalNotice] = useState<string | null>(null);

  // Queue state
  const [queueRows, setQueueRows] = useState<QueueRow[]>([]);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [queueError, setQueueError] = useState<string | null>(null);

  // Beds state
  const [bedRows, setBedRows] = useState<BedRow[]>([]);
  const [loadingBeds, setLoadingBeds] = useState(false);
  const [bedUpdatingId, setBedUpdatingId] = useState<string | null>(null);
  const [bedError, setBedError] = useState<string | null>(null);

  // Analytics state
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Realtime channel ref
  const bedChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Load user auth
  useEffect(() => {
    async function loadUser() {
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
      setLoadingUser(false);
    }
    loadUser();
  }, [router]);

  // Resolve admin's hospital from public.users
  useEffect(() => {
    if (!user) return;
    async function resolveHospital() {
      try {
        const res = await fetch(`/api/admin/my-hospital?userId=${user!.id}`);
        const json = await res.json();
        if (res.ok && json.hospital) {
          setHospital(json.hospital);
        } else {
          // Fallback to first hospital for demo testing if user doesn't have hospital_id set
          const fallback = await fetch("/api/hospitals");
          const fb = await fallback.json();
          if (fb.hospitals?.length > 0) {
            setHospital(fb.hospitals[0]);
            setHospitalNotice(
              "Demonstration Mode: Account not linked to specific hospital — showing Apollo Multispecialty."
            );
          }
        }
      } catch (e: any) {
        setHospitalNotice(e.message);
      }
    }
    resolveHospital();
  }, [user]);

  // Fetch queue data for hospital
  const fetchQueue = useCallback(async () => {
    if (!hospital) return;
    setLoadingQueue(true);
    setQueueError(null);
    try {
      const res = await fetch(`/api/admin/queue/today?hospitalId=${hospital.id}`);
      const json = await res.json();
      if (res.ok) {
        setQueueRows(json.appointments || []);
      } else {
        setQueueError(json.error || "Failed to load OPD queue.");
      }
    } catch (e: any) {
      setQueueError(e.message);
    } finally {
      setLoadingQueue(false);
    }
  }, [hospital]);

  // Fetch beds data for hospital
  const fetchBeds = useCallback(async () => {
    if (!hospital) return;
    setLoadingBeds(true);
    setBedError(null);
    try {
      const res = await fetch(`/api/admin/beds?hospitalId=${hospital.id}`);
      const json = await res.json();
      if (res.ok) {
        setBedRows(json.beds || []);
      } else {
        setBedError(json.error || "Failed to load bed inventory.");
      }
    } catch (e: any) {
      setBedError(e.message);
    } finally {
      setLoadingBeds(false);
    }
  }, [hospital]);

  // Fetch analytics data for hospital
  const fetchAnalytics = useCallback(async () => {
    if (!hospital) return;
    setLoadingAnalytics(true);
    try {
      const res = await fetch(`/api/admin/analytics?hospitalId=${hospital.id}`);
      const json = await res.json();
      if (res.ok) {
        setAnalytics(json.analytics || null);
      }
    } catch (e: any) {
      console.error("Analytics fetch error:", e);
    } finally {
      setLoadingAnalytics(false);
    }
  }, [hospital]);

  // Load active tab data
  useEffect(() => {
    if (!hospital) return;
    if (activeTab === "queue") {
      fetchQueue();
    } else if (activeTab === "beds") {
      fetchBeds();
    } else if (activeTab === "analytics") {
      fetchAnalytics();
    }
  }, [hospital, activeTab, fetchQueue, fetchBeds, fetchAnalytics]);

  // Realtime subscription on beds table for live bed manager updates
  useEffect(() => {
    if (!hospital) return;

    const channel = supabase
      .channel(`beds:${hospital.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "beds",
          filter: `hospital_id=eq.${hospital.id}`,
        },
        (payload) => {
          const updated = payload.new as BedRow;
          if (updated && updated.id) {
            setBedRows((prev) =>
              prev.map((b) => (b.id === updated.id ? { ...b, ...updated } : b))
            );
          }
        }
      )
      .subscribe();

    bedChannelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [hospital]);

  const handleLogout = async () => {
    await signOutUser();
    router.push("/login");
  };

  // Start Consultation
  const handleStartConsultation = async (appointmentId: string) => {
    setActionInProgress(appointmentId);
    setQueueError(null);
    try {
      const res = await fetch("/api/admin/queue/start-consultation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId }),
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        setQueueError(json.error || "Failed to start consultation.");
        return;
      }
      setQueueRows((prev) =>
        prev.map((row) =>
          row.id === appointmentId ? { ...row, status: "in_progress" } : row
        )
      );
    } catch (e: any) {
      setQueueError(e.message);
    } finally {
      setActionInProgress(null);
    }
  };

  // Mark Complete
  const handleMarkComplete = async (appointmentId: string) => {
    setActionInProgress(appointmentId);
    setQueueError(null);
    try {
      const res = await fetch("/api/admin/queue/mark-complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId }),
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        setQueueError(json.error || "Failed to mark complete.");
        return;
      }
      setQueueRows((prev) =>
        prev.map((row) =>
          row.id === appointmentId ? { ...row, status: "completed" } : row
        )
      );
    } catch (e: any) {
      setQueueError(e.message);
    } finally {
      setActionInProgress(null);
    }
  };

  // Atomic Bed Delta Update (+1 or -1) per Section 7
  const handleUpdateBedCount = async (bedId: string, delta: number) => {
    if (!hospital) return;
    setBedUpdatingId(bedId);
    setBedError(null);
    try {
      const res = await fetch("/api/admin/beds/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bedId, delta, hospitalId: hospital.id }),
      });
      const json = await res.json();

      if (!res.ok || json.error) {
        setBedError(json.error || "Failed to update bed count.");
        return;
      }

      // Optimistic update
      if (json.bed) {
        setBedRows((prev) =>
          prev.map((b) => (b.id === bedId ? { ...b, ...json.bed } : b))
        );
      }
    } catch (e: any) {
      setBedError(e.message);
    } finally {
      setBedUpdatingId(null);
    }
  };

  if (loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <p className="text-sm text-zinc-500 animate-pulse">
          Loading Hospital Admin Portal...
        </p>
      </div>
    );
  }

  const todayLabel = new Date().toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      {/* Top Navbar */}
      <header className="bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-zinc-900">
            Care<span className="text-[#E63946]">Sync</span>
          </h1>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-[#E63946]">
            Hospital Admin Portal
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-500 hidden sm:inline">
            {user?.email}
          </span>
          <button
            onClick={handleLogout}
            className="px-3.5 py-1.5 text-xs font-semibold text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors border border-zinc-200"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6 flex-1">
        {/* Hospital Header Banner */}
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-red-50 rounded-xl shrink-0">
              <BuildingIcon className="w-6 h-6 text-[#E63946]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900">
                {hospital?.name || "Loading Hospital..."}
              </h2>
              <p className="text-xs text-zinc-500">{hospital?.address}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs shrink-0">
            <span className="px-3 py-1 bg-zinc-100 text-zinc-700 font-medium rounded-lg">
              Staff: {user?.fullName}
            </span>
            <span className="px-3 py-1 bg-zinc-50 text-zinc-500 rounded-lg border border-zinc-200">
              {todayLabel}
            </span>
          </div>
        </div>

        {hospitalNotice && (
          <div className="px-4 py-2.5 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium rounded-xl flex items-center gap-2">
            <InfoIcon className="w-4 h-4 text-amber-700 shrink-0" />
            <span>{hospitalNotice}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="border-b border-zinc-200 flex items-center gap-2">
          <button
            onClick={() => setActiveTab("queue")}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "queue"
                ? "border-[#E63946] text-[#E63946]"
                : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
          >
            <UsersIcon className="w-4 h-4" />
            Today&apos;s OPD Queue
          </button>

          <button
            onClick={() => setActiveTab("beds")}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "beds"
                ? "border-[#E63946] text-[#E63946]"
                : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
          >
            <BedIcon className="w-4 h-4" />
            Bed Manager
          </button>

          <button
            onClick={() => setActiveTab("analytics")}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "analytics"
                ? "border-[#E63946] text-[#E63946]"
                : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
          >
            <TrendingUpIcon className="w-4 h-4" />
            Analytics
          </button>
        </div>

        {/* TAB 1: OPD QUEUE MANAGER */}
        {activeTab === "queue" && (
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden space-y-0">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
              <div>
                <h3 className="text-base font-bold text-zinc-900">
                  OPD Appointments ({queueRows.length})
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Advance consultations to notify waiting patients in real-time.
                </p>
              </div>
              <button
                onClick={fetchQueue}
                disabled={loadingQueue}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 rounded-lg border border-zinc-200 transition-colors"
              >
                <RefreshCwIcon
                  className={`w-3.5 h-3.5 ${loadingQueue ? "animate-spin" : ""}`}
                />
                Refresh Queue
              </button>
            </div>

            {queueError && (
              <div className="mx-6 mt-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-xl flex items-center gap-2">
                <AlertCircleIcon className="w-4 h-4 shrink-0" />
                {queueError}
              </div>
            )}

            {loadingQueue ? (
              <div className="py-16 text-center text-zinc-400 text-sm animate-pulse">
                Loading today&apos;s OPD queue...
              </div>
            ) : queueRows.length === 0 ? (
              <div className="py-16 text-center bg-zinc-50/50">
                <p className="text-sm font-semibold text-zinc-600">
                  No appointments booked for today.
                </p>
                <p className="text-xs text-zinc-400 mt-1">
                  Patients booking slots via CareSync will appear here immediately.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-100">
                {queueRows.map((row) => {
                  const isActioning = actionInProgress === row.id;
                  const isBooked = row.status === "booked";
                  const isInProgress = row.status === "in_progress";
                  const isDone = row.status === "completed";

                  return (
                    <div
                      key={row.id}
                      className={`px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                        isDone ? "opacity-50" : ""
                      } ${isInProgress ? "bg-amber-50/40" : ""}`}
                    >
                      {/* Patient & Doctor info */}
                      <div className="flex items-center gap-4">
                        <div
                          className={`min-w-[52px] text-center px-3 py-2 rounded-xl font-black text-xl ${
                            isInProgress
                              ? "bg-amber-100 text-amber-700"
                              : isDone
                              ? "bg-zinc-100 text-zinc-400"
                              : "bg-blue-50 text-blue-700"
                          }`}
                        >
                          #{String(row.token_number).padStart(2, "0")}
                        </div>

                        <div>
                          <p className="font-semibold text-zinc-900 text-sm">
                            {row.users?.full_name || "Patient"}
                          </p>
                          <p className="text-xs text-zinc-500">
                            {row.doctors?.full_name} &middot;{" "}
                            <span className="text-emerald-700 font-medium">
                              {row.doctors?.specialization}
                            </span>
                          </p>
                          <p className="text-[11px] text-zinc-400 mt-0.5">
                            Booked:{" "}
                            {new Date(row.created_at).toLocaleTimeString("en-IN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>

                      {/* Advance Controls */}
                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <span
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${
                            STATUS_COLORS[row.status] || ""
                          }`}
                        >
                          {row.status === "in_progress"
                            ? "In Progress"
                            : row.status}
                        </span>

                        {isBooked && (
                          <button
                            onClick={() => handleStartConsultation(row.id)}
                            disabled={isActioning}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-[#E63946] hover:bg-red-600 rounded-lg shadow-sm transition-all disabled:opacity-50"
                          >
                            <PlayIcon className="w-3.5 h-3.5" />
                            {isActioning ? "Starting..." : "Start Consultation"}
                          </button>
                        )}

                        {isInProgress && (
                          <button
                            onClick={() => handleMarkComplete(row.id)}
                            disabled={isActioning}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-[#2A9D8F] hover:bg-emerald-700 rounded-lg shadow-sm transition-all disabled:opacity-50"
                          >
                            <CheckSquareIcon className="w-3.5 h-3.5" />
                            {isActioning ? "Saving..." : "Mark Complete"}
                          </button>
                        )}

                        {isDone && (
                          <span className="text-xs text-zinc-400 italic">
                            Completed
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: BED MANAGER */}
        {activeTab === "beds" && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-base font-bold text-zinc-900">
                    Emergency Bed Count Manager
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Per Section 7: Bed updates use server-side atomic deltas (+1 / -1).
                  </p>
                </div>
                <button
                  onClick={fetchBeds}
                  disabled={loadingBeds}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 rounded-lg border border-zinc-200 transition-colors"
                >
                  <RefreshCwIcon
                    className={`w-3.5 h-3.5 ${loadingBeds ? "animate-spin" : ""}`}
                  />
                  Refresh
                </button>
              </div>

              {bedError && (
                <div className="mt-3 px-4 py-2.5 bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-xl flex items-center gap-2">
                  <AlertCircleIcon className="w-4 h-4 shrink-0 text-red-700" />
                  <span>{bedError}</span>
                </div>
              )}

              {loadingBeds ? (
                <div className="py-12 text-center text-zinc-400 text-sm animate-pulse">
                  Loading bed inventory...
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
                  {bedRows.map((bed) => {
                    const isUpdating = bedUpdatingId === bed.id;
                    const occupiedBeds = Math.max(0, bed.total_beds - bed.available_beds);
                    const percentAvailable =
                      bed.total_beds > 0
                        ? Math.round((bed.available_beds / bed.total_beds) * 100)
                        : 0;

                    return (
                      <div
                        key={bed.id}
                        className="bg-white rounded-xl border border-zinc-200 shadow-sm p-5 hover:border-zinc-300 transition-all flex flex-col justify-between"
                      >
                        {/* Ward Header */}
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="px-3 py-1 bg-red-50 text-[#E63946] text-xs font-bold rounded-lg border border-red-100 uppercase tracking-wider">
                              {bed.ward_type} Ward
                            </span>
                            <span className="text-[11px] text-zinc-400">
                              Updated{" "}
                              {new Date(bed.updated_at).toLocaleTimeString("en-IN", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>

                          {/* Large Counter */}
                          <div className="py-2 text-center">
                            <span className="block text-4xl font-black text-zinc-900">
                              {bed.available_beds}
                            </span>
                            <span className="block text-xs font-medium text-zinc-500 mt-0.5">
                              Available / {bed.total_beds} Total Beds
                            </span>
                          </div>

                          {/* Stat Breakdown */}
                          <div className="grid grid-cols-2 gap-2 text-center mt-3 pt-3 border-t border-zinc-100 text-xs">
                            <div className="bg-zinc-50 p-2 rounded-lg">
                              <span className="text-zinc-400 block text-[10px] uppercase font-semibold">
                                Occupied
                              </span>
                              <span className="font-bold text-zinc-700">
                                {occupiedBeds}
                              </span>
                            </div>
                            <div className="bg-zinc-50 p-2 rounded-lg">
                              <span className="text-zinc-400 block text-[10px] uppercase font-semibold">
                                Availability Rate
                              </span>
                              <span className="font-bold text-emerald-700">
                                {percentAvailable}%
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Atomic Controls (+1 / -1) */}
                        <div className="mt-5 pt-3 border-t border-zinc-100">
                          <p className="text-[11px] text-center text-zinc-400 mb-2 font-medium">
                            Adjust Available Beds (Atomic Delta)
                          </p>
                          <div className="flex items-center justify-center gap-3">
                            {/* Decrement (-1 available_beds / +1 patient admitted) */}
                            <button
                              onClick={() => handleUpdateBedCount(bed.id, -1)}
                              disabled={isUpdating || bed.available_beds <= 0}
                              title="Admit Patient (-1 Available Bed)"
                              className="flex items-center justify-center w-10 h-10 rounded-xl bg-red-50 text-[#E63946] border border-red-200 font-bold hover:bg-red-100 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                              <MinusIcon className="w-5 h-5" />
                            </button>

                            <span className="text-xs font-mono font-bold text-zinc-600 min-w-[40px] text-center">
                              {isUpdating ? "..." : `${bed.available_beds}`}
                            </span>

                            {/* Increment (+1 available_beds / -1 patient discharged) */}
                            <button
                              onClick={() => handleUpdateBedCount(bed.id, 1)}
                              disabled={isUpdating || bed.available_beds >= bed.total_beds}
                              title="Discharge Patient (+1 Available Bed)"
                              className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-50 text-[#2A9D8F] border border-emerald-200 font-bold hover:bg-emerald-100 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                              <PlusIcon className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: BASIC ANALYTICS */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-zinc-900">
                  Hospital Overview & Analytics
                </h3>
                <p className="text-xs text-zinc-500">
                  Read-only metrics for today ({todayLabel}) scoped to {hospital?.name}.
                </p>
              </div>
              <button
                onClick={fetchAnalytics}
                disabled={loadingAnalytics}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 rounded-lg border border-zinc-200 transition-colors"
              >
                <RefreshCwIcon
                  className={`w-3.5 h-3.5 ${
                    loadingAnalytics ? "animate-spin" : ""
                  }`}
                />
                Refresh Analytics
              </button>
            </div>

            {loadingAnalytics ? (
              <div className="py-16 text-center text-zinc-400 text-sm animate-pulse">
                Computing analytics...
              </div>
            ) : analytics ? (
              <>
                {/* 4 Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Patients Served Today */}
                  <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-zinc-400 uppercase tracking-wide">
                        Patients Served
                      </span>
                      <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                        <CheckCircleIcon className="w-4 h-4" />
                      </div>
                    </div>
                    <span className="block text-3xl font-black text-zinc-900">
                      {analytics.patientsServedToday}
                    </span>
                    <span className="text-[11px] text-zinc-400 mt-1 block">
                      Consultations completed today
                    </span>
                  </div>

                  {/* Average Wait Time */}
                  <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-zinc-400 uppercase tracking-wide">
                        Avg Wait Time
                      </span>
                      <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                        <ClockIcon className="w-4 h-4" />
                      </div>
                    </div>
                    <span className="block text-3xl font-black text-zinc-900">
                      ~{analytics.averageWaitTimeMins} <span className="text-lg font-semibold text-zinc-500">min</span>
                    </span>
                    <span className="text-[11px] text-zinc-400 mt-1 block">
                      Est. average queue waiting time
                    </span>
                  </div>

                  {/* Total Bookings Today */}
                  <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-zinc-400 uppercase tracking-wide">
                        Total OPD Bookings
                      </span>
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <UsersIcon className="w-4 h-4" />
                      </div>
                    </div>
                    <span className="block text-3xl font-black text-zinc-900">
                      {analytics.totalBookingsToday}
                    </span>
                    <span className="text-[11px] text-zinc-400 mt-1 block">
                      {analytics.inProgressCount} in progress &middot; {analytics.bookedCount} waiting
                    </span>
                  </div>

                  {/* Bed Occupancy Rate */}
                  <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-zinc-400 uppercase tracking-wide">
                        Bed Occupancy
                      </span>
                      <div className="p-2 bg-red-50 text-[#E63946] rounded-lg">
                        <BedIcon className="w-4 h-4" />
                      </div>
                    </div>
                    <span className="block text-3xl font-black text-zinc-900">
                      {analytics.beds.occupancyPercentage}%
                    </span>
                    <span className="text-[11px] text-zinc-400 mt-1 block">
                      {analytics.beds.occupiedBeds} occupied / {analytics.beds.totalBeds} total
                    </span>
                  </div>
                </div>

                {/* Detailed Ward Breakdown */}
                <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
                  <h4 className="text-sm font-bold text-zinc-900 mb-4">
                    Department Bed Capacity Breakdown
                  </h4>
                  <div className="space-y-4">
                    {analytics.beds.byWard.map((ward) => {
                      const occ = Math.max(0, ward.total_beds - ward.available_beds);
                      const pct =
                        ward.total_beds > 0
                          ? Math.round((occ / ward.total_beds) * 100)
                          : 0;

                      return (
                        <div key={ward.id} className="space-y-1.5">
                          <div className="flex justify-between text-xs font-semibold text-zinc-700">
                            <span>{ward.ward_type} Ward</span>
                            <span>
                              {ward.available_beds} Available ({pct}% Occupied)
                            </span>
                          </div>
                          <div className="w-full h-2.5 bg-zinc-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                pct > 85
                                  ? "bg-red-500"
                                  : pct > 60
                                  ? "bg-amber-500"
                                  : "bg-emerald-500"
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <div className="py-12 text-center text-zinc-400 text-sm">
                No analytics data available for today.
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
