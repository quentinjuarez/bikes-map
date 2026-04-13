import { createPinia } from 'pinia';
import piniaPersistedstate from 'pinia-plugin-persistedstate';
import { createApp } from 'vue';

import './style.css';
import App from './App.vue';
import { i18n } from './i18n';
import router from './router/index';

// Increment this when a breaking change requires wiping all user data.
// Changing the key name from 'lime-tracker-version' to 'bike-tracker:version' acts as
// an implicit migration trigger: old key not found → version 0 < 2 → clear.
const DATA_VERSION = 2;
const VERSION_KEY = 'bike-tracker:version';
if (parseInt(localStorage.getItem(VERSION_KEY) ?? '0') < DATA_VERSION) {
  localStorage.clear();
  localStorage.setItem(VERSION_KEY, String(DATA_VERSION));
}

const pinia = createPinia();
pinia.use(piniaPersistedstate);

createApp(App).use(pinia).use(router).use(i18n).mount('#app');
