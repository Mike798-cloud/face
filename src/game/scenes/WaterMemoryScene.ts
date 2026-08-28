import Phaser from 'phaser';
import { BaseScene } from './BaseScene';
import { SCENE_INTROS } from '../../data/storyData';

export class WaterMemoryScene extends BaseScene {
  private clockHand!: Phaser.GameObjects.Rectangle;
  private lastAngle = 0;
  private draggingClock = false;
  private fogCells: Phaser.GameObjects.Ellipse[] = [];
  private cleared = new Set<number>();

  constructor() { super('water'); }
  preload(): void { this.preloadImage('bg-water', 'water-memory.webp'); }

  create(): void {
    this.ui.setScene('water');
    this.audio.playAmbient('water', .2);
    this.addBackground('bg-water');
    this.addAtmosphere('water', 20);
    this.installWaterLife();
    const intro = SCENE_INTROS.water!;
    this.setObjective(intro.objective);
    this.createReverseObjects();
    this.createClock();
    if (this.state.water.reverseProgress < 1) this.scheduleObjectGlint(1015, 260, 190, 190, 3900);
    if (this.state.water.reverseProgress >= 1) this.createFog();
    if (this.state.water.completed) {
      this.addExitButton();
    } else if (!this.state.hiddenFlags.includes(`${intro.flag}:seen`)) {
      this.store.mutate((state) => { state.hiddenFlags.push(`${intro.flag}:seen`); });
      this.ui.setCaption('水把家具推向过去，墙钟却仍固执地向前。镜面上的雾没有替你解释原因。');
    }
  }

  private createReverseObjects(): void {
    const droplets = Array.from({ length: 14 }, (_, i) => this.add.circle(130 + i * 72, 585 - (i % 4) * 52, 5 + (i % 3), 0x91a8a5, .55).setDepth(3));
    const shards = Array.from({ length: 8 }, (_, i) => this.add.triangle(310 + i * 55, 530 + (i % 2) * 18, 0, 28, 16, 0, 31, 29, 0xa8bbb6, .45).setDepth(3));
    if (!this.state.settings.reducedMotion) {
      droplets.forEach((d, i) => this.tweens.add({ targets: d, y: d.y - 46, alpha: .2, duration: 1400 + i * 70, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }));
      shards.forEach((s, i) => this.tweens.add({ targets: s, x: s.x - 18, angle: -12, duration: 1900 + i * 80, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }));
    }
  }

