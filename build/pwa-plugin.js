// Tiny Vite plugin: writes manifest.webmanifest and sw.js into the build.
// sw.js gets a NEW cache name on every build and a list of every built file,
// so players always get the newest version and the whole game works offline.
import { readdirSync, statSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

function listFiles(dir, root = dir) {
  let out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out = out.concat(listFiles(p, root));
    else out.push(relative(root, p).split('\\').join('/'));
  }
  return out;
}

export function manifest(base) {
  return {
    id: base,
    name: 'جاسوس',
    short_name: 'جاسوس',
    lang: 'fa',
    dir: 'rtl',
    description: 'بازی مهمانی جاسوس با یک گوشی',
    start_url: base,
    scope: base,
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#F5EDE0',
    theme_color: '#17130F',
    icons: [
      { src: `${base}icons/icon-192.png`, sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: `${base}icons/icon-512.png`, sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: `${base}icons/icon-maskable-512.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}

export function pwa({ base, version }) {
  let publicDir = 'public';
  return {
    name: 'jasoos-pwa',
    apply: 'build',
    configResolved(cfg) { publicDir = cfg.publicDir; },
    generateBundle(_opts, bundle) {
      const buildId = `${version}-${Date.now().toString(36)}`;
      const files = new Set(['./', 'index.html', 'manifest.webmanifest']);
      for (const f of Object.keys(bundle)) if (!f.endsWith('.map')) files.add(f);
      for (const f of listFiles(publicDir)) files.add(f);
      files.delete('sw.js');

      const sw = readFileSync(new URL('./sw-template.js', import.meta.url), 'utf8')
        .replace('__BUILD_ID__', buildId)
        .replace('__ASSETS__', JSON.stringify([...files].sort(), null, 1));

      this.emitFile({ type: 'asset', fileName: 'manifest.webmanifest', source: JSON.stringify(manifest(base), null, 2) });
      this.emitFile({ type: 'asset', fileName: 'sw.js', source: sw });
      this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ version, build: buildId }) });
    },
  };
}
