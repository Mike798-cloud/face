import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

function fail(message) { throw new Error(`[dist-audit] ${message}`); }
const dist = 'dist';
const indexPath = join(dist, 'index.html');
if (!existsSync(indexPath)) fail('dist/index.html is missing');
if (!existsSync(join(dist, '.nojekyll'))) fail('dist/.nojekyll is missing; GitHub Pages may apply Jekyll processing');

const index = readFileSync(indexPath, 'utf8');
if (/\/src\/main\.ts/.test(index)) fail('development TypeScript entry leaked into dist/index.html');
if (/(?:src|href)=["']\/assets\//.test(index)) fail('root /assets/ URL found; GitHub project Pages requires /face/ base URLs');

const refs = [...index.matchAll(/(?:src|href)=["'](\/face\/[^"'#?]+)/g)].map((match) => match[1]);
if (!refs.length) fail('dist/index.html has no /face/ build references');
for (const ref of refs) {
  const local = join(dist, ref.replace(/^\/face\//, ''));
  if (!existsSync(local)) fail(`index references missing built file: ${ref}`);
}

const requiredPublic = [
  'assets/images/mask-shop.webp', 'assets/images/mayor.webp', 'assets/images/butcher.webp',
  'assets/images/interaction/shop-box-base.png', 'assets/audio/shop.wav',
  'assets/audio/voice/dialogue-mayor.ogg', 'assets/audio/voice/dialogue-butcher.ogg',
];
for (const file of requiredPublic) if (!existsSync(join(dist, file))) fail(`public asset missing from dist: ${file}`);

const forbidden = ['assets/game.js', 'assets/game.css'];
for (const file of forbidden) if (existsSync(join(dist, file))) fail(`legacy runtime leaked into dist: ${file}`);

const empty = [];
function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path);
    else if (entry.name !== '.nojekyll' && statSync(path).size === 0) empty.push(relative(dist, path));
  }
}
walk(dist);
if (empty.length) fail(`zero-byte build files: ${empty.join(', ')}`);
console.log(`dist-audit: ${refs.length} /face/ entry references resolve; required public assets copied; no legacy runtime or zero-byte files.`);
