// Registers the service worker (offline support) on the website only — not inside the Android/iOS app.
import { isNativeApp } from './platform.js';

let pending = false;
let canReloadNow = () => false;

/** App tells us when reloading is safe (only on the home screen, never mid-game). */
export const setReloadGuard = (fn) => { canReloadNow = fn; };

/** Called when the player returns to the home screen. */
export function applyPendingUpdate() {
  if (pending) { pending = false; window.location.reload(); }
}

export function registerSW() {
  if (import.meta.env.DEV || isNativeApp() || !('serviceWorker' in navigator)) return;
  const base = import.meta.env.BASE_URL;
  let hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController) { hadController = true; return; } // first install, nothing to refresh
    if (canReloadNow()) window.location.reload();
    else pending = true;
  });
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${base}sw.js`, { scope: base }).then((reg) => {
      // Look for a new version each time the app comes back to the foreground.
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') reg.update().catch(() => {});
      });
    }).catch(() => {});
  });
}
