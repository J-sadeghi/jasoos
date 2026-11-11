import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';
import { pwa } from './build/pwa-plugin.js';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

// The website lives at https://j-sadeghi.github.io/jasoos/  → base "/jasoos/".
// The Android/iOS app (Capacitor) loads files locally        → base "./"  (npm run build:app).
export const GH_PAGES_BASE = '/jasoos/';

export default defineConfig(({ mode }) => {
  const base = mode === 'app' ? './' : GH_PAGES_BASE;
  return {
    base,
    plugins: [react(), pwa({ base, version: pkg.version })],
    define: { __APP_VERSION__: JSON.stringify(pkg.version) },
    build: { target: 'es2019', assetsInlineLimit: 0 },
  };
});
