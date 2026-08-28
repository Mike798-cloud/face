import {
  SAVE_VERSION,
  createDefaultState,
  type GameState,
  type MaskId,
  type ObservationId,
  type RelationId,
  type ResidueId,
  type SceneId,
} from './GameState.ts';

const SAVE_KEY = 'mianmu-the-face-of-it-save-v4-ts';
const SCENES: readonly SceneId[] = ['shop','secret','water','mayor','butcher','elaine','milo','postman','soren','blank','finale','ending'];
const MASKS: readonly MaskId[] = ['mayor','butcher','elaine','milo','postman'];
const RESIDUES: readonly ResidueId[] = ['discern','speech','hear','see','act','warm','blank'];
const OBSERVATIONS: readonly ObservationId[] = ['box-relations','clock-exception','mayor-contradiction','butcher-care','elaine-habit','milo-projection','postman-break','soren-space','blank-choice','shop-memory'];
const RELATIONS: readonly RelationId[] = ['see-discern','hear-act','speech-warm'];
const MAYOR_STATEMENTS = ['ledger','harbor','subsidy','family','tax','speech'] as const;
const MILO_PROPS = ['cane','cloth','badge'] as const;
const POSTMAN_CHOICES = ['bag','mailbox','shore'] as const;
const BUTCHER_SEATS = ['left-end','left-inner','lamp-left','lamp-right','portrait-left','right-end'] as const;
const BUTCHER_ANIMALS = ['bramble','oat','milk','potato','carrot','bread'] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function mergeRecord<T extends object>(base: T, incoming: unknown): T {
  if (!isRecord(incoming)) return { ...base };
  return { ...base, ...incoming } as T;
}

function selectStrings<T extends string>(value: unknown, allowed: readonly T[]): T[] {
  if (!Array.isArray(value)) return [];
  const allowedSet = new Set<string>(allowed);
  return [...new Set(value.filter((item): item is T => typeof item === 'string' && allowedSet.has(item)))];
}

