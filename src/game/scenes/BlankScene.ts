import Phaser from 'phaser';
import { BaseScene } from './BaseScene';
import { SCENE_INTROS } from '../../data/storyData';

type LegacyChoiceId = 'thread' | 'handkerchief' | 'apron';
interface ChoiceSpec {
  id: LegacyChoiceId;
  label: string;
  note: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

// The save keys stay compatible with v4.1.x, but the visible choices are the objects
// that already exist in blank.webp. No substitute vector props are drawn over the artwork.
const CHOICES: readonly ChoiceSpec[] = [
  { id: 'handkerchief', label: '母亲留下的旧照片', note: '照片里的人没有看镜头。背面只有一个早已褪色的日期。', x: 392, y: 462, width: 160, height: 190 },
  { id: 'thread', label: '师父的工作册', note: '页角全是修改痕迹。师父把“稳定”写了很多遍，却从没写过“完整”。', x: 642, y: 505, width: 205, height: 95 },
  { id: 'apron', label: '阿七一直带着的怀表', note: '表针走得很准。它没有替任何人决定下一分钟该做什么。', x: 874, y: 478, width: 160, height: 160 },
];

export class BlankScene extends BaseScene {
  constructor() { super('blank'); }
  preload(): void { this.preloadImage('bg-blank', 'blank.webp'); }

  create(): void {
    this.ui.setScene('blank');
    this.audio.playAmbient('sea', .12);
    this.addBackground('bg-blank');
    this.addAtmosphere('dust', 9);
    this.installBlankLife();
    const intro = SCENE_INTROS.blank!;
    this.setObjective(intro.objective);
    if (this.state.blank.completed) { this.addNavArrow('forward', () => this.navigate('shop')); return; }

    CHOICES.forEach((choice) => this.createChoice(choice));
    this.createBlankMaskTarget();
    if (!this.state.hiddenFlags.includes(`${intro.flag}:seen`)) {
      this.store.mutate((state) => { state.hiddenFlags.push(`${intro.flag}:seen`); });
      this.ui.setCaption('这一次，三件东西都是真的。桌上的白面具没有写名字，也没有替你决定该把哪一件留给它。');
    }
  }


  private installBlankLife(): void {
    this.addBlinkEasterEgg(640, 196, 180, 150, 27, 16, 'breath');
    this.addMouthEasterEgg(640, 196, 180, 150, 38, 14, 'breath');
    const watch = this.add.zone(873, 476, 150, 150).setDepth(10).setInteractive({ useHandCursor: true });
    watch.on('pointerdown', () => {
      this.audio.playSfx('clock', .13);
      const hand = this.add.rectangle(861, 466, 2, 27, 0x2c261f, .72).setOrigin(.5, 1).setDepth(11);
      if (this.state.settings.reducedMotion) { hand.setAngle(36); this.time.delayedCall(160, () => hand.destroy()); return; }
      this.tweens.add({ targets: hand, angle: 64, duration: 520, ease: 'Sine.easeInOut', onComplete: () => hand.destroy() });
    });
    const mirror = this.add.zone(1118, 280, 220, 300).setDepth(9).setInteractive({ useHandCursor: true });
    mirror.on('pointerdown', () => {
      this.audio.playSfx('glass', .08);
      const glint = this.add.rectangle(1070, 275, 3, 230, 0xe9e2cf, .10).setAngle(18).setBlendMode(Phaser.BlendModes.ADD).setDepth(11);
      if (this.state.settings.reducedMotion) { this.time.delayedCall(150, () => glint.destroy()); return; }
      this.tweens.add({ targets: glint, x: 1170, alpha: 0, duration: 650, ease: 'Sine.easeOut', onComplete: () => glint.destroy() });
    });
    const flower = this.add.zone(168, 236, 170, 210).setDepth(9).setInteractive({ useHandCursor: true });
    flower.on('pointerdown', () => {
      const petal = this.add.ellipse(166, 215, 16, 9, 0x8a6f4c, .32).setDepth(11).setAngle(-28);
      if (this.state.settings.reducedMotion) { petal.setY(242); this.time.delayedCall(180, () => petal.destroy()); return; }
      this.tweens.add({ targets: petal, y: 255, x: 174, angle: 22, alpha: 0, duration: 900, ease: 'Sine.easeIn', onComplete: () => petal.destroy() });
    });
  }

