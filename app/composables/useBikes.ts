import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';

import { useProfileStore } from '../stores/profile';
import {
  type Bike,
  type GbfsBike,
  type GbfsResponse,
  type VelibStation,
  type MapEntity,
  type Provider,
  UNSET,
} from '../types';

interface RawVelibStation {
  station_id: string;
  lat: number;
  lon: number;
  num_bikes_available: number;
  mechanical: number;
  ebike: number;
  num_docks_available: number;
  is_renting?: number;
}

// Re-export for convenience
export type { Bike, VelibStation, MapEntity, Provider } from '../types';

export function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3;
  const toRad = (n: number) => (n * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const PARIS = { lat: 48.8566, lng: 2.3522 };

export function useBikes(opts?: { proxyBase?: string }) {
  const store = useProfileStore();
  const bikes = ref<MapEntity[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const nextRefresh = ref(0);

  // Same-origin Nitro API. Callers pass nothing; overridable for tests.
  const proxyBase = opts?.proxyBase ?? '/api';

  let fetchTimer: ReturnType<typeof setTimeout> | null = null;
  let countdownTimer: ReturnType<typeof setInterval> | null = null;

  // ── Fetch helpers ────────────────────────────────────────────────────

  async function fetchProvider(
    provider: Provider,
    userLat: number,
    userLng: number,
  ): Promise<Bike[]> {
    const res = await fetch(`${proxyBase}/${provider}/free_bike_status`);
    if (!res.ok) throw new Error(`${provider} fetch failed: ${res.status}`);
    const json = (await res.json()) as GbfsResponse;

    return (json.data?.bikes || []).map((b: GbfsBike) => {
      const distance = haversineDistance(userLat, userLng, b.lat, b.lon);
      return {
        kind: 'bike',
        bike_id: b.bike_id,
        lat: b.lat,
        lon: b.lon,
        battery_percent: b.battery_percent,
        distance,
        provider,
      } satisfies Bike;
    });
  }

  async function fetchVelib(userLat: number, userLng: number): Promise<VelibStation[]> {
    const res = await fetch(`${proxyBase}/velib/stations`);
    if (!res.ok) throw new Error(`velib fetch failed: ${res.status}`);
    const json = (await res.json()) as { stations: RawVelibStation[] };

    return (json.stations || []).map((s: RawVelibStation) => {
      const distance = haversineDistance(userLat, userLng, s.lat, s.lon);
      return {
        kind: 'station',
        station_id: s.station_id,
        lat: s.lat,
        lon: s.lon,
        num_bikes_available: s.num_bikes_available,
        mechanical: s.mechanical,
        ebike: s.ebike,
        num_docks_available: s.num_docks_available,
        is_renting: s.is_renting,
        distance,
        provider: 'velib' as const,
      } satisfies VelibStation;
    });
  }

  // ── Core fetch ───────────────────────────────────────────────────────

  async function fetchOnce() {
    const userLat = store.lat ?? PARIS.lat;
    const userLng = store.lng ?? PARIS.lng;

    loading.value = true;
    error.value = null;
    try {
      const bikeProviders = store.providers.filter((p) => p !== 'velib') as Exclude<
        Provider,
        'velib'
      >[];
      const includeVelib = store.providers.includes('velib');

      const results = await Promise.allSettled([
        ...bikeProviders.map((p) => fetchProvider(p, userLat, userLng)),
        ...(includeVelib ? [fetchVelib(userLat, userLng)] : []),
      ]);

      const all: MapEntity[] = [];
      const errors: string[] = [];
      const allProviders = [...bikeProviders, ...(includeVelib ? ['velib' as const] : [])];

      for (const [i, result] of results.entries()) {
        if (result.status === 'fulfilled') {
          all.push(...result.value);
        } else {
          errors.push(`${allProviders[i]}: ${result.reason?.message ?? result.reason}`);
        }
      }

      if (errors.length && !all.length) throw new Error(errors.join('; '));

      let filtered = all;

      if (store.hasPosition && store.maxDistance !== UNSET && store.maxDistance > 0) {
        filtered = filtered.filter((e) => e.distance != null && e.distance <= store.maxDistance);
      }

      if (store.minBattery !== UNSET && store.minBattery > 0) {
        filtered = filtered.filter(
          (e) =>
            e.kind === 'station' ||
            (e.battery_percent != null && e.battery_percent >= store.minBattery),
        );
      }

      bikes.value = filtered.sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : String(err);
    } finally {
      loading.value = false;
    }
  }

  // ── Scheduling ───────────────────────────────────────────────────────

  function clearTimers() {
    if (fetchTimer) {
      clearTimeout(fetchTimer);
      fetchTimer = null;
    }
    if (countdownTimer) {
      clearInterval(countdownTimer);
      countdownTimer = null;
    }
    // Do NOT update nextRefresh here — avoid synchronous reactive mutations
    // inside watcher callbacks which can conflict with mid-mount component updates
  }

  function scheduleNext() {
    clearTimers();
    const intervalMs = store.pollInterval * 1000;

    fetchTimer = setTimeout(async () => {
      clearTimers();
      await fetchOnce();
      scheduleNext();
    }, intervalMs);

    // Defer countdown to next tick so it doesn't trigger re-renders
    // in the same flush cycle as position-driven component mounts (LMarker v-if)
    nextTick(() => {
      nextRefresh.value = store.pollInterval;
      countdownTimer = setInterval(() => {
        if (nextRefresh.value > 0) nextRefresh.value -= 1;
      }, 1000);
    });
  }

  // Fetch immediately then schedule the next cycle.
  // Does NOT clear bikes during the fetch — stale data stays visible.
  async function refresh() {
    clearTimers();
    await fetchOnce();
    scheduleNext();
  }

  // ── Reactivity ───────────────────────────────────────────────────────

  // Re-fetch when position changes (user moved or GPS updated)
  watch(
    () => [store.lat, store.lng] as const,
    ([lat, lng], [prevLat, prevLng]) => {
      if (lat === prevLat && lng === prevLng) return;
      refresh();
    },
  );

  // Re-fetch when provider list changes (different API endpoints)
  watch(
    () => [...store.providers].sort().join(','),
    (val, prev) => {
      if (val === prev) return;
      refresh();
    },
  );

  // Reschedule (no immediate fetch) when poll interval changes
  watch(
    () => store.pollInterval,
    () => {
      scheduleNext();
    },
  );

  onMounted(() => {
    refresh();
  });

  onUnmounted(() => {
    clearTimers();
    bikes.value = [];
  });

  return { bikes, loading, error, nextRefresh };
}
