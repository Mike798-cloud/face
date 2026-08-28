import Phaser from 'phaser';
import { BaseScene } from './BaseScene';
import { MILO_MATCHES } from '../puzzles/logic';
import { SCENE_INTROS } from '../../data/storyData';

interface Prop { id: string; label: string; x: number; y: number; }
interface Anchor { id: string; monsterLabel: string; realityLabel: string; x: number; y: number; radius: number; }

const PROPS: Prop[] = [
  { id: 'cane', label: '旧拐杖', x: 405, y: 560 },
  { id: 'cloth', label: '湿布', x: 900, y: 492 },
  { id: 'badge', label: '徽章', x: 1180, y: 565 },
];
const ANCHORS: Anchor[] = [
  { id: 'bull', monsterLabel: '牛头父亲', realityLabel: '门边 · 父亲扶过的地方', x: 275, y: 365, radius: 125 },
  { id: 'cat', monsterLabel: '猫首母亲', realityLabel: '床边 · 母亲反复换布的位置', x: 835, y: 410, radius: 135 },
  { id: 'snake', monsterLabel: '蛇身镇长', realityLabel: '台灯旁 · 镇长进门前停留的位置', x: 1130, y: 395, radius: 125 },
];

export class MiloScene extends BaseScene {
  private background!: Phaser.GameObjects.Image;
  private realityLayer!: Phaser.GameObjects.Container;
  private modeButton!: Phaser.GameObjects.Container;

  constructor() { super('milo'); }
  preload(): void { this.preloadImage('bg-milo', 'milo.webp'); }

  create(): void {
    this.ui.setScene('milo');
    this.audio.playAmbient('shop', .19);
    this.background = this.addBackground('bg-milo');
    this.addAtmosphere('dust', 12);
    this.installMiloLife();
    const intro = SCENE_INTROS.milo!;
    this.setObjective(intro.objective);
    if (this.state.milo.completed) { this.addNavArrow('forward', () => this.navigate('shop')); return; }

    this.createRealityLayer();
    this.setMonsterMode(this.state.milo.monsterMode, false);
    this.modeButton = this.createViewMask();
    PROPS.forEach((prop) => this.createProp(prop));
    if (!this.state.hiddenFlags.includes(`${intro.flag}:seen`)) {
      this.store.mutate((state) => { state.hiddenFlags.push(`${intro.flag}:seen`); });
      this.ui.setCaption('米罗的房间没有两套家具。只有两种看法叠在同一个位置上。先看看白天留下了什么。');
    }
  }


