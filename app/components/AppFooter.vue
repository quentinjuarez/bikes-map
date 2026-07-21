<template>
  <div class="flex items-center justify-center gap-3 border-t border-line pt-4 text-xs text-muted">
    <NuxtLink to="/legal" class="transition-colors hover:text-fg">{{ t('footer.legal') }}</NuxtLink>
    <span class="h-3 w-px bg-line" aria-hidden="true" />
    <NuxtLink to="/privacy" class="transition-colors hover:text-fg">
      {{ t('footer.privacy') }}
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>
