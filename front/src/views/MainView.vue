<template>
  <div
    class="relative w-full h-dvh overflow-hidden bg-[#fafaf9] dark:bg-[#0c0c14] flex flex-col"
  >
    <!-- Map always visible -->
    <BikeMap
      :bikes="bikes"
      :user-lat="store.lat ?? undefined"
      :user-lng="store.lng ?? undefined"
    />

    <!-- Top-right HUD -->
    <div class="top-4 right-4 fixed z-1000 flex items-center gap-2 flex-none">
      <BaseButton @click="showList = true" variant="ghost" size="sm">
        {{ t('main.list') }}
      </BaseButton>
      <BaseButton @click="showSettings = true" variant="ghost" size="sm">
        {{ t('main.settings') }}
      </BaseButton>
      <div
        class="min-w-16 flex justify-center items-center backdrop-blur-sm bg-accent-500/5 dark:bg-black/10 text-accent-600 dark:text-accent-400 text-xs font-mono px-3 py-1.5 rounded-xl border border-accent-200 dark:border-accent-700"
      >
        <SpinnerIcon v-if="loading" size="sm" />
        <span v-if="!loading" class="flex-none">{{
          t('main.nextRefresh', { n: nextRefresh })
        }}</span>
      </div>
    </div>

    <!-- Geolocation widget (bottom-right) -->
    <div class="fixed bottom-6 right-4 z-1000">
      <button
        class="flex items-center gap-2 backdrop-blur-sm bg-accent-500/5 dark:bg-black/10 text-accent-600 dark:text-accent-400 text-xs font-medium px-3 py-2 rounded-xl border border-accent-200 dark:border-accent-700 shadow-sm hover:bg-accent-100/60 dark:hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="geoLoading"
        @click="locate"
      >
        <SpinnerIcon v-if="geoLoading" size="sm" />
        <svg
          v-else
          xmlns="http://www.w3.org/2000/svg"
          class="w-3.5 h-3.5 flex-none"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
        </svg>
        {{ geoLoading ? t('main.locating') : t('main.locateMe') }}
      </button>
      <!-- Geo error tooltip -->
      <div
        v-if="geoError"
        class="mt-1 text-red-400 text-xs bg-red-950/80 px-2 py-1 rounded-lg border border-red-800 max-w-xs text-right"
      >
        {{ geoError }}
      </div>
    </div>

    <!-- API error toast -->
    <div
      v-if="error"
      class="fixed top-16 right-4 z-1000 bg-red-900 text-red-400 text-xs font-mono px-3 py-2 rounded-lg shadow-lg border border-red-800 max-w-xs"
    >
      {{ error }}
    </div>

    <!-- First-run onboarding modal -->
    <OnboardingModal v-if="showOnboarding" @close="dismissOnboarding" />

    <!-- Settings -->
    <SettingsPanel :open="showSettings" @close="showSettings = false" />
    <!-- Bike list -->
    <BikeList :open="showList" :bikes="bikes" @close="showList = false" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useProfileStore } from '../stores/profile';
import { useBikes } from '../composables/useBikes';
import { useGeolocation } from '../composables/useGeolocation';
import { ALL_PROVIDERS, FILTER_BOUNDS, UNSET } from '../types';
import { applyQueryParams } from '../composables/useQueryParams';
import BikeMap from '../components/BikeMap.vue';
import BikeList from '../components/BikeList.vue';
import SpinnerIcon from '../components/SpinnerIcon.vue';
import SettingsPanel from '../components/SettingsPanel.vue';
import BaseButton from '../components/BaseButton.vue';
import OnboardingModal from '../components/OnboardingModal.vue';

const store = useProfileStore();
const { t } = useI18n();
const { error: geoError, loading: geoLoading, locate } = useGeolocation();

const showList = ref(false);
const showSettings = ref(false);

const ONBOARDING_KEY = 'lt_onboarding_seen';
const showOnboarding = ref(false);

function dismissOnboarding() {
  showOnboarding.value = false;
  localStorage.setItem(ONBOARDING_KEY, '1');
}

onMounted(() => {
  // Query params take priority (shared link / embed-like usage on main view)
  applyQueryParams(window.location.search);

  // Show first-run modal if not previously dismissed
  if (!localStorage.getItem(ONBOARDING_KEY)) {
    showOnboarding.value = true;
  }
});

// Keep URL in sync with the store
watch(
  () =>
    store.hasPosition
      ? {
          lat: store.lat,
          lng: store.lng,
          providers: store.providers.join(','),
          limit: store.limit,
          maxDistance: store.maxDistance,
          minBattery: store.minBattery,
        }
      : null,
  (state) => {
    if (!state) {
      window.history.replaceState({}, '', window.location.pathname);
      return;
    }
    const params = new URLSearchParams();
    params.set('lat', state.lat!.toString());
    params.set('lng', state.lng!.toString());
    if (state.providers !== ALL_PROVIDERS.join(','))
      params.set('providers', state.providers);
    if (state.limit !== FILTER_BOUNDS.limit.default)
      params.set('limit', state.limit.toString());
    if (state.maxDistance !== FILTER_BOUNDS.maxDistance.default)
      params.set(
        'maxDist',
        (state.maxDistance === UNSET ? 0 : state.maxDistance).toString(),
      );
    if (state.minBattery !== FILTER_BOUNDS.minBattery.default)
      params.set(
        'minBat',
        (state.minBattery === UNSET ? 0 : state.minBattery).toString(),
      );
    window.history.replaceState(
      {},
      '',
      `${window.location.pathname}?${params.toString()}`,
    );
  },
);

const { bikes, loading, error, nextRefresh } = useBikes({
  proxyBase: import.meta.env.VITE_BACK_URL || 'http://localhost:13001',
});
</script>
