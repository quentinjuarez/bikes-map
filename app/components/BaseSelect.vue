<template>
  <div
    class="w-full cursor-pointer rounded-xl border border-accent-200 bg-accent-50 pr-2 font-mono text-sm text-accent-700 transition-colors focus-within:border-accent-300 dark:border-accent-700 dark:bg-accent-950/40 dark:text-accent-300 dark:focus-within:border-accent-600"
  >
    <select v-model="model" class="h-full w-full px-3 py-2">
      <slot />
    </select>
  </div>
</template>

<script setup lang="ts">
const model = defineModel<string>();
</script>

<style scoped>
option {
  background: var(--scrollbar-bg); /* switches with theme */
  color: var(--color-accent);
}
</style>
