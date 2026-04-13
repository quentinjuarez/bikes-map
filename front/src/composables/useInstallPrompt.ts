import { ref } from 'vue';

import { useAppStore } from '../stores/app';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// ── Platform detection ────────────────────────────────────────────────

export const isIOS =
  typeof window !== 'undefined' &&
  (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

// ── Module-level singleton ────────────────────────────────────────────
// Listeners and deferred prompt live at module scope — beforeinstallprompt
// fires at most once and must not be missed by a component remount.
//
// isDismissed is read directly from the lt:app Pinia persist key (same JSON
// Pinia writes) so we can check it before the Vue app is created.
// Writes go through useAppStore() once Pinia is available (component context).

function readInstallDismissed(): boolean {
  try {
    const raw = localStorage.getItem('bike-tracker:app');
    if (raw) return JSON.parse(raw)?.installDismissed === true;
  } catch {}
  return false;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
export const showBanner = ref(false);

export const isInstalled =
  typeof window !== 'undefined' &&
  window.matchMedia('(display-mode: standalone)').matches;

// Debug info — updated reactively so a debug panel can display live state
export const debugInstall = ref({
  isIOS,
  isInstalled,
  isHttps: typeof window !== 'undefined' && location.protocol === 'https:',
  promptFired: false,
  promptFiredAt: null as string | null,
  hasDeferredPrompt: false,
  appInstalled: false,
  isDismissed: readInstallDismissed(),
  showBanner: false,
  swRegistered: false,
  swState: 'unknown' as string,
  userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
});

if (typeof window !== 'undefined' && !isInstalled) {
  // Async: check SW registration state
  navigator.serviceWorker?.getRegistration().then((reg) => {
    debugInstall.value.swRegistered = !!reg;
    debugInstall.value.swState = reg?.active?.state ?? reg?.installing?.state ?? reg?.waiting?.state ?? 'none';
  });

  if (isIOS) {
    setTimeout(() => {
      const dismissed = readInstallDismissed();
      debugInstall.value.isDismissed = dismissed;
      if (!dismissed) showBanner.value = true;
      debugInstall.value.showBanner = showBanner.value;
    }, 2000);
  } else {
    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault();
      deferredPrompt = e as BeforeInstallPromptEvent;
      debugInstall.value.promptFired = true;
      debugInstall.value.promptFiredAt = new Date().toISOString();
      debugInstall.value.hasDeferredPrompt = true;
      setTimeout(() => {
        const dismissed = readInstallDismissed();
        debugInstall.value.isDismissed = dismissed;
        if (!dismissed) showBanner.value = true;
        debugInstall.value.showBanner = showBanner.value;
      }, 2000);
    });

    window.addEventListener('appinstalled', () => {
      deferredPrompt = null;
      showBanner.value = false;
      debugInstall.value.appInstalled = true;
      debugInstall.value.hasDeferredPrompt = false;
      debugInstall.value.showBanner = false;
    });
  }
}

// ── Public composable ─────────────────────────────────────────────────

export function useInstallPrompt() {
  async function triggerInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      deferredPrompt = null;
      showBanner.value = false;
    }
  }

  function dismiss() {
    showBanner.value = false;
    useAppStore().installDismissed = true;
  }

  return { showBanner, isIOS, triggerInstall, dismiss };
}