  private createClock(): void {
    const cx = 1015;
    const cy = 260;
    this.add.circle(cx, cy, 102, 0xd6c7a4, .9).setStrokeStyle(7, 0x343028).setDepth(5);
    for (let i = 0; i < 12; i += 1) {
      const angle = Phaser.Math.DegToRad(i * 30 - 90);
      this.add.circle(cx + Math.cos(angle) * 82, cy + Math.sin(angle) * 82, 3, 0x3b362e).setDepth(6);
    }
    this.clockHand = this.add.rectangle(cx, cy - 46, 7, 96, 0x332d25).setOrigin(.5, .94).setDepth(7);
    this.clockHand.rotation = -this.state.water.reverseProgress * Math.PI * 2;

    // The whole clock face acts as the grab target, which is much more forgiving on touch screens.
    const clockHit = this.add.circle(cx, cy, this.state.settings.largeTargets ? 124 : 112, 0xffffff, .001)
      .setDepth(8)
      .setInteractive({ useHandCursor: true });
    clockHit.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.state.water.reverseProgress >= 1) return;
      this.draggingClock = true;
      this.lastAngle = Phaser.Math.Angle.Between(cx, cy, pointer.worldX, pointer.worldY);
      if (!this.state.settings.reducedMotion) this.tweens.add({ targets: this.clockHand, scaleX: 1.2, duration: 80, yoyo: true });
    });
    this.input.on('pointerup', () => {
      if (this.draggingClock) this.store.flush();
      this.draggingClock = false;
    });
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.draggingClock || this.state.water.reverseProgress >= 1) return;
      const angle = Phaser.Math.Angle.Between(cx, cy, pointer.worldX, pointer.worldY);
      const delta = Phaser.Math.Angle.Wrap(angle - this.lastAngle);
      this.lastAngle = angle;

      // Counter-clockwise increases reverse progress; clockwise motion naturally gives some progress back.
      // This keeps the hand attached to the player's gesture instead of feeling sticky on small jitters.
      const progress = Phaser.Math.Clamp(this.state.water.reverseProgress - delta / (Math.PI * 2), 0, 1);
      this.store.mutate((s) => { s.water.reverseProgress = progress; }, false);
      this.clockHand.rotation = -progress * Math.PI * 2;
      this.applyWorldReverse(progress);
      if (progress >= .995) {
        this.store.mutate((s) => { s.water.reverseProgress = 1; });
        this.store.flush();
        this.draggingClock = false;
        this.clockHand.rotation = -Math.PI * 2;
        this.audio.playSfx('clock', .65);
        this.createFog();
      }
    });
  }

  private applyWorldReverse(progress: number): void {
    const tint = Phaser.Display.Color.Interpolate.ColorWithColor(
      Phaser.Display.Color.ValueToColor(0x9a9b8c), Phaser.Display.Color.ValueToColor(0x657f82), 100, Math.floor(progress * 100),
    );
    this.cameras.main.setBackgroundColor(Phaser.Display.Color.GetColor(tint.r, tint.g, tint.b));
  }

  private createFog(): void {
    if (this.fogCells.length) return;
    const cols = 6;
    const rows = 4;
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        const index = y * cols + x;
        // Overlapping soft shapes remove the old checkerboard feeling while keeping save compatibility (24 cells).
        const cell = this.add.ellipse(212 + x * 68, 188 + y * 84, 105, 120, 0xc7d0c9, .54).setDepth(12);
        this.fogCells.push(cell);
        if (index < this.state.water.clearedCells) { cell.setVisible(false); this.cleared.add(index); }
      }
    }
    const reveal = this.add.rectangle(382, 315, 420, 330, 0x88907f, .12).setStrokeStyle(2, 0xe1d6be, .28).setDepth(10);
    this.add.text(382, 315, '两个人的旧轮廓\n隔着雾站在同一面镜子里', {
      fontFamily: 'Georgia, "Noto Serif SC", serif', fontSize: '18px', color: '#ddd1b8', align: 'center',
    }).setOrigin(.5).setDepth(11);
    reveal.setInteractive({ useHandCursor: true });
    if (!this.state.water.completed) this.scheduleObjectGlint(382, 315, 360, 270, 3600);
    let wiping = false;
    reveal.on('pointerdown', (pointer: Phaser.Input.Pointer) => { wiping = true; this.wipe(pointer.worldX, pointer.worldY); });
    this.input.on('pointerup', () => { wiping = false; this.store.flush(); });
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (wiping) this.wipe(pointer.worldX, pointer.worldY);
    });
    if (this.state.water.completed) this.addExitButton();
  }

  private wipe(x: number, y: number): void {
    this.fogCells.forEach((cell, index) => {
      if (this.cleared.has(index)) return;
      const dx = x - cell.x;
      const dy = y - cell.y;
      if ((dx * dx) / (60 * 60) + (dy * dy) / (65 * 65) > 1) return;
      this.cleared.add(index);
      this.audio.playSfx('glass', .055);
      this.store.mutate((s) => { s.water.clearedCells = this.cleared.size; }, false);
      if (this.state.settings.reducedMotion) cell.setVisible(false);
      else this.tweens.add({ targets: cell, alpha: 0, scaleX: 1.08, scaleY: 1.08, duration: 170, ease: 'Sine.easeOut', onComplete: () => cell.setVisible(false) });
    });
    if (this.cleared.size >= 15 && !this.state.water.completed) {
      this.store.mutate((s) => {
        s.water.completed = true;
        s.water.clearedCells = this.cleared.size;
        if (!s.observations.includes('clock-exception')) s.observations.push('clock-exception');
        s.currentScene = 'shop';
      });
      this.store.flush();
      this.audio.playSfx('clock', .75);
      this.ui.setCaption('雾退到最后一层时，镜中两个人的轮廓没有合成一张脸。水底的门却松开了。');
      this.time.delayedCall(this.state.settings.reducedMotion ? 0 : 420, () => this.addExitButton());
    }
  }

  private installWaterLife(): void {
    this.addBlinkEasterEgg(250, 228, 105, 85, 11, 9, 'glass');
    this.addBlinkEasterEgg(785, 232, 100, 82, 10, 8, 'glass');
    this.addPulseEasterEgg(1125, 248, 210, 360, 0xa8c5c1, 'wood');
    if (!this.state.settings.reducedMotion) {
      const paper = this.add.rectangle(730, 470, 40, 24, 0xd9d2ba, .18).setDepth(2).setAngle(-14);
      this.tweens.add({ targets: paper, x: 790, y: 430, angle: 7, alpha: { from: .08, to: .24 }, duration: 3300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      const chairShadow = this.add.ellipse(718, 442, 96, 24, 0x0b1212, .07).setDepth(1);
      this.tweens.add({ targets: chairShadow, scaleX: 1.12, alpha: .025, duration: 2100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
  }

  private addExitButton(): void {
    if (this.children.getByName('water-exit')) return;
    this.addNavArrow('forward', () => this.navigate('shop')).setName('water-exit');
  }
}
