<template>
  <div class="min-h-dvh overflow-y-auto bg-canvas text-fg">
    <div class="mx-auto max-w-2xl space-y-8 px-6 py-10">
      <NuxtLink
        to="/"
        class="inline-flex items-center gap-2 text-xs text-muted transition-colors hover:text-fg"
      >
        {{ t('legal.back') }}
      </NuxtLink>

      <LanguageSwitcher />

      <h1 class="text-2xl font-bold">
        {{ t('privacy.title') }}
      </h1>
      <p class="text-xs text-muted">
        {{ t('privacy.updatedAt', { date: lastUpdated }) }}
      </p>

      <!-- 1. General principle -->
      <section class="space-y-2">
        <h2 class="text-sm font-semibold text-fg">
          {{ t('privacy.s1.title') }}
        </h2>
        <p class="text-sm leading-relaxed text-muted">
          {{ t('privacy.s1.content') }}
        </p>
      </section>

      <!-- 2. Geolocation -->
      <section class="space-y-2">
        <h2 class="text-sm font-semibold text-fg">
          {{ t('privacy.s2.title') }}
        </h2>
        <p class="text-sm leading-relaxed text-muted">
          <I18nT keypath="privacy.s2.intro" tag="span">
            <template #solelyToCentre>
              <strong>{{ t('privacy.s2.solelyToCentre') }}</strong>
            </template>
          </I18nT>
        </p>
        <p class="text-sm leading-relaxed text-muted">
          <I18nT keypath="privacy.s2.p2" tag="span">
            <template #locally>
              <strong>{{ t('privacy.s2.locally') }}</strong>
            </template>
            <template #neverSent>
              <strong>{{ t('privacy.s2.neverSent') }}</strong>
            </template>
          </I18nT>
        </p>
      </section>

      <!-- 3. Local storage -->
      <section class="space-y-2">
        <h2 class="text-sm font-semibold text-fg">
          {{ t('privacy.s3.title') }}
        </h2>
        <p class="text-sm leading-relaxed text-muted">
          <I18nT keypath="privacy.s3.intro" tag="span">
            <template #localStorage>
              <strong>{{ t('privacy.s3.localStorage') }}</strong>
            </template>
          </I18nT>
        </p>
        <p class="text-sm leading-relaxed text-muted">
          {{ t('privacy.s3.content') }}
        </p>
      </section>

      <!-- 4. Cookies -->
      <section class="space-y-2">
        <h2 class="text-sm font-semibold text-fg">
          {{ t('privacy.s4.title') }}
        </h2>
        <p class="text-sm leading-relaxed text-muted">
          <I18nT keypath="privacy.s4.intro" tag="span">
            <template #noCookies>
              <strong>{{ t('privacy.s4.noCookies') }}</strong>
            </template>
          </I18nT>
        </p>
      </section>

      <!-- 5. Third-party APIs -->
      <section class="space-y-2">
        <h2 class="text-sm font-semibold text-fg">
          {{ t('privacy.s5.title') }}
        </h2>
        <p class="text-sm leading-relaxed text-muted">
          <strong>{{ t('privacy.s5.gbfsLabel') }}</strong>
          {{ t('privacy.s5.gbfsContent') }}
        </p>
        <p class="text-sm leading-relaxed text-muted">
          <strong>{{ t('privacy.s5.mapLabel') }}</strong>
          {{ t('privacy.s5.mapContent') }}
        </p>
        <p class="text-sm leading-relaxed text-muted">
          <strong>{{ t('privacy.s5.routeLabel') }}</strong>
          {{ t('privacy.s5.routeContent') }}
        </p>
      </section>

      <!-- 6. Security -->
      <section class="space-y-2">
        <h2 class="text-sm font-semibold text-fg">
          {{ t('privacy.s6.title') }}
        </h2>
        <p class="text-sm leading-relaxed text-muted">
          {{ t('privacy.s6.content') }}
        </p>
      </section>

      <!-- 7. GDPR -->
      <section class="space-y-2">
        <h2 class="text-sm font-semibold text-fg">
          {{ t('privacy.s7.title') }}
        </h2>
        <p class="text-sm leading-relaxed text-muted">
          {{ t('privacy.s7.content', { email: ownerEmail }) }}
        </p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n, I18nT } from 'vue-i18n';

import LanguageSwitcher from '../components/LanguageSwitcher.vue';

const { t, locale } = useI18n();

useHead({ title: 'Politique de confidentialité | Bikes Map' });

const ownerEmail = 'contact@quentinjuarez.dev';

const lastUpdated = computed(() =>
  new Intl.DateTimeFormat(locale.value, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date('2026-03-14')),
);
</script>
