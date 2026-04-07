<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="open"
        class="fixed inset-0 bg-accent-500/5 dark:bg-black/10 backdrop-blur-sm z-2000"
        @click.self="emit('close')"
      />
    </Transition>
    <Transition name="modal">
      <div
        v-if="open"
        class="fixed bottom-0 left-0 right-0 h-[85dvh] rounded-t-2xl border-t border-accent-100 dark:border-accent-900 bg-white dark:bg-black text-accent-700 dark:text-accent-300 z-2001 flex flex-col md:bottom-auto md:left-1/2 md:-translate-x-1/2 md:top-1/2 md:-translate-y-1/2 md:h-[80dvh] md:w-[640px] md:rounded-2xl md:border"
      >
        <!-- Sticky header -->
        <div class="flex-none px-6 pt-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-base font-semibold tracking-wide">
              {{ t('bikeList.title') }}
              <span
                class="text-accent-400 dark:text-accent-500 text-sm font-normal ml-2"
              >
                {{ bikes.length }}
              </span>
            </h2>
            <BaseButton
              variant="ghost"
              size="sm"
              class="px-2!"
              @click="emit('close')"
            >
              ✕
            </BaseButton>
          </div>

          <!-- Column headers -->
          <div
            class="grid grid-cols-[1fr_60px_100px] gap-2 px-4 py-2 border-b border-accent-100 dark:border-accent-900 text-accent-400 dark:text-accent-600 text-[11px] uppercase tracking-widest font-mono"
          >
            <span>{{ t('bikeList.provider') }}</span>
            <span class="text-right">{{ t('bikeList.battery') }}</span>
            <span class="text-right">{{ t('bikeList.distance') }}</span>
          </div>
        </div>

        <!-- Virtual scroll viewport -->
        <div
          ref="scrollEl"
          class="flex-1 overflow-y-auto"
          @scroll.passive="onScroll"
        >
          <!-- Empty state -->
          <div
            v-if="!bikes.length"
            class="text-center text-accent-300 dark:text-accent-600 text-sm py-10 tracking-wide"
          >
            {{ t('bikeList.noVehicles') }}
          </div>

          <!-- Virtual spacer -->
          <div
            v-else
            :style="{ height: totalHeight + 'px', position: 'relative' }"
          >
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
                class="grid grid-cols-[1fr_60px_100px] gap-2 items-center px-4 border-b border-accent-100 dark:border-accent-900 hover:bg-accent-50 dark:hover:bg-accent-950"
                :style="{ height: ROW_HEIGHT + 'px' }"
              >
                <!-- Provider -->
                <span
                  class="text-sm font-bold uppercase tracking-wide"
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
                  class="text-right text-sm font-bold font-mono"
                  :class="batteryColor(entity.battery_percent)"
                >
                  {{
                    entity.battery_percent != null
                      ? `${entity.battery_percent}%`
                      : '---'
                  }}
                </span>
                <span
                  v-else
                  class="text-right text-sm font-bold font-mono text-velib-brand"
                  :title="`${entity.num_docks_available} docks libres`"
                >
                  {{ entity.num_bikes_available }}
                </span>

                <!-- Distance -->
                <span
                  class="text-right text-accent-600 dark:text-accent-400 text-sm font-mono"
                >
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

const startIndex = computed(() =>
  Math.max(0, Math.floor(scrollTop.value / ROW_HEIGHT) - OVERSCAN),
);

const endIndex = computed(() =>
  Math.min(
    props.bikes.length,
    Math.ceil((scrollTop.value + containerHeight.value) / ROW_HEIGHT) +
      OVERSCAN,
  ),
);

const visibleItems = computed(() =>
  props.bikes.slice(startIndex.value, endIndex.value),
);

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
