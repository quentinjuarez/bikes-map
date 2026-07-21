<template>
  <div class="relative flex h-dvh w-full flex-col overflow-hidden bg-[#fafaf9] dark:bg-[#0c0c14]">
    <!-- Map always visible -->
    <BikeMap :bikes="bikes" :user-lat="store.lat ?? undefined" :user-lng="store.lng ?? undefined" />

    <!-- Top-right HUD -->
    <div class="fixed top-4 right-4 z-1000 flex flex-none items-center gap-2">
      <BaseButton @click="showList = true" variant="ghost" size="sm">
        {{ t('main.list') }}
      </BaseButton>
      <BaseButton @click="showSettings = true" variant="ghost" size="sm">
        {{ t('main.settings') }}
      </BaseButton>
      <div
        class="flex min-w-16 items-center justify-center rounded-xl border border-accent-200 bg-accent-500/5 px-3 py-1.5 font-mono text-xs text-accent-600 backdrop-blur-sm dark:border-accent-700 dark:bg-black/10 dark:text-accent-400"
      >
        <SpinnerIcon v-if="loading" size="sm" />
        <span v-if="!loading" class="flex-none">{{
          t('main.nextRefresh', { n: nextRefresh })
        }}</span>
      </div>
    </div>

    <!-- Geolocation widget (bottom-right) -->
    <div class="fixed right-4 bottom-6 z-1000">
      <GeoWidget />
    </div>

    <!-- API error toast -->
    <div
      v-if="error"
      class="fixed top-16 right-4 z-1000 max-w-xs rounded-lg border border-red-800 bg-red-900 px-3 py-2 font-mono text-xs text-red-400 shadow-lg"
    >
      {{ error }}
    </div>

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
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import BaseButton from '../components/BaseButton.vue';
import BikeList from '../components/BikeList.vue';
import BikeMap from '../components/BikeMap.vue';
import GeoWidget from '../components/GeoWidget.vue';
import InstallBanner from '../components/InstallBanner.vue';
import OnboardingModal from '../components/OnboardingModal.vue';
import SettingsPanel from '../components/SettingsPanel.vue';
import SpinnerIcon from '../components/SpinnerIcon.vue';
import { useBikes } from '../composables/useBikes';
import { useGeolocation } from '../composables/useGeolocation';
import { applyQueryParams } from '../composables/useQueryParams';
import { useAppStore } from '../stores/app';
import { useProfileStore } from '../stores/profile';
import { ALL_PROVIDERS, FILTER_BOUNDS, UNSET } from '../types';

const store = useProfileStore();
const appStore = useAppStore();
const { t } = useI18n();
const { locate } = useGeolocation();

const showList = ref(false);
const showSettings = ref(false);
const showOnboarding = ref(false);

function dismissOnboarding() {
  showOnboarding.value = false;
  appStore.onboardingSeen = true;
}

function onVisibilityChange() {
  if (document.visibilityState === 'visible' && store.locationMode === 'geo') {
    locate();
  }
}

onMounted(() => {
  // Query params take priority (shared link / embed-like usage on main view)
  applyQueryParams(window.location.search);

  if (!appStore.onboardingSeen) {
    showOnboarding.value = true;
  }

  // Re-fetch GPS when the tab becomes visible again (e.g. switching back on mobile)
  document.addEventListener('visibilitychange', onVisibilityChange);
});

onUnmounted(() => {
  document.removeEventListener('visibilitychange', onVisibilityChange);
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
