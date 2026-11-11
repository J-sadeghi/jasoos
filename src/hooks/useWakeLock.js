import { useEffect } from 'react';

/** Keep the screen on while `active` is true (Wake Lock API; silently does nothing if unsupported). */
export function useWakeLock(active) {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return undefined;
    let lock = null;
    let cancelled = false;
    const request = async () => {
      try {
        lock = await navigator.wakeLock.request('screen');
        if (cancelled) lock.release().catch(() => {});
      } catch { /* e.g. battery saver — ignore */ }
    };
    // The lock is dropped when the app goes to the background; take it again on return.
    const onVisible = () => { if (document.visibilityState === 'visible') request(); };
    request();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      if (lock) lock.release().catch(() => {});
    };
  }, [active]);
}
