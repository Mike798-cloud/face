import { createDefaultState, type GameState } from './GameState';
import { SaveManager } from './SaveManager';

export class GameStore {
  readonly saveManager = new SaveManager();
  state: GameState;
  private dirty = false;

  constructor() {
    this.state = this.saveManager.load() ?? createDefaultState();
  }

  mutate(mutator: (state: GameState) => void, saveImmediately = true): void {
    mutator(this.state);
    this.dirty = true;
    if (saveImmediately) this.flush();
  }

  flush(): void {
    if (!this.dirty) return;
    this.saveManager.save(this.state);
    this.dirty = false;
  }

  reset(): void {
    const settings = { ...this.state.settings };
    const ngPlus = this.state.ending.completed || this.state.ngPlus;
    this.state = createDefaultState();
    this.state.settings = settings;
    this.state.ngPlus = ngPlus;
    this.dirty = true;
    this.flush();
  }

  hasSave(): boolean {
    return this.state.started || this.state.completedMasks.length > 0 || this.state.prologue.opened;
  }
}
