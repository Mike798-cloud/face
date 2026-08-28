import type { SceneId } from './GameState';

export interface AppEvents {
  navigate: { scene: SceneId };
  toast: { text: string; tone?: 'normal' | 'good' | 'warning' };
  stateChanged: undefined;
  openNotebook: undefined;
  openHint: undefined;
  openSettings: undefined;
  title: undefined;
}

type EventName = keyof AppEvents;
type Listener<K extends EventName> = (payload: AppEvents[K]) => void;

export class EventBus {
  private readonly listeners = new Map<EventName, Set<(payload: never) => void>>();

  on<K extends EventName>(event: K, listener: Listener<K>): () => void {
    const set = this.listeners.get(event) ?? new Set<(payload: never) => void>();
    const wrapped = listener as (payload: never) => void;
    set.add(wrapped);
    this.listeners.set(event, set);
    return () => set.delete(wrapped);
  }

  emit<K extends EventName>(event: K, payload: AppEvents[K]): void {
    const set = this.listeners.get(event);
    if (!set) return;
    set.forEach((listener) => listener(payload as never));
  }
}

export const eventBus = new EventBus();
