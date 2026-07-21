import { ref } from 'vue';

import { useProfileStore } from '../stores/profile';
import { haversineDistance } from '../utils/geo';

// Module-level shared state so all callers (GeoWidget, SettingsPanel, index)
// see the same loading/error/following without prop-drilling.
const error = ref<string | null>(null);
const loading = ref(false);
// Whether the map should recenter on the user as they move. Paused when the
// user pans/zooms manually (set in BikeMap), resumed on a locate tap.
export const following = ref(true);

// Smoothing: drop noisy samples and jitter so we do not recompute/recenter for
// a few metres of GPS wobble.
const MAX_ACCURACY_M = 50;
const JITTER_M = 15;

let watchId: number | null = null;
let lastAccepted: { lat: number; lng: number } | null = null;

/**
 * Live geolocation. `startTracking()` follows the user continuously (smoothed);
 * `locate()` (re)starts tracking and re-enables map follow. `stopTracking()`
 * clears the watch (call when leaving geo mode or unmounting).
 */
export function useGeolocation() {
  const store = useProfileStore();

  function onSample(pos: GeolocationPosition) {
    const { latitude, longitude, accuracy } = pos.coords;
    loading.value = false;
    error.value = null;

    // Reject low-confidence fixes that would cause big jumps.
    if (accuracy != null && accuracy > MAX_ACCURACY_M) return;

    // Ignore jitter: only accept a genuine move.
    if (lastAccepted) {
      const moved = haversineDistance(lastAccepted.lat, lastAccepted.lng, latitude, longitude);
      if (moved < JITTER_M) return;
    }

    lastAccepted = { lat: latitude, lng: longitude };
    store.setPosition(latitude, longitude, 'geo');
  }

  function onError(err: GeolocationPositionError) {
    loading.value = false;
    switch (err.code) {
      case err.PERMISSION_DENIED:
        error.value = 'Location access denied. Please enable it in your browser settings.';
        break;
      case err.POSITION_UNAVAILABLE:
        error.value = 'Location unavailable';
        break;
      case err.TIMEOUT:
        error.value = 'Location request timed out';
        break;
      default:
        error.value = 'Unknown geolocation error';
    }
  }

  function startTracking() {
    if (!navigator.geolocation) {
      error.value = 'Geolocation is not supported by your browser';
      return;
    }
    if (watchId != null) return; // already tracking
    loading.value = true;
    error.value = null;
    following.value = true;
    watchId = navigator.geolocation.watchPosition(onSample, onError, {
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 15000,
    });
  }

  function stopTracking() {
    if (watchId != null) {
      navigator.geolocation.clearWatch(watchId);
      watchId = null;
    }
    lastAccepted = null;
    loading.value = false;
  }

  // Manual tap: force the next sample to be accepted and re-enable follow.
  function locate() {
    lastAccepted = null;
    following.value = true;
    if (watchId != null) {
      loading.value = true;
      navigator.geolocation.getCurrentPosition(onSample, onError, {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 15000,
      });
    } else {
      startTracking();
    }
  }

  return { error, loading, following, locate, startTracking, stopTracking };
}
