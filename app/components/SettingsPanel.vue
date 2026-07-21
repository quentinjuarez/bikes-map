<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="open"
        class="fixed inset-0 z-2000 bg-accent-500/5 backdrop-blur-sm dark:bg-black/10"
        @click.self="emit('close')"
      />
    </Transition>
    <Transition name="slide">
      <div
        v-if="open"
        class="fixed right-0 bottom-0 left-0 z-2001 max-h-[85dvh] overflow-y-auto rounded-t-2xl border-t border-accent-100 bg-white text-accent-700 md:top-0 md:right-0 md:bottom-auto md:left-auto md:h-full md:max-h-none md:w-xl md:rounded-none md:border-t-0 md:border-l dark:border-accent-900 dark:bg-black dark:text-accent-300"
      >
        <div class="space-y-6 p-6">
          <!-- Header -->
          <div class="flex items-center justify-between">
            <h2 class="text-base font-semibold tracking-wide">
              {{ t('settings.title') }}
            </h2>
            <div class="flex items-center gap-2">
              <ThemeSwitcher />
              <BaseButton variant="ghost" size="sm" class="px-2!" @click="save"> ✕ </BaseButton>
            </div>
          </div>

          <!-- ── Providers ─────────────────────────────────────────── -->
          <section class="space-y-2">
            <h3 class="text-xs font-medium tracking-widest text-accent-500 uppercase">
              {{ t('settings.providers') }}
            </h3>
            <label
              v-for="p in allProviders"
              :key="p.id"
              class="flex cursor-pointer items-center gap-3"
            >
              <input
                type="checkbox"
                :checked="draft.providers.includes(p.id)"
                class="accent-accent"
                @change="toggleDraftProvider(p.id)"
              />
              <span class="text-sm font-bold uppercase" :class="p.colorClass">
                {{ p.id }}
              </span>
            </label>
          </section>

          <!-- ── Filters ───────────────────────────────────────────── -->
          <section class="space-y-4">
            <h3 class="text-xs font-medium tracking-widest text-accent-500 uppercase">
              {{ t('settings.filters') }}
            </h3>

            <BaseSlider
              :label="t('settings.maxDistance')"
              :display-value="
                draft.maxDistance === UNSET
                  ? t('settings.noLimit')
                  : t('settings.walkMin', {
                      n: metersToWalkMinutes(draft.maxDistance),
                    })
              "
              :model-value="
                draft.maxDistance === UNSET ? 0 : metersToWalkMinutes(draft.maxDistance)
              "
              :min="0"
              :max="20"
              :step="1"
              @update:model-value="
                draft.maxDistance = $event === 0 ? UNSET : walkMinutesToMeters($event)
              "
            />

            <BaseSlider
              :label="t('settings.minBattery')"
              :display-value="
                draft.minBattery === UNSET ? t('settings.anyBattery') : `${draft.minBattery}%`
              "
              :model-value="draft.minBattery === UNSET ? 0 : draft.minBattery"
              :min="0"
              :max="FILTER_BOUNDS.minBattery.max"
              :step="FILTER_BOUNDS.minBattery.step"
              @update:model-value="draft.minBattery = $event === 0 ? UNSET : $event"
            />
          </section>

          <!-- Language -->
          <section class="space-y-2">
            <h3 class="text-xs font-medium tracking-widest text-accent-500 uppercase">
              {{ t('settings.language') }}
            </h3>
            <LanguageSwitcher />
          </section>

          <!-- ── Location ──────────────────────────────────────────── -->
          <section class="space-y-3">
            <h3 class="text-xs font-medium tracking-widest text-accent-500 uppercase">
              {{ t('settings.location') }}
            </h3>

            <!-- Current position + GPS button row -->
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div
                v-if="store.hasPosition"
                class="flex items-center gap-2 font-mono text-xs text-accent-500 dark:text-accent-400"
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
                <span class="text-accent-300 dark:text-accent-600">
                  {{ store.locationMode === 'geo' ? '(GPS)' : '(manual)' }}
                </span>
              </div>
              <span v-else class="text-xs text-accent-400">—</span>

              <button
                class="flex items-center gap-2 rounded-xl border border-accent-200 bg-accent-500/5 px-3 py-1.5 text-xs font-medium text-accent-600 transition-colors hover:bg-accent-100/60 disabled:cursor-not-allowed disabled:opacity-50 dark:border-accent-700 dark:text-accent-400 dark:hover:bg-white/5"
                :disabled="geoLoading"
                @click="locate"
              >
                <SpinnerIcon v-if="geoLoading" size="sm" />
                <svg
                  v-else
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-3.5 w-3.5 flex-none"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
                </svg>
                {{ geoLoading ? t('main.locating') : t('main.locateMe') }}
              </button>
            </div>

            <!-- Geo error -->
            <p v-if="geoError" class="text-xs text-red-400">{{ geoError }}</p>

            <!-- Manual location -->
            <div class="space-y-2 pt-1">
              <p class="text-xs text-accent-500 dark:text-accent-400">
                {{ t('geo.enterManually') }}
              </p>

              <!-- Input + confirm in a row -->
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
                  class="shrink-0 rounded-xl bg-accent-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-40"
                  :disabled="!parsedLocation"
                  @click="submitManual"
                >
                  {{ t('geo.confirm') }}
                </button>
              </div>

              <!-- Live feedback -->
              <div
                v-if="locationRaw && parsedLocation"
                class="flex items-center gap-1.5 text-[11px] text-green-500 dark:text-green-400"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-3 w-3 flex-none"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {{ parsedLocation.lat.toFixed(5) }},
                {{ parsedLocation.lng.toFixed(5) }}
              </div>
              <div
                v-else-if="locationRaw && !parsedLocation"
                class="flex items-center gap-1.5 text-[11px] text-red-400"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-3 w-3 flex-none"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                {{ t('geo.cannotParse') }}
              </div>
              <p class="text-[10px] leading-relaxed text-accent-400 dark:text-accent-600">
                {{ t('geo.helperText') }}
              </p>
            </div>
          </section>

          <!-- Reset -->
          <BaseButton variant="danger-ghost" size="sm" class="w-full" @click="resetDraft">
            {{ t('settings.resetDefaults') }}
          </BaseButton>

          <!-- Copy link -->
          <BaseButton variant="ghost" size="sm" class="w-full" @click="copyLink">
            {{ linkCopied ? t('settings.linkCopied') : '🔗 ' + t('settings.copyLink') }}
          </BaseButton>

          <!-- Footer legal links -->
          <AppFooter />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import { useGeolocation } from '../composables/useGeolocation';
