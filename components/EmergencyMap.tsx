"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface BedInfo {
  id: string;
  ward_type: "ICU" | "General" | "Emergency";
  total_beds: number;
  available_beds: number;
}

interface HospitalWithBeds {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  beds?: BedInfo[];
  last_verified_at?: string | null;
}

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


interface EmergencyMapProps {
  hospitals: HospitalWithBeds[];
  selectedHospitalId: string | null;
  onSelectHospital: (hospitalId: string) => void;
}

export default function EmergencyMap({
  hospitals,
  selectedHospitalId,
  onSelectHospital,
}: EmergencyMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize Leaflet map if not already created
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [22.54, 88.37], // Centered over Kolkata
        zoom: 12,
        scrollWheelZoom: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear existing markers
    Object.values(markersRef.current).forEach((marker) => marker.remove());
    markersRef.current = {};

    // Create custom SVG pins for Leaflet
    const createCustomIcon = (isSelected: boolean, totalAvailable: number) => {
      const bg = totalAvailable > 0 ? (isSelected ? "#E63946" : "#2A9D8F") : "#71717A";
      const svg = `
        <svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 0C7.16344 0 0 7.16344 0 16C0 28 16 40 16 40C16 40 32 28 32 16C32 7.16344 24.8366 0 16 0Z" fill="${bg}"/>
          <circle cx="16" cy="16" r="8" fill="white"/>
          <text x="16" y="20" font-size="11" font-weight="bold" fill="${bg}" text-anchor="middle">${totalAvailable}</text>
        </svg>
      `;

      return L.divIcon({
        className: "custom-leaflet-marker",
        html: svg,
        iconSize: [32, 40],
        iconAnchor: [16, 40],
        popupAnchor: [0, -36],
      });
    };

    // Add markers for hospitals
    hospitals.forEach((h) => {
      if (!h.latitude || !h.longitude) return;

      const beds = h.beds || [];
      const icu = beds.find((b) => b.ward_type === "ICU")?.available_beds ?? 0;
      const gen = beds.find((b) => b.ward_type === "General")?.available_beds ?? 0;
      const emg = beds.find((b) => b.ward_type === "Emergency")?.available_beds ?? 0;
      const totalAvail = icu + gen + emg;
      const isSelected = h.id === selectedHospitalId;

      const icon = createCustomIcon(isSelected, totalAvail);
      const marker = L.marker([h.latitude, h.longitude], { icon }).addTo(map);

      const verifiedText = formatVerifiedTime(h.last_verified_at, beds);

      // Popup Content
      const popupHtml = `
        <div style="font-family: sans-serif; padding: 4px; max-width: 240px;">
          <h4 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 700; color: #18181B;">${h.name}</h4>
          <p style="margin: 0 0 4px 0; font-size: 11px; color: #71717A;">${h.address}</p>
          <div style="font-size: 10px; color: #E63946; font-weight: 600; margin-bottom: 6px;">
            ${verifiedText}
          </div>
          <div style="display: flex; gap: 4px; margin-bottom: 8px;">
            <span style="background: #FEF2F2; color: #991B1B; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700;">ICU: ${icu}</span>
            <span style="background: #F0FDF4; color: #166534; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700;">Gen: ${gen}</span>
            <span style="background: #EFF6FF; color: #1E40AF; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700;">Emg: ${emg}</span>
          </div>
          <a href="https://maps.google.com/?q=${h.latitude},${h.longitude}" target="_blank" rel="noopener noreferrer" style="display: block; text-align: center; background: #E63946; color: white; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; text-decoration: none;">
            Get Directions →
          </a>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on("click", () => {
        onSelectHospital(h.id);
      });

      markersRef.current[h.id] = marker;
    });

    // Pan to selected hospital marker
    if (selectedHospitalId && markersRef.current[selectedHospitalId]) {
      const selectedMarker = markersRef.current[selectedHospitalId];
      const latLng = selectedMarker.getLatLng();
      map.setView(latLng, 14, { animate: true });
      selectedMarker.openPopup();
    }
  }, [hospitals, selectedHospitalId, onSelectHospital]);

  return (
    <div
      ref={mapContainerRef}
      className="w-full h-full min-h-[400px] rounded-xl border border-zinc-200 shadow-sm z-0 overflow-hidden"
    />
  );
}
