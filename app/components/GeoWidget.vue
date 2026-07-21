<template>
  <div class="flex flex-col items-end gap-2">
    <!-- Current position readout -->
    <div
      v-if="store.hasPosition"
      class="flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 font-mono text-[11px] text-muted shadow-card"
    >
      <span v-if="geoActive" class="relative flex h-2 w-2 flex-none">
        <span
          class="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"
        />
        <span class="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
      </span>
      <SpinnerIcon v-else-if="geoLoading" size="sm" />
      {{ store.lat?.toFixed(4) }}, {{ store.lng?.toFixed(4) }}
      <span>{{ store.locationMode === 'geo' ? '(GPS)' : '(manual)' }}</span>
    </div>

    <!-- Locate FAB -->
    <button
      class="flex h-12 w-12 items-center justify-center rounded-full border border-line bg-surface shadow-pop transition-colors hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-accent-500/50 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
      :class="geoActive ? 'text-accent-600 dark:text-accent-400' : 'text-fg'"
      :disabled="geoLoading"
      :aria-label="t('main.locateMe')"
      :title="t('main.locateMe')"
      @click="locate"
    >
      <SpinnerIcon v-if="geoLoading" size="md" />
      <LocateFixed v-else :size="22" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { LocateFixed } from '@lucide/vue';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import { useGeolocation } from '../composables/useGeolocation';
import { useProfileStore } from '../stores/profile';
import SpinnerIcon from './SpinnerIcon.vue';

const { t } = useI18n();
const store = useProfileStore();
const { loading: geoLoading, locate } = useGeolocation();

const geoActive = computed(() => store.locationMode === 'geo' && !geoLoading.value);
</script>
