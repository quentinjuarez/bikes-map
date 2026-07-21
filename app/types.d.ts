// Web APIs not yet in TypeScript's lib.dom.d.ts
import { BeforeInstallPromptEvent } from './types';

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

export {};
