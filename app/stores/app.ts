import { defineStore } from 'pinia';

export const useAppStore = defineStore('bike-tracker:app', {
  state: () => ({
    onboardingSeen: false,
    installDismissed: false,
  }),
  persist: true,
});
