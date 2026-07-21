<template>
  <div class="flex flex-col items-start gap-2 md:flex-row md:items-center md:overflow-x-auto">
    <button
      v-for="p in PROVIDERS"
      :key="p.id"
      type="button"
      :aria-pressed="isActive(p.id)"
      class="flex flex-none items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-sm font-medium shadow-card transition-colors focus-visible:ring-2 focus-visible:ring-accent-500/50 focus-visible:outline-none"
      :class="isActive(p.id) ? 'bg-surface text-fg' : 'bg-surface/70 text-muted'"
      :title="
        isActive(p.id)
          ? t('providerChips.hide', { name: p.label })
          : t('providerChips.show', { name: p.label })
      "
      @click="store.toggleProvider(p.id)"
    >
      <span
        class="h-2.5 w-2.5 flex-none rounded-full transition-opacity"
        :class="[p.dot, isActive(p.id) ? 'opacity-100' : 'opacity-30 grayscale']"
      />
      {{ p.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

import { useProfileStore } from '../stores/profile';
import type { Provider } from '../types';

// dot classes reference --color-*-brand tokens (kept as literals for Tailwind).
const PROVIDERS: { id: Provider; label: string; dot: string }[] = [
  { id: 'lime', label: 'Lime', dot: 'bg-lime-brand' },
  { id: 'voi', label: 'Voi', dot: 'bg-voi-brand' },
  { id: 'dott', label: 'Dott', dot: 'bg-dott-brand' },
  { id: 'velib', label: 'Vélib', dot: 'bg-velib-brand' },
];

const store = useProfileStore();
const { t } = useI18n();

function isActive(id: Provider) {
  return store.providers.includes(id);
}
</script>
