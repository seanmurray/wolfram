// Generate the PWA icon set from the Wolfram mark.
//
//   brand/mark.svg → icon-192.png, icon-512.png, apple-touch-icon.png,
//                    favicon.png
//
// brand/ sits outside public/ so the source never ships in the precache.
// The wordmark is live text (Fraunces) in the app header, not an image.
// Run via `npm run gen-icons`.

import { readFile, writeFile } from 'node:fs/promises';
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
for (const { name, size } of TARGETS) {
  // Render at 4× then downsample so the glow gradients stay smooth.
  const buf = await sharp(svg, { density: Math.max(72, (72 * size * 4) / 1024) })
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toBuffer();
  await writeFile(path.join(PUBLIC, name), buf);
  console.log(`wrote public/${name} (${size}×${size}, ${(buf.length / 1024).toFixed(1)} KB)`);
}
