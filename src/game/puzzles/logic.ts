import type { FinaleStationId, ObservationId, RelationId, ResidueId } from '../../core/GameState';
import { RELATIONS } from '../../data/gameData.ts';

export const MAYOR_CORRECT = new Set(['ledger', 'harbor', 'subsidy']);

export const BUTCHER_SEATING: Record<string, string> = {
  bramble: 'left-end',
  oat: 'left-inner',
  milk: 'lamp-left',
  potato: 'lamp-right',
  carrot: 'portrait-left',
  bread: 'right-end',
};

export const ELAINE_TARGET_ROTATIONS: readonly number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

export const MILO_MATCHES: Record<string, string> = {
  bull: 'cane',
  cat: 'cloth',
  snake: 'badge',
};

export const FINALE_PAIRS: Record<FinaleStationId, readonly [ResidueId, ResidueId]> = {
  mirror: ['see', 'discern'],
  rhythm: ['hear', 'act'],
  warmth: ['speech', 'warm'],
};

export function sameSet(left: readonly string[], right: ReadonlySet<string>): boolean {
  return left.length === right.size && left.every((value) => right.has(value));
}

export function mayorSolved(selected: readonly string[]): boolean {
  return sameSet(selected, MAYOR_CORRECT);
}

export function seatingSolved(seats: Readonly<Record<string, string>>): boolean {
  return Object.entries(BUTCHER_SEATING).every(([animal, seat]) => seats[seat] === animal);
}

export function elainePieceSolved(rotation: number, target: number): boolean {
  const normalized = ((rotation % 360) + 360) % 360;
  const targetNormalized = ((target % 360) + 360) % 360;
  const delta = Math.abs(normalized - targetNormalized);
  return Math.min(delta, 360 - delta) <= 12;
}

export interface PostmanStepResult {
  step: number;
  facing: -1 | 1;
  escaped: boolean;
  reset: boolean;
}

export function advancePostman(step: number, facing: -1 | 1, command: 'forward' | 'turn' | 'back'): PostmanStepResult {
  if (command === 'turn') return { step, facing: facing === 1 ? -1 : 1, escaped: false, reset: false };
  if (command === 'back') {
    if (step === 6 && facing === -1) return { step: 7, facing, escaped: true, reset: false };
    return { step: Math.max(0, step - 1), facing, escaped: false, reset: false };
  }
  const next = step + 1;
  if (next >= 7) return { step: 0, facing: 1, escaped: false, reset: true };
  return { step: next, facing, escaped: false, reset: false };
}

export function relationFor(first: ObservationId, second: ObservationId): RelationId | null {
  const relation = Object.entries(RELATIONS).find(([, value]) => {
    const [a, b] = value.pair;
    return (a === first && b === second) || (a === second && b === first);
  });
  return relation ? (relation[0] as RelationId) : null;
}

export function finalePairCorrect(station: FinaleStationId, pair: readonly ResidueId[]): boolean {
  const target = FINALE_PAIRS[station];
  return pair.length === 2 && target.every((id) => pair.includes(id));
}
