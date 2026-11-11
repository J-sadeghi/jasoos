import { useEffect, useRef, useState } from 'react';
import { isInstallDismissed, dismissInstall } from '../game/storage.js';
import { isNativeApp } from '../platform.js';

/**
 * Which install hint to show: 'ios' (Share → Add to Home Screen), 'android' (real install prompt),
 * 'generic' (browser menu hint) or null.
 */
export function useInstallBanner() {
  const [kind, setKind] = useState(null);
  const deferred = useRef(null);

  useEffect(() => {
    if (isNativeApp()) return undefined;
    const standalone = window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true;
    const dismissed = isInstallDismissed();
    if (standalone || dismissed) return undefined;
    const ua = navigator.userAgent || '';
    const iOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const mobile = iOS || /Android/i.test(ua);
    if (mobile) setKind(iOS ? 'ios' : 'generic');
    const onPrompt = (e) => { e.preventDefault(); deferred.current = e; setKind('android'); };
    const onInstalled = () => setKind(null);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const dismiss = () => { dismissInstall(); setKind(null); };
  const install = () => {
    if (deferred.current) { deferred.current.prompt(); deferred.current = null; }
    dismiss();
  };
  return { kind, dismiss, install };
}
