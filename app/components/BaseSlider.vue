<template>
  <div class="space-y-1">
    <div class="flex justify-between text-xs">
      <span class="text-fg">{{ label }}</span>
      <span class="font-mono text-muted">{{ displayValue }}</span>
    </div>
    <input
      type="range"
      :value="model"
      :min="min"
      :max="max"
      :step="step ?? 1"
      class="slider w-full"
      @input="model = Number(($event.target as HTMLInputElement).value)"
    />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label: string;
  displayValue: string;
  min: number;
  max: number;
  step?: number;
}>();

const model = defineModel<number>({ required: true });
</script>

<style scoped>
.slider {
  -webkit-appearance: none;
  appearance: none;
  height: 3px;
  background: var(--slider-track);
  border-radius: 2px;
  outline: none;
}
.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--slider-thumb);
  cursor: pointer;
  border: 2px solid var(--slider-ring);
  transition: transform 0.1s ease;
}
.slider::-webkit-slider-thumb:hover {
  transform: scale(1.15);
}
.slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--slider-thumb);
  cursor: pointer;
  border: 2px solid var(--slider-ring);
}
</style>
