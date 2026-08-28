import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const sceneDir = join(process.cwd(), 'src', 'game', 'scenes');
const sceneFiles = [
  'SecretScene.ts','WaterMemoryScene.ts','MayorScene.ts','ButcherScene.ts','ElaineScene.ts',
  'MiloScene.ts','PostmanScene.ts','SorenScene.ts','BlankScene.ts','FinaleScene.ts','EndingScene.ts',
];
for (const file of sceneFiles) {
  const source = readFileSync(join(sceneDir, file), 'utf8');
  assert.equal(source.includes('playCinematic('), false, `${file} must not interrupt play with a chapter cinematic`);
}
const shop = readFileSync(join(sceneDir, 'ShopScene.ts'), 'utf8');
assert.ok(shop.includes('playOpeningFilm('), 'shop must keep the one opening film');
assert.equal(shop.includes("this.playCinematic('cine-box-opened'"), false, 'opening the box must stay in-world');
assert.ok(shop.includes('prologue-masks-settled'), 'prologue must require the visible wall-mask chain before the key');
assert.ok(shop.includes('prologue-doll-spoken'), 'the first-scene doll must participate in the unfinished workshop chain');
assert.ok(shop.includes('pickupBoxTrace'), 'opening the case must reveal clickable evidence rather than auto-awarding it');
assert.ok(shop.includes('prologue-box-opened-v52'), 'an opened-but-not-emptied case must recover correctly after reload');

const secret = readFileSync(join(sceneDir, 'SecretScene.ts'), 'utf8');
assert.ok(secret.includes('createClothDrawer'), 'secret room must expose the witness ticket through a physical drawer interaction');

const blank = readFileSync(join(sceneDir, 'BlankScene.ts'), 'utf8');
assert.ok(blank.includes('createBlankMaskTarget'), 'blank scene must resolve the choice by using an object on the mask, not a hold timer');

console.log('scene-flow.test.ts: scene rhythm, in-world item chains and opening-only cinematic rule passed');
