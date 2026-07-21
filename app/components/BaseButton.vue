<template>
  <button
    type="button"
    class="flex items-center justify-center gap-1.5"
    :class="[
      'rounded-xl font-medium transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-accent-500/50 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40',
      {
        // sizes
        'px-4 py-2.5 text-sm': size === 'md',
        'px-3 py-2 text-xs': size === 'sm',
        // variants
        'bg-accent-600 text-white hover:bg-accent-700 dark:bg-accent-500 dark:hover:bg-accent-400':
          variant === 'default',
        'border border-line bg-surface text-fg hover:bg-surface-2': variant === 'ghost',
        'bg-red-500 text-white hover:bg-red-600': variant === 'danger',
        'border border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950':
          variant === 'danger-ghost',
      },
    ]"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'default' | 'ghost' | 'danger' | 'danger-ghost';
    size?: 'sm' | 'md';
  }>(),
  {
    variant: 'default',
    size: 'md',
  },
);
</script>
