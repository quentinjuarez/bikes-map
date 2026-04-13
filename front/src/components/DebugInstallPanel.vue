<template>
  <div class="fixed top-4 left-4 z-9999 w-72 rounded-xl border border-yellow-500/40 bg-black/90 font-mono text-[10px] text-yellow-300 shadow-2xl backdrop-blur-sm">
    <!-- Header -->
    <div
      class="flex cursor-pointer items-center justify-between border-b border-yellow-500/20 px-3 py-2"
      @click="open = !open"
    >
      <span class="font-bold tracking-widest text-yellow-400 uppercase">⚙ PWA Debug</span>
      <span class="text-yellow-600">{{ open ? '▲' : '▼' }}</span>
    </div>

    <div v-if="open" class="space-y-0.5 px-3 py-2">
      <Row label="HTTPS" :ok="d.isHttps" :value="d.isHttps ? 'yes' : 'NO ← install blocked'" />
      <Row label="standalone" :ok="!d.isInstalled" :value="d.isInstalled ? 'yes (already installed)' : 'no'" />
      <Row label="iOS" :value="d.isIOS ? 'yes (share-sheet flow)' : 'no'" />
      <Row label="SW registered" :ok="d.swRegistered" :value="d.swRegistered ? `yes (${d.swState})` : 'NO ← install blocked'" />
      <Row label="prompt fired" :ok="d.promptFired" :value="d.promptFired ? `yes @ ${d.promptFiredAt?.slice(11, 19)}` : 'NOT YET'" />
      <Row label="deferredPrompt" :ok="d.hasDeferredPrompt" :value="d.hasDeferredPrompt ? 'captured ✓' : 'null'" />
      <Row label="dismissed" :ok="!d.isDismissed" :value="d.isDismissed ? 'YES ← banner blocked' : 'no'" />
      <Row label="showBanner" :ok="d.showBanner" :value="String(d.showBanner)" />
      <Row label="appInstalled" :value="String(d.appInstalled)" />

      <div class="mt-2 border-t border-yellow-500/20 pt-2">
        <div class="mb-1 text-yellow-600">userAgent</div>
        <div class="break-all leading-tight text-yellow-500">{{ d.userAgent }}</div>
      </div>

      <div class="mt-2 flex gap-2">
        <button
          class="rounded bg-yellow-500/20 px-2 py-1 text-yellow-300 hover:bg-yellow-500/40"
          @click="resetDismissed"
        >
          Reset dismissed
        </button>
        <button
          class="rounded bg-yellow-500/20 px-2 py-1 text-yellow-300 hover:bg-yellow-500/40"
          @click="refreshSW"
        >
          Check SW
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

import { debugInstall } from '../composables/useInstallPrompt';
import { useAppStore } from '../stores/app';

const open = ref(true);
const d = debugInstall;

function resetDismissed() {
  useAppStore().installDismissed = false;
  d.value.isDismissed = false;
}

async function refreshSW() {
  const reg = await navigator.serviceWorker?.getRegistration();
  d.value.swRegistered = !!reg;
  d.value.swState =
    reg?.active?.state ?? reg?.installing?.state ?? reg?.waiting?.state ?? 'none';
}
</script>
