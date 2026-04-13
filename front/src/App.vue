<template>
  <RouterView />
</template>

<script setup lang="ts">
import { onErrorCaptured } from 'vue';
import { RouterView } from 'vue-router';

import { useTheme } from './composables/useTheme';

useTheme();

// Global error boundary — catch Vue render/watcher errors so the app
// doesn't blank out. Errors are suppressed after logging; the next
// reactive tick will produce a clean render.
onErrorCaptured((err, _instance, info) => {
  console.warn('[App] caught Vue error:', info, err);
  return false; // prevent propagation to window.onerror
});
</script>
