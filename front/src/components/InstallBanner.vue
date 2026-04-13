<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="translate-y-full opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="translate-y-full opacity-0"
    >
      <div
        v-if="visible"
        class="fixed right-0 bottom-0 left-0 z-2000 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
      >
        <div
          class="mx-auto w-full max-w-sm rounded-2xl border border-accent-100 bg-white p-4 shadow-2xl dark:border-accent-900 dark:bg-[#111118]"
        >
          <div class="flex items-start gap-3">
            <!-- Text -->
            <div class="min-w-0 flex-1">
              <p
                class="text-sm font-semibold text-accent-800 dark:text-accent-100"
              >
                {{ t('install.title') }}
              </p>
              <p
                class="mt-0.5 text-xs leading-snug text-accent-500 dark:text-accent-400"
              >
                {{ isIos ? t('install.iosHint') : t('install.subtitle') }}
              </p>
            </div>

            <!-- Dismiss -->
            <button
              class="flex-none text-accent-400 transition-colors hover:text-accent-600 dark:hover:text-accent-200"
              :aria-label="t('install.later')"
              @click="dismiss"
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

          <!-- Install button — only for browsers that support the prompt -->
          <BaseButton
            v-if="canPrompt"
            class="mt-3 w-full"
            size="sm"
            @click="install"
          >
            {{ t('install.install') }}
          </BaseButton>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
import { useI18n } from 'vue-i18n';

import BaseButton from './BaseButton.vue';
import { useAppStore } from '../stores/app';

const { t } = useI18n();
const appStore = useAppStore();

// The deferred prompt event (Chrome/Android)
let deferredPrompt: BeforeInstallPromptEvent | null = null;
const canPrompt = ref(false);

// Detect iOS Safari
const isIos = computed(() => /iphone|ipad|ipod/i.test(navigator.userAgent));

// Already running as installed standalone PWA?
const isStandalone = computed(
  () =>
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in navigator &&
      (navigator as Navigator & { standalone: boolean }).standalone),
);

const visible = computed(
  () =>
    !appStore.installDismissed &&
    !isStandalone.value &&
    (canPrompt.value || isIos.value),
);

function dismiss() {
  appStore.installDismissed = true;
}

async function install() {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  if (outcome === 'accepted') {
    appStore.installDismissed = true;
  }
  deferredPrompt = null;
  canPrompt.value = false;
}

function onBeforeInstallPrompt(e: Event) {
  e.preventDefault();
  deferredPrompt = e as BeforeInstallPromptEvent;
  canPrompt.value = true;
}

function onAppInstalled() {
  appStore.installDismissed = true;
  deferredPrompt = null;
  canPrompt.value = false;
}

onMounted(() => {
  window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
  window.addEventListener('appinstalled', onAppInstalled);
});

onBeforeUnmount(() => {
  window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
  window.removeEventListener('appinstalled', onAppInstalled);
});
</script>
