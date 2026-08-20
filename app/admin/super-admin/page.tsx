"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import {
  CheckCircle2 as CheckIcon,
  XCircle as XIcon,
  Building2 as BuildingIcon,
  ArrowLeft as BackIcon,
  RefreshCw as RefreshIcon,
  ShieldCheck as ShieldIcon,
} from "lucide-react";

interface PendingHospital {
  id: string;
  name: string;
  address: string;
  status: string;
  license_number: string;
  contact_info: string;
  latitude: number;
  longitude: number;
}

export default function SuperAdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [hospitals, setHospitals] = useState<PendingHospital[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchPending = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/verify-hospital");
      if (res.status === 403) {
        router.push("/admin/dashboard");
        return;
      }
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to load pending hospitals");
      } else {
        setHospitals(json.hospitals || []);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    async function init() {
      const u = await getCurrentUser();
      if (!u) { router.push("/login"); return; }
      if (u.role !== "super_admin") { router.push("/admin/dashboard"); return; }
      fetchPending();
    }
    init();
  }, [router, fetchPending]);

  const handleAction = async (hospitalId: string, action: "approve" | "reject") => {
    setActionInProgress(hospitalId + action);
    setSuccessMsg(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/verify-hospital", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hospitalId, action }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Action failed");
      } else {
        const h = json.hospital;
        setSuccessMsg(
          `${h.name} has been ${action === "approve" ? "approved ✅" : "rejected ❌"}.`
        );
        setHospitals((prev) => prev.filter((x) => x.id !== hospitalId));
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setActionInProgress(null);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/dashboard" className="text-zinc-500 hover:text-zinc-900 transition-colors">
            <BackIcon className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <ShieldIcon className="w-5 h-5 text-[#E63946]" />
            <h1 className="text-lg font-bold text-zinc-900">
              Super Admin — Hospital Verification
            </h1>
          </div>
        </div>
        <button
          onClick={fetchPending}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          <RefreshIcon className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {/* Success message */}
        {successMsg && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-700 font-medium">
            {successMsg}
          </div>
        )}
        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-[#E63946]">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-20 text-zinc-400 text-sm">Loading pending hospitals…</div>
        ) : hospitals.length === 0 ? (
          <div className="text-center py-20">
            <CheckIcon className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <p className="text-zinc-600 font-semibold text-sm">No pending hospital registrations.</p>
            <p className="text-zinc-400 text-xs mt-1">All registrations have been reviewed.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-zinc-500 mb-2">
              {hospitals.length} hospital{hospitals.length !== 1 ? "s" : ""} awaiting verification
            </p>
            {hospitals.map((h) => (
              <div key={h.id} className="bg-white rounded-xl border border-zinc-200 shadow-xs p-5">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center flex-shrink-0">
                    <BuildingIcon className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-bold text-zinc-900 text-sm">{h.name}</h2>
                    <p className="text-xs text-zinc-500 mt-0.5 truncate">{h.address || "No address provided"}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                    Pending
                  </span>
                </div>

                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mb-5">
                  <div>
                    <dt className="text-zinc-400 font-semibold uppercase tracking-wider text-[10px] mb-0.5">License / Reg. Number</dt>
                    <dd className="text-zinc-900 font-mono font-semibold">
                      {h.license_number || <span className="text-zinc-400 italic">Not provided</span>}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-zinc-400 font-semibold uppercase tracking-wider text-[10px] mb-0.5">Contact Info</dt>
                    <dd className="text-zinc-900">
                      {h.contact_info || <span className="text-zinc-400 italic">Not provided</span>}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-zinc-400 font-semibold uppercase tracking-wider text-[10px] mb-0.5">Coordinates</dt>
                    <dd className="text-zinc-600">
                      {h.latitude || h.longitude
                        ? `${h.latitude}, ${h.longitude}`
                        : <span className="text-zinc-400 italic">Not provided</span>}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-zinc-400 font-semibold uppercase tracking-wider text-[10px] mb-0.5">Hospital ID</dt>
                    <dd className="text-zinc-400 font-mono text-[10px] truncate">{h.id}</dd>
                  </div>
                </dl>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleAction(h.id, "approve")}
                    disabled={actionInProgress !== null}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                  >
                    <CheckIcon className="w-3.5 h-3.5" />
                    {actionInProgress === h.id + "approve" ? "Approving…" : "Approve"}
                  </button>
                  <button
                    onClick={() => handleAction(h.id, "reject")}
                    disabled={actionInProgress !== null}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-white hover:bg-red-50 border border-red-200 text-[#E63946] text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                  >
                    <XIcon className="w-3.5 h-3.5" />
                    {actionInProgress === h.id + "reject" ? "Rejecting…" : "Reject"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
