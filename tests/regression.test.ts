import assert from 'node:assert/strict';
import { SaveManager } from '../src/core/SaveManager.ts';
import { createDefaultState } from '../src/core/GameState.ts';

class MemoryStorage {
  private readonly values = new Map<string, string>();
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  setItem(key: string, value: string): void { this.values.set(key, value); }
  removeItem(key: string): void { this.values.delete(key); }
  clear(): void { this.values.clear(); }
  key(index: number): string | null { return [...this.values.keys()][index] ?? null; }
  get length(): number { return this.values.size; }
}

const memory = new MemoryStorage();
Object.defineProperty(globalThis, 'localStorage', { value: memory, configurable: true });

const key = 'mianmu-the-face-of-it-save-v4-ts';
const raw = createDefaultState();
raw.mayor.selected = ['ledger', 'not-a-card', 'harbor', 'subsidy'];
raw.milo.restored = ['cane', 'ghost-prop'];
raw.butcher.seats = { 'wall-left': 'bramble', 'left-end': 'bramble', 'left-inner': 'ghost', 'lamp-left': 'milk' };
raw.elaine.pieces = {
  '0': { x: -50, y: 900, rotation: 450, snapped: true },
  '20': { x: 100, y: 100, rotation: 0, snapped: true },
};
raw.postman.step = 6;
raw.postman.escaped = true;
raw.finale.stations.mirror.pair = ['see', 'discern'];
raw.finale.stations.rhythm.pair = ['see', 'act'];
raw.water.reverseProgress = 4;
raw.water.clearedCells = 200;
memory.setItem(key, JSON.stringify(raw));

const loaded = new SaveManager().load();
assert.ok(loaded);
assert.deepEqual(loaded.mayor.selected, ['ledger', 'harbor', 'subsidy']);
assert.deepEqual(loaded.milo.restored, ['cane']);
assert.deepEqual(loaded.butcher.seats, { 'left-end': 'bramble', 'lamp-left': 'milk' }, 'legacy/invalid butcher seats must not leak into the new table layout');
assert.deepEqual(loaded.elaine.pieces['0'], { x: 0, y: 720, rotation: 450, snapped: true });
assert.equal(loaded.elaine.pieces['20'], undefined, 'elaine save recovery must only accept the twelve real mirror pieces');
assert.equal(loaded.postman.step, 7, 'escaped postman saves must resume at the seventh mailbox');
assert.equal(loaded.postman.escaped, true);
assert.deepEqual(loaded.finale.stations.mirror.pair, ['see', 'discern']);
assert.deepEqual(loaded.finale.stations.rhythm.pair, ['act'], 'one residue cannot occupy two finale stations');
assert.equal(loaded.water.reverseProgress, 1);
assert.equal(loaded.water.clearedCells, 24);

console.log('regression.test.ts: save recovery and finale assignment invariants passed');
