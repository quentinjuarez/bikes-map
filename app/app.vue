<template>
  <NuxtPage />
</template>

<script setup lang="ts">
useTheme();

// Global error boundary — catch Vue render/watcher errors so the app
// doesn't blank out. Errors are suppressed after logging; the next
// reactive tick will produce a clean render.
onErrorCaptured((err, _instance, info) => {
  // eslint-disable-next-line no-console
  console.warn('[App] caught Vue error:', info, err);
  return false; // prevent propagation to window.onerror
});
</script>
