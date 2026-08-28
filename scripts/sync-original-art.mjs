import { existsSync, mkdirSync, copyFileSync, statSync, writeFileSync, unlinkSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const root = resolve(process.cwd());
const targetRoot = join(root, 'public', 'assets');
const legacyRoots = [join(root, 'assets'), join(root, '..', 'assets'), join(root, '..', '..', 'assets')];
const repoRaw = 'https://raw.githubusercontent.com/Mike798-cloud/face/main/assets';

const images = [
  'mask-shop.webp','secret-room.webp','water-memory.webp','mayor.webp','butcher.webp',
  'elaine.webp','milo.webp','postman.webp','soren.webp','blank.webp','finale.webp','coast-house.webp'
];
const audio = ['clock.wav','glass.wav','knock.wav','sea.wav','shop.wav'];
const groups = [['images', images], ['audio', audio]];

function valid(path) {
  try { return existsSync(path) && statSync(path).size > 1024; } catch { return false; }
}

async function ensure(kind, file) {
  const dest = join(targetRoot, kind, file);
  if (valid(dest)) return 'kept';
  mkdirSync(dirname(dest), { recursive: true });

  for (const legacyRoot of legacyRoots) {
    const local = join(legacyRoot, kind, file);
    if (valid(local)) {
      copyFileSync(local, dest);
      return 'copied';
    }
  }

  const url = `${repoRaw}/${kind}/${file}`;
  const response = await fetch(url, { redirect: 'follow' });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.byteLength <= 1024) throw new Error(`downloaded asset is unexpectedly small: ${url}`);
  writeFileSync(dest, bytes);
  return 'downloaded';
}

let changed = 0;
for (const [kind, files] of groups) {
  for (const file of files) {
    try {
      const status = await ensure(kind, file);
      if (status !== 'kept') { changed++; console.log(`[art] ${status}: ${kind}/${file}`); }
    } catch (error) {
      console.error(`\n[art] Cannot restore original artwork: ${kind}/${file}`);
      console.error(String(error));
      console.error('\nDo NOT continue with the SVG placeholder build.');
      console.error('Copy the original repository assets/ folder into this project, then run npm run sync:art again.');
      process.exit(1);
    }
  }
}


// Never ship the programmer-art scene placeholders once the original WebP set is ready.
const placeholders = ['shop.svg','secret.svg','water.svg','mayor.svg','butcher.svg','elaine.svg','milo.svg','postman.svg','soren.svg','blank.svg','finale.svg','ending.svg'];
for (const file of placeholders) {
  const path = join(targetRoot, 'images', file);
  if (existsSync(path)) {
    unlinkSync(path);
    console.log(`[art] removed placeholder: images/${file}`);
  }
}

console.log(`[art] original artwork ready (${changed} restored); placeholder scene SVGs removed.`);
