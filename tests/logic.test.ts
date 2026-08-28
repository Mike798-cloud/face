import assert from 'node:assert/strict';
import { advancePostman, elainePieceSolved, finalePairCorrect, mayorSolved, relationFor, seatingSolved, BUTCHER_SEATING } from '../src/game/puzzles/logic.ts';

assert.equal(mayorSolved(['ledger', 'harbor', 'subsidy']), true);
assert.equal(mayorSolved(['family', 'harbor', 'subsidy']), false);

const seats: Record<string, string> = {};
for (const [animal, seat] of Object.entries(BUTCHER_SEATING)) seats[seat] = animal;
assert.equal(seatingSolved(seats), true);
seats['left-end'] = 'potato';
assert.equal(seatingSolved(seats), false);

assert.equal(elainePieceSolved(359, 0), true);
assert.equal(elainePieceSolved(45, 0), false);

let step = 0;
let facing: -1 | 1 = 1;
for (let i = 0; i < 6; i += 1) {
  const result = advancePostman(step, facing, 'forward');
  step = result.step;
  facing = result.facing;
}
assert.equal(step, 6);
let result = advancePostman(step, facing, 'turn');
step = result.step;
facing = result.facing;
result = advancePostman(step, facing, 'back');
assert.equal(result.escaped, true);

assert.equal(relationFor('milo-projection', 'mayor-contradiction'), 'see-discern');
assert.equal(relationFor('clock-exception', 'mayor-contradiction'), null);

assert.equal(finalePairCorrect('mirror', ['discern', 'see']), true);
assert.equal(finalePairCorrect('mirror', ['discern', 'hear']), false);

console.log('logic.test.ts: all assertions passed');