function numberOr(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function booleanOr(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

export class SaveManager {
  load(): GameState | null {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const parsed: unknown = JSON.parse(raw);
      if (!isRecord(parsed)) return null;
      return this.migrate(parsed);
    } catch (error) {
      console.warn('[SaveManager] Could not load save:', error);
      return null;
    }
  }

  save(state: GameState): void {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({ ...state, version: SAVE_VERSION }));
    } catch (error) {
      console.warn('[SaveManager] Could not save:', error);
    }
  }

  clear(): void { localStorage.removeItem(SAVE_KEY); }

  private migrate(raw: Record<string, unknown>): GameState {
    const base = createDefaultState();
    const state = mergeRecord(base, raw);
    state.version = SAVE_VERSION;
    state.currentScene = typeof raw.currentScene === 'string' && SCENES.includes(raw.currentScene as SceneId) ? raw.currentScene as SceneId : 'shop';
    state.started = booleanOr(raw.started, base.started);
    state.completedMasks = selectStrings(raw.completedMasks, MASKS);
    state.residues = selectStrings(raw.residues, RESIDUES);
    state.observations = selectStrings(raw.observations, OBSERVATIONS);
    state.linkedRelations = selectStrings(raw.linkedRelations, RELATIONS);
    state.shopChanges = Array.isArray(raw.shopChanges) ? raw.shopChanges.filter((value): value is string => typeof value === 'string').slice(0, 50) : [];
    state.hiddenFlags = Array.isArray(raw.hiddenFlags) ? raw.hiddenFlags.filter((value): value is string => typeof value === 'string').slice(0, 50) : [];
    state.mistakes = Math.max(0, numberOr(raw.mistakes, 0));
    state.playSeconds = Math.max(0, numberOr(raw.playSeconds, 0));
    state.ngPlus = booleanOr(raw.ngPlus, false);

    state.prologue = mergeRecord(base.prologue, raw.prologue);
    state.craft = mergeRecord(base.craft, raw.craft);
    state.water = mergeRecord(base.water, raw.water);
    state.mayor = mergeRecord(base.mayor, raw.mayor);
    state.butcher = mergeRecord(base.butcher, raw.butcher);
    state.elaine = mergeRecord(base.elaine, raw.elaine);
    state.milo = mergeRecord(base.milo, raw.milo);
    state.postman = mergeRecord(base.postman, raw.postman);
    state.soren = mergeRecord(base.soren, raw.soren);
    state.blank = mergeRecord(base.blank, raw.blank);
    state.finale = mergeRecord(base.finale, raw.finale);
    state.ending = mergeRecord(base.ending, raw.ending);
    state.settings = mergeRecord(base.settings, raw.settings);

    const rawButcher = isRecord(raw.butcher) ? raw.butcher : {};
    const rawSeats = isRecord(rawButcher.seats) ? rawButcher.seats : {};
    const validSeats = new Set<string>(BUTCHER_SEATS);
    const validAnimals = new Set<string>(BUTCHER_ANIMALS);
    state.butcher.seats = {};
    for (const [seat, animal] of Object.entries(rawSeats)) {
      if (!validSeats.has(seat) || typeof animal !== 'string' || !validAnimals.has(animal)) continue;
      if (Object.values(state.butcher.seats).includes(animal)) continue;
      state.butcher.seats[seat] = animal;
    }

    const rawElaine = isRecord(raw.elaine) ? raw.elaine : {};
    const rawPieces = isRecord(rawElaine.pieces) ? rawElaine.pieces : {};
    state.elaine.pieces = {};
    for (let index = 0; index < 12; index += 1) {
      const key = String(index);
      const piece = rawPieces[key];
      if (!isRecord(piece)) continue;
      state.elaine.pieces[key] = {
        x: Math.min(1280, Math.max(0, numberOr(piece.x, 640))),
        y: Math.min(720, Math.max(0, numberOr(piece.y, 360))),
        rotation: numberOr(piece.rotation, 0),
        snapped: booleanOr(piece.snapped, false),
      };
    }

    state.settings.sound = booleanOr(state.settings.sound, base.settings.sound);
    state.settings.reducedMotion = booleanOr(state.settings.reducedMotion, base.settings.reducedMotion);
    state.settings.largeTargets = booleanOr(state.settings.largeTargets, base.settings.largeTargets);

    const rawFinale = isRecord(raw.finale) ? raw.finale : {};
    const rawStations = isRecord(rawFinale.stations) ? rawFinale.stations : {};
    state.finale.stations = {
      mirror: mergeRecord(base.finale.stations.mirror, rawStations.mirror),
      rhythm: mergeRecord(base.finale.stations.rhythm, rawStations.rhythm),
      warmth: mergeRecord(base.finale.stations.warmth, rawStations.warmth),
    };
    state.finale.stations.mirror.pair = selectStrings(state.finale.stations.mirror.pair, RESIDUES).slice(0, 2);
    state.finale.stations.rhythm.pair = selectStrings(state.finale.stations.rhythm.pair, RESIDUES).slice(0, 2);
    state.finale.stations.warmth.pair = selectStrings(state.finale.stations.warmth.pair, RESIDUES).slice(0, 2);

    state.mayor.selected = selectStrings(state.mayor.selected, MAYOR_STATEMENTS).slice(0, 3);
    state.milo.restored = selectStrings(state.milo.restored, MILO_PROPS);
    state.postman.step = Math.min(state.postman.escaped ? 7 : 6, Math.max(0, Math.floor(numberOr(state.postman.step, 0))));
    state.postman.facing = state.postman.facing === -1 ? -1 : 1;
    state.postman.loopCount = Math.max(0, Math.floor(numberOr(state.postman.loopCount, 0)));
    state.postman.letterChoice = typeof state.postman.letterChoice === 'string' && POSTMAN_CHOICES.includes(state.postman.letterChoice as typeof POSTMAN_CHOICES[number])
      ? state.postman.letterChoice as typeof POSTMAN_CHOICES[number]
      : null;
    if (state.postman.escaped && !state.postman.completed) state.postman.step = 7;
    state.soren.scanHits = Array.isArray(state.soren.scanHits) ? state.soren.scanHits.filter((v): v is number => typeof v === 'number' && Number.isFinite(v)).slice(0, 30) : [];

    const assignedResidues = new Set<ResidueId>();
    (['mirror','rhythm','warmth'] as const).forEach((stationId) => {
      const station = state.finale.stations[stationId];
      station.phase = Math.max(0, Math.floor(numberOr(station.phase, 0)));
      station.pair = station.pair.filter((residue) => {
        if (residue === 'blank' || assignedResidues.has(residue)) return false;
        assignedResidues.add(residue);
        return true;
      });
    });
    state.water.reverseProgress = Math.min(1, Math.max(0, numberOr(state.water.reverseProgress, 0)));
    state.water.clearedCells = Math.min(24, Math.max(0, Math.floor(numberOr(state.water.clearedCells, 0))));
    return state;
  }
}
