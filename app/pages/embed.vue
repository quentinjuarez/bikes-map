<template>
  <div class="relative h-full w-full overflow-hidden bg-[#fafaf9] dark:bg-[#0c0c14]">
    <!-- Params missing: show inline error instead of a blank map -->
    <div
      v-if="missingParams"
      class="flex h-full flex-col items-center justify-center gap-2 text-sm text-accent-500 dark:text-accent-400"
    >
      Missing required query params:
      <code class="font-mono text-accent-500 dark:text-accent-400">?lat=…&lng=…</code>
    </div>

    <!-- Wait until params are applied so BikeMap mounts at the right position -->
    <template v-else-if="ready">
      <BikeMap
        :bikes="bikes"
        :user-lat="store.lat ?? undefined"
        :user-lng="store.lng ?? undefined"
      />

      <div
        v-if="error"
        class="fixed bottom-4 left-1/2 z-1000 -translate-x-1/2 rounded-lg border border-red-800 bg-red-900 px-3 py-2 font-mono text-xs text-red-400 shadow-lg"
      >
        {{ error }}
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

import BikeMap from '../components/BikeMap.vue';
import { useBikes } from '../composables/useBikes';
import { applyQueryParams } from '../composables/useQueryParams';
import { useProfileStore } from '../stores/profile';

const store = useProfileStore();

// Apply params synchronously during setup — before useBikes registers its
// position watcher. This way the watcher captures the correct initial value
// and never fires a redundant second fetch on mount.
const ok = applyQueryParams(window.location.search);
const missingParams = ref(!ok);
const ready = ref(ok); // gate BikeMap so it mounts with position already set

const { bikes, error } = useBikes();
</script>
