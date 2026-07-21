import { defineStore } from 'pinia';

import {
  type Provider,
  type LocationMode,
  type ProfileState,
  createDefaultState,
  FILTER_BOUNDS,
  UNSET,
} from '../types';

export const useProfileStore = defineStore('bike-tracker:profile', {
  state: (): ProfileState => createDefaultState(),

  getters: {
    hasPosition(): boolean {
      return this.lat != null && this.lng != null;
    },
  },

  actions: {
    setPosition(lat: number, lng: number, mode?: LocationMode) {
      this.lat = lat;
      this.lng = lng;
      if (mode) this.locationMode = mode;
    },

    setLocationMode(mode: LocationMode) {
      this.locationMode = mode;
    },

    clearPosition() {
      this.lat = null;
      this.lng = null;
    },

    toggleProvider(provider: Provider) {
      const idx = this.providers.indexOf(provider);
      if (idx === -1) {
        this.providers.push(provider);
      } else if (this.providers.length > 1) {
        this.providers.splice(idx, 1);
      }
    },

    setLimit(value: number) {
      const b = FILTER_BOUNDS.limit;
      this.limit = Math.max(b.min, Math.min(b.max, value));
    },

    setMaxDistance(value: number) {
      this.maxDistance =
        value === UNSET ? UNSET : Math.max(0, Math.min(FILTER_BOUNDS.maxDistance.max, value));
    },

    setMinBattery(value: number) {
      this.minBattery =
        value === UNSET ? UNSET : Math.max(0, Math.min(FILTER_BOUNDS.minBattery.max, value));
    },

    setPollInterval(value: number) {
      const b = FILTER_BOUNDS.pollInterval;
      this.pollInterval = Math.max(b.min, Math.min(b.max, value));
    },

    resetFilters() {
      const d = createDefaultState();
      this.providers = d.providers;
      this.limit = FILTER_BOUNDS.limit.default;
      this.maxDistance = FILTER_BOUNDS.maxDistance.default;
      this.minBattery = FILTER_BOUNDS.minBattery.default;
    },
  },

  persist: true,
});
