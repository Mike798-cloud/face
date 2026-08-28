import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const sceneDir = join(root, 'src', 'game', 'scenes');
const sceneFiles = [
  'ShopScene.ts','SecretScene.ts','WaterMemoryScene.ts','MayorScene.ts','ButcherScene.ts',
  'ElaineScene.ts','MiloScene.ts','PostmanScene.ts','SorenScene.ts','BlankScene.ts',
  'FinaleScene.ts','EndingScene.ts',
];

for (const file of sceneFiles) {
  const source = readFileSync(join(sceneDir, file), 'utf8');
  const refs = [...source.matchAll(/preloadImage\('[^']+',\s*'([^']+)'\)/g)].map((match) => match[1]!);
  for (const ref of refs) {
    const asset = join(root, 'public', 'assets', 'images', ref);
    assert.ok(existsSync(asset), `${file}: missing image asset ${ref}`);
    assert.ok(statSync(asset).size > 100, `${file}: image asset is suspiciously small ${ref}`);
  }
}

const shop = readFileSync(join(sceneDir, 'ShopScene.ts'), 'utf8');
const openBoxStart = shop.indexOf('private openBox(');
const renderBoxStart = shop.indexOf('private renderOpenedBox(');
assert.ok(openBoxStart >= 0 && renderBoxStart > openBoxStart, 'shop box methods must exist');
const openBoxBody = shop.slice(openBoxStart, renderBoxStart);
assert.equal(openBoxBody.includes("trace-rubbing-found"), false, 'opening the case must not silently grant the rubbing');
assert.equal(openBoxBody.includes("trace-thread-found"), false, 'opening the case must not silently grant the thread');

const css = readFileSync(join(root, 'src', 'styles', 'v4.css'), 'utf8');
assert.match(css, /body::before \{ opacity:0/, 'global noise overlay must stay disabled in the clean-art pass');
assert.match(css, /\.grain \{ opacity:0/, 'scanline grain must stay disabled in the clean-art pass');
assert.match(css, /backdrop-filter:none/, 'world chrome must not blur the scene underneath it');

console.log('release-regression.test.ts: assets, physical pickups and clean presentation guards passed');
