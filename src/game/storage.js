// Small wrapper around localStorage that never throws (private mode, blocked storage…).
const KEYS = { lang: 'jasoos.lang', a2hs: 'jasoos.a2hs', settings: 'jasoos.settings.v3' };

const read = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const write = (k, v) => { try { localStorage.setItem(k, v); } catch { /* ignore */ } };

export const loadLang = () => read(KEYS.lang);
export const saveLang = (l) => write(KEYS.lang, l);
export const isInstallDismissed = () => read(KEYS.a2hs) === '1';
export const dismissInstall = () => write(KEYS.a2hs, '1');

export function loadSettings() {
  try { return JSON.parse(read(KEYS.settings) || 'null'); } catch { return null; }
}
export const saveSettings = (s) => write(KEYS.settings, JSON.stringify(s));
