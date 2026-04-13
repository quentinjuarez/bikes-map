<template>
  <Transition name="slide-up">
    <div v-if="showBanner" class="fixed inset-x-0 bottom-4 z-1100 p-4">
      <div
        class="mx-auto flex max-w-sm flex-col gap-3 rounded-2xl border border-accent-100 bg-accent-500/5 px-4 py-3 shadow-xl backdrop-blur-sm md:flex-row md:items-center dark:border-accent-900 dark:bg-black/10"
      >
        <!-- Text -->
        <div class="min-w-0 flex-1">
          <p
            class="truncate text-xs font-semibold tracking-wide text-accent-700 dark:text-accent-300"
          >
            {{ t('install.title') }}
          </p>
          <p
            class="mt-0.5 text-[10px] leading-tight text-accent-400 dark:text-accent-500"
          >
            {{ isIOS ? t('install.iosHint') : t('install.subtitle') }}
          </p>
        </div>

        <!-- Actions -->
        <div class="flex w-full flex-none items-center gap-2 md:w-auto">
          <BaseButton
            variant="ghost"
            size="sm"
            class="w-full uppercase md:w-auto"
            @click="dismiss"
          >
            {{ t('install.later') }}
          </BaseButton>

          <!-- iOS: no programmatic install — button just dismisses after reading hint -->
          <BaseButton
            v-if="!isIOS"
            size="sm"
            class="w-full uppercase md:w-auto"
            @click="onInstall"
          >
            {{ t('install.install') }}
          </BaseButton>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

import { useInstallPrompt } from '../composables/useInstallPrompt';
import BaseButton from './BaseButton.vue';

const { t } = useI18n();
const { showBanner, isIOS, triggerInstall, dismiss } = useInstallPrompt();

function onInstall() {
  triggerInstall();
}
</script>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition:
    transform 0.35s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.35s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(120%);
  opacity: 0;
}
</style>
