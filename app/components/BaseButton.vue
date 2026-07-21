<template>
  <button
    type="button"
    class="flex items-center justify-center gap-1"
    :class="[
      'rounded-xl font-medium tracking-wide backdrop-blur-sm transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-40',
      {
        // sizes
        'px-4 py-2.5 text-sm': size === 'md',
        'px-3 py-1.5 text-xs': size === 'sm',
        // variants
        'bg-accent-600 text-white shadow-sm hover:bg-accent-700 dark:bg-accent-500 dark:hover:bg-accent-400':
          variant === 'default',
        'border border-accent-200 bg-transparent text-accent-600 hover:bg-accent-50 dark:border-accent-700 dark:text-accent-400 dark:hover:bg-accent-950':
          variant === 'ghost',
        'bg-red-500 text-white shadow-sm hover:bg-red-600': variant === 'danger',
        'border border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950':
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