  private installMiloLife(): void {
    // Optional room reactions: the player can discover that the painted monsters are not entirely passive.
    this.addMouthEasterEgg(255, 220, 250, 300, 58, 22, 'breath');
    this.addBlinkEasterEgg(1115, 286, 115, 150, 13, 12, 'glass');
    this.addBlinkEasterEgg(838, 121, 110, 92, 12, 11, 'paper');
    this.addBlinkEasterEgg(218, 628, 215, 94, 34, 16, 'breath');
    if (this.state.settings.reducedMotion) return;
    const bedsideGlow = this.add.ellipse(1118, 338, 150, 118, 0xd3c28e, .018).setBlendMode(Phaser.BlendModes.ADD).setDepth(2);
    this.tweens.add({ targets: bedsideGlow, alpha: { from: .008, to: .065 }, scaleX: 1.04, scaleY: .96, duration: 1900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    const underBed = this.add.ellipse(800, 612, 300, 64, 0x121713, .025).setDepth(1);
    this.tweens.add({ targets: underBed, scaleX: 1.12, alpha: .07, duration: 2300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  private createRealityLayer(): void {
    this.realityLayer = this.add.container(0, 0).setDepth(5);
    const wash = this.add.rectangle(640, 360, 1280, 720, 0xc9c0aa, .23);
    this.realityLayer.add(wash);
    ANCHORS.forEach((anchor) => {
      if (this.isRestored(anchor.id)) return;
      const ring = this.add.circle(anchor.x, anchor.y, anchor.radius, 0xf4ead6, .018).setStrokeStyle(2, 0xe5d7bd, .32);
      this.realityLayer.add(ring);
    });
  }

  private isRestored(monsterId: string): boolean {
    const propId = MILO_MATCHES[monsterId];
    return propId ? this.state.milo.restored.includes(propId) : false;
  }

  private setMonsterMode(active: boolean, announce = true): void {
    this.store.mutate((s) => { s.milo.monsterMode = active; }, false);
    this.tweens.killTweensOf(this.realityLayer);
    this.tweens.killTweensOf(this.background);
    if (this.state.settings.reducedMotion) {
      this.realityLayer.setVisible(!active).setAlpha(active ? 0 : 1);
      this.background.setTint(active ? 0xffffff : 0xd9cfb8);
    } else {
      this.realityLayer.setVisible(true);
      this.tweens.add({ targets: this.realityLayer, alpha: active ? 0 : 1, duration: 260, ease: 'Sine.easeInOut', onComplete: () => { if (active) this.realityLayer.setVisible(false); } });
      this.background.setTint(active ? 0xffffff : 0xd9cfb8);
      this.cameras.main.zoomTo(active ? 1.018 : 1, 260, 'Sine.easeInOut');
    }
    if (this.modeButton) {
      this.modeButton.setAlpha(active ? .95 : .72).setScale(active ? 1.06 : 1);
      const maskBody = this.modeButton.getByName('mode-mask-body');
      if (maskBody instanceof Phaser.GameObjects.Ellipse) maskBody.setFillStyle(active ? 0x7d705d : 0xb7aa91, active ? .86 : .78);
    }
    if (!announce) return;
    this.audio.playSfx(active ? 'breath' : 'paper', .18);
    this.ui.setCaption(active ? '面具贴近眼前，房间没有移动；墙上的人却换成了另一种解释。' : '面具离开视线，家具重新只剩下白天留下的磨痕与位置。');
  }


  private createViewMask(): Phaser.GameObjects.Container {
    const holder = this.add.container(1052, 612).setDepth(18).setAlpha(this.state.milo.monsterMode ? .95 : .72);
    const shadow = this.add.ellipse(5, 8, 82, 26, 0x0c0b09, .18);
    const body = this.add.ellipse(0, 0, 74, 92, this.state.milo.monsterMode ? 0x7d705d : 0xb7aa91, .82)
      .setStrokeStyle(2.5, 0x3a3026, .84).setName('mode-mask-body');
    const leftEye = this.add.ellipse(-14, -10, 15, 8, 0x161512, .88);
    const rightEye = this.add.ellipse(14, -10, 15, 8, 0x161512, .88);
    const mouth = this.add.rectangle(0, 22, 24, 2.5, 0x342b23, .72);
    holder.add([shadow, body, leftEye, rightEye, mouth]);
    holder.setSize(90, 106).setInteractive({ useHandCursor: true });
    holder.on('pointerdown', () => this.setMonsterMode(!this.state.milo.monsterMode));
    if (!this.state.settings.reducedMotion) this.tweens.add({ targets: holder, y: 599, duration: 1700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    return holder;
  }

  private createProp(prop: Prop): void {
    if (this.state.milo.restored.includes(prop.id)) return;
    const item = this.add.container(prop.x, prop.y).setDepth(12);
    const shadow = this.add.ellipse(5, 7, prop.id === 'cane' ? 78 : 62, 18, 0x0d0b09, .18);
    const object = this.add.graphics();
    if (prop.id === 'cane') {
      object.lineStyle(8, 0x6a4d32, .95);
      object.beginPath(); object.moveTo(-28, 30); object.lineTo(22, -28); object.strokePath();
      object.lineStyle(7, 0x6a4d32, .95); object.strokeCircle(27, -28, 11);
      object.lineStyle(2, 0x2e251e, .7); object.beginPath(); object.moveTo(-27, 30); object.lineTo(22, -28); object.strokePath();
    } else if (prop.id === 'cloth') {
      object.fillStyle(0x8c9c94, .94);
      object.fillPoints([{ x: -32, y: -20 }, { x: 23, y: -26 }, { x: 38, y: 10 }, { x: -16, y: 27 }, { x: -38, y: 5 }], true);
      object.lineStyle(2, 0x39433e, .7); object.strokePoints([{ x: -32, y: -20 }, { x: 23, y: -26 }, { x: 38, y: 10 }, { x: -16, y: 27 }, { x: -38, y: 5 }], true);
      object.lineStyle(1.4, 0xc6d0ca, .38); object.lineBetween(-20, -7, 22, 7); object.lineBetween(-11, 9, 8, 20);
    } else {
      object.fillStyle(0xb6a476, .96); object.fillCircle(0, 0, 25);
      object.lineStyle(3, 0x3a3024, .82); object.strokeCircle(0, 0, 25);
      object.fillStyle(0x4c5a52, .85); object.fillCircle(0, 0, 10);
      object.lineStyle(2, 0xd5c59b, .8); object.lineBetween(-6, 0, 6, 0); object.lineBetween(0, -6, 0, 6);
    }
    item.add([shadow, object]);
    item.setSize(prop.id === 'cane' ? 88 : 78, prop.id === 'cane' ? 96 : 72).setInteractive({ useHandCursor: true });
    this.input.setDraggable(item);
    const home = { x: item.x, y: item.y };
    item.on('pointerdown', () => {
      this.ui.setCaption(prop.id === 'cane' ? '木柄被手掌磨得发亮。' : prop.id === 'cloth' ? '湿布还带着反复折叠的折痕。' : '徽章背面的别针有重新扣过很多次的划痕。');
    });
    item.on('dragstart', () => item.setDepth(20).setScale(1.045));
    item.on('drag', (_p: Phaser.Input.Pointer, x: number, y: number) => item.setPosition(x, y));
    item.on('dragend', () => {
      item.setDepth(12).setScale(1);
      if (!this.state.milo.monsterMode) {
        this.ui.setCaption('白天的房间只肯告诉你这件东西原本属于哪里，并不替你说明怪物是谁。');
        this.settleContainer(item, home.x, home.y);
        return;
      }
      const nearest = ANCHORS.filter((anchor) => !this.isRestored(anchor.id)).map((anchor) => ({ anchor, d: Phaser.Math.Distance.Between(item.x, item.y, anchor.x, anchor.y) })).sort((a, b) => a.d - b.d)[0];
      if (!nearest || nearest.d > nearest.anchor.radius + 35) { this.settleContainer(item, home.x, home.y); return; }
      const expectedProp = MILO_MATCHES[nearest.anchor.id];
      if (expectedProp !== prop.id) {
        this.ui.setCaption(`${nearest.anchor.monsterLabel}没有消失。这个物件和它记住的动作对不上。`);
        this.store.mutate((s) => { s.mistakes += 1; }, false);
        this.nudge(item, nearest.anchor.x < item.x ? 8 : -8);
        this.time.delayedCall(this.state.settings.reducedMotion ? 0 : 150, () => this.settleContainer(item, home.x, home.y));
        return;
      }
      this.restore(nearest.anchor, prop.id, item);
    });
  }

  private restore(anchor: Anchor, propId: string, item: Phaser.GameObjects.Container): void {
    item.disableInteractive();
    this.store.mutate((s) => { if (!s.milo.restored.includes(propId)) s.milo.restored.push(propId); });
    this.audio.playSfx('wood', .3);
    this.settleContainer(item, anchor.x, anchor.y + 80, 220);
    const ring = this.add.circle(anchor.x, anchor.y, anchor.radius, 0xd8c7a7, .025).setStrokeStyle(3, 0xd8c7a7, .5).setDepth(11);
    if (!this.state.settings.reducedMotion) this.tweens.add({ targets: ring, scale: 1.08, alpha: 0, duration: 650, onComplete: () => ring.destroy() });
    const lines: Record<string, string> = {
      bull: '牛头没有“被治好”。只是那根拐杖让门边重新出现一个会疼、会扶墙的父亲。',
      cat: '猫爪退回一双发红的手。湿布仍被反复折叠——紧张没有消失，但不再需要兽脸解释。',
      snake: '蛇皮从台灯旁褪下。镇长手里只剩那枚每次进门前都会换上的徽章。',
    };
    this.ui.setCaption(lines[anchor.id] ?? '怪物短暂退回一个能被现实坐标确认的人。');
    if (this.state.milo.restored.length >= 3) {
      this.store.mutate((s) => { s.milo.completed = true; });
      this.completeMask('milo', 'milo-projection');
      this.ui.setCaption('房间没有变。改变的一直是解释。眼睛残响留下的，是把同一个人认成同一个人的能力。');
      this.time.delayedCall(this.state.settings.reducedMotion ? 0 : 460, () => this.addNavArrow('forward', () => this.navigate('shop')));
    }
  }
}
