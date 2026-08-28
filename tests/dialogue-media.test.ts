import assert from 'node:assert/strict';
import { existsSync, statSync } from 'node:fs';
import { WORLD_DIALOGUE } from '../src/data/dialogueData.ts';
import { VOICEOVER_EN } from '../src/data/voiceoverData.ts';

const verifyOgg = (file: string, label: string): void => {
  assert.ok(existsSync(file), `${label}: packaged voice file missing: ${file}`);
  assert.ok(statSync(file).size > 10_000, `${label}: packaged voice file looks empty/corrupt: ${file}`);
};

for (const [key, line] of Object.entries(WORLD_DIALOGUE)) {
  assert.ok(line.zh.trim().length >= 12, `${key}: Chinese world line is too short to carry character context`);
  assert.ok(line.en.trim().length >= 24, `${key}: English world line is too short to carry character context`);
  verifyOgg(`public/assets/audio/voice/${line.voiceId}.ogg`, key);
}

for (const [flag, lines] of Object.entries(VOICEOVER_EN)) {
  lines.forEach((_line, index) => verifyOgg(`public/assets/audio/voice/${flag}-${index + 1}.ogg`, `${flag} line ${index + 1}`));
}

console.log('dialogue-media.test.ts: all diegetic dialogue and cinematic OGG voice assets passed');
