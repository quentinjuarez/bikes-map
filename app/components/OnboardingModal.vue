<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-3000 flex items-end justify-center bg-black/40 p-4 backdrop-blur-sm sm:items-center"
      @click.self="emit('close')"
    >
      <div
        class="w-full max-w-sm space-y-5 rounded-2xl border border-accent-100 bg-white p-6 shadow-2xl dark:border-accent-900 dark:bg-[#111118]"
      >
        <!-- Header -->
        <div class="flex items-start justify-between gap-4">
          <div>
            <h2 class="text-base font-semibold tracking-wide text-accent-800 dark:text-accent-100">
              {{ t('onboardingModal.title') }}
            </h2>
            <p class="mt-1 text-xs text-accent-500 dark:text-accent-400">
              {{ t('onboardingModal.subtitle') }}
            </p>
          </div>
          <button
            class="mt-0.5 flex-none text-accent-400 transition-colors hover:text-accent-600 dark:hover:text-accent-200"
            :aria-label="t('onboardingModal.close')"
            @click="emit('close')"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <!-- Tips -->
        <ul class="space-y-3">
          <li v-for="tip in tips" :key="tip.key" class="flex items-start gap-3">
            <span
              class="mt-0.5 w-5 flex-none text-center text-base leading-none"
              aria-hidden="true"
              >{{ tip.icon }}</span
            >
            <span class="text-sm leading-snug text-accent-700 dark:text-accent-300">
              {{ t(tip.key) }}
            </span>
          </li>
        </ul>

        <!-- CTA -->
        <BaseButton class="w-full" size="md" @click="emit('close')">
          {{ t('onboardingModal.cta') }}
        </BaseButton>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

import BaseButton from './BaseButton.vue';

const emit = defineEmits<{ close: [] }>();
const { t } = useI18n();

const tips = [
  { icon: '🗺️', key: 'onboardingModal.tip1' },
  { icon: '📍', key: 'onboardingModal.tip2' },
  { icon: '🔍', key: 'onboardingModal.tip3' },
  { icon: '♻️', key: 'onboardingModal.tip4' },
];
</script>
