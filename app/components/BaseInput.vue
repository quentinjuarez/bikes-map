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
      'rounded-xl border border-line bg-surface-2 font-mono text-fg transition-colors placeholder:text-muted focus:border-accent-500 focus:ring-2 focus:ring-accent-500/30 focus:outline-none',
      {
        'px-4 py-2.5 text-sm': size === 'md',
        'px-3 py-1.5 text-xs': size === 'sm',
      },
    ]"
  />
</template>
