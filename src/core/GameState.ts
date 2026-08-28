export const SAVE_VERSION = 5 as const;

export type SceneId =
  | 'shop'
  | 'secret'
  | 'water'
  | 'mayor'
  | 'butcher'
  | 'elaine'
  | 'milo'
  | 'postman'
  | 'soren'
  | 'blank'
  | 'finale'
  | 'ending';

export type MaskId = 'mayor' | 'butcher' | 'elaine' | 'milo' | 'postman';
export type ResidueId = 'discern' | 'speech' | 'hear' | 'see' | 'act' | 'warm' | 'blank';
export type ObservationId =
  | 'box-relations'
  | 'clock-exception'
  | 'mayor-contradiction'
  | 'butcher-care'
  | 'elaine-habit'
  | 'milo-projection'
  | 'postman-break'
  | 'soren-space'
  | 'blank-choice'
  | 'shop-memory';
export type RelationId = 'see-discern' | 'hear-act' | 'speech-warm';
export type EndingId = 'accept' | 'unfixed' | 'close';

export interface GameSettings {
  sound: boolean;
  reducedMotion: boolean;
  largeTargets: boolean;
}

export interface PrologueState {
  eyes: boolean;
  mouth: boolean;
  ears: boolean;
  nose: boolean;
  brows: boolean;
  opened: boolean;
}

export interface CraftState {
  appearance: boolean;
  habit: boolean;
  witness: boolean;
  completed: boolean;
  mistakes: number;
}

export interface WaterState {
  reverseProgress: number;
  clearedCells: number;
  completed: boolean;
}

export interface MayorState {
  selected: string[];
  completed: boolean;
}

export interface ButcherState {
  seats: Record<string, string>;
  chairPulled: boolean;
  completed: boolean;
}

export interface ElainePieceState {
  x: number;
  y: number;
  rotation: number;
  snapped: boolean;
}

export interface ElaineState {
  pieces: Record<string, ElainePieceState>;
  completed: boolean;
}

export interface MiloState {
  monsterMode: boolean;
  restored: string[];
  completed: boolean;
}

export interface PostmanState {
  step: number;
  facing: -1 | 1;
  loopCount: number;
  escaped: boolean;
  letterChoice: 'bag' | 'mailbox' | 'shore' | null;
  completed: boolean;
}

export interface SorenState {
  scanHits: number[];
  opened: boolean;
  completed: boolean;
}

export interface BlankState {
  hoveredChoice: 'thread' | 'handkerchief' | 'apron' | null;
  choice: 'thread' | 'handkerchief' | 'apron' | null;
  completed: boolean;
}

export type FinaleStationId = 'mirror' | 'rhythm' | 'warmth';

export interface FinaleStationState {
  pair: ResidueId[];
  phase: number;
  completed: boolean;
}

export interface FinaleState {
  stations: Record<FinaleStationId, FinaleStationState>;
  motherShown: boolean;
  transparentRejectedCount: number;
  voidAccepted: boolean;
  completed: boolean;
}

export interface EndingState {
  chosen: EndingId | null;
  progress: number;
  completed: boolean;
}

export interface GameState {
  version: typeof SAVE_VERSION;
  currentScene: SceneId;
  started: boolean;
  prologue: PrologueState;
  craft: CraftState;
  water: WaterState;
  mayor: MayorState;
  butcher: ButcherState;
  elaine: ElaineState;
  milo: MiloState;
  postman: PostmanState;
  soren: SorenState;
  blank: BlankState;
  finale: FinaleState;
  ending: EndingState;
  completedMasks: MaskId[];
  residues: ResidueId[];
  observations: ObservationId[];
  linkedRelations: RelationId[];
  shopChanges: string[];
  hiddenFlags: string[];
  mistakes: number;
  playSeconds: number;
  ngPlus: boolean;
  settings: GameSettings;
}

export function createDefaultState(): GameState {
  return {
    version: SAVE_VERSION,
    currentScene: 'shop',
    started: false,
    prologue: { eyes: false, mouth: false, ears: false, nose: false, brows: false, opened: false },
    craft: { appearance: false, habit: false, witness: false, completed: false, mistakes: 0 },
    water: { reverseProgress: 0, clearedCells: 0, completed: false },
    mayor: { selected: [], completed: false },
    butcher: { seats: {}, chairPulled: false, completed: false },
    elaine: { pieces: {}, completed: false },
    milo: { monsterMode: false, restored: [], completed: false },
    postman: { step: 0, facing: 1, loopCount: 0, escaped: false, letterChoice: null, completed: false },
    soren: { scanHits: [], opened: false, completed: false },
    blank: { hoveredChoice: null, choice: null, completed: false },
    finale: {
      stations: {
        mirror: { pair: [], phase: 0, completed: false },
        rhythm: { pair: [], phase: 0, completed: false },
        warmth: { pair: [], phase: 0, completed: false },
      },
      motherShown: false,
      transparentRejectedCount: 0,
      voidAccepted: false,
      completed: false,
    },
    ending: { chosen: null, progress: 0, completed: false },
    completedMasks: [],
    residues: [],
    observations: [],
    linkedRelations: [],
    shopChanges: [],
    hiddenFlags: [],
    mistakes: 0,
    playSeconds: 0,
    ngPlus: false,
    settings: { sound: true, reducedMotion: false, largeTargets: false },
  };
}

export function isFinaleUnlocked(state: GameState): boolean {
  return state.completedMasks.length >= 5 && state.water.completed;
}

export function isHiddenUnlocked(state: GameState): boolean {
  return state.completedMasks.length >= 3;
}