import { useProfileStore } from '../stores/profile';
import { type Provider, ALL_PROVIDERS, FILTER_BOUNDS, UNSET } from '../types';
import { parseLocation } from '../utils/parseLocation';
import { metersToWalkMinutes, walkMinutesToMeters } from '../utils/walking';
import AppFooter from './AppFooter.vue';
import BaseButton from './BaseButton.vue';
import BaseInput from './BaseInput.vue';
import BaseSlider from './BaseSlider.vue';
import LanguageSwitcher from './LanguageSwitcher.vue';
import SpinnerIcon from './SpinnerIcon.vue';
import ThemeSwitcher from './ThemeSwitcher.vue';

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ close: [] }>();

const store = useProfileStore();
const { t } = useI18n();
const { error: geoError, loading: geoLoading, locate } = useGeolocation();

// ── Manual location input ────────────────────────────────────────────
const locationRaw = ref('');
const parsedLocation = computed(() => parseLocation(locationRaw.value));

function submitManual() {
  if (!parsedLocation.value) return;
  store.setPosition(parsedLocation.value.lat, parsedLocation.value.lng, 'manual');
  locationRaw.value = '';
}

// ── Providers list ───────────────────────────────────────────────────
const allProviders: { id: Provider; colorClass: string }[] = [
  { id: 'lime', colorClass: 'text-lime-brand' },
  { id: 'voi', colorClass: 'text-voi-brand' },
  { id: 'dott', colorClass: 'text-dott-brand' },
  { id: 'velib', colorClass: 'text-velib-brand' },
];

// ── Draft (buffered until Save) ──────────────────────────────────────
interface Draft {
  providers: Provider[];
  limit: number;
  maxDistance: number;
  minBattery: number;
}

function draftFromStore(): Draft {
  return {
    providers: [...store.providers],
    limit: store.limit,
    maxDistance: store.maxDistance,
    minBattery: store.minBattery,
  };
}

const draft = reactive<Draft>(draftFromStore());

watch(
  () => props.open,
  (open) => {
    if (open) {
      Object.assign(draft, draftFromStore());
    } else {
      locationRaw.value = '';
    }
  },
);

function toggleDraftProvider(id: Provider) {
  const idx = draft.providers.indexOf(id);
  if (idx === -1) {
    draft.providers.push(id);
  } else if (draft.providers.length > 1) {
    draft.providers.splice(idx, 1);
  }
}

function resetDraft() {
  draft.providers = [...ALL_PROVIDERS];
  draft.limit = FILTER_BOUNDS.limit.default;
  draft.maxDistance = FILTER_BOUNDS.maxDistance.default;
  draft.minBattery = FILTER_BOUNDS.minBattery.default;
}

function save() {
  store.providers = [...draft.providers];
  store.setLimit(draft.limit);
  store.setMaxDistance(draft.maxDistance);
  store.setMinBattery(draft.minBattery);
  emit('close');
}

// ── Copy link ────────────────────────────────────────────────────────
const linkCopied = ref(false);

function copyLink() {
  if (!store.hasPosition) return;

  const params = new URLSearchParams();
  params.set('lat', store.lat!.toString());
  params.set('lng', store.lng!.toString());
  if (draft.providers.join(',') !== ALL_PROVIDERS.join(','))
    params.set('providers', draft.providers.join(','));
  if (draft.limit !== FILTER_BOUNDS.limit.default) params.set('limit', draft.limit.toString());
  if (draft.maxDistance !== FILTER_BOUNDS.maxDistance.default)
    params.set('maxDist', (draft.maxDistance === UNSET ? 0 : draft.maxDistance).toString());
  if (draft.minBattery !== FILTER_BOUNDS.minBattery.default)
    params.set('minBat', (draft.minBattery === UNSET ? 0 : draft.minBattery).toString());

  const qs = params.toString();
  const url = `${window.location.origin}${window.location.pathname}${qs ? `?${qs}` : ''}`;
  navigator.clipboard.writeText(url).then(() => {
    linkCopied.value = true;
    setTimeout(() => (linkCopied.value = false), 2000);
  });
}
</script>
