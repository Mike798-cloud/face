import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path: string): string => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const base = read('src/game/scenes/BaseScene.ts');
assert.match(base, /speakWorldLineOnce/, 'world dialogue must be gated to one voiced playback per scene/role');
assert.match(base, /voice-once-v52:/, 'voice-once save flag must persist across revisits');
assert.match(base, /playVoice\(voiceId, volume, undefined, \(\) => \{[\s\S]*hiddenFlags\.push\(flag\)/, 'one-shot voice flag must be written only after playback actually starts');

const shop = read('src/game/scenes/ShopScene.ts');
assert.match(shop, /prologue-mask-closed:/, 'prologue must require visible mask-state interaction');
assert.match(shop, /prologue-masks-settled/, 'prologue masks must gate the later key reveal');
assert.match(shop, /Distance\.Between\(stool\.x, stool\.y, 820, 590\)/, 'high key must require moving the stool within reach');
assert.doesNotMatch(shop, /prologue-mask-clue-seen/, 'abstract hidden sequence-paper mechanic should no longer drive the prologue');
assert.match(shop, /prologue-doll-spoken[\s\S]*prologue-masks-settled[\s\S]*!lampOn/, 'the first-scene doll must participate in the key reveal chain');
assert.match(shop, /shop-box-lid/, 'wooden case must have a separate hinged lid');
assert.match(shop, /setOrigin\(\.5, 1\)/, 'wooden case lid must hinge from its rear/bottom edge');
assert.match(shop, /targetLidScaleY = lidBaseScaleY \* 3\.15/, 'wooden case lid must visibly rise upward rather than squashing the whole case');
assert.match(shop, /pickupBoxTrace/, 'objects revealed inside the wooden case must be physical clickable pickups');
assert.match(shop, /prologue-box-opened-v52/, 'partially opened case state must survive reload without auto-completing the prologue');

const secret = read('src/game/scenes/SecretScene.ts');
assert.match(secret, /createClothDrawer/, 'secret room must use a physical cloth/drawer discovery');
assert.match(secret, /strokeEllipse|strokeRect/, 'workbench must visually advertise its receptacles');
assert.match(secret, /prologue\.opened && !this\.state\.hiddenFlags\.includes\('prologue-box-opened-v52'\)/, 'only legacy saves may receive pre-v5.2 box traces automatically');

const mayor = read('src/game/scenes/MayorScene.ts');
assert.match(mayor, /createEvidenceSources/, 'mayor evidence must be discovered from physical room sources before it can be compared');
assert.match(mayor, /mayor-evidence:/, 'mayor evidence discovery must persist across reloads');
assert.match(mayor, /revealLecternCompartment/, 'correct mayor evidence must open a physical lectern compartment');
assert.match(mayor, /createNoseResidue/, 'mayor completion must reveal a physical nose-bridge residue pickup');
assert.doesNotMatch(mayor, /flipped = !flipped/, 'mayor must not regress to six pre-written flip cards');


const butcher = read('src/game/scenes/ButcherScene.ts');
assert.match(butcher, /createEnvironmentalClues/, 'butcher must let wall, lamp, portrait and pigs demonstrate seating rules in-world');
assert.match(butcher, /drawAnimalMotif/, 'butcher identity pieces must be physical pictorial tokens rather than six text-only name cards');
assert.match(butcher, /revealUnderTableDrawer/, 'pulling the seventh chair must expose a new physical drawer');
assert.match(butcher, /createLipResidue/, 'butcher drawer must contain a physical residue pickup before completion');
assert.doesNotMatch(butcher, /createNameCards/, 'old text-card seating implementation must stay removed');

assert.match(base, /installWorldInspectables/, 'painted rooms must expose optional tactile world reactions beyond puzzle-only hotspots');
assert.match(base, /playInspectableReaction/, 'optional world objects must visibly respond instead of behaving like inert background art');

const milo = read('src/game/scenes/MiloScene.ts');
assert.match(milo, /createViewMask/, 'Milo view switch must be an in-world mask rather than a generic UI toggle');
assert.doesNotMatch(milo, /addSymbolButton\(1190, 626/, 'Milo should not use the old abstract view button');

const soren = read('src/game/scenes/SorenScene.ts');
assert.match(soren, /createWallCane/, 'Soren must use a physical cane tool after the bell');
assert.match(soren, /soren-listening-ready/, 'the bell must establish the echo rule before wall search');

const finale = read('src/game/scenes/FinaleScene.ts');
assert.match(finale, /face-part silhouettes|expected kinds of evidence/, 'finale sockets must advertise meaningful physical pairings');
assert.match(finale, /const shutter =/, 'warmth station must use a visible sliding shutter rather than hidden hold timing');
assert.doesNotMatch(finale, /delayedCall\(900/, 'warmth station must not rely on unexplained press-and-hold timing');

const elaine = read('src/game/scenes/ElaineScene.ts');
assert.doesNotMatch(elaine, /addSymbolButton\(1180, 626, '↻'/, 'Elaine rotation must stay on the shard itself, not a detached UI button');

const audio = read('src/core/AudioManager.ts');
assert.match(audio, /capture: true, once: true/, 'blocked voice playback must retry before scene pointer handlers can swallow the gesture');
assert.match(audio, /duckAmbientForVoice/, 'spoken dialogue must remain audible over ambient loops');
assert.doesNotMatch(audio, /this\.unlocked = true;\s*const probe/, 'audio unlock must not be marked successful before media playback actually starts');

console.log('design-regression.test.ts: puzzle affordances, physical box loot and voice playback guards passed');
