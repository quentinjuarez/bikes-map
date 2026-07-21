<template>
  <div class="flex gap-2">
    <BaseButton
      v-for="loc in SUPPORTED_LOCALES"
      :key="loc"
      :variant="locale === loc ? 'default' : 'ghost'"
      :size="size"
      class="uppercase"
      @click="switchLocale(loc)"
    >
      {{ loc }}
    </BaseButton>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

import { setLocale, SUPPORTED_LOCALES, type Locale } from '../i18n';
import BaseButton from './BaseButton.vue';

withDefaults(defineProps<{ size?: 'sm' | 'md' }>(), { size: 'sm' });

const { locale } = useI18n();

function switchLocale(loc: Locale) {
  setLocale(loc);
}
</script>
