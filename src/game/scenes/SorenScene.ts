import Phaser from 'phaser';
import { BaseScene } from './BaseScene';
import { SCENE_INTROS } from '../../data/storyData';

export class SorenScene extends BaseScene {
  private lastScanAt = 0;
  constructor() { super('soren'); }
  preload(): void { this.preloadImage('bg-soren', 'soren.webp'); }

  create(): void {
    this.ui.setScene('soren');
    this.audio.stopAmbient();
    this.addBackground('bg-soren');
    this.installSorenLife();
    const intro = SCENE_INTROS.soren!;
    this.setObjective(intro.objective);
    if (this.state.soren.completed) { this.addNavArrow('forward', () => this.navigate('shop')); return; }
    const wall = this.add.rectangle(640, 365, 1060, 470, 0x0f1110, .018).setDepth(3);
    this.createWallCane(wall);
    if (!this.state.hiddenFlags.includes('soren-listening-ready')) this.scheduleObjectGlint(658, 250, 92, 120, 3800);
    if (this.state.soren.opened || this.state.soren.scanHits.length >= 3) this.openCavity();
    if (!this.state.hiddenFlags.includes(`${intro.flag}:seen`)) {
      this.store.mutate((state) => { state.hiddenFlags.push(`${intro.flag}:seen`); });
      this.ui.setCaption('索伦已经记不起人的脸，却还记得声音从哪里来、又从哪里回来。');
    }
  }


  private installSorenLife(): void {
    const bell = this.add.zone(658, 250, 120, 170).setDepth(10).setInteractive({ useHandCursor: true });
    bell.on('pointerdown', () => {
      this.store.mutate((state) => { if (!state.hiddenFlags.includes('soren-listening-ready')) state.hiddenFlags.push('soren-listening-ready'); }, false);
      this.audio.playSfx('knock', .16);
      this.ui.setCaption('钟声撞到石墙后回来了一次；右侧深处，又慢半拍还来第二次。');
      [0, 1, 2].forEach((i) => {
        const ring = this.add.ellipse(658, 260, 76, 76, 0xb7aa8d, .001).setStrokeStyle(2, 0xb7aa8d, .42).setDepth(11).setScale(.55);
        if (this.state.settings.reducedMotion) { this.time.delayedCall(180 + i * 80, () => ring.destroy()); return; }
        this.tweens.add({ targets: ring, scaleX: 1.9 + i * .28, scaleY: 1.9 + i * .28, alpha: 0, duration: 820 + i * 180, delay: i * 120, ease: 'Sine.easeOut', onComplete: () => ring.destroy() });
      });
    });
    const ear = this.add.zone(244, 244, 92, 150).setDepth(10).setInteractive({ useHandCursor: true });
    ear.on('pointerdown', () => {
      this.audio.playSfx('breath', .09);
      const pulse = this.add.arc(246, 245, 24, -70, 70, false, 0xc9b998, .001).setStrokeStyle(2, 0xc9b998, .55).setDepth(11);
      if (this.state.settings.reducedMotion) { this.time.delayedCall(140, () => pulse.destroy()); return; }
      this.tweens.add({ targets: pulse, x: 315, scale: 1.8, alpha: 0, duration: 620, ease: 'Sine.easeOut', onComplete: () => pulse.destroy() });
    });
    [659, 885, 1120].forEach((x, i) => {
      const bowl = this.add.zone(x, i === 0 ? 493 : 440, i === 0 ? 230 : 155, 100).setDepth(9).setInteractive({ useHandCursor: true });
      bowl.on('pointerdown', () => {
        const ripple = this.add.ellipse(x, i === 0 ? 493 : 440, i === 0 ? 120 : 76, 24, 0x9ca69b, .001).setStrokeStyle(1.5, 0xb8c2b5, .38).setDepth(10);
        if (this.state.settings.reducedMotion) { this.time.delayedCall(120, () => ripple.destroy()); return; }
        this.tweens.add({ targets: ripple, scaleX: 1.7, scaleY: 1.35, alpha: 0, duration: 520, ease: 'Sine.easeOut', onComplete: () => ripple.destroy() });
      });
    });
  }


