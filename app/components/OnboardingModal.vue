<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-3000 flex items-end justify-center bg-black/40 p-4 sm:items-center"
      @click.self="emit('close')"
    >
      <div
        :style="drag.style"
        v-on="drag.handlers"
        class="w-full max-w-sm touch-none space-y-5 rounded-2xl border border-line bg-surface p-6 shadow-pop md:touch-auto"
      >
        <div class="mx-auto -mt-2 h-1 w-9 rounded-full bg-line md:hidden" aria-hidden="true" />
        <!-- Header -->
        <div class="flex items-start justify-between gap-4">
          <div>
            <h2 class="text-base font-semibold text-fg">{{ t('onboardingModal.title') }}</h2>
            <p class="mt-1 text-xs text-muted">{{ t('onboardingModal.subtitle') }}</p>
          </div>
          <button
            class="mt-0.5 flex-none rounded-lg p-1 text-muted transition-colors hover:bg-surface-2 hover:text-fg focus-visible:ring-2 focus-visible:ring-accent-500/50 focus-visible:outline-none"
            :aria-label="t('onboardingModal.close')"
            @click="emit('close')"
          >
            <X :size="18" />
          </button>
        </div>

        <!-- Tips -->
        <ul class="space-y-3">
          <li v-for="tip in tips" :key="tip.key" class="flex items-start gap-3">
            <component
              :is="tip.icon"
              :size="18"
              class="mt-0.5 flex-none text-accent-600 dark:text-accent-400"
            />
            <span class="text-sm leading-snug text-fg">{{ t(tip.key) }}</span>
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
import { LocateFixed, Map as MapIcon, MousePointerClick, SlidersHorizontal, X } from '@lucide/vue';
import { useI18n } from 'vue-i18n';

import { useSwipeDismiss } from '../composables/useSwipeDismiss';
import BaseButton from './BaseButton.vue';

const emit = defineEmits<{ close: [] }>();
const { t } = useI18n();

const drag = useSwipeDismiss(() => emit('close'));

const tips = [
  { icon: MapIcon, key: 'onboardingModal.tip1' },
  { icon: LocateFixed, key: 'onboardingModal.tip2' },
  { icon: MousePointerClick, key: 'onboardingModal.tip3' },
  { icon: SlidersHorizontal, key: 'onboardingModal.tip4' },
];
</script>
