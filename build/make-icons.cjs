// Draws the app icons from the home-screen logo. Run: node build/make-icons.cjs
const { chromium } = require('playwright');
const fs = require('fs');
// logo: ring = 48/104 of the tile, ring border 7/104, dot 12/104
const logo = (size, tile, radius, bg = '#EDE4D6') => {
  const u = tile / 104, c = size / 2;
  const off = (size - tile) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  ${bg ? `<rect width="${size}" height="${size}" fill="${bg}"/>` : ''}
  <rect x="${off}" y="${off}" width="${tile}" height="${tile}" rx="${radius * u}" fill="#17130F"/>
  <circle cx="${c}" cy="${c}" r="${(48 - 7) / 2 * u}" fill="none" stroke="#F5EDE0" stroke-width="${7 * u}"/>
  <circle cx="${c}" cy="${c}" r="${6 * u}" fill="#C4562A"/></svg>`;
};
// "any" icons: rounded tile on transparent; maskable/apple/store: full-bleed dark square with the logo scaled down
const fullBleed = (size, scale) => {
  const u = (size * scale) / 104, c = size / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#17130F"/>
  <circle cx="${c}" cy="${c}" r="${(48 - 7) / 2 * u}" fill="none" stroke="#F5EDE0" stroke-width="${7 * u}"/>
  <circle cx="${c}" cy="${c}" r="${6 * u}" fill="#C4562A"/></svg>`;
};
const jobs = [
  ['public/icons/icon-192.png', logo(192, 192, 32, null), 192],
  ['public/icons/icon-512.png', logo(512, 512, 32, null), 512],
  ['public/icons/icon-maskable-512.png', fullBleed(512, 0.95), 512],
  ['public/icons/apple-touch-icon.png', fullBleed(180, 0.9), 180],
  ['resources/icon-only.png', fullBleed(1024, 0.9), 1024],
  ['resources/icon-foreground.png', fullBleed(1024, 0.55).replace('<rect width="1024" height="1024" fill="#17130F"/>', ''), 1024],
  ['resources/icon-background.png', `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024"><rect width="1024" height="1024" fill="#17130F"/></svg>`, 1024],
  ['resources/splash.png', `<svg xmlns="http://www.w3.org/2000/svg" width="2732" height="2732"><rect width="2732" height="2732" fill="#F5EDE0"/>${logo(2732, 420, 32, null).replace(/<svg[^>]*>|<\/svg>/g, '')}</svg>`, 2732],
];
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  for (const [file, svg, size] of jobs) {
    await p.setViewportSize({ width: size, height: size });
    await p.setContent(`<html><body style="margin:0;background:transparent">${svg}</body></html>`);
    await p.locator('svg').screenshot({ path: file, omitBackground: true });
    console.log('wrote', file);
  }
  fs.writeFileSync('public/icons/favicon.svg', logo(104, 104, 32, null));
  await b.close();
})();
