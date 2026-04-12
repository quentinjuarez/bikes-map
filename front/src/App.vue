<template>
  <RouterView />
  <InstallBanner v-if="!isEmbed" />
</template>

<script setup lang="ts">
import { computed, onErrorCaptured } from 'vue';
import { RouterView, useRoute } from 'vue-router';

import InstallBanner from './components/InstallBanner.vue';
import { useTheme } from './composables/useTheme';

useTheme();

const route = useRoute();
const isEmbed = computed(() => route.meta.embed === true);

// Global error boundary — catch Vue render/watcher errors so the app
// doesn't blank out. Errors are suppressed after logging; the next
// reactive tick will produce a clean render.
onErrorCaptured((err, _instance, info) => {
  console.warn('[App] caught Vue error:', info, err);
  return false; // prevent propagation to window.onerror
});
</script>
