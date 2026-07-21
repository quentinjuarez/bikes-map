// GBFS + Vélib parsing shared by the server API routes.
// Ported from the old Express proxy (back/index.js). Now runs same-origin as
// the app, so no CORS layer is needed — Nitro caching replaces Redis.

export type Provider = 'lime' | 'voi' | 'dott';

export const FREE_BIKE_URLS: Record<Provider, string> = {
  lime: 'https://data.lime.bike/api/partners/v2/gbfs/paris/free_bike_status',
  voi: 'https://api.voiapp.io/gbfs/fr/6bb6b5dc-1cda-4da7-9216-d3023a0bc54a/v2/352/free_bike_status.json',
  dott: 'https://gbfs.api.ridedott.com/public/v2/paris/free_bike_status.json',
};

export const VELIB_BASE =
  'https://velib-metropole-opendata.smovengo.cloud/opendata/Velib_Metropole';

// Max range per vehicle_type_id (metres) — used to derive battery % when the
// provider only gives current_range_meters instead of current_fuel_percent.
const MAX_RANGE: Record<string | number, number> = {
  // Lime
  1: 24140,
  2: 40233,
  3: 85000,
  // Voi
  voi_scooter: 80000,
  voi_bike: 80000,
  // Dott
  dott_bicycle: 100000,
};

interface RawBike {
  bike_id: string;
  lat: number | string;
  lon: number | string;
  current_fuel_percent?: number | null;
  current_range_meters?: number | null;
  vehicle_type_id?: string | number;
}

export interface ParsedBike {
  bike_id: string;
  lat: number;
  lon: number;
  battery_percent: number | null;
}

/** Compute 0–100 integer battery percent from raw GBFS fields; null if unknown. */
function computeBattery(b: RawBike): number | null {
  if (b.current_fuel_percent != null) {
    return Math.min(100, Math.round(Number(b.current_fuel_percent) * 100));
  }
  const maxRange = b.vehicle_type_id ? MAX_RANGE[b.vehicle_type_id] : undefined;
  if (b.current_range_meters != null && maxRange) {
    return Math.min(100, Math.round((Number(b.current_range_meters) / maxRange) * 100));
  }
  return null;
}

/** Strip a raw GBFS bike to the 4 fields the frontend uses; null if coords invalid. */
export function parseBike(b: RawBike): ParsedBike | null {
  const lat = Number(b.lat);
  const lon = Number(b.lon);
  if (isNaN(lat) || isNaN(lon)) return null;
  return { bike_id: b.bike_id, lat, lon, battery_percent: computeBattery(b) };
}

export interface ParsedStation {
  station_id: string;
  lat: number;
  lon: number;
  num_bikes_available: number;
  mechanical: number;
  ebike: number;
  num_docks_available: number;
  is_renting?: number;
}

interface RawInfo {
  data?: { stations?: Array<{ station_id: string | number; lat: number; lon: number }> };
}
interface RawStatus {
  data?: {
    stations?: Array<{
      station_id: string | number;
      num_bikes_available?: number;
      numBikesAvailable?: number;
      num_docks_available?: number;
      numDocksAvailable?: number;
      is_renting?: number;
      num_bikes_available_types?: Array<{ mechanical?: number; ebike?: number }>;
    }>;
  };
}

/** Merge Vélib station_information + station_status into the frontend shape. */
export function parseVelibStations(infoData: RawInfo, statusData: RawStatus): ParsedStation[] {
  const infoMap = new Map<string, { lat: number; lon: number }>();
  for (const s of infoData?.data?.stations ?? []) {
    infoMap.set(String(s.station_id), { lat: Number(s.lat), lon: Number(s.lon) });
  }

  const stations: ParsedStation[] = [];
  for (const s of statusData?.data?.stations ?? []) {
    const info = infoMap.get(String(s.station_id));
    if (!info) continue;
    if (isNaN(info.lat) || isNaN(info.lon)) continue;
    const types = s.num_bikes_available_types ?? [];
    stations.push({
      station_id: String(s.station_id),
      lat: info.lat,
      lon: info.lon,
      num_bikes_available: s.num_bikes_available ?? s.numBikesAvailable ?? 0,
      mechanical: types.find((t) => t.mechanical != null)?.mechanical ?? 0,
      ebike: types.find((t) => t.ebike != null)?.ebike ?? 0,
      num_docks_available: s.num_docks_available ?? s.numDocksAvailable ?? 0,
      is_renting: s.is_renting,
    });
  }
  return stations;
}
