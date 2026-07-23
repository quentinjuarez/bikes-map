<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="open" class="fixed inset-0 z-2000 bg-black/40" @click.self="emit('close')" />
    </Transition>
    <Transition name="slide">
      <div
        v-if="open"
        :style="drag.style"
        class="fixed inset-x-0 bottom-0 z-2001 flex max-h-[85dvh] flex-col overflow-hidden rounded-t-2xl border-t border-line bg-surface text-fg shadow-sheet md:inset-y-0 md:right-0 md:left-auto md:h-full md:max-h-none md:w-[min(28rem,100%)] md:rounded-none md:border-t-0 md:border-l"
      >
        <!-- Header (also the mobile swipe-to-dismiss zone) -->
        <div v-on="drag.handlers" class="flex-none touch-none">
          <div class="mx-auto mt-2 h-1 w-9 rounded-full bg-line md:hidden" aria-hidden="true" />
          <div class="flex items-center justify-between border-b border-line px-6 py-4">
            <h2 class="text-base font-semibold">{{ t('settings.title') }}</h2>
            <button
              class="rounded-lg p-1.5 text-muted transition-colors hover:bg-surface-2 hover:text-fg focus-visible:ring-2 focus-visible:ring-accent-500/50 focus-visible:outline-none"
              :aria-label="t('settings.done')"
              @click="emit('close')"
            >
              <X :size="20" />
            </button>
          </div>
        </div>

        <!-- Scrollable body -->
        <div class="flex-1 space-y-6 overflow-y-auto p-6">
          <!-- Filters -->
          <section class="space-y-4">
            <h3 class="text-sm font-semibold text-fg">{{ t('settings.filters') }}</h3>

            <BaseSlider
              :label="t('settings.maxDistance')"
              :display-value="
                store.maxDistance === UNSET
                  ? t('settings.noLimit')
                  : t('settings.walkMin', { n: metersToWalkMinutes(store.maxDistance) })
              "
              :model-value="
                store.maxDistance === UNSET ? 0 : metersToWalkMinutes(store.maxDistance)
              "
              :min="0"
              :max="20"
              :step="1"
              @update:model-value="
                store.setMaxDistance($event === 0 ? UNSET : walkMinutesToMeters($event))
              "
            />

            <BaseSlider
              :label="t('settings.minBattery')"
              :display-value="
                store.minBattery === UNSET ? t('settings.anyBattery') : `${store.minBattery}%`
              "
              :model-value="store.minBattery === UNSET ? 0 : store.minBattery"
              :min="0"
              :max="FILTER_BOUNDS.minBattery.max"
              :step="FILTER_BOUNDS.minBattery.step"
              @update:model-value="store.setMinBattery($event === 0 ? UNSET : $event)"
            />
          </section>

          <!-- Language -->
          <section class="space-y-2">
            <h3 class="text-sm font-semibold text-fg">{{ t('settings.language') }}</h3>
            <LanguageSwitcher />
          </section>

          <!-- Location -->
          <section class="space-y-3">
            <h3 class="text-sm font-semibold text-fg">{{ t('settings.location') }}</h3>

            <!-- Address / place search -->
            <div class="relative">
              <BaseInput
                v-model="searchQuery"
                size="sm"
                type="text"
                :placeholder="t('geo.searchPlaceholder')"
                class="w-full"
                @input="onSearchInput"
              />
              <ul
                v-if="searchResults.length"
                class="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-line bg-surface shadow-pop"
              >
                <li v-for="r in searchResults" :key="`${r.lat},${r.lng}`">
                  <button
                    class="block w-full truncate px-3 py-2 text-left text-sm text-fg transition-colors hover:bg-surface-2"
                    @click="pickResult(r)"
                  >
                    {{ r.label }}
                  </button>
                </li>
              </ul>
              <p
                v-else-if="searched && !searching && searchQuery.trim().length >= 3"
                class="mt-1 text-xs text-muted"
              >
                {{ t('geo.noResults') }}
              </p>
            </div>

            <div class="flex flex-wrap items-center justify-between gap-2">
              <div
                v-if="store.hasPosition"
                class="flex items-center gap-2 font-mono text-xs text-muted"
              >
                <span
                  v-if="store.locationMode === 'geo' && !geoLoading"
                  class="relative flex h-2 w-2 flex-none"
                >
                  <span
                    class="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"
                  />
                  <span class="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                </span>
                <SpinnerIcon v-else-if="geoLoading" size="sm" />
                {{ store.lat?.toFixed(5) }}, {{ store.lng?.toFixed(5) }}
                <span>{{ store.locationMode === 'geo' ? '(GPS)' : '(manual)' }}</span>
              </div>
              <span v-else class="text-xs text-muted">{{ t('settings.noLocation') }}</span>

              <button
                class="flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-1.5 text-xs font-medium text-fg transition-colors hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-accent-500/50 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                :disabled="geoLoading"
                @click="locate"
              >
                <SpinnerIcon v-if="geoLoading" size="sm" />
                <LocateFixed v-else :size="14" />
                {{ geoLoading ? t('main.locating') : t('main.locateMe') }}
              </button>
            </div>

            <p v-if="geoError" class="text-xs text-red-500">{{ geoError }}</p>

            <!-- Manual location -->
            <div class="space-y-2 pt-1">
              <p class="text-xs text-muted">{{ t('geo.enterManually') }}</p>

              <div class="flex gap-2">
                <BaseInput
                  v-model="locationRaw"
                  size="sm"
                  type="text"
                  :placeholder="t('geo.placeholder')"
                  class="min-w-0 flex-1"
                  @keydown.enter="submitManual"
                />
                <button
                  class="shrink-0 rounded-xl bg-accent-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-accent-700 focus-visible:ring-2 focus-visible:ring-accent-500/50 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40"
                  :disabled="!parsedLocation"
                  @click="submitManual"
                >
                  {{ t('geo.confirm') }}
                </button>
              </div>

              <div
                v-if="locationRaw && parsedLocation"
                class="flex items-center gap-1.5 text-[11px] text-green-600 dark:text-green-400"
              >
                <Check :size="14" />
                {{ parsedLocation.lat.toFixed(5) }}, {{ parsedLocation.lng.toFixed(5) }}
              </div>
              <div
                v-else-if="locationRaw && !parsedLocation"
                class="flex items-center gap-1.5 text-[11px] text-red-500"
              >
                <X :size="14" />
                {{ t('geo.cannotParse') }}
              </div>
              <p class="text-[10px] leading-relaxed text-muted">{{ t('geo.helperText') }}</p>
            </div>
          </section>

          <!-- Actions -->
          <div class="space-y-2">
            <BaseButton variant="ghost" size="sm" class="w-full" @click="copyLink">
              <component :is="linkCopied ? Check : Link" :size="14" />
              {{ linkCopied ? t('settings.linkCopied') : t('settings.copyLink') }}
            </BaseButton>
            <BaseButton variant="danger-ghost" size="sm" class="w-full" @click="store.resetFilters">
              {{ t('settings.resetDefaults') }}
            </BaseButton>
          </div>

          <AppFooter />
        </div>

        <!-- Footer action -->
        <div class="flex-none border-t border-line p-4">
          <BaseButton class="w-full" @click="emit('close')">{{ t('settings.done') }}</BaseButton>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { Check, Link, LocateFixed, X } from '@lucide/vue';
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import { useGeolocation } from '../composables/useGeolocation';
import { useSwipeDismiss } from '../composables/useSwipeDismiss';
import { useProfileStore } from '../stores/profile';
import { ALL_PROVIDERS, FILTER_BOUNDS, UNSET } from '../types';
import { parseLocation } from '../utils/parseLocation';
import { metersToWalkMinutes, walkMinutesToMeters } from '../utils/walking';
import AppFooter from './AppFooter.vue';
import BaseButton from './BaseButton.vue';
import BaseInput from './BaseInput.vue';
import BaseSlider from './BaseSlider.vue';
import LanguageSwitcher from './LanguageSwitcher.vue';
import SpinnerIcon from './SpinnerIcon.vue';

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ close: [] }>();

