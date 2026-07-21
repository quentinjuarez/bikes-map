import { createI18n } from 'vue-i18n';

import en from './locales/en';
import fr from './locales/fr';

export type Locale = 'en' | 'fr';
export const SUPPORTED_LOCALES: Locale[] = ['en', 'fr'];

function detectLocale(): Locale {
  const saved = localStorage.getItem('bike-tracker:locale') as Locale | null;
  if (saved && SUPPORTED_LOCALES.includes(saved)) return saved;

  // Probe browser/system language
  const candidates = [...(navigator.languages ?? []), navigator.language].filter(Boolean);

  for (const lang of candidates) {
    if (lang.startsWith('fr')) return 'fr';
  }
  return 'en';
}

export const i18n = createI18n({
  legacy: false, // Composition API mode
  locale: detectLocale(),
  fallbackLocale: 'en',
  messages: { en, fr },
});

export function setLocale(locale: Locale) {
  (i18n.global.locale as { value: Locale }).value = locale;
  localStorage.setItem('bike-tracker:locale', locale);
  document.documentElement.lang = locale;
}
