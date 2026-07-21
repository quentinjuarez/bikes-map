<template>
  <div class="w-full space-y-3">
    <!-- GPS -->
    <BaseButton class="w-full" :disabled="geoLoading" @click="chooseGeo">
      <SpinnerIcon v-if="geoLoading" size="sm" class="mr-1" />
      {{ geoLoading ? 'Locating…' : 'Use my GPS location' }}
    </BaseButton>
    <div v-if="geoError" class="text-xs text-red-400">{{ geoError }}</div>

    <div
      class="text-center text-[11px] tracking-widest text-accent-300 uppercase dark:text-accent-600"
    >
      or
    </div>

    <!-- Manual input -->
    <BaseInput
      v-model="locationRaw"
      type="text"
      placeholder="Paste coordinates or Google Maps link…"
      class="w-full"
      @keydown.enter="submitCustom"
    />
    <div v-if="locationRaw && parsed" class="text-xs text-green-400">
      ✓ {{ parsed.lat.toFixed(5) }}, {{ parsed.lng.toFixed(5) }}
    </div>
    <div v-else-if="locationRaw && !parsed" class="text-xs text-red-400">
      Could not parse location
    </div>
    <BaseButton class="w-full" size="sm" :disabled="!parsed" @click="submitCustom">
      Confirm location
    </BaseButton>
    <details class="text-[11px] text-accent-300 dark:text-accent-600">
      <summary
        class="cursor-pointer tracking-widest transition-colors hover:text-accent-600 dark:hover:text-accent-400"
      >
        Supported formats
      </summary>
      <ul class="mt-2 space-y-1 font-mono">
        <li v-for="f in LOCATION_FORMATS" :key="f">{{ f }}</li>
      </ul>
    </details>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';

import { useGeolocation } from '../composables/useGeolocation';
import { useProfileStore } from '../stores/profile';
import { parseLocation, LOCATION_FORMATS } from '../utils/parseLocation';
import BaseButton from './BaseButton.vue';
import BaseInput from './BaseInput.vue';
import SpinnerIcon from './SpinnerIcon.vue';

const props = defineProps<{ isOnboarding?: boolean }>();
const emit = defineEmits<{ done: [] }>();

const store = useProfileStore();
const { error: geoError, loading: geoLoading, locate } = useGeolocation();

const locationRaw = ref('');
const parsed = computed(() => parseLocation(locationRaw.value));

// Close picker when GPS succeeds
watch(
  () => [store.lat, store.lng] as const,
  ([lat, lng], [oldLat, oldLng]) => {
    if (!props.isOnboarding && lat != null && lng != null && (lat !== oldLat || lng !== oldLng)) {
      emit('done');
    }
  },
);

function chooseGeo() {
  locate();
}

function submitCustom() {
  if (!parsed.value) return;
  store.setPosition(parsed.value.lat, parsed.value.lng, 'manual');
  emit('done');
}

function reset() {
  locationRaw.value = '';
}

defineExpose({ reset });
</script>
