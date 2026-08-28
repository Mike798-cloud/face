import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const required = [
  'index.html', 'package.json', 'package-lock.json', 'tsconfig.json', 'vite.config.ts',
  '.github/workflows/deploy.yml', 'src/main.ts', 'src/core/GameState.ts', 'src/core/SaveManager.ts',
  'public/assets/audio/shop.wav',
  'public/assets/images/mask-shop.webp', 'public/assets/images/secret-room.webp',
  'public/assets/images/water-memory.webp', 'public/assets/images/mayor.webp',
  'public/assets/images/butcher.webp', 'public/assets/images/elaine.webp',
  'public/assets/images/milo.webp', 'public/assets/images/postman.webp',
  'public/assets/images/soren.webp', 'public/assets/images/blank.webp',
  'public/assets/images/finale.webp', 'public/assets/images/coast-house.webp',
  ...Array.from({ length: 12 }, (_, i) => `public/assets/images/interaction/elaine-piece-${String(i).padStart(2, '0')}.webp`),
  'public/assets/images/interaction/shop-box.png',
  'public/assets/images/mask-shop-clean.webp',
  'public/assets/images/interaction/shop-stool.png',
  'public/assets/images/interaction/brass-key.png',
  'public/assets/images/interaction/trace-rubbing.webp',
  'public/assets/images/interaction/trace-thread.webp',
  'public/assets/images/interaction/trace-ticket.webp',
  'public/assets/audio/voice/opening-v46-1.ogg',
  'public/assets/audio/voice/opening-v46-2.ogg',
  'public/assets/audio/voice/opening-v46-3.ogg',
  'public/assets/audio/voice/opening-v46-4.ogg',
  'public/assets/audio/voice/dialogue-shop-doll.ogg',
  'public/assets/audio/voice/dialogue-mayor.ogg',
  'public/assets/audio/voice/dialogue-butcher.ogg',
  'public/assets/audio/voice/dialogue-elaine.ogg',
  'public/assets/audio/voice/dialogue-milo.ogg',
  'public/assets/audio/voice/dialogue-postman.ogg',
  'public/assets/audio/voice/dialogue-soren.ogg',
  'public/assets/audio/voice/dialogue-water-woman.ogg',
];

const legacyPaths = ['assets', 'scripts/sync-static-assets.mjs'];
const lingeringLegacy = legacyPaths.filter((path) => existsSync(path));
if (lingeringLegacy.length) throw new Error(`Legacy runtime files must be deleted: ${lingeringLegacy.join(', ')}`);

const missing = required.filter((file) => !existsSync(file));
if (missing.length) throw new Error(`Missing required files: ${missing.join(', ')}`);

const tinyArt = required.filter((file) => {
  if (!/\.(?:webp|png)$/.test(file)) return false;
  const minBytes = file.includes('/interaction/') ? 256 : 1024;
  return statSync(file).size <= minBytes;
});
if (tinyArt.length) throw new Error(`Artwork looks invalid/empty: ${tinyArt.join(', ')}`);

const voiceDir = join('public', 'assets', 'audio', 'voice');
const voiceFiles = existsSync(voiceDir) ? readdirSync(voiceDir).filter((name) => name.endsWith('.ogg')) : [];
if (voiceFiles.length < 40) throw new Error(`Voice package looks incomplete: only ${voiceFiles.length} OGG files found`);
for (const name of voiceFiles) {
  const path = join(voiceDir, name);
  const bytes = readFileSync(path);
  if (bytes.length <= 2048 || bytes.subarray(0, 4).toString('ascii') !== 'OggS') {
    throw new Error(`Invalid packaged voice asset: ${path}`);
  }
}

const sourceFiles = [];
function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path);
    else if (/\.(ts|css|html|mjs|yml|json)$/.test(entry.name)) sourceFiles.push(path);
  }
}
walk('src');
const forbidden = [/@ts-ignore\b/, /@ts-nocheck\b/, /\bas unknown as\b/, /\bPhaser\s*=\s*window\./];
const violations = [];
for (const file of sourceFiles) {
  const text = readFileSync(file, 'utf8');
  for (const pattern of forbidden) if (pattern.test(text)) violations.push(`${file}: ${pattern}`);
  if (file.includes(`${join('game','scenes')}`) && /preloadSvg\(|(?:shop|secret|water|mayor|butcher|elaine|milo|postman|soren|blank|finale|ending)\.svg/.test(text)) {
    violations.push(`${file}: placeholder SVG scene art is forbidden in release scenes`);
  }
  if (file.includes(`${join('game','scenes')}`) && /shop-(?:lamp|doll|chair)(?:-repair)?\.(?:png|webp)/.test(text)) {
    violations.push(`${file}: legacy movable shop cut-outs are forbidden because they expose ghost silhouettes in the painted background`);
  }
}
if (violations.length) throw new Error(`Release audit failed:\n${violations.join('\n')}`);
console.log(`audit-project: ${sourceFiles.length} source/config files checked; packaged WebP artwork and ${voiceFiles.length} OGG voice files verified; legacy /assets runtime removed; no placeholder scene SVG, ghost-cutout references or forbidden TS escapes.`);
