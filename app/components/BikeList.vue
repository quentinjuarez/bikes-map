<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="open"
        class="fixed inset-0 z-2000 bg-accent-500/5 backdrop-blur-sm dark:bg-black/10"
        @click.self="emit('close')"
      />
    </Transition>
    <Transition name="modal">
      <div
        v-if="open"
        class="fixed right-0 bottom-0 left-0 z-2001 flex h-[85dvh] flex-col rounded-t-2xl border-t border-accent-100 bg-white text-accent-700 md:top-1/2 md:bottom-auto md:left-1/2 md:h-[80dvh] md:w-[640px] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl md:border dark:border-accent-900 dark:bg-black dark:text-accent-300"
      >
        <!-- Sticky header -->
        <div class="flex-none px-6 pt-6">
          <div class="mb-4 flex items-center justify-between">
            <h2 class="text-base font-semibold tracking-wide">
              {{ t('bikeList.title') }}
              <span class="ml-2 text-sm font-normal text-accent-400 dark:text-accent-500">
                {{ bikes.length }}
              </span>
            </h2>
            <BaseButton variant="ghost" size="sm" class="px-2!" @click="emit('close')">
              ✕
            </BaseButton>
          </div>

          <!-- Column headers -->
          <div
            class="grid grid-cols-[1fr_60px_100px] gap-2 border-b border-accent-100 px-4 py-2 font-mono text-[11px] tracking-widest text-accent-400 uppercase dark:border-accent-900 dark:text-accent-600"
          >
            <span>{{ t('bikeList.provider') }}</span>
            <span class="text-right">{{ t('bikeList.battery') }}</span>
            <span class="text-right">{{ t('bikeList.distance') }}</span>
          </div>
        </div>

        <!-- Virtual scroll viewport -->
        <div ref="scrollEl" class="flex-1 overflow-y-auto" @scroll.passive="onScroll">
          <!-- Empty state -->
          <div
            v-if="!bikes.length"
            class="py-10 text-center text-sm tracking-wide text-accent-300 dark:text-accent-600"
          >
            {{ t('bikeList.noVehicles') }}
          </div>

          <!-- Virtual spacer -->
          <div v-else :style="{ height: totalHeight + 'px', position: 'relative' }">
            <div
              :style="{
                position: 'absolute',
                top: offsetY + 'px',
                left: 0,
                right: 0,
              }"
            >
              <div
                v-for="entity in visibleItems"
                :key="
                  entity.kind === 'bike'
                    ? `${entity.provider}-${entity.bike_id}`
                    : `${entity.provider}-${entity.station_id}`
                "
                class="grid grid-cols-[1fr_60px_100px] items-center gap-2 border-b border-accent-100 px-4 hover:bg-accent-50 dark:border-accent-900 dark:hover:bg-accent-950"
                :style="{ height: ROW_HEIGHT + 'px' }"
              >
                <!-- Provider -->
                <span
                  class="text-sm font-bold tracking-wide uppercase"
                  :class="{
                    'text-lime-brand': entity.provider === 'lime',
                    'text-voi-brand': entity.provider === 'voi',
                    'text-dott-brand': entity.provider === 'dott',
                    'text-velib-brand': entity.provider === 'velib',
                  }"
                >
                  {{ entity.provider }}
                </span>

                <!-- Battery / bikes available -->
                <span
                  v-if="entity.kind === 'bike'"
                  class="text-right font-mono text-sm font-bold"
                  :class="batteryColor(entity.battery_percent ?? undefined)"
                >
                  {{ entity.battery_percent != null ? `${entity.battery_percent}%` : '---' }}
                </span>
                <span
                  v-else
                  class="text-right font-mono text-sm font-bold text-velib-brand"
                  :title="`${entity.num_docks_available} docks libres`"
                >
                  {{ entity.num_bikes_available }}
                </span>

                <!-- Distance -->
                <span class="text-right font-mono text-sm text-accent-600 dark:text-accent-400">
                  {{ formatDistance(entity.distance) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';

import type { MapEntity } from '../composables/useBikes';
import BaseButton from './BaseButton.vue';

const { t } = useI18n();

const props = defineProps<{
  open: boolean;
  bikes: MapEntity[];
}>();

const emit = defineEmits<{ close: [] }>();

// ── Virtual list ─────────────────────────────────────────────────────

const ROW_HEIGHT = 48; // px, must match the :style height on each row
const OVERSCAN = 3;

const scrollEl = ref<HTMLElement | null>(null);
const scrollTop = ref(0);
const containerHeight = ref(0);

let ro: ResizeObserver | null = null;

watch(
  () => props.open,
  (val) => {
    if (val) {
      scrollTop.value = 0;
      nextTick(() => {
        if (!scrollEl.value) return;
        containerHeight.value = scrollEl.value.clientHeight;
        ro = new ResizeObserver(() => {
          containerHeight.value = scrollEl.value?.clientHeight ?? 0;
        });
        ro.observe(scrollEl.value);
      });
    } else {
      ro?.disconnect();
      ro = null;
    }
  },
);

onUnmounted(() => ro?.disconnect());

function onScroll() {
  scrollTop.value = scrollEl.value?.scrollTop ?? 0;
}

const startIndex = computed(() => Math.max(0, Math.floor(scrollTop.value / ROW_HEIGHT) - OVERSCAN));

const endIndex = computed(() =>
  Math.min(
    props.bikes.length,
    Math.ceil((scrollTop.value + containerHeight.value) / ROW_HEIGHT) + OVERSCAN,
  ),
);

const visibleItems = computed(() => props.bikes.slice(startIndex.value, endIndex.value));

const totalHeight = computed(() => props.bikes.length * ROW_HEIGHT);
const offsetY = computed(() => startIndex.value * ROW_HEIGHT);

// ── Helpers ───────────────────────────────────────────────────────────

function formatDistance(m?: number) {
  if (m == null) return '---';
  if (m < 1000) return `${Math.round(m)}m`;
  return `${(m / 1000).toFixed(1)}km`;
}

function batteryColor(pct?: number): string {
  if (pct == null) return 'text-accent-300 dark:text-accent-600';
  if (pct >= 60) return 'text-green-400';
  if (pct >= 30) return 'text-yellow-400';
  return 'text-red-400';
}
</script>
