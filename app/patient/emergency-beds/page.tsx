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
  Sparkles as SparklesIcon,
  AlertCircle as AlertCircleIcon,
} from "lucide-react";
import { rankHospitals, getHaversineDistance, HospitalWithBeds } from "@/lib/bedFinderRanking";

const DEFAULT_KOLKATA_LOCATION = { latitude: 22.54, longitude: 88.37 };

function formatVerifiedTime(lastVerifiedAt: string | null | undefined, beds: any[] = []) {
  const dateStr = lastVerifiedAt || (beds.length > 0 ? beds.reduce((max, b) => b.updated_at > max ? b.updated_at : max, beds[0].updated_at) : null);
  if (!dateStr) return "Verified recently";
  
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffMins = Math.max(0, Math.floor(diffMs / 60000));
  
  if (diffMins < 1) return "Verified <1 min ago";
  if (diffMins < 60) return `Verified ${diffMins} min ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `Verified ${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `Verified ${diffDays}d ago`;
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

  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locating, setLocating] = useState(false);

  // PWA/Offline state
  const [cachedTime, setCachedTime] = useState<number | null>(null);
  const [offlineAgeText, setOfflineAgeText] = useState<string>("");
  const [reconnectDelay, setReconnectDelay] = useState<number>(2000);
  const [reconnectTrigger, setReconnectTrigger] = useState(0);

  // Channel ref for cleanup
  const bedChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Initialize: Attempt to restore safe state from localStorage cache
  useEffect(() => {
    const cacheKey = "caresync:beds";
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setCachedTime(parsed.timestamp);
        setHospitals(parsed.hospitals || []);
        if (parsed.hospitals?.length > 0 && !selectedHospitalId) {
          setSelectedHospitalId(parsed.hospitals[0].id);
        }
        setLoading(false);
      } catch (e) {
        console.error("[cache] Failed to restore beds state:", e);
      }
    }
  }, []);

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

  // Request patient geolocation on mount
  useEffect(() => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLocating(false);
      },
      (err) => {
        console.warn("Geolocation failed, defaulting to Kolkata Center:", err.message);
        setLocating(false);
      },
      { timeout: 8000 }
    );
  }, []);

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
        // If we have cached data, don't show full page error
        if (!localStorage.getItem("caresync:beds")) {
          setError(json.error || "Failed to load bed inventory.");
        }
      }
    } catch (e: any) {
      console.error("Fetch beds network error:", e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmergencyBeds();
  }, []);

  // Update localStorage cache when hospitals change
  // Caches only safe metrics (bed counts, names). No patient-sensitive details.
  useEffect(() => {
    if (hospitals.length === 0) return;
    const cacheKey = "caresync:beds";
    const payload = {
      hospitals: hospitals.map(h => ({
        id: h.id,
        name: h.name,
        address: h.address,
        latitude: h.latitude,
        longitude: h.longitude,
        beds: h.beds,
        last_verified_at: h.last_verified_at,
      })),
      timestamp: Date.now()
    };
    localStorage.setItem(cacheKey, JSON.stringify(payload));
    setCachedTime(payload.timestamp);
  }, [hospitals]);

  // Keep calculating cached data age
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

  // Supabase Realtime subscription on `beds` table with Exponential Reconnection
  useEffect(() => {
    let active = true;
    let reconnectTimeout: ReturnType<typeof setTimeout>;

    const handleReconnect = () => {
      if (!active) return;
      console.log(`[realtime-beds] Reconnecting in ${reconnectDelay}ms...`);
      reconnectTimeout = setTimeout(() => {
        setReconnectTrigger((prev) => prev + 1);
        setReconnectDelay((prev) => Math.min(prev * 2, 30000));
      }, reconnectDelay);
    };

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
          const updatedBed = payload.new as any;
          if (updatedBed && updatedBed.id) {
            setHospitals((prev) =>
              prev.map((h) => ({
                ...h,
                beds: h.beds.map((b) =>
                  b.id === updatedBed.id ? { ...b, ...updatedBed } : b
                ),
              }))
            );
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

    bedChannelRef.current = channel;

    return () => {
      active = false;
      clearTimeout(reconnectTimeout);
      supabase.removeChannel(channel);
    };
  }, [reconnectTrigger]);

  const activeLocation = userLocation || DEFAULT_KOLKATA_LOCATION;

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

  // Keep distance-based sorting for the general list
  const sortedGeneralHospitals = [...filteredHospitals]
    .map((h) => {
      const distance = getHaversineDistance(
        activeLocation.latitude,
        activeLocation.longitude,
        h.latitude,
        h.longitude
      );
      return { ...h, distanceKm: distance };
    })
    .sort((a, b) => a.distanceKm - b.distanceKm);

  // Recommendations ranking: top 1-2 hospitals
  const requestedWardForRecommendation = filterWard === "All" ? "Emergency" : filterWard;
  const recommendations = rankHospitals(
    hospitals,
    activeLocation.latitude,
    activeLocation.longitude,
    requestedWardForRecommendation
  ).slice(0, 2);

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

      {/* ===== OFFLINE / RECONNECTING BANNER ===== */}
      {!realtimeConnected && cachedTime !== null && (
        <div className="bg-amber-500 text-white text-xs font-bold text-center py-2.5 px-4 flex items-center justify-center gap-2 animate-pulse sticky top-[61px] z-20">
          <AlertCircleIcon className="w-4 h-4 shrink-0" />
          <span>Showing last known data from {offlineAgeText} — reconnecting...</span>
        </div>
      )}

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
            ) : sortedGeneralHospitals.length === 0 ? (
              <div className="py-16 text-center bg-white rounded-xl border border-zinc-200 p-6">
                <p className="text-sm font-semibold text-zinc-700">
                  No hospitals matching filter.
                </p>
                <p className="text-xs text-zinc-400 mt-1">
                  Try clearing the ward filter or search term.
                </p>
              </div>
            ) : (
              sortedGeneralHospitals.map((h) => {
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
                          <span className="text-[11px] font-semibold text-zinc-500 block mt-1">
                            {h.distanceKm.toFixed(1)} km away
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span
                          className={`px-2.5 py-1 text-xs font-black rounded-lg ${
                            totalAvail > 0
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-zinc-100 text-zinc-400"
                          }`}
                        >
                          {totalAvail} Free
                        </span>
                        <span className="text-[10px] text-zinc-400 font-semibold bg-zinc-50 border border-zinc-200 px-1.5 py-0.5 rounded-md whitespace-nowrap">
                          {formatVerifiedTime(h.last_verified_at, h.beds)}
                        </span>
                      </div>
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

          {/* Right Column: Recommendation Banner + OpenStreetMap Leaflet Map */}
          <div className="lg:col-span-7 flex flex-col min-h-[450px]">
            {recommendations.length > 0 && (
              <div className="bg-gradient-to-r from-red-500/10 to-rose-500/10 border border-red-200/50 rounded-xl p-4 mb-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <SparklesIcon className="w-5 h-5 text-[#E63946] animate-pulse" />
                    <h3 className="text-sm font-bold text-zinc-900">
                      Best Options For You ({requestedWardForRecommendation} Ward)
                    </h3>
                  </div>
                  <span className="text-[10px] bg-red-100 text-[#E63946] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Recommended
                  </span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {recommendations.map((rec) => {
                    const targetBed = rec.beds.find((b) => b.ward_type === requestedWardForRecommendation);
                    const openBeds = targetBed?.available_beds ?? 0;
                    
                    return (
                      <div
                        key={rec.id}
                        onClick={() => setSelectedHospitalId(rec.id)}
                        className={`p-3 rounded-lg border transition-all cursor-pointer bg-white/80 hover:bg-white flex flex-col justify-between ${
                          rec.id === selectedHospitalId
                            ? "border-[#E63946] ring-1 ring-red-100 shadow-sm"
                            : "border-zinc-200 hover:border-zinc-300"
                        }`}
                      >
                        <div>
                          <h4 className="font-bold text-xs text-zinc-900 line-clamp-1">{rec.name}</h4>
                          <p className="text-[11px] text-zinc-500 line-clamp-1 mt-0.5">{rec.address}</p>
                        </div>
                        
                        <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-zinc-100">
                          <span className="text-[11px] text-zinc-600 font-medium">
                            {rec.distanceKm.toFixed(1)} km away &bull; {openBeds} {requestedWardForRecommendation} {openBeds === 1 ? "bed" : "beds"} open
                          </span>
                          <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                            Score: {rec.score.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex-1 min-h-[400px]">
              <DynamicEmergencyMap
                hospitals={sortedGeneralHospitals}
                selectedHospitalId={selectedHospitalId}
                onSelectHospital={(id) => setSelectedHospitalId(id)}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
