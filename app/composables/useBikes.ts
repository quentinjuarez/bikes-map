import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';

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
import { haversineDistance } from '../utils/geo';

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
export { haversineDistance } from '../utils/geo';

const PARIS = { lat: 48.8566, lng: 2.3522 };

export function useBikes(opts?: { proxyBase?: string }) {
  const store = useProfileStore();
  // Raw fetched set (no distance baked in). Distance/filter/sort are derived
  // reactively in `bikes` below, so moving recomputes locally without refetching.
  const allEntities = ref<MapEntity[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const nextRefresh = ref(0);

  // Same-origin Nitro API. Callers pass nothing; overridable for tests.
  const proxyBase = opts?.proxyBase ?? '/api';

  let fetchTimer: ReturnType<typeof setTimeout> | null = null;
  let countdownTimer: ReturnType<typeof setInterval> | null = null;

  // ── Fetch helpers (raw, position-independent) ────────────────────────

  async function fetchProvider(provider: Provider): Promise<Bike[]> {
    const res = await fetch(`${proxyBase}/${provider}/free_bike_status`);
    if (!res.ok) throw new Error(`${provider} fetch failed: ${res.status}`);
    const json = (await res.json()) as GbfsResponse;

    return (json.data?.bikes || []).map(
      (b: GbfsBike) =>
        ({
          kind: 'bike',
          bike_id: b.bike_id,
          lat: b.lat,
          lon: b.lon,
          battery_percent: b.battery_percent,
          provider,
        }) satisfies Bike,
    );
  }

  async function fetchVelib(): Promise<VelibStation[]> {
    const res = await fetch(`${proxyBase}/velib/stations`);
    if (!res.ok) throw new Error(`velib fetch failed: ${res.status}`);
    const json = (await res.json()) as { stations: RawVelibStation[] };

    return (json.stations || []).map(
      (s: RawVelibStation) =>
        ({
          kind: 'station',
          station_id: s.station_id,
          lat: s.lat,
          lon: s.lon,
          num_bikes_available: s.num_bikes_available,
          mechanical: s.mechanical,
          ebike: s.ebike,
          num_docks_available: s.num_docks_available,
          is_renting: s.is_renting,
          provider: 'velib' as const,
        }) satisfies VelibStation,
    );
  }

  // ── Derived view: distance + filters + sort (reacts to position live) ─

  const bikes = computed<MapEntity[]>(() => {
    const userLat = store.lat ?? PARIS.lat;
    const userLng = store.lng ?? PARIS.lng;

    let list = allEntities.value.map(
      (e) => ({ ...e, distance: haversineDistance(userLat, userLng, e.lat, e.lon) }) as MapEntity,
    );

    if (store.hasPosition && store.maxDistance !== UNSET && store.maxDistance > 0) {
      list = list.filter((e) => e.distance != null && e.distance <= store.maxDistance);
    }

    if (store.minBattery !== UNSET && store.minBattery > 0) {
      list = list.filter(
        (e) =>
          e.kind === 'station' ||
          (e.battery_percent != null && e.battery_percent >= store.minBattery),
      );
    }

    return list.sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
  });

  // ── Core fetch ───────────────────────────────────────────────────────

  async function fetchOnce() {
    loading.value = true;
    error.value = null;
    try {
      const bikeProviders = store.providers.filter((p) => p !== 'velib') as Exclude<
        Provider,
        'velib'
      >[];
      const includeVelib = store.providers.includes('velib');

      const results = await Promise.allSettled([
        ...bikeProviders.map((p) => fetchProvider(p)),
        ...(includeVelib ? [fetchVelib()] : []),
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

      allEntities.value = all;
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
  }

  function scheduleNext() {
    clearTimers();
    const intervalMs = store.pollInterval * 1000;

    fetchTimer = setTimeout(async () => {
      clearTimers();
      await fetchOnce();
      scheduleNext();
    }, intervalMs);

    nextTick(() => {
      nextRefresh.value = store.pollInterval;
      countdownTimer = setInterval(() => {
        if (nextRefresh.value > 0) nextRefresh.value -= 1;
      }, 1000);
    });
  }

  // Fetch immediately then schedule the next cycle.
  async function refresh() {
    clearTimers();
    await fetchOnce();
    scheduleNext();
  }

  // ── Reactivity ───────────────────────────────────────────────────────
  // NOTE: no position watch. Moving recomputes `bikes` locally (above); only
  // the poll interval and provider changes trigger a network refetch.

  watch(
    () => [...store.providers].sort().join(','),
    (val, prev) => {
      if (val === prev) return;
      refresh();
    },
  );

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
    allEntities.value = [];
  });

  return { bikes, loading, error, nextRefresh };
}
