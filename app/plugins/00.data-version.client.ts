// Increment DATA_VERSION when a breaking change requires wiping all user data.
// Runs before any Pinia store hydrates (plugins run before component setup),
// so a stale persisted state is cleared before pinia-plugin-persistedstate
// reads it back.
export default defineNuxtPlugin(() => {
  const DATA_VERSION = 2;
  const VERSION_KEY = 'bike-tracker:version';
  if (parseInt(localStorage.getItem(VERSION_KEY) ?? '0') < DATA_VERSION) {
    localStorage.clear();
    localStorage.setItem(VERSION_KEY, String(DATA_VERSION));
  }
});
