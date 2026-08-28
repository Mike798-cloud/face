import Phaser from 'phaser';
import { BaseScene } from './BaseScene';
import { eventBus } from '../../core/EventBus';
import type { EndingId } from '../../core/GameState';
import { SCENE_INTROS } from '../../data/storyData';

export class EndingScene extends BaseScene {
  private pathLocked: EndingId | null = null;
  private stitchCount = 0;
  private masksStored = 0;

  constructor() { super('ending'); }
  preload(): void { this.preloadImage('bg-ending', 'mask-shop.webp'); }

  create(): void {
    this.ui.setScene('ending');
    this.audio.playAmbient('sea', .13);
    this.addBackground('bg-ending');
    this.addAtmosphere('dust', 10);
    this.installEndingLife();
    const intro = SCENE_INTROS.ending!;
    this.setObjective(intro.objective);
    if (this.state.ending.completed) { this.renderCompleted(); return; }
    this.createAcceptPath();
    this.createUnfixedPath();
    this.createClosePath();
    if (!this.state.hiddenFlags.includes(`${intro.flag}:seen`)) {
      this.store.mutate((state) => { state.hiddenFlags.push(`${intro.flag}:seen`); });
      this.ui.setCaption('最后没有按钮，也没有标准答案。镜子、缝线和木箱都留在原处，等阿七亲手完成一种离开的动作。');
    }
  }


  private installEndingLife(): void {
    this.addBlinkEasterEgg(150, 328, 135, 300, 22, 13, 'glass');
    [[440, 205], [520, 205], [600, 205], [680, 205], [440, 312]].forEach(([x, y], i) => {
      const zone = this.add.zone(x!, y!, 64, 88).setDepth(5).setInteractive({ useHandCursor: true });
      zone.on('pointerdown', () => {
        this.audio.playSfx('breath', .08);
        const mouth = this.add.ellipse(x!, y! + 18, 26, 2, 0x171310, .76).setDepth(6);
        if (this.state.settings.reducedMotion) { mouth.setDisplaySize(26, 12); this.time.delayedCall(150, () => mouth.destroy()); return; }
        this.tweens.add({ targets: mouth, scaleY: 5, duration: 120, yoyo: true, hold: 160 + i * 15, onComplete: () => mouth.destroy() });
      });
    });
    this.addBreathingLight(390, 389, 150, 110, 0xe2bd77, .065, 2);
  }

  private createAcceptPath(): void {
    this.add.ellipse(240, 315, 235, 330, 0x262620, .32).setStrokeStyle(3, 0xb19f7d, .45).setDepth(3);
    const target = this.add.ellipse(275, 315, 86, 250, 0xa79076, .14).setDepth(4);
    const half = this.add.container(120, 545).setDepth(8);
    const halfFace = this.add.arc(0, 0, 72, -90, 90, false, 0xb5a487, .86).setStrokeStyle(3, 0x30271f);
    const halfMarks = this.add.graphics().setAlpha(.62);
    halfMarks.lineStyle(1.5, 0x30271f, .86);
    halfMarks.strokeEllipse(20, -18, 20, 9);
    halfMarks.beginPath(); halfMarks.moveTo(18, -4); halfMarks.lineTo(10, 17); halfMarks.strokePath();
    halfMarks.lineBetween(9, 34, 31, 32);
    half.add([halfFace, halfMarks]);
    half.setSize(110, 160).setInteractive({ useHandCursor: true });
    this.input.setDraggable(half);
    half.on('dragstart', () => half.setDepth(14).setScale(1.035));
    half.on('drag', (_p: Phaser.Input.Pointer, x: number, y: number) => half.setPosition(x, y));
    half.on('dragend', () => {
      half.setDepth(8).setScale(1);
      if (Phaser.Math.Distance.Between(half.x, half.y, target.x, target.y) < 100) {
        if (!this.lockPath('accept')) { this.moveContainer(half, 120, 545); return; }
        this.moveContainer(half, target.x, target.y, 170, () => this.complete('accept'));
      } else this.moveContainer(half, 120, 545);
    });
  }

  private createUnfixedPath(): void {
    this.add.ellipse(640, 315, 230, 320, 0x9c8b73, .18).setStrokeStyle(3, 0xb19f7d, .38).setDepth(3);
    for (let i = 0; i < 7; i += 1) {
      const y = 205 + i * 34;
      const stitch = this.add.rectangle(640, y, 94, 5, 0x2d211c).setDepth(7).setInteractive({ useHandCursor: true });
      this.input.setDraggable(stitch);
      stitch.on('dragstart', () => stitch.setScale(1.05, 1.6));
      stitch.on('drag', (_p: Phaser.Input.Pointer, x: number, dragY: number) => stitch.setPosition(x, dragY));
      stitch.on('dragend', () => {
        stitch.setScale(1);
        if (Math.abs(stitch.x - 640) > 150) {
          if (!this.lockPath('unfixed')) {
            if (this.state.settings.reducedMotion) stitch.setPosition(640, y);
            else this.tweens.add({ targets: stitch, x: 640, y, duration: 150, ease: 'Sine.easeOut' });
            return;
          }
          stitch.disableInteractive();
          this.stitchCount += 1;
          this.audio.playSfx('stitch', .34);
          if (this.state.settings.reducedMotion) stitch.setAlpha(.18);
          else this.tweens.add({ targets: stitch, alpha: .12, x: stitch.x + Math.sign(stitch.x - 640) * 45, duration: 180, ease: 'Sine.easeOut' });
          if (this.stitchCount >= 7) this.complete('unfixed');
        } else if (this.state.settings.reducedMotion) stitch.setPosition(640, y);
        else this.tweens.add({ targets: stitch, x: 640, y, duration: 150, ease: 'Sine.easeOut' });
      });
    }
  }

