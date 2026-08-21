"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  latitude: string;
  longitude: string;
  onLocationChange: (lat: string, lng: string, address?: string) => void;
}

export default function LocationPicker({ latitude, longitude, onLocationChange }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markerRef = useRef<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [geolocating, setGeolocating] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  const defaultLat = latitude ? parseFloat(latitude) : 22.5726;
  const defaultLng = longitude ? parseFloat(longitude) : 88.3639;

  // Dynamically load Leaflet CSS + JS only on client
  useEffect(() => {
    if (typeof window === "undefined") return;

    const loadLeaflet = async () => {
      // Add CSS if not already present
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      // Dynamically import Leaflet
      const L = (await import("leaflet")).default;

      // Fix default marker icon paths broken by webpack
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      if (!mapRef.current || mapInstanceRef.current) return;

      const map = L.map(mapRef.current, { zoomControl: true }).setView(
        [defaultLat, defaultLng],
        14
      );

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      const marker = L.marker([defaultLat, defaultLng], { draggable: true }).addTo(map);

      // Update coords on marker drag
      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        onLocationChange(pos.lat.toFixed(6), pos.lng.toFixed(6));
        reverseGeocode(pos.lat, pos.lng);
      });

      // Click on map to move marker
      map.on("click", (e: { latlng: { lat: number; lng: number } }) => {
        marker.setLatLng([e.latlng.lat, e.latlng.lng]);
        onLocationChange(e.latlng.lat.toFixed(6), e.latlng.lng.toFixed(6));
        reverseGeocode(e.latlng.lat, e.latlng.lng);
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;
      setMapReady(true);
    };

    loadLeaflet();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reverse geocode: lat/lng → address string using Nominatim (free)
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        { headers: { "Accept-Language": "en" } }
      );
      const data = await res.json();
      if (data.display_name) {
        onLocationChange(lat.toFixed(6), lng.toFixed(6), data.display_name);
      }
    } catch {
      // silently ignore
    }
  };

  // Forward geocode: search text → lat/lng
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !mapInstanceRef.current || !markerRef.current) return;
    setSearching(true);

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1`,
        { headers: { "Accept-Language": "en" } }
      );
      const results = await res.json();
      if (results.length > 0) {
        const { lat, lon, display_name } = results[0];
        const latN = parseFloat(lat);
        const lngN = parseFloat(lon);
        mapInstanceRef.current.setView([latN, lngN], 16);
        markerRef.current.setLatLng([latN, lngN]);
        onLocationChange(latN.toFixed(6), lngN.toFixed(6), display_name);
      }
    } catch {
      // silently ignore
    } finally {
      setSearching(false);
    }
  };

  // Use browser geolocation
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) return;
    setGeolocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.setView([lat, lng], 17);
          markerRef.current.setLatLng([lat, lng]);
        }
        onLocationChange(lat.toFixed(6), lng.toFixed(6));
        reverseGeocode(lat, lng);
        setGeolocating(false);
      },
      () => setGeolocating(false),
      { enableHighAccuracy: true }
    );
  };

  return (
    <div className="space-y-2">
      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search hospital address or area…"
          className="flex-1 px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E63946] focus:border-transparent text-sm text-zinc-900"
        />
        <button
          type="submit"
          disabled={searching || !mapReady}
          className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          {searching ? "…" : "Search"}
        </button>
      </form>

      {/* Use My Location button */}
      <button
        type="button"
        onClick={handleUseMyLocation}
        disabled={geolocating || !mapReady}
        className="flex items-center gap-2 text-xs text-[#E63946] font-semibold hover:underline disabled:opacity-50"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" />
        </svg>
        {geolocating ? "Detecting location…" : "Use my current location"}
      </button>

      {/* Map container */}
      <div className="relative rounded-xl overflow-hidden border border-zinc-300 shadow-sm">
        <div ref={mapRef} style={{ height: "260px", width: "100%" }} />
        {!mapReady && (
          <div className="absolute inset-0 bg-zinc-100 flex items-center justify-center">
            <span className="text-zinc-400 text-sm">Loading map…</span>
          </div>
        )}
      </div>

      {/* Hint */}
      <p className="text-[11px] text-zinc-400">
        📍 Click anywhere on the map or drag the marker to set the exact hospital location.
      </p>

      {/* Coordinate display (read-only) */}
      {latitude && longitude && (
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-0.5">Latitude</label>
            <div className="px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-700 font-mono">
              {latitude}
            </div>
          </div>
          <div className="flex-1">
            <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-0.5">Longitude</label>
            <div className="px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-700 font-mono">
              {longitude}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
