import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { recoverIfNeeded, backupSoon } from './lib/localdb.js'
import { isNative } from './lib/nativeFile.js'
import { useSettingsStore } from './stores/settingsStore'
import { useClassStore } from './stores/classStore'
import { useSlotStore } from './stores/slotStore'

// Dev-mode service-worker cleanup. vite-plugin-pwa only generates an SW in
// production builds, but a developer who once ran `npm run build/preview`
// can have a stale SW registered for localhost that then intercepts dev
// fetches. Clear it on dev boot.
if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    if (regs.length > 0) {
      console.log('[dev] Unregistering', regs.length, 'service worker(s).');
      regs.forEach((r) => r.unregister());
    }
  }).catch(() => { /* ignore */ });
}

// The service worker is for the WEB build only. In the native WebView it
// precaches the bundle, so the first launch after a rebuild + `cap sync`
// serves the PREVIOUS build. Native assets already live on the device, so the
// SW buys nothing there; native also tears down any SW an older build left.
async function setupServiceWorker() {
  if (isNative()) {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
    if (typeof caches !== 'undefined') {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
    return;
  }
  if (!import.meta.env.PROD) return;
  const { registerSW } = await import('virtual:pwa-register');
  registerSW({ immediate: true });
}
setupServiceWorker().catch((e) => console.warn('[wolfram] service worker setup skipped', e));

// All of the user's data lives in on-device storage. On the web, ask for
// PERSISTENT storage so it can't be auto-evicted under storage pressure
// (WebKit grants it to Home Screen web apps). Native keeps its own copy in
// the app's Documents folder (lib/nativeFile.js).
if (!isNative() && navigator.storage?.persist) {
  navigator.storage.persisted().then((already) => {
    if (!already) navigator.storage.persist().catch(() => {});
  }).catch(() => {});
}

const PREF_STORES = [useSettingsStore, useClassStore, useSlotStore];

// If the primary storage came back empty but a backup copy survived (the
// native data file, the IndexedDB mirror, or the snapshot), restore it before
// the first render. The preference stores loaded from localStorage when their
// modules were imported, i.e. BEFORE this ran, so after a restore they must
// re-read it. Otherwise they'd keep empty defaults, show onboarding, and the
// first tap would write those defaults over the restored settings.
recoverIfNeeded()
  .then(async (r) => {
    if (!r) return;
    console.warn(`[wolfram] Restored ${r.restored} session(s) from ${r.from}.`);
    await Promise.all(PREF_STORES.map((s) => s.persist.rehydrate()));
  })
  .catch(() => { /* recovery is best-effort; never block boot */ })
  .finally(() => {
    // Settings, the class library and slot swaps change outside localdb's
    // writes, so each change schedules a backup of everything.
    PREF_STORES.forEach((s) => s.subscribe(() => backupSoon()));
    createRoot(document.getElementById('root')).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  });