  private createClosePath(): void {
    const crate = this.add.rectangle(1085, 520, 260, 115, 0x4d3424, .72).setStrokeStyle(4, 0x211912).setDepth(3);
    const positions = [[920, 180], [1030, 180], [1140, 180], [975, 300], [1090, 300]] as const;
    positions.forEach(([x, y]) => {
      const item = this.add.container(x, y).setDepth(7);
      const mask = this.add.ellipse(0, 0, 72, 92, 0xa89676, .82).setStrokeStyle(3, 0x30271f);
      const features = this.add.graphics().setAlpha(.6);
      features.lineStyle(1.4, 0x30271f, .8);
      features.strokeEllipse(-12, -10, 12, 6); features.strokeEllipse(12, -10, 12, 6);
      features.lineBetween(-12, 19, 12, 19);
      item.add([mask, features]);
      item.setSize(82, 104).setInteractive({ useHandCursor: true });
      this.input.setDraggable(item);
      item.on('dragstart', () => item.setDepth(14).setScale(1.035));
      item.on('drag', (_p: Phaser.Input.Pointer, dx: number, dy: number) => item.setPosition(dx, dy));
      item.on('dragend', () => {
        item.setDepth(7).setScale(1);
        if (crate.getBounds().contains(item.x, item.y)) {
          if (!this.lockPath('close')) { this.moveContainer(item, x, y); return; }
          item.disableInteractive();
          this.masksStored += 1;
          this.audio.playSfx('wood', .26);
          if (this.state.settings.reducedMotion) item.setVisible(false);
          else this.tweens.add({ targets: item, x: crate.x, y: crate.y, alpha: 0, scaleX: .72, scaleY: .72, duration: 190, ease: 'Sine.easeIn', onComplete: () => item.setVisible(false) });
          if (this.masksStored >= 5) this.revealLamp();
        } else this.moveContainer(item, x, y);
      });
    });
  }

  private revealLamp(): void {
    if (this.children.getByName('ending-lamp')) return;
    const lamp = this.add.circle(1080, 400, 34, 0xddbb72, .86).setStrokeStyle(3, 0x443522).setDepth(9).setInteractive({ useHandCursor: true }).setName('ending-lamp');
    lamp.on('pointerdown', () => {
      if (!this.lockPath('close')) return;
      lamp.disableInteractive().setFillStyle(0x4a453a, .35);
      if (!this.state.settings.reducedMotion) this.cameras.main.fadeOut(280, 12, 11, 8);
      this.time.delayedCall(this.state.settings.reducedMotion ? 0 : 220, () => this.complete('close'));
    });
  }

  private lockPath(path: EndingId): boolean {
    if (this.pathLocked && this.pathLocked !== path) {
      this.ui.setCaption('你已经开始了另一件事。这个动作被留在原处，没有替你改写选择。');
      return false;
    }
    if (this.pathLocked === path) return true;
    this.pathLocked = path;
    const text: Record<EndingId, string> = {
      accept: '半张脸贴近镜面，木纹在冷光里停了一瞬。',
      unfixed: '第一根线离开皮肤，旧结在地板上轻轻弹了一下。',
      close: '第一张面具落进木箱，墙上露出一块多年没有见过光的颜色。',
    };
    this.ui.setCaption(text[path]);
    return true;
  }

  private complete(path: EndingId): void {
    if (this.state.ending.completed) return;
    this.store.mutate((s) => { s.ending.chosen = path; s.ending.progress = 1; s.ending.completed = true; s.ngPlus = true; });
    this.audio.playSfx(path === 'close' ? 'wood' : 'breath', .5);
    const endings: Record<EndingId, string> = {
      accept: '半张脸贴近镜面，木纹没有继续向左生长。第二天，铺子仍开着，只是新订单最下面多了一行：有些地方不必替任何人填满。',
      unfixed: '最后一根线离开皮肤时，没有露出一张所谓真正的脸。阿七只是终于不再急着证明哪张脸最早、最真。',
      close: '工作灯熄灭，墙上的脸重新成为木头。阿七把门板拉到底；没有下一代，也可以是一种完整的结束。',
    };
    this.ui.setCaption(endings[path]);
    this.time.delayedCall(this.state.settings.reducedMotion ? 0 : 1150, () => this.renderCompleted());
  }

  private renderCompleted(): void {
    if (this.children.getByName('ending-complete')) return;
    this.add.rectangle(640, 360, 1280, 720, 0x10110e, .55).setDepth(15).setName('ending-complete');
    this.add.text(640, 300, '面 目', { fontFamily: 'Georgia, "Noto Serif SC", serif', fontSize: '60px', color: '#e0d1b1', letterSpacing: 18 }).setOrigin(.5).setDepth(16);
    this.add.text(640, 385, '有些木头记得手，但记得并不等于拥有。', { fontFamily: 'Georgia, "Noto Serif SC", serif', fontSize: '17px', color: '#b9ad95' }).setOrigin(.5).setDepth(16);
    this.addSymbolButton(640, 485, '⌂', () => eventBus.emit('title', undefined), 58).setDepth(17);
  }
}
