<template>
  <div class="flex flex-col items-end gap-1.5">
    <!-- Current position pill -->
    <div
      v-if="store.hasPosition"
      class="flex items-center gap-1.5 rounded-lg border border-accent-100 bg-white/70 px-2 py-0.5 font-mono text-[11px] text-accent-500 backdrop-blur-sm dark:border-accent-800 dark:bg-black/40 dark:text-accent-400"
    >
      <!-- Pulsing dot when GPS is active and not refreshing -->
      <span
        v-if="store.locationMode === 'geo' && !geoLoading"
        class="relative flex h-2 w-2 flex-none"
      >
        <span
          class="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"
        />
        <span class="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
      </span>
      <SpinnerIcon v-else-if="geoLoading" size="sm" />
      {{ store.lat?.toFixed(4) }}, {{ store.lng?.toFixed(4) }}
      <span class="ml-0.5 text-accent-300 dark:text-accent-600">
        {{ store.locationMode === 'geo' ? '(GPS)' : '(manual)' }}
      </span>
    </div>

    <!-- GPS button -->
    <button
      class="flex items-center gap-2 rounded-xl border border-accent-200 bg-accent-500/5 px-3 py-2 text-xs font-medium text-accent-600 shadow-sm backdrop-blur-sm transition-colors hover:bg-accent-100/60 disabled:cursor-not-allowed disabled:opacity-50 dark:border-accent-700 dark:bg-black/10 dark:text-accent-400 dark:hover:bg-white/5"
      :disabled="geoLoading"
      @click="locate"
    >
      <SpinnerIcon v-if="geoLoading" size="sm" />
      <svg
        v-else
        xmlns="http://www.w3.org/2000/svg"
        class="h-3.5 w-3.5 flex-none"
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
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

import { useGeolocation } from '../composables/useGeolocation';
import { useProfileStore } from '../stores/profile';
import SpinnerIcon from './SpinnerIcon.vue';

const { t } = useI18n();
const store = useProfileStore();
const { loading: geoLoading, locate } = useGeolocation();
</script>
