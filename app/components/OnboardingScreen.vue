<template>
  <div
    class="flex h-full flex-col items-center justify-center gap-6 px-6 text-accent-700 dark:text-accent-300"
  >
    <h1 class="text-2xl font-semibold tracking-wide">
      {{ t('onboarding.title') }}
    </h1>
    <p class="max-w-sm text-center text-sm text-accent-500 dark:text-accent-400">
      {{ t('onboarding.subtitle') }}
    </p>

    <div class="w-full max-w-sm space-y-3">
      <!-- Primary: GPS -->
      <BaseButton class="w-full" size="md" :disabled="geoLoading" @click="locate">
        <SpinnerIcon v-if="geoLoading" size="sm" class="mr-1" />
        {{ geoLoading ? t('onboarding.locating') : t('onboarding.useGps') }}
      </BaseButton>
      <div v-if="geoError" class="text-center text-xs text-red-400">
        {{ geoError }}
      </div>

      <!-- Separator -->
      <div
        class="flex items-center gap-3 text-[11px] tracking-widest text-accent-300 uppercase dark:text-accent-600"
      >
        <span class="h-px flex-1 bg-accent-100 dark:bg-accent-900" />
        {{ t('onboarding.or') }}
        <span class="h-px flex-1 bg-accent-100 dark:bg-accent-900" />
      </div>

      <!-- Secondary: manual input -->
      <BaseInput
        v-model="locationRaw"
        type="text"
        :placeholder="t('onboarding.placeholder')"
        class="w-full"
        @keydown.enter="submitManual"
      />
      <div v-if="locationRaw && parsed" class="text-xs text-green-400">
        ✓ {{ parsed.lat.toFixed(5) }}, {{ parsed.lng.toFixed(5) }}
      </div>
      <div v-else-if="locationRaw && !parsed" class="text-xs text-red-400">
        {{ t('onboarding.cannotParse') }}
      </div>
      <BaseButton
        variant="ghost"
        class="w-full"
        size="sm"
        :disabled="!parsed"
        @click="submitManual"
      >
        {{ t('onboarding.confirmLocation') }}
      </BaseButton>

      <details class="text-[11px] text-accent-300 dark:text-accent-600">
        <summary
          class="cursor-pointer text-center tracking-widest transition-colors hover:text-accent-600 dark:hover:text-accent-400"
        >
          {{ t('onboarding.supportedFormats') }}
        </summary>
        <ul class="mt-2 space-y-1 font-mono">
          <li v-for="f in LOCATION_FORMATS" :key="f">{{ f }}</li>
        </ul>
      </details>
    </div>

    <div class="mt-4 flex items-center gap-2">
      <LanguageSwitcher /> <span>-</span> <ThemeSwitcher />
    </div>

    <!-- Footer legal links -->
    <AppFooter />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';

import { useGeolocation } from '../composables/useGeolocation';
import { useProfileStore } from '../stores/profile';
import { parseLocation, LOCATION_FORMATS } from '../utils/parseLocation';
import AppFooter from './AppFooter.vue';
import BaseButton from './BaseButton.vue';
import BaseInput from './BaseInput.vue';
import LanguageSwitcher from './LanguageSwitcher.vue';
import SpinnerIcon from './SpinnerIcon.vue';
import ThemeSwitcher from './ThemeSwitcher.vue';

const { t } = useI18n();
const store = useProfileStore();
const { error: geoError, loading: geoLoading, locate } = useGeolocation();

const locationRaw = ref('');
const parsed = computed(() => parseLocation(locationRaw.value));

function submitManual() {
  if (!parsed.value) return;
  store.setPosition(parsed.value.lat, parsed.value.lng, 'manual');
}
</script>
