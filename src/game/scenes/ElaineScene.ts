import Phaser from 'phaser';
import { BaseScene } from './BaseScene';
import { ELAINE_TARGET_ROTATIONS, elainePieceSolved } from '../puzzles/logic';
import { SCENE_INTROS } from '../../data/storyData';

export class ElaineScene extends BaseScene {
  private selectedIndex = 0;
  private pieces: Phaser.GameObjects.Container[] = [];
  private mirrorVeil!: Phaser.GameObjects.Ellipse;

  constructor() { super('elaine'); }

  preload(): void {
    this.preloadImage('bg-elaine', 'elaine.webp');
    for (let i = 0; i < 12; i += 1) this.preloadImage(`elaine-piece-${i}`, `interaction/elaine-piece-${String(i).padStart(2, '0')}.webp`);
  }

  create(): void {
    this.ui.setScene('elaine');
    this.audio.playAmbient('elaine', .17);
    this.addBackground('bg-elaine');
    this.addAtmosphere('dust', 15);
    this.installElaineLife();
    const intro = SCENE_INTROS.elaine!;
    this.setObjective(intro.objective);
    if (this.state.elaine.completed) { this.addNavArrow('forward', () => this.navigate('shop')); return; }

    this.mirrorVeil = this.add.ellipse(622, 284, 420, 472, 0x6a6e68, .82).setStrokeStyle(3, 0x3c3932, .42).setDepth(3);
    if (!this.state.settings.reducedMotion) this.tweens.add({ targets: this.mirrorVeil, alpha: { from: .77, to: .86 }, duration: 2300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    const targets = this.targetPositions();
    targets.forEach((pos) => {
      this.add.rectangle(pos.x, pos.y, 112, 120, 0x1d1d19, .08).setStrokeStyle(1, 0xc9b998, .16).setDepth(4);
    });

    for (let i = 0; i < 12; i += 1) this.createPiece(i, targets[i]!);
    this.input.on('wheel', (_pointer: Phaser.Input.Pointer, _over: Phaser.GameObjects.GameObject[], _dx: number, dy: number) => this.rotateSelected(dy > 0 ? 90 : -90));
    if (!this.state.hiddenFlags.includes(`${intro.flag}:seen`)) {
      this.store.mutate((state) => { state.hiddenFlags.push(`${intro.flag}:seen`); });
      this.ui.setCaption('伊莲把十二块镜片留在后台。脸在每一年都不同，身体却还保留着同样的小动作。');
    }
  }


  private installElaineLife(): void {
    // Small, optional discoveries: the dressing room should feel watched even when the puzzle is untouched.
    this.addMouthEasterEgg(214, 104, 120, 126, 34, 15, 'breath');
    this.addBlinkEasterEgg(922, 113, 112, 128, 16, 11, 'paper');
    this.addBlinkEasterEgg(905, 287, 108, 132, 15, 10, 'glass');
    this.addMouthEasterEgg(205, 302, 132, 128, 30, 13, 'breath');
    if (this.state.settings.reducedMotion) return;
    [374, 794].forEach((x, column) => {
      [57, 124, 190, 258, 326, 394].forEach((y, i) => {
        const bulb = this.add.circle(x, y, 11, 0xf3d8a0, .03).setBlendMode(Phaser.BlendModes.ADD).setDepth(2);
        this.tweens.add({ targets: bulb, alpha: { from: .012, to: .10 }, scale: { from: .96, to: 1.04 }, duration: 920 + i * 80 + column * 130, yoyo: true, repeat: -1, delay: i * 55, ease: 'Sine.easeInOut' });
      });
    });
    const curtainShadow = this.add.rectangle(1205, 348, 175, 610, 0x170e0d, .02).setDepth(1).setAngle(-1);
    this.tweens.add({ targets: curtainShadow, x: 1192, angle: .8, alpha: .055, duration: 2800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  private targetPositions(): Array<{ x: number; y: number }> {
    return Array.from({ length: 12 }, (_, i) => ({ x: 442 + (i % 4) * 118, y: 150 + Math.floor(i / 4) * 134 }));
  }

  private homePosition(index: number): { x: number; y: number } {
    const left = [135, 255, 135, 255, 135, 255];
    const right = [1005, 1130, 1005, 1130, 1005, 1130];
    if (index < 6) return { x: left[index] ?? 135, y: 190 + Math.floor(index / 2) * 150 };
    const local = index - 6;
    return { x: right[local] ?? 1005, y: 190 + Math.floor(local / 2) * 150 };
  }

  private createPiece(index: number, target: { x: number; y: number }): void {
    const saved = this.state.elaine.pieces[String(index)];
    const home = this.homePosition(index);
    const piece = this.add.container(saved?.x ?? home.x, saved?.y ?? home.y).setDepth(9);
    const shadow = this.add.rectangle(4, 5, 110, 116, 0x0c0b09, .28);
    const image = this.add.image(0, 0, `elaine-piece-${index}`).setDisplaySize(106, 112);
    const edge = this.add.rectangle(0, 0, 110, 116, 0xffffff, .001).setStrokeStyle(2, 0x463f35, .85);
    piece.add([shadow, image, edge]);
    const initialAngle = saved?.rotation ?? ((index * 90 + 90) % 360);
    piece.setAngle(initialAngle);
    piece.setSize(118, 124).setInteractive({ useHandCursor: true });
    this.input.setDraggable(piece);

    let pointerDownAt = 0;
    let dragged = false;
    piece.on('pointerdown', () => {
      pointerDownAt = this.time.now;
      dragged = false;
      this.selectedIndex = index;
      this.pulse(piece);
    });
    piece.on('dragstart', () => {
      dragged = true;
      piece.setDepth(18).setScale(1.045);
      this.focusCamera(620, 300, 1.025, 130);
    });
    piece.on('drag', (_p: Phaser.Input.Pointer, x: number, y: number) => piece.setPosition(x, y));
    piece.on('dragend', () => {
      piece.setDepth(9).setScale(1);
      this.resetCamera(130);
      this.trySnap(index, piece, target);
    });
    piece.on('pointerup', () => {
      if (!dragged && this.time.now - pointerDownAt < 260 && piece.input?.enabled) this.rotateSelected(90);
    });

    if (saved?.snapped) {
      piece.setPosition(target.x, target.y).setAngle(ELAINE_TARGET_ROTATIONS[index] ?? 0).disableInteractive();
    }
    this.pieces[index] = piece;
  }

  private rotateSelected(delta = 90): void {
    const piece = this.pieces[this.selectedIndex];
    if (!piece || !piece.input?.enabled) return;
    const targetAngle = Math.round((piece.angle + delta) / 90) * 90;
    if (this.state.settings.reducedMotion) piece.setAngle(targetAngle);
    else this.tweens.add({ targets: piece, angle: targetAngle, duration: 120, ease: 'Sine.easeOut' });
    this.audio.playSfx('glass', .12);
    const target = this.targetPositions()[this.selectedIndex];
    this.time.delayedCall(this.state.settings.reducedMotion ? 0 : 125, () => { if (target) this.trySnap(this.selectedIndex, piece, target, false); });
  }

  private trySnap(index: number, piece: Phaser.GameObjects.Container, target: { x: number; y: number }, bounce = true): void {
    const targetRotation = ELAINE_TARGET_ROTATIONS[index] ?? 0;
    const close = Phaser.Math.Distance.Between(piece.x, piece.y, target.x, target.y) < 82;
    const rotationOk = elainePieceSolved(piece.angle, targetRotation);
    if (close && rotationOk) {
      piece.disableInteractive();
      this.settleContainer(piece, target.x, target.y, 220);
      this.store.mutate((s) => { s.elaine.pieces[String(index)] = { x: target.x, y: target.y, rotation: targetRotation, snapped: true }; }, false);
      this.audio.playSfx('glass', .24);
      const glint = this.add.rectangle(target.x, target.y, 4, 112, 0xf1e6d0, .65).setAngle(-18).setDepth(16);
      if (!this.state.settings.reducedMotion) this.tweens.add({ targets: glint, x: target.x + 54, alpha: 0, duration: 240, onComplete: () => glint.destroy() });
      else glint.destroy();
      if (Object.values(this.state.elaine.pieces).filter((p) => p.snapped).length >= 12) this.finish();
      return;
    }
    this.store.mutate((s) => { s.elaine.pieces[String(index)] = { x: piece.x, y: piece.y, rotation: piece.angle, snapped: false }; }, false);
    if (bounce && close && !rotationOk) {
      this.audio.playSfx('glass', .12);
      this.nudge(piece, index % 2 === 0 ? 7 : -7);
    }
  }

  private finish(): void {
    this.store.mutate((s) => { s.elaine.completed = true; });
    this.completeMask('elaine', 'elaine-habit');
    this.store.flush();
    if (this.state.settings.reducedMotion) this.mirrorVeil.setAlpha(.06);
    else this.tweens.add({ targets: this.mirrorVeil, alpha: .06, duration: 720, ease: 'Sine.easeOut' });
    this.ui.setCaption('十二块不同年份的脸拼回同一面镜子。真正连续的不是相貌，而是她抬手、侧身和迟疑的方式。');
    this.audio.playSfx('glass', .6);
    this.time.delayedCall(this.state.settings.reducedMotion ? 0 : 480, () => this.addNavArrow('forward', () => this.navigate('shop')));
  }
}
