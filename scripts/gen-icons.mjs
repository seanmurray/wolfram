// Generate the PWA icon set from the Wolfram mark.
//
//   brand/mark.svg → icon-192.png, icon-512.png, apple-touch-icon.png,
//                    favicon.png
//
// brand/ sits outside public/ so the source never ships in the precache.
// The wordmark is live text (Fraunces) in the app header, not an image.
// Run via `npm run gen-icons`.

import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.resolve(__dirname, '..', 'public');
const SOURCE = path.resolve(__dirname, '..', 'brand', 'mark.svg');

const TARGETS = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'favicon.png', size: 64 },
];

const svg = await readFile(SOURCE);
// Render at 4× then downsample so the glow gradients stay smooth.
const render = (size) =>
  sharp(svg, { density: Math.max(72, (72 * size * 4) / 1024) }).resize(size, size);

for (const { name, size } of TARGETS) {
  const buf = await render(size).png({ compressionLevel: 9 }).toBuffer();
  await writeFile(path.join(PUBLIC, name), buf);
  console.log(`wrote public/${name} (${size}×${size}, ${(buf.length / 1024).toFixed(1)} KB)`);
}

// ── iOS app (Capacitor) ─────────────────────────────────────────────────────
// The App Store icon must have NO alpha channel, or the upload is rejected.
// The launch screen is the mark as a rounded tile on the bone canvas; the
// storyboard aspect-fills the square, so the centre is what shows.
const ASSETS = path.resolve(__dirname, '..', 'ios', 'App', 'App', 'Assets.xcassets');
if (existsSync(ASSETS)) {
  const icon = await render(1024).flatten({ background: '#1d1a17' }).removeAlpha().png().toBuffer();
  await writeFile(path.join(ASSETS, 'AppIcon.appiconset', 'AppIcon-512@2x.png'), icon);
  console.log('wrote ios AppIcon-512@2x.png (1024×1024, no alpha)');

  const TILE = 440;
  const mask = Buffer.from(`<svg width="${TILE}" height="${TILE}"><rect width="${TILE}" height="${TILE}" rx="${TILE * 0.22}"/></svg>`);
  const tile = await render(TILE).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
  const splash = await sharp({ create: { width: 2732, height: 2732, channels: 3, background: '#f5efe6' } })
    .composite([{ input: tile, gravity: 'center' }])
    .flatten({ background: '#f5efe6' })
    .removeAlpha()
    .png({ compressionLevel: 9 })
    .toBuffer();
  for (const f of ['splash-2732x2732.png', 'splash-2732x2732-1.png', 'splash-2732x2732-2.png']) {
    await writeFile(path.join(ASSETS, 'Splash.imageset', f), splash);
  }
  console.log('wrote ios launch images (2732×2732 ×3)');
}