  private createChoice(choice: ChoiceSpec): void {
    const zone = this.add.zone(choice.x, choice.y, choice.width, choice.height).setDepth(9).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', () => {
      if (this.state.blank.completed) return;
      this.store.mutate((s) => { s.blank.hoveredChoice = choice.id; }, false);
      this.audio.playSfx(choice.id === 'apron' ? 'clock' : 'paper', .14);
      this.ui.setCaption(choice.note);
      this.children.getByName('blank-choice-ring')?.destroy();
      const ring = this.add.circle(choice.x, choice.y, Math.max(choice.width, choice.height) * .36, 0xd9c8a7, .008)
        .setStrokeStyle(3, 0xdac8a7, .55).setDepth(10).setName('blank-choice-ring');
      if (!this.state.settings.reducedMotion) this.tweens.add({ targets: ring, scale: { from: .96, to: 1.05 }, alpha: { from: .38, to: .7 }, duration: 780, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      const maskCue = this.add.ellipse(640, 196, 174, 146, 0xe5d6b6, .001).setStrokeStyle(2, 0xe5d6b6, .28).setDepth(10);
      if (this.state.settings.reducedMotion) this.time.delayedCall(260, () => maskCue.destroy());
      else this.tweens.add({ targets: maskCue, scaleX: 1.08, scaleY: 1.08, alpha: 0, duration: 620, ease: 'Sine.easeOut', onComplete: () => maskCue.destroy() });
    });
  }

  private createBlankMaskTarget(): void {
    const zone = this.add.zone(640, 196, 190, 160).setDepth(11).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', () => {
      if (this.state.blank.completed) return;
      const id = this.state.blank.hoveredChoice;
      const choice = CHOICES.find((candidate) => candidate.id === id);
      if (!choice) {
        this.audio.playSfx('breath', .08);
        this.ui.setCaption('白面具没有回应。它像是在等你先从房间里拿定一件东西。');
        return;
      }
      this.choose(choice, zone, null);
    });
  }

  private choose(choice: ChoiceSpec, zone: Phaser.GameObjects.Zone, ring: Phaser.GameObjects.Arc | null): void {
    if (this.state.blank.completed) return;
    zone.disableInteractive();
    this.store.mutate((s) => {
      s.blank.hoveredChoice = choice.id;
      s.blank.choice = choice.id;
      s.blank.completed = true;
      if (!s.residues.includes('blank')) s.residues.push('blank');
      if (!s.observations.includes('blank-choice')) s.observations.push('blank-choice');
    });
    this.store.flush();
    this.audio.playSfx('breath', .35);
    if (ring) {
      if (this.state.settings.reducedMotion) ring.setAlpha(.4);
      else this.tweens.add({ targets: ring, scale: 1.18, alpha: 0, duration: 420, ease: 'Sine.easeOut', onComplete: () => ring.destroy() });
    }
    const shade = this.add.rectangle(640, 360, 1280, 720, 0x171713, .01).setDepth(8);
    if (!this.state.settings.reducedMotion) this.tweens.add({ targets: shade, alpha: .36, duration: 380, yoyo: true, hold: 180, ease: 'Sine.easeInOut', onComplete: () => shade.destroy() });
    this.ui.setCaption(`阿七拿起${choice.label}。没有铃声，也没有“正确”。房间只是第一次没有替他把另外两件东西推回来。`);
    this.time.delayedCall(this.state.settings.reducedMotion ? 0 : 480, () => this.addNavArrow('forward', () => this.navigate('shop')));
  }
}
