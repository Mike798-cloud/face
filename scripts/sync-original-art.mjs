import { existsSync, statSync, unlinkSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(process.cwd());
const publicRoot = join(root, 'public', 'assets');
const images = [
  'mask-shop.webp','mask-shop-clean.webp','secret-room.webp','water-memory.webp','mayor.webp','butcher.webp',
  'elaine.webp','milo.webp','postman.webp','soren.webp','blank.webp','finale.webp','coast-house.webp',
];
const audio = ['clock.wav','glass.wav','knock.wav','sea.wav','shop.wav'];

function valid(path, minBytes = 1024) {
  try { return existsSync(path) && statSync(path).size > minBytes; }
  catch { return false; }
}

const missing = [];
for (const file of images) {
  const path = join(publicRoot, 'images', file);
  if (!valid(path)) missing.push(`public/assets/images/${file}`);
}
for (const file of audio) {
  const path = join(publicRoot, 'audio', file);
  if (!valid(path)) missing.push(`public/assets/audio/${file}`);
}

if (missing.length) {
  console.error('[art] Required release artwork/audio is missing or truncated:');
  for (const file of missing) console.error(`  - ${file}`);
  console.error('[art] The Vite project is self-contained; legacy /assets fallbacks and network downloads are intentionally disabled.');
  process.exit(1);
}

// Never allow the old programmer-art scene SVGs to shadow the packaged hand-painted WebP set.
const placeholders = ['shop.svg','secret.svg','water.svg','mayor.svg','butcher.svg','elaine.svg','milo.svg','postman.svg','soren.svg','blank.svg','finale.svg','ending.svg'];
for (const file of placeholders) {
  const path = join(publicRoot, 'images', file);
  if (existsSync(path)) {
    unlinkSync(path);
    console.log(`[art] removed placeholder: public/assets/images/${file}`);
  }
}

console.log(`[art] packaged release artwork ready (${images.length} scenes, ${audio.length} core ambience files); no legacy fallback directory required.`);
