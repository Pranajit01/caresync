"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { getCurrentUser } from "@/lib/auth";
import DynamicEmergencyMap from "@/components/DynamicEmergencyMap";
import {
  ArrowLeft as ArrowLeftIcon,
  Navigation as NavigationIcon,
  Search as SearchIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
  Building2 as BuildingIcon,
  RefreshCw as RefreshCwIcon,
  PhoneCall as PhoneIcon,
  AlertTriangle as AlertIcon,
} from "lucide-react";

interface BedInfo {
  id: string;
  ward_type: "ICU" | "General" | "Emergency";
  total_beds: number;
  available_beds: number;
  updated_at: string;
}

interface HospitalWithBeds {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  beds: BedInfo[];
}

export default function EmergencyBedFinderPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [hospitals, setHospitals] = useState<HospitalWithBeds[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedHospitalId, setSelectedHospitalId] = useState<string | null>(null);
  const [filterWard, setFilterWard] = useState<"All" | "ICU" | "General" | "Emergency">("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [realtimeConnected, setRealtimeConnected] = useState(false);

  // Channel ref for cleanup
  const bedChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Authenticate patient
  useEffect(() => {
    getCurrentUser().then((u) => {
      if (!u) {
        router.push("/login");
        return;
      }
      setUser(u);
    });
  }, [router]);

  // Fetch hospital bed inventory
  const fetchEmergencyBeds = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/hospitals/emergency-beds");
      const json = await res.json();
      if (res.ok) {
        setHospitals(json.hospitals || []);
        if (json.hospitals?.length > 0 && !selectedHospitalId) {
          setSelectedHospitalId(json.hospitals[0].id);
        }
      } else {
        setError(json.error || "Failed to load bed inventory.");
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmergencyBeds();
  }, []);

  // Supabase Realtime subscription on `beds` table
  // Per PRD & TRD: Live bed count changes from hospital admin reflect instantly on patient finder screen!
  useEffect(() => {
    const channel = supabase
      .channel("patient_emergency_beds")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "beds",
        },
        (payload) => {
          const updatedBed = payload.new as BedInfo;
          if (updatedBed && updatedBed.id) {
            setHospitals((prev) =>
              prev.map((h) => ({
                ...h,
                beds: h.beds.map((b) =>
                  b.id === updatedBed.id ? { ...b, ...updatedBed } : b
                ),
              }))
            );
          }
        }
      )
      .subscribe((status) => {
        setRealtimeConnected(status === "SUBSCRIBED");
      });

    bedChannelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Filtered & searched hospital list
  const filteredHospitals = hospitals.filter((h) => {
    const matchesSearch =
      h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.address.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterWard === "All") return true;

    const wardBed = h.beds.find((b) => b.ward_type === filterWard);
    return wardBed && wardBed.available_beds > 0;
  });

  // Calculate total emergency network beds
  const totalNetworkAvailable = hospitals.reduce((sum, h) => {
    const availInHosp = h.beds.reduce((s, b) => s + (b.available_beds || 0), 0);
    return sum + availInHosp;
  }, 0);

  const totalIcuAvailable = hospitals.reduce((sum, h) => {
    const icu = h.beds.find((b) => b.ward_type === "ICU");
    return sum + (icu?.available_beds || 0);
  }, 0);

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
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
          <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-[#E63946]">
            Emergency Bed Finder
          </span>
        </div>

        {/* Realtime Connection status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-medium">
            {realtimeConnected ? (
              <>
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse inline-block" />
                <span className="text-emerald-700 hidden sm:inline">Live Sync</span>
                <WifiIcon className="w-4 h-4 text-emerald-600" />
              </>
            ) : (
              <>
                <span className="w-2 h-2 bg-zinc-400 rounded-full inline-block" />
                <WifiOffIcon className="w-4 h-4 text-zinc-400" />
              </>
            )}
          </div>
          <button
            onClick={fetchEmergencyBeds}
            className="p-2 text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
            title="Refresh Bed Data"
          >
            <RefreshCwIcon className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 space-y-5 flex-1 flex flex-col">
        {/* Banner Summary */}
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-50 text-[#E63946] rounded-xl shrink-0">
              <AlertIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900">
                Kolkata Emergency Bed Network
              </h2>
              <p className="text-xs text-zinc-500">
                Real-time bed availability across 5 major hospitals in Kolkata.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs shrink-0">
            <div className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg text-center">
              <span className="text-emerald-800 font-bold block text-sm">
                {totalNetworkAvailable}
              </span>
              <span className="text-emerald-600 text-[10px] font-medium uppercase">
                Total Beds Free
              </span>
            </div>

            <div className="bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg text-center">
              <span className="text-red-800 font-bold block text-sm">
                {totalIcuAvailable}
              </span>
              <span className="text-red-600 text-[10px] font-medium uppercase">
                ICU Beds Free
              </span>
            </div>
          </div>
        </div>

        {/* Controls: Search + Ward Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-zinc-200 shadow-sm">
          {/* Search bar */}
          <div className="relative flex-1">
            <SearchIcon className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search hospital by name or location (Salt Lake, Minto Park...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E63946]"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {(["All", "ICU", "General", "Emergency"] as const).map((w) => (
              <button
                key={w}
                onClick={() => setFilterWard(w)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                  filterWard === w
                    ? "bg-[#E63946] text-white shadow-sm"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                }`}
              >
                {w === "All" ? "All Wards" : `${w} Available`}
              </button>
            ))}
          </div>
        </div>

        {/* Content Layout: 2 Columns on Desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-[500px]">
          {/* Left Column: Hospital List Cards */}
          <div className="lg:col-span-5 space-y-3 overflow-y-auto max-h-[680px] pr-1">
            {loading ? (
              <div className="py-16 text-center text-zinc-400 text-sm animate-pulse">
                Fetching live hospital bed availability...
              </div>
            ) : error ? (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertIcon className="w-4 h-4 shrink-0 text-red-700" />
                <span>{error}</span>
              </div>
            ) : filteredHospitals.length === 0 ? (
              <div className="py-16 text-center bg-white rounded-xl border border-zinc-200 p-6">
                <p className="text-sm font-semibold text-zinc-700">
                  No hospitals matching filter.
                </p>
                <p className="text-xs text-zinc-400 mt-1">
                  Try clearing the ward filter or search term.
                </p>
              </div>
            ) : (
              filteredHospitals.map((h) => {
                const isSelected = h.id === selectedHospitalId;
                const icu = h.beds.find((b) => b.ward_type === "ICU")?.available_beds ?? 0;
                const gen = h.beds.find((b) => b.ward_type === "General")?.available_beds ?? 0;
                const emg = h.beds.find((b) => b.ward_type === "Emergency")?.available_beds ?? 0;
                const totalAvail = icu + gen + emg;

                return (
                  <div
                    key={h.id}
                    onClick={() => setSelectedHospitalId(h.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer bg-white space-y-3 ${
                      isSelected
                        ? "border-[#E63946] ring-2 ring-red-100 shadow-md"
                        : "border-zinc-200 hover:border-zinc-300 shadow-sm"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5">
                        <div className="p-2 bg-red-50 text-[#E63946] rounded-lg shrink-0 mt-0.5">
                          <BuildingIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="font-bold text-zinc-900 text-sm leading-snug">
                            {h.name}
                          </h3>
                          <p className="text-xs text-zinc-500 mt-0.5">{h.address}</p>
                        </div>
                      </div>

                      <span
                        className={`px-2.5 py-1 text-xs font-black rounded-lg shrink-0 ${
                          totalAvail > 0
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-zinc-100 text-zinc-400"
                        }`}
                      >
                        {totalAvail} Free
                      </span>
                    </div>

                    {/* Ward Pill Badges */}
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="bg-red-50/70 border border-red-100 rounded-lg py-1.5">
                        <span className="block text-[10px] text-red-500 font-bold uppercase">
                          ICU
                        </span>
                        <span className="block font-black text-red-700 text-sm">
                          {icu}
                        </span>
                      </div>

                      <div className="bg-emerald-50/70 border border-emerald-100 rounded-lg py-1.5">
                        <span className="block text-[10px] text-emerald-600 font-bold uppercase">
                          General
                        </span>
                        <span className="block font-black text-emerald-800 text-sm">
                          {gen}
                        </span>
                      </div>

                      <div className="bg-blue-50/70 border border-blue-100 rounded-lg py-1.5">
                        <span className="block text-[10px] text-blue-500 font-bold uppercase">
                          Emergency
                        </span>
                        <span className="block font-black text-blue-800 text-sm">
                          {emg}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-1 text-xs">
                      <a
                        href={`https://maps.google.com/?q=${h.latitude},${h.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 font-bold text-[#E63946] hover:underline"
                      >
                        <NavigationIcon className="w-3.5 h-3.5" />
                        Get Directions →
                      </a>

                      <span className="text-[11px] text-zinc-400 font-medium">
                        24x7 Helpline
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column: OpenStreetMap Leaflet Map */}
          <div className="lg:col-span-7 h-full min-h-[450px]">
            <DynamicEmergencyMap
              hospitals={filteredHospitals}
              selectedHospitalId={selectedHospitalId}
              onSelectHospital={(id) => setSelectedHospitalId(id)}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