const drag = useSwipeDismiss(() => emit('close'));

const store = useProfileStore();
const { t } = useI18n();
const { error: geoError, loading: geoLoading, locate } = useGeolocation();

// Filters and providers now apply live to the store (no buffered draft), so
// closing the panel is unambiguous — nothing is silently committed on close.

// ── Manual location input ────────────────────────────────────────────
const locationRaw = ref('');
const parsedLocation = computed(() => parseLocation(locationRaw.value));

function submitManual() {
  if (!parsedLocation.value) return;
  store.setPosition(parsedLocation.value.lat, parsedLocation.value.lng, 'manual');
  locationRaw.value = '';
}

// ── Address / place search (BAN geocoder via /api/geocode) ───────────
interface GeoResult {
  label: string;
  lat: number;
  lng: number;
}
const searchQuery = ref('');
const searchResults = ref<GeoResult[]>([]);
const searching = ref(false);
const searched = ref(false);
let searchTimer: ReturnType<typeof setTimeout> | null = null;

function onSearchInput() {
  if (searchTimer) clearTimeout(searchTimer);
  const q = searchQuery.value.trim();
  if (q.length < 3) {
    searchResults.value = [];
    searched.value = false;
    return;
  }
  searchTimer = setTimeout(async () => {
    searching.value = true;
    try {
      searchResults.value = await $fetch<GeoResult[]>('/api/geocode', { params: { q } });
    } catch {
      searchResults.value = [];
    } finally {
      searching.value = false;
      searched.value = true;
    }
  }, 250);
}

function pickResult(r: GeoResult) {
  store.setPosition(r.lat, r.lng, 'manual');
  searchQuery.value = '';
  searchResults.value = [];
  searched.value = false;
}

watch(
  () => props.open,
  (open) => {
    if (!open) {
      locationRaw.value = '';
      searchQuery.value = '';
      searchResults.value = [];
      searched.value = false;
    }
  },
);

// ── Copy link ────────────────────────────────────────────────────────
const linkCopied = ref(false);

function copyLink() {
  if (!store.hasPosition) return;

  const params = new URLSearchParams();
  params.set('lat', store.lat!.toString());
  params.set('lng', store.lng!.toString());
  if (store.providers.join(',') !== ALL_PROVIDERS.join(','))
    params.set('providers', store.providers.join(','));
  if (store.limit !== FILTER_BOUNDS.limit.default) params.set('limit', store.limit.toString());
  if (store.maxDistance !== FILTER_BOUNDS.maxDistance.default)
    params.set('maxDist', (store.maxDistance === UNSET ? 0 : store.maxDistance).toString());
  if (store.minBattery !== FILTER_BOUNDS.minBattery.default)
    params.set('minBat', (store.minBattery === UNSET ? 0 : store.minBattery).toString());

  const qs = params.toString();
  const url = `${window.location.origin}${window.location.pathname}${qs ? `?${qs}` : ''}`;
  navigator.clipboard.writeText(url).then(() => {
    linkCopied.value = true;
    setTimeout(() => (linkCopied.value = false), 2000);
  });
}
</script>
