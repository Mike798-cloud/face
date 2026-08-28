import assert from 'node:assert/strict';
import { CHAPTER_TWO_CINEMATIC, MASK_OUTROS, SCENE_INTROS, WATER_OUTRO } from '../src/data/storyData.ts';
import { VOICEOVER_EN } from '../src/data/voiceoverData.ts';
import { WORLD_DIALOGUE } from '../src/data/dialogueData.ts';

for (const intro of Object.values(SCENE_INTROS)) {
  if (!intro) continue;
  const voice = VOICEOVER_EN[intro.flag];
  assert.ok(voice, `missing English voice-over for ${intro.flag}`);
  assert.equal(voice.length, intro.lines.length, `voice/subtitle count mismatch for ${intro.flag}`);
}

for (const item of [CHAPTER_TWO_CINEMATIC, WATER_OUTRO]) {
  const voice = VOICEOVER_EN[item.flag];
  assert.ok(voice, `missing English voice-over for ${item.flag}`);
  assert.equal(voice.length, item.lines.length, `voice/subtitle count mismatch for ${item.flag}`);
}

for (const [mask, outro] of Object.entries(MASK_OUTROS)) {
  const flag = `cine-outro-${mask}`;
  const voice = VOICEOVER_EN[flag];
  assert.ok(voice, `missing English voice-over for ${flag}`);
  assert.equal(voice.length, outro.lines.length, `voice/subtitle count mismatch for ${flag}`);
}

const adHocFlags = [
  'cine-box-opened', 'cine-craft-finished', 'cine-soren-unlock', 'cine-blank-unlock',
  'cine-finale-unlock', 'cine-finale-reveal', 'cine-ending-accept', 'cine-ending-unfixed', 'cine-ending-close',
] as const;
for (const flag of adHocFlags) assert.ok(VOICEOVER_EN[flag]?.length, `missing English voice-over for ${flag}`);

assert.equal(VOICEOVER_EN['opening-v46']?.length, 4, 'opening film must ship four English voice lines');
for (const [key, line] of Object.entries(WORLD_DIALOGUE)) {
  assert.ok(line.voiceId.startsWith('dialogue-'), `world dialogue ${key} must use packaged dialogue voice id`);
  assert.ok(line.zh.length >= 16, `world dialogue ${key} should read as an in-world sentence, not a button hint`);
}

console.log('cinematic.test.ts: subtitles, opening film and diegetic English dialogue registry are aligned');
