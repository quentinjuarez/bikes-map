<template>
  <BaseButton
    variant="ghost"
    size="sm"
    class="px-2!"
    :title="theme === 'dark' ? t('settings.lightMode') : t('settings.darkMode')"
    @click="toggleTheme"
  >
    {{ theme === 'dark' ? '☀️' : '🌙' }}
  </BaseButton>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

import { useTheme } from '../composables/useTheme';
import BaseButton from './BaseButton.vue';

const { theme, toggleTheme } = useTheme();

const { t } = useI18n();
</script>
