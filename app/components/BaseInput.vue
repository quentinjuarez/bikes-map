<script setup lang="ts">
withDefaults(
  defineProps<{
    size?: 'sm' | 'md';
  }>(),
  {
    size: 'md',
  },
);

const model = defineModel<string>();
</script>

<template>
  <input
    v-model="model"
    :class="[
      'rounded-xl border border-accent-200 bg-accent-50 font-mono text-accent-700 transition-colors placeholder:text-accent-300 focus:border-accent-300 focus:ring-2 focus:ring-accent-100 focus:outline-none dark:border-accent-700 dark:bg-accent-950/40 dark:text-accent-300 dark:placeholder:text-accent-600 dark:focus:border-accent-600 dark:focus:ring-accent-900',
      {
        'px-4 py-2.5 text-sm': size === 'md',
        'px-3 py-1.5 text-xs': size === 'sm',
      },
    ]"
  />
</template>
