/**
 * Pure functions for emergency bed ranking and recommendation.
 */

export interface BedInfo {
  id: string;
  ward_type: "ICU" | "General" | "Emergency";
  total_beds: number;
  available_beds: number;
  updated_at: string;
}

export interface HospitalWithBeds {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  beds: BedInfo[];
  last_verified_at?: string | null;
}

export interface RankedHospital extends HospitalWithBeds {
  distanceKm: number;
  score: number;
  matchType: "exact" | "partial" | "none";
}

/**
 * Calculates the Haversine distance in kilometers between two points.
 */
export function getHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculates the composite score for a single hospital.
 * Returns null if the hospital is excluded (e.g. >15km away or 0 total beds of requested type).
 */
export function calculateHospitalScore(
  hospital: HospitalWithBeds,
  patientLat: number,
  patientLng: number,
  requestedWard: "ICU" | "General" | "Emergency"
): { score: number; distanceKm: number; matchType: "exact" | "partial" | "none" } | null {
  const distanceKm = getHaversineDistance(
    patientLat,
    patientLng,
    hospital.latitude,
    hospital.longitude
  );

  // Constraint 1: Only hospitals within a 15km radius
  if (distanceKm > 15) {
    return null;
  }

  const targetBed = hospital.beds.find((b) => b.ward_type === requestedWard);

  // Constraint 2: Exclude hospitals with 0 total beds of the requested type entirely
  if (!targetBed || targetBed.total_beds <= 0) {
    return null;
  }

  // Cap distance_km at a minimum of 0.1km to prevent division by zero or giant outlier scores
  const cappedDistance = Math.max(distanceKm, 0.1);
  const distanceScore = 1 / cappedDistance;

  const bedRatio = targetBed.available_beds / targetBed.total_beds;

  // Determine ward_type_match
  let wardTypeMatch = 0;
  let matchType: "exact" | "partial" | "none" = "none";

  if (targetBed.available_beds > 0) {
    wardTypeMatch = 1.0;
    matchType = "exact";
  } else {
    // Check if other ward types have availability
    const otherAvailable = hospital.beds.some(
      (b) => b.ward_type !== requestedWard && b.available_beds > 0
    );
    if (otherAvailable) {
      wardTypeMatch = 0.5;
      matchType = "partial";
    } else {
      wardTypeMatch = 0.0;
      matchType = "none";
    }
  }

  // Score formula: (0.4 * (1 / distance_km)) + (0.4 * bed_ratio) + (0.2 * ward_type_match)
  const score = 0.4 * distanceScore + 0.4 * bedRatio + 0.2 * wardTypeMatch;

  return { score, distanceKm, matchType };
}

/**
 * Returns a list of eligible hospitals ranked by their recommendation score (highest first).
 */
export function rankHospitals(
  hospitals: HospitalWithBeds[],
  patientLat: number,
  patientLng: number,
  requestedWard: "ICU" | "General" | "Emergency"
): RankedHospital[] {
  const ranked: RankedHospital[] = [];

  for (const h of hospitals) {
    const result = calculateHospitalScore(h, patientLat, patientLng, requestedWard);
    if (result !== null) {
      ranked.push({
        ...h,
        distanceKm: result.distanceKm,
        score: result.score,
        matchType: result.matchType,
      });
    }
  }

  return ranked.sort((a, b) => b.score - a.score);
}
