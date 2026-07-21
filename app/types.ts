// ── Providers ───────────────────────────────────────────────────────

export type Provider = 'lime' | 'voi' | 'dott' | 'velib';

export const ALL_PROVIDERS: Provider[] = ['lime', 'voi', 'dott', 'velib'];

export const PROVIDER_COLORS: Record<Provider, string> = {
  lime: '#00de00',
  voi: '#f44336',
  dott: '#f5a623',
  velib: '#6b3fa0',
};

// ── GBFS types ──────────────────────────────────────────────────────

// Battery is pre-computed server-side (back/index.js parseBike + computeBattery).
// Only 4 fields are sent per bike — everything else is derived or added client-side.
export interface GbfsResponse {
  data: { bikes: GbfsBike[] };
}

export interface GbfsBike {
  bike_id: string;
  lat: number;
  lon: number;
  battery_percent: number | null;
}

// ── App bike (enriched) ─────────────────────────────────────────────

export interface Bike {
  kind: 'bike';
  bike_id: string;
  lat: number;
  lon: number;
  battery_percent: number | null;
  distance?: number;
  provider: Provider;
}

// ── Vélib station (enriched) ────────────────────────────────────────

export interface VelibStation {
  kind: 'station';
  station_id: string;
  lat: number;
  lon: number;
  num_bikes_available: number;
  mechanical: number;
  ebike: number;
  num_docks_available: number;
  is_renting?: number;
  distance?: number;
  provider: 'velib';
}

// ── Map entity (discriminated union) ───────────────────────────────

export type MapEntity = Bike | VelibStation;

// ── Profile / Filters ───────────────────────────────────────────────

/** -1 = not set / unlimited */
export const UNSET = -1;

export const FILTER_BOUNDS = {
  limit: { min: 5, max: 100, step: 5, default: 100 },
  maxDistance: { min: UNSET, max: 10_000, step: 100, default: UNSET },
  minBattery: { min: UNSET, max: 100, step: 5, default: UNSET },
  pollInterval: { min: 15, max: 300, step: 15, default: 60 },
} as const;

export type LocationMode = 'geo' | 'manual';

export interface ProfileState {
  lat: number | null;
  lng: number | null;
  locationMode: LocationMode;
  providers: Provider[];
  limit: number;
  maxDistance: number;
  minBattery: number;
  pollInterval: number;
}

export function createDefaultState(): ProfileState {
  return {
    lat: null,
    lng: null,
    locationMode: 'geo',
    providers: [...ALL_PROVIDERS],
    limit: FILTER_BOUNDS.limit.default,
    maxDistance: FILTER_BOUNDS.maxDistance.default,
    minBattery: FILTER_BOUNDS.minBattery.default,
    pollInterval: FILTER_BOUNDS.pollInterval.default,
  };
}

// ── Other types ─────────────────────────────────────────────────────

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}
