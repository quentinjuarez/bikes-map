<template>
  <div class="relative h-full w-full overflow-hidden bg-canvas">
    <!-- Params missing: show inline error instead of a blank map -->
    <div
      v-if="missingParams"
      class="flex h-full flex-col items-center justify-center gap-2 text-sm text-muted"
    >
      Missing required query params:
      <code class="font-mono text-fg">?lat=…&lng=…</code>
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
        class="fixed bottom-4 left-1/2 z-1000 -translate-x-1/2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 shadow-pop dark:border-red-900 dark:bg-red-950 dark:text-red-300"
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
