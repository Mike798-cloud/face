import Phaser from 'phaser';
import { BaseScene } from './BaseScene';
import { SCENE_INTROS } from '../../data/storyData';

interface Waypoint { x: number; y: number; note: string; }

const WAYPOINTS: readonly Waypoint[] = [
  { x: 405, y: 612, note: '脚下是进镇时最熟悉的裂石。' },
  { x: 500, y: 525, note: '路在草坡之间拐了第一次弯。' },
  { x: 560, y: 454, note: '海灯被雾切成一小块暖色。' },
  { x: 640, y: 425, note: '中央邮箱始终在同一条视线上。' },
  { x: 748, y: 468, note: '风从右侧草坡压过来。' },
  { x: 875, y: 540, note: '第六步以后，身体已经开始替记忆做决定。' },
  { x: 1010, y: 600, note: '再向前一步，昨天就会回来。' },
] as const;

export class PostmanScene extends BaseScene {
  private step = 0;
  private moving = false;
  private escaped = false;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private status!: Phaser.GameObjects.Text;
  private currentTrace: Phaser.GameObjects.Container | null = null;

  constructor() { super('postman'); }
  preload(): void { this.preloadImage('bg-postman', 'postman.webp'); }

  create(): void {
    this.ui.setScene('postman');
    this.audio.playAmbient('sea', .22);
    this.addBackground('bg-postman');
    this.addAtmosphere('fog', 16);
    this.installPostmanLife();
    const intro = SCENE_INTROS.postman!;
    this.setObjective(intro.objective);
    if (this.state.postman.completed) { this.addNavArrow('forward', () => this.navigate('shop')); return; }

    this.step = Phaser.Math.Clamp(this.state.postman.step, 0, 7);
    this.escaped = this.state.postman.escaped;
    this.status = this.add.text(640, 626, '', {
      fontFamily: 'Georgia, "Noto Serif SC", serif', fontSize: '13px', color: '#e5d8bd',
      backgroundColor: '#191a16d6', padding: { x: 12, y: 7 }, align: 'center',
    }).setOrigin(.5).setDepth(16).setVisible(false);

    const keyboard = this.input.keyboard;
    if (!keyboard) throw new Error('Keyboard input is unavailable.');
    this.cursors = keyboard.createCursorKeys();

    this.addSymbolButton(72, 646, '‹', () => this.move(-1), 50);
    this.addSymbolButton(1208, 646, '›', () => this.move(1), 50);
    const backRoad = this.add.zone(300, 470, 500, 310).setDepth(6).setInteractive({ useHandCursor: true });
    const forwardRoad = this.add.zone(950, 470, 520, 310).setDepth(6).setInteractive({ useHandCursor: true });
    backRoad.on('pointerdown', () => this.move(-1));
    forwardRoad.on('pointerdown', () => this.move(1));
    if (this.step === 0) this.scheduleObjectGlint(930, 520, 260, 90, 4200);

    if (this.escaped) this.finishRoad();
    else this.renderStepState(false);
    if (!this.state.hiddenFlags.includes(`${intro.flag}:seen`)) {
      this.store.mutate((state) => { state.hiddenFlags.push(`${intro.flag}:seen`); });
      this.ui.setCaption('埃利亚斯说自己每天都走到第七只邮箱。路没有变，真正重复的是身体记住的那一套步子。');
    }
  }


