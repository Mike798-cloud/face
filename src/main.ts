import Phaser from 'phaser';
import './styles/v4.css';
import { GameStore } from './core/GameStore';
import { AudioManager } from './core/AudioManager';
import { eventBus } from './core/EventBus';
import type { SceneId } from './core/GameState';
import { UI } from './ui/UI';
import { ShopScene } from './game/scenes/ShopScene';
import { SecretScene } from './game/scenes/SecretScene';
import { WaterMemoryScene } from './game/scenes/WaterMemoryScene';
import { MayorScene } from './game/scenes/MayorScene';
import { ButcherScene } from './game/scenes/ButcherScene';
import { ElaineScene } from './game/scenes/ElaineScene';
import { MiloScene } from './game/scenes/MiloScene';
import { PostmanScene } from './game/scenes/PostmanScene';
import { SorenScene } from './game/scenes/SorenScene';
import { BlankScene } from './game/scenes/BlankScene';
import { FinaleScene } from './game/scenes/FinaleScene';
import { EndingScene } from './game/scenes/EndingScene';

const app = document.querySelector<HTMLElement>('#app');
if (!app) throw new Error('Missing #app root.');

const store = new GameStore();
const audio = new AudioManager(store.state.settings);
const ui = new UI(app, store, audio);
let game: Phaser.Game | null = null;

const sceneRegistry = [
  ['shop', ShopScene], ['secret', SecretScene], ['water', WaterMemoryScene], ['mayor', MayorScene],
  ['butcher', ButcherScene], ['elaine', ElaineScene], ['milo', MiloScene], ['postman', PostmanScene],
  ['soren', SorenScene], ['blank', BlankScene], ['finale', FinaleScene], ['ending', EndingScene],
] as const;

function bootGame(scene: SceneId): void {
  if (game) game.destroy(true);
  const host = ui.renderGameShell();
  game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: host,
    backgroundColor: '#11120f',
    width: 1280,
    height: 720,
    scene: [],
    render: { antialias: true, pixelArt: false, roundPixels: false },
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: 1280, height: 720 },
    input: { activePointers: 3 },
    audio: { disableWebAudio: false },
  });
  game.events.once(Phaser.Core.Events.READY, () => {
    if (!game) return;
    sceneRegistry.forEach(([key, SceneClass]) => game?.scene.add(key, SceneClass, false));
    game.scene.start(scene, { store, ui, audio });
  });
}

function navigate(scene: SceneId): void {
  if (!game) { bootGame(scene); return; }
  store.mutate((state) => { state.currentScene = scene; });
  ui.setScene(scene);
  game.scene.start(scene, { store, ui, audio });
}

function renderTitle(): void {
  if (game) { game.destroy(true); game = null; }
  audio.stopAmbient();
  store.flush();
  ui.renderTitle((continueGame) => {
    if (!continueGame) store.mutate((state) => { state.started = true; state.currentScene = 'shop'; });
    const target = continueGame ? store.state.currentScene : 'shop';
    bootGame(target);
  });
}

eventBus.on('navigate', ({ scene }) => navigate(scene));
eventBus.on('title', () => renderTitle());

window.addEventListener('beforeunload', () => store.flush());
window.setInterval(() => {
  if (!store.state.started) return;
  store.mutate((state) => { state.playSeconds += 10; }, false);
  store.flush();
}, 10_000);

renderTitle();
