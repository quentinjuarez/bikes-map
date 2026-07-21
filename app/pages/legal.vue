<template>
  <div
    class="min-h-dvh overflow-y-auto bg-[#fafaf9] text-accent-700 dark:bg-[#0c0c14] dark:text-accent-300"
  >
    <div class="mx-auto max-w-2xl space-y-8 px-6 py-10">
      <NuxtLink
        to="/"
        class="inline-flex items-center gap-2 text-xs tracking-widest text-accent-400 uppercase transition-colors hover:text-accent-700 dark:text-accent-500 dark:hover:text-accent-300"
      >
        {{ t('legal.back') }}
      </NuxtLink>

      <LanguageSwitcher />

      <h1 class="text-2xl font-bold tracking-widest uppercase">
        {{ t('legalNotice.title') }}
      </h1>
      <p class="text-xs text-accent-400 dark:text-accent-500">
        {{ t('legalNotice.updatedAt', { date: lastUpdated }) }}
      </p>

      <!-- 1. Publisher -->
      <section class="space-y-2">
        <h2
          class="text-sm font-bold tracking-widest text-accent-700 uppercase dark:text-accent-300"
        >
          {{ t('legalNotice.s1.title') }}
        </h2>
        <p class="text-sm leading-relaxed text-accent-600 dark:text-accent-400">
          {{ t('legalNotice.s1.publishedBy') }}<br />
          <span class="text-accent-300 dark:text-accent-600">{{
            t('legalNotice.s1.nameLabel')
          }}</span>
          {{ ownerName }}<br />
          <span class="text-accent-300 dark:text-accent-600">{{
            t('legalNotice.s1.emailLabel')
          }}</span>
          {{ ownerEmail }}
        </p>
      </section>

      <!-- 2. Hosting -->
      <section class="space-y-2">
        <h2
          class="text-sm font-bold tracking-widest text-accent-700 uppercase dark:text-accent-300"
        >
          {{ t('legalNotice.s2.title') }}
        </h2>
        <p class="text-sm leading-relaxed text-accent-600 dark:text-accent-400">
          {{ t('legalNotice.s2.hostedBy') }}<br />
          {{ hostingName }}<br />
          {{ hostingAddress }}
        </p>
      </section>

      <!-- 3. Purpose -->
      <section class="space-y-2">
        <h2
          class="text-sm font-bold tracking-widest text-accent-700 uppercase dark:text-accent-300"
        >
          {{ t('legalNotice.s3.title') }}
        </h2>
        <p class="text-sm leading-relaxed text-accent-600 dark:text-accent-400">
          {{ t('legalNotice.s3.content') }}
        </p>
      </section>

      <!-- 4. As Is -->
      <section class="space-y-2">
        <h2
          class="text-sm font-bold tracking-widest text-accent-700 uppercase dark:text-accent-300"
        >
          {{ t('legalNotice.s4.title') }}
        </h2>
        <p class="text-sm leading-relaxed text-accent-600 dark:text-accent-400">
          <I18nT keypath="legalNotice.s4.intro" tag="span">
            <template #asIs>
              <strong>{{ t('legalNotice.s4.asIs') }}</strong>
            </template>
          </I18nT>
        </p>
        <p
          v-if="t('legalNotice.s4.bullets')"
          class="text-sm leading-relaxed whitespace-pre-line text-accent-600 dark:text-accent-400"
        >
          {{ t('legalNotice.s4.bullets') }}
        </p>
        <p class="text-sm leading-relaxed text-accent-600 dark:text-accent-400">
          {{ t('legalNotice.s4.closing') }}
        </p>
      </section>

      <!-- 5. Third-party data -->
      <section class="space-y-2">
        <h2
          class="text-sm font-bold tracking-widest text-accent-700 uppercase dark:text-accent-300"
        >
          {{ t('legalNotice.s5.title') }}
        </h2>
        <p class="text-sm leading-relaxed text-accent-600 dark:text-accent-400">
          <I18nT keypath="legalNotice.s5.intro" tag="span">
            <template #thirdParty>
              <strong>{{ t('legalNotice.s5.thirdParty') }}</strong>
            </template>
          </I18nT>
        </p>
        <p class="text-sm leading-relaxed text-accent-600 dark:text-accent-400">
          {{ t('legalNotice.s5.content') }}
        </p>
      </section>

      <!-- 6. Non-commercial -->
      <section class="space-y-2">
        <h2
          class="text-sm font-bold tracking-widest text-accent-700 uppercase dark:text-accent-300"
        >
          {{ t('legalNotice.s6.title') }}
        </h2>
        <p class="text-sm leading-relaxed text-accent-600 dark:text-accent-400">
          <I18nT keypath="legalNotice.s6.intro" tag="span">
            <template #strictlyPersonal>
              <strong>{{ t('legalNotice.s6.strictlyPersonal') }}</strong>
            </template>
          </I18nT>
        </p>
        <p class="text-sm leading-relaxed text-accent-600 dark:text-accent-400">
          {{ t('legalNotice.s6.content') }}
        </p>
      </section>

      <!-- 7. Intellectual property -->
      <section class="space-y-2">
        <h2
          class="text-sm font-bold tracking-widest text-accent-700 uppercase dark:text-accent-300"
        >
          {{ t('legalNotice.s7.title') }}
        </h2>
        <p class="text-sm leading-relaxed text-accent-600 dark:text-accent-400">
          {{ t('legalNotice.s7.content') }}
        </p>
      </section>

      <!-- 8. Law -->
      <section class="space-y-2">
        <h2
          class="text-sm font-bold tracking-widest text-accent-700 uppercase dark:text-accent-300"
        >
          {{ t('legalNotice.s8.title') }}
        </h2>
        <p class="text-sm leading-relaxed text-accent-600 dark:text-accent-400">
          {{ t('legalNotice.s8.content') }}
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

useHead({ title: 'Mentions légales & CGU – Bike Tracker' });

const ownerName = 'Quentin Juarez';
const ownerEmail = 'contact@quentinjuarez.dev';
const hostingName = 'Vercel Inc.';
const hostingAddress = '340 S Lemon Ave, Walnut, CA 91789, USA';

const lastUpdated = computed(() =>
  new Intl.DateTimeFormat(locale.value, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date('2026-03-14')),
);
</script>