  private installPostmanLife(): void {
    const lighthouse = this.add.zone(1035, 205, 165, 250).setDepth(10).setInteractive({ useHandCursor: true });
    lighthouse.on('pointerdown', () => {
      this.audio.playSfx('glass', .11);
      const beam = this.add.triangle(1038, 176, 0, 0, -430, 120, -26, 26, 0xe8ddbd, .10)
        .setOrigin(0, .5).setBlendMode(Phaser.BlendModes.ADD).setDepth(11).setAngle(-14);
      if (this.state.settings.reducedMotion) { this.time.delayedCall(180, () => beam.destroy()); return; }
      this.tweens.add({ targets: beam, angle: 18, alpha: { from: .03, to: .16 }, duration: 780, yoyo: true, ease: 'Sine.easeInOut', onComplete: () => beam.destroy() });
    });

    const streetLamp = this.add.zone(218, 225, 130, 230).setDepth(10).setInteractive({ useHandCursor: true });
    streetLamp.on('pointerdown', () => {
      this.audio.playSfx('glass', .08);
      const glow = this.add.ellipse(218, 223, 105, 120, 0xe6c77f, .10).setBlendMode(Phaser.BlendModes.ADD).setDepth(11);
      if (this.state.settings.reducedMotion) { this.time.delayedCall(160, () => glow.destroy()); return; }
      this.tweens.add({ targets: glow, alpha: { from: .03, to: .16 }, scaleX: 1.08, scaleY: .96, duration: 140, yoyo: true, repeat: 2, onComplete: () => glow.destroy() });
    });

    const mailbox = this.add.zone(640, 424, 150, 160).setDepth(10).setInteractive({ useHandCursor: true });
    mailbox.on('pointerdown', () => {
      this.audio.playSfx('wood', .10);
      const flag = this.add.rectangle(619, 382, 7, 41, 0x7d3028, .82).setOrigin(.5, 1).setDepth(11);
      if (this.state.settings.reducedMotion) { flag.setAngle(-32); this.time.delayedCall(180, () => flag.destroy()); return; }
      this.tweens.add({ targets: flag, angle: -54, duration: 160, yoyo: true, hold: 160, ease: 'Back.easeOut', onComplete: () => flag.destroy() });
    });

    if (!this.state.settings.reducedMotion) {
      const seaLine = this.add.rectangle(690, 304, 340, 2, 0xdfe6df, .025).setDepth(1);
      this.tweens.add({ targets: seaLine, x: 760, alpha: { from: .01, to: .075 }, duration: 2500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
  }

  override update(): void {
    if (this.moving || this.escaped || this.state.postman.completed) return;
    if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) this.move(1);
    if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) this.move(-1);
  }

  private move(direction: -1 | 1): void {
    if (this.moving || this.escaped || this.state.postman.escaped || this.state.postman.completed) return;
    if (direction === -1 && this.step === 6) {
      this.escapeLoop();
      return;
    }

    if (direction === -1) {
      this.step = Math.max(0, this.step - 1);
      this.store.mutate((s) => { s.postman.step = this.step; s.postman.facing = -1; }, false);
      this.animateStep(false);
      return;
    }

    const next = this.step + 1;
    if (next >= 7) {
      this.store.mutate((s) => { s.postman.loopCount += 1; s.postman.step = 0; s.postman.facing = 1; }, false);
      this.step = 0;
      this.ui.setCaption('第七步落下。海风先停，随后连你刚才踩过的地方都回到了最初。');
      this.audio.playSfx('clock', .35);
      if (!this.state.settings.reducedMotion) {
        this.cameras.main.flash(180, 190, 200, 190, false);
        this.cameras.main.shake(130, .0018);
      }
      this.renderStepState(true);
      return;
    }

    this.step = next;
    this.store.mutate((s) => { s.postman.step = this.step; s.postman.facing = 1; }, false);
    this.animateStep(false);
  }

  private animateStep(escaped: boolean): void {
    this.moving = true;
    this.audio.playSfx('step', .2);
    const waypoint = WAYPOINTS[Math.min(this.step, WAYPOINTS.length - 1)]!;
    this.leaveFootTrace(waypoint.x, waypoint.y);
    if (this.state.settings.reducedMotion) {
      this.moving = false;
      this.renderStepState(false);
      if (escaped) this.finishRoad();
      return;
    }

    this.cameras.main.pan(waypoint.x, waypoint.y - 35, escaped ? 390 : 285, 'Sine.easeInOut');
    this.cameras.main.zoomTo(this.step >= 5 ? 1.045 : 1.025, escaped ? 390 : 285, 'Sine.easeInOut');
    this.time.delayedCall(escaped ? 400 : 295, () => {
      this.moving = false;
      this.renderStepState(false);
      if (escaped) this.finishRoad();
    });
  }

  private renderStepState(reset: boolean): void {
    const visibleStep = Math.min(this.step, 6);
    this.status.setText(this.escaped ? '循环已断开' : `脚步 ${visibleStep} / 6 · ${this.state.postman.facing === -1 ? '面向来路' : '面向前方'}`);
    const waypoint = WAYPOINTS[Math.min(visibleStep, WAYPOINTS.length - 1)]!;
    if (!reset) this.ui.setCaption(waypoint.note);
    if (visibleStep === 6 && !this.escaped && !this.children.getByName('postman-wind-ribbon')) {
      const ribbon = this.add.rectangle(720, 300, 78, 9, 0xb79c72, .52).setAngle(-8).setDepth(8).setName('postman-wind-ribbon');
      const tail = this.add.triangle(680, 302, 0, 0, 20, -10, 20, 10, 0xb79c72, .52).setDepth(8);
      if (!this.state.settings.reducedMotion) {
        this.tweens.add({ targets: [ribbon, tail], x: '-=92', angle: '-=5', duration: 1050, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      }
    }
    if (this.state.settings.reducedMotion) return;
    this.cameras.main.pan(waypoint.x, waypoint.y - 35, reset ? 420 : 170, 'Sine.easeInOut');
    this.cameras.main.zoomTo(visibleStep >= 5 ? 1.045 : 1.025, reset ? 420 : 170, 'Sine.easeInOut');
  }

  private leaveFootTrace(x: number, y: number): void {
    this.currentTrace?.destroy();
    const trace = this.add.container(x, y).setDepth(7).setAlpha(.42);
    const left = this.add.ellipse(-9, 0, 10, 24, 0x282720, .62).setAngle(-16);
    const right = this.add.ellipse(10, 7, 10, 24, 0x282720, .62).setAngle(16);
    trace.add([left, right]);
    this.currentTrace = trace;
    if (!this.state.settings.reducedMotion) {
      this.tweens.add({ targets: trace, alpha: .12, duration: 1250, ease: 'Sine.easeOut' });
    }
  }

  private escapeLoop(): void {
    this.escaped = true;
    this.store.mutate((s) => { s.postman.escaped = true; s.postman.facing = -1; s.postman.step = 7; });
    this.status.setText('第六步后回身 · 循环断开');
    this.ui.setCaption('第六步以后，阿七第一次没有继续向前。道路没有重置；中央那只一直存在的邮箱，忽然像第一次被真正看见。');
    this.animateStep(true);
  }

  private finishRoad(): void {
    if (this.children.getByName('postman-letter')) return;
    this.escaped = true;
    this.status.setText('循环已断开 · 中央邮箱');
    this.resetCamera(260);
    this.focusCamera(640, 430, 1.08, 320);

    const letter = this.add.container(640, 438).setDepth(12).setName('postman-letter');
    const shadow = this.add.rectangle(4, 5, 116, 76, 0x17130f, .25);
    const envelope = this.add.rectangle(0, 0, 116, 76, 0xc4b18a, .94).setStrokeStyle(2, 0x4d4030);
    const foldA = this.add.line(0, 0, -53, -31, 0, 5, 0x79684e, .62).setLineWidth(1);
    const foldB = this.add.line(0, 0, 53, -31, 0, 5, 0x79684e, .62).setLineWidth(1);
    const text = this.add.text(0, 16, '三十年前', { fontFamily: 'Georgia, "Noto Serif SC", serif', fontSize: '11px', color: '#493c2e' }).setOrigin(.5);
    letter.add([shadow, envelope, foldA, foldB, text]);
    if (!this.state.settings.reducedMotion) this.tweens.add({ targets: letter, y: 425, duration: 360, ease: 'Back.easeOut' });

    // The envelope itself is the choice. Drop it into the painted mailbox, into the sea,
    // or back to the lower-left hand position (the postman's bag) instead of clicking a labelled button.
    letter.setSize(132, 92).setInteractive({ useHandCursor: true });
    this.input.setDraggable(letter);
    const home = { x: 640, y: 438 };
    const mailboxZone = new Phaser.Geom.Rectangle(575, 385, 135, 150);
    const shoreZone = new Phaser.Geom.Rectangle(390, 180, 500, 190);
    const bagZone = new Phaser.Geom.Rectangle(0, 500, 310, 220);
    letter.on('dragstart', () => letter.setDepth(20).setScale(1.045));
    letter.on('drag', (_pointer: Phaser.Input.Pointer, x: number, y: number) => letter.setPosition(x, y));
    letter.on('dragend', () => {
      letter.setDepth(12).setScale(1);
      if (mailboxZone.contains(letter.x, letter.y)) { this.chooseLetter('mailbox'); return; }
      if (shoreZone.contains(letter.x, letter.y)) { this.chooseLetter('shore'); return; }
      if (bagZone.contains(letter.x, letter.y)) { this.chooseLetter('bag'); return; }
      this.moveContainer(letter, home.x, home.y);
    });
  }

  private chooseLetter(choice: 'bag' | 'mailbox' | 'shore'): void {
    if (this.state.postman.completed) return;
    this.store.mutate((s) => { s.postman.letterChoice = choice; s.postman.completed = true; });
    this.completeMask('postman', 'postman-break');
    this.ui.setCaption('海没有评价这个选择。眉毛残响只是从旧折痕里松开，像一个终于被打断的步子。');
    this.time.delayedCall(this.state.settings.reducedMotion ? 0 : 440, () => this.addNavArrow('forward', () => this.navigate('shop')));
  }
}
