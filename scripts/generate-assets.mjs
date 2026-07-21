// Generates every app asset from two SVG sources in assets-src/.
// Edit assets-src/icon.svg or assets-src/og.svg, then `yarn assets`.
import { readFile, writeFile, copyFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = (f) => join(root, 'assets-src', f);
const out = (f) => join(root, 'public', f);

// name → pixel size, rendered from icon.svg. `flatten` fills the rounded
// corners (Apple masks its own shape, so it wants an opaque square).
const ICONS = [
  { file: 'favicon-16.png', size: 16 },
  { file: 'favicon-32.png', size: 32 },
  { file: 'favicon-48.png', size: 48 },
  { file: 'apple-touch-icon.png', size: 180, flatten: '#2563eb' },
  { file: 'icon-192.png', size: 192 },
  { file: 'icon-512.png', size: 512 },
];

// ICO container wrapping PNG payloads (favicon.ico, 16/32/48).
function buildIco(entries) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(entries.length, 4);
  const dir = Buffer.alloc(16 * entries.length);
  let offset = 6 + dir.length;
  entries.forEach((e, i) => {
    const d = dir.subarray(i * 16);
    d.writeUInt8(e.size >= 256 ? 0 : e.size, 0); // width
    d.writeUInt8(e.size >= 256 ? 0 : e.size, 1); // height
    d.writeUInt16LE(1, 4); // color planes
    d.writeUInt16LE(32, 6); // bits per pixel
    d.writeUInt32LE(e.buf.length, 8);
    d.writeUInt32LE(offset, 12);
    offset += e.buf.length;
  });
  return Buffer.concat([header, dir, ...entries.map((e) => e.buf)]);
}

const iconSvg = await readFile(src('icon.svg'));
// High-density master → crisp downscales at every size.
const master = await sharp(iconSvg, { density: 512 }).resize(1024, 1024).png().toBuffer();

const written = [];
const pngBySize = {};

for (const { file, size, flatten } of ICONS) {
  let img = sharp(master).resize(size, size);
  if (flatten) img = img.flatten({ background: flatten });
  const buf = await img.png().toBuffer();
  await writeFile(out(file), buf);
  pngBySize[size] = buf;
  written.push(`${file} (${size}×${size})`);
}

// favicon.ico (16/32/48) + favicon.svg (source of truth, crisp at any size)
await writeFile(
  out('favicon.ico'),
  buildIco([16, 32, 48].map((s) => ({ size: s, buf: pngBySize[s] }))),
);
written.push('favicon.ico (16/32/48)');
await copyFile(src('icon.svg'), out('favicon.svg'));
written.push('favicon.svg');

// Social share card
const ogBuf = await sharp(await readFile(src('og.svg')), { density: 144 })
  .resize(1200, 630)
  .png()
  .toBuffer();
await writeFile(out('og.png'), ogBuf);
written.push('og.png (1200×630)');

// eslint-disable-next-line no-console
console.log('Generated:\n  ' + written.join('\n  '));