  private createWallCane(wall: Phaser.GameObjects.Rectangle): void {
    const caneZone = this.add.zone(70, 500, 90, 250).setDepth(16).setInteractive({ useHandCursor: true });
    const caneRing = this.add.ellipse(72, 506, 58, 224, 0xd0b98d, .001).setStrokeStyle(2, 0xd0b98d, .35).setDepth(15).setAlpha(0);
    let selected = false;

    caneZone.on('pointerdown', () => {
      if (!this.state.hiddenFlags.includes('soren-listening-ready')) {
        this.audio.playSfx('wood', .10);
        this.ui.setCaption('索伦的手杖还靠在墙边。他没有伸手；先让房间里那口钟响一次。');
        return;
      }
      selected = !selected;
      this.audio.playSfx('wood', .12);
      if (this.state.settings.reducedMotion) caneRing.setAlpha(selected ? .38 : 0);
      else this.tweens.add({ targets: caneRing, alpha: selected ? .38 : 0, duration: 140, ease: 'Sine.easeOut' });
      this.ui.setCaption(selected ? '索伦把手杖递了过来。木头在掌心里很轻。' : '手杖重新靠回墙边。');
    });

    wall.setInteractive({ useHandCursor: true });
    wall.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (!selected) {
        this.audio.playSfx('knock', .08);
        this.ui.setCaption('空手敲石墙，声音很快就散了。');
        return;
      }
      if (this.time.now - this.lastScanAt < 90) return;
      const tip = this.add.line(0, 0, pointer.worldX - 54, pointer.worldY + 80, pointer.worldX, pointer.worldY, 0x6b563d, .72).setOrigin(0, 0).setLineWidth(5).setDepth(18);
      if (this.state.settings.reducedMotion) this.time.delayedCall(90, () => tip.destroy());
      else this.tweens.add({ targets: tip, alpha: 0, duration: 180, ease: 'Sine.easeOut', onComplete: () => tip.destroy() });
      this.scan(pointer.worldX, pointer.worldY);
    });
  }

  private scan(x: number, y: number): void {
    this.lastScanAt = this.time.now;
    const normalized = x / 1280;
    const doubleEcho = normalized >= .70 && normalized <= .82 && y > 180 && y < 560;
    const radius = doubleEcho ? 62 : 34;
    const ring = this.add.circle(x, y, radius, 0x718a85, .04).setStrokeStyle(3, doubleEcho ? 0xb5d2ca : 0x758b85, .75).setDepth(8);
    if (!this.state.settings.reducedMotion) this.tweens.add({ targets: ring, scale: doubleEcho ? 1.9 : 1.4, alpha: 0, duration: doubleEcho ? 850 : 520, onComplete: () => ring.destroy() });
    else this.time.delayedCall(180, () => ring.destroy());
    if (doubleEcho) {
      const second = this.add.circle(x + 16, y, radius + 20, 0x718a85, .02).setStrokeStyle(2, 0xb5d2ca, .5).setDepth(7);
      if (!this.state.settings.reducedMotion) this.tweens.add({ targets: second, scale: 1.7, alpha: 0, duration: 1050, onComplete: () => second.destroy() });
      else this.time.delayedCall(230, () => second.destroy());
      this.audio.playSfx('knock-double', .45);
      const bucket = Math.round(normalized * 20);
      if (!this.state.soren.scanHits.includes(bucket)) {
        this.store.mutate((s) => { s.soren.scanHits.push(bucket); }, false);
      }
      if (this.state.soren.scanHits.length >= 3 && !this.state.soren.opened) this.openCavity();
    } else {
      this.audio.playSfx('knock', .32);
    }
  }

  private openCavity(): void {
    this.store.mutate((s) => { s.soren.opened = true; });
    this.ui.setCaption('同一块墙连续回了两次声。第二层并不远，只是以前没人用脸以外的方法确认它。');
    const cavity = this.add.rectangle(965, 365, 150, 190, 0x554a3c, .7).setStrokeStyle(4, 0xa99572).setDepth(10).setInteractive({ useHandCursor: true });
    cavity.on('pointerdown', () => {
      if (this.state.soren.completed) return;
      this.store.mutate((s) => { s.soren.completed = true; if (!s.residues.includes('warm')) s.residues.push('warm'); if (!s.observations.includes('soren-space')) s.observations.push('soren-space'); });
      this.ui.setCaption('夹层里只有一块磨损镜面。索伦说：我记得她的声音，不记得她最后一张脸。脸颊残响却仍有温度。');
      this.audio.playSfx('glass', .5);
      this.addNavArrow('forward', () => this.navigate('shop'));
    });
  }
}
