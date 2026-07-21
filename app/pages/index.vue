<template>
  <div class="relative flex h-dvh w-full flex-col overflow-hidden bg-canvas">
    <!-- Map always visible -->
    <BikeMap :bikes="bikes" :user-lat="store.lat ?? undefined" :user-lng="store.lng ?? undefined" />

    <!-- Provider filter chips (double as the map legend) -->
    <div class="fixed top-4 left-4 z-1000 max-w-[min(62vw,32rem)]">
      <ProviderChips />
    </div>

    <!-- Top-right control bar -->
    <div
      class="fixed top-4 right-4 z-1000 flex flex-none items-center gap-1 rounded-xl border border-line bg-surface p-1 shadow-pop"
    >
      <div
        class="flex items-center gap-1.5 px-2 text-xs text-muted"
        :title="t('main.nextRefresh', { n: nextRefresh })"
      >
        <SpinnerIcon v-if="loading" size="sm" />
        <span v-else class="font-mono tabular-nums">{{ nextRefresh }}s</span>
      </div>
      <span class="h-5 w-px bg-line" />
      <button type="button" :class="hudBtn" @click="showList = true">
        <List :size="18" />
        <span class="hidden sm:inline">{{ t('main.list') }}</span>
      </button>
      <button type="button" :class="hudBtn" @click="showSettings = true">
        <SlidersHorizontal :size="18" />
        <span class="hidden sm:inline">{{ t('main.settings') }}</span>
      </button>
      <button
        type="button"
        :class="hudBtn"
        :title="theme === 'dark' ? t('settings.lightMode') : t('settings.darkMode')"
        @click="toggleTheme"
      >
        <Sun v-if="theme === 'dark'" :size="18" />
        <Moon v-else :size="18" />
      </button>
    </div>

    <!-- Locate control (bottom-right) -->
    <div class="fixed right-4 bottom-6 z-1000">
      <GeoWidget />
    </div>

    <!-- API error toast -->
    <Transition name="fade">
      <div
        v-if="error"
        class="fixed top-20 left-1/2 z-1000 max-w-xs -translate-x-1/2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 shadow-pop dark:border-red-900 dark:bg-red-950 dark:text-red-300"
      >
        {{ error }}
      </div>
    </Transition>

    <!-- First-run onboarding modal -->
    <OnboardingModal v-if="showOnboarding" @close="dismissOnboarding" />

    <!-- PWA install banner -->
    <InstallBanner />

    <!-- Settings -->
    <SettingsPanel :open="showSettings" @close="showSettings = false" />
    <!-- Bike list -->
    <BikeList :open="showList" :bikes="bikes" @close="showList = false" />
  </div>
</template>

<script setup lang="ts">
import { List, Moon, SlidersHorizontal, Sun } from '@lucide/vue';
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import BikeList from '../components/BikeList.vue';
import BikeMap from '../components/BikeMap.vue';
import GeoWidget from '../components/GeoWidget.vue';
import InstallBanner from '../components/InstallBanner.vue';
import OnboardingModal from '../components/OnboardingModal.vue';
import ProviderChips from '../components/ProviderChips.vue';
import SettingsPanel from '../components/SettingsPanel.vue';
import SpinnerIcon from '../components/SpinnerIcon.vue';
import { useBikes } from '../composables/useBikes';
import { useGeolocation } from '../composables/useGeolocation';
import { applyQueryParams } from '../composables/useQueryParams';
import { theme, toggleTheme } from '../composables/useTheme';
import { useAppStore } from '../stores/app';
import { useProfileStore } from '../stores/profile';
import { ALL_PROVIDERS, FILTER_BOUNDS, UNSET } from '../types';

const store = useProfileStore();
const appStore = useAppStore();
const { t } = useI18n();
const { startTracking, stopTracking } = useGeolocation();

// Shared style for the top-bar icon buttons (borderless; the bar provides surface + shadow).
const hudBtn =
  'flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium text-fg transition-colors hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-accent-500/50 focus-visible:outline-none';

const showList = ref(false);
const showSettings = ref(false);
const showOnboarding = ref(false);

function dismissOnboarding() {
  showOnboarding.value = false;
  appStore.onboardingSeen = true;
}

onMounted(() => {
  // Query params take priority (shared link / embed-like usage on main view)
  applyQueryParams(window.location.search);

  if (!appStore.onboardingSeen) {
    showOnboarding.value = true;
  }

  // Resume live tracking if the user was in geo mode with a known position
  // (permission already granted in a prior session). First-time users start it
  // via the locate button, so we do not prompt for permission on load.
  if (store.locationMode === 'geo' && store.hasPosition) {
    startTracking();
  }
});

// Start/stop live tracking as the location mode changes (manual coords stop it).
watch(
  () => store.locationMode,
  (mode) => (mode === 'geo' ? startTracking() : stopTracking()),
);

onUnmounted(() => {
  stopTracking();
});

// Keep URL in sync with the store.
// Geo position is NOT written to the URL — it's device-specific and would be
// re-applied as 'manual' on refresh. Only manual positions go in the URL.
watch(
  () => ({
    locationMode: store.locationMode,
    lat: store.lat,
    lng: store.lng,
    providers: store.providers.join(','),
    limit: store.limit,
    maxDistance: store.maxDistance,
    minBattery: store.minBattery,
  }),
  (state) => {
    const params = new URLSearchParams();

    if (state.locationMode === 'manual' && state.lat != null && state.lng != null) {
      params.set('lat', state.lat.toString());
      params.set('lng', state.lng.toString());
    }

    if (state.providers !== ALL_PROVIDERS.join(',')) params.set('providers', state.providers);
    if (state.limit !== FILTER_BOUNDS.limit.default) params.set('limit', state.limit.toString());
    if (state.maxDistance !== FILTER_BOUNDS.maxDistance.default)
      params.set('maxDist', (state.maxDistance === UNSET ? 0 : state.maxDistance).toString());
    if (state.minBattery !== FILTER_BOUNDS.minBattery.default)
      params.set('minBat', (state.minBattery === UNSET ? 0 : state.minBattery).toString());

    const qs = params.toString();
    window.history.replaceState(
      {},
      '',
      qs ? `${window.location.pathname}?${qs}` : window.location.pathname,
    );
  },
);

const { bikes, loading, error, nextRefresh } = useBikes();
</script>
