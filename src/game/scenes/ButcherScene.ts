import Phaser from 'phaser';
import { BaseScene } from './BaseScene';
import { BUTCHER_SEATING, seatingSolved } from '../puzzles/logic';
import { SCENE_INTROS } from '../../data/storyData';

interface AnimalSpec {
  id: string;
  label: string;
  note: string;
  motif: 'bramble' | 'oat' | 'milk' | 'potato' | 'carrot' | 'bread';
}
interface SeatSpec { id: string; x: number; y: number; }

const ANIMALS: readonly AnimalSpec[] = [
  { id: 'bramble', label: '荆棘', note: '木牌背面刻着一道墙纹：它每次开饭前，都先确认左手还能碰到墙。', motif: 'bramble' },
  { id: 'oat', label: '燕麦', note: '三粒燕麦排成一行：它总挨在荆棘右边，而且比白奶离吊灯更远。', motif: 'oat' },
  { id: 'milk', label: '白奶', note: '奶壶上的灯影被磨得最亮：它只坐吊灯左边最近的一席。', motif: 'milk' },
  { id: 'potato', label: '土豆', note: '木牌背面刮掉了一小块农场画：它避开墙画，只肯坐灯右边最近的一席。', motif: 'potato' },
  { id: 'carrot', label: '胡萝卜', note: '两道并排的刀痕没有分开：它总挨着黑麦，而且两者都待在农场画下面。', motif: 'carrot' },
  { id: 'bread', label: '黑麦', note: '面包纹一直刻到木牌右缘：它只认最右端，离席前还会回头看农场画。', motif: 'bread' },
] as const;

const SEATS: readonly SeatSpec[] = [
  { id: 'left-end', x: 158, y: 507 },
  { id: 'left-inner', x: 365, y: 507 },
  { id: 'lamp-left', x: 570, y: 507 },
  { id: 'lamp-right', x: 790, y: 507 },
  { id: 'portrait-left', x: 995, y: 507 },
  { id: 'right-end', x: 1170, y: 507 },
] as const;

const PIG_HEADS = [158, 365, 570, 790, 995, 1170] as const;

export class ButcherScene extends BaseScene {
  private occupied: Record<string, string> = {};
  private homes: Record<string, { x: number; y: number }> = {};
  private tokens = new Map<string, Phaser.GameObjects.Container>();
  private chairZone?: Phaser.GameObjects.Zone;

  constructor() { super('butcher'); }
  preload(): void { this.preloadImage('bg-butcher', 'butcher.webp'); }

  create(): void {
    this.ui.setScene('butcher');
    this.audio.playAmbient('butcher', .16);
    this.addBackground('bg-butcher');
    this.addAtmosphere('embers', 10);
    this.installButcherLife();
    const intro = SCENE_INTROS.butcher!;
    this.setObjective(intro.objective);

    if (this.state.butcher.completed) {
      this.renderSolvedTable();
      this.addNavArrow('forward', () => this.navigate('shop'));
      return;
    }

    this.occupied = { ...this.state.butcher.seats };
    this.createEnvironmentalClues();
    this.drawSeatMarks();
    this.createTokenTray();
    this.createIdentityTokens();

    if (seatingSolved(this.occupied)) {
      if (this.state.butcher.chairPulled) this.revealUnderTableDrawer();
      else this.revealSeventhChair();
    }

    if (!this.state.hiddenFlags.includes(`${intro.flag}:seen`)) {
      this.store.mutate((state) => { state.hiddenFlags.push(`${intro.flag}:seen`); });
      this.ui.setCaption('名字没有排成说明书。墙、吊灯、农场画和六只猪的习惯都还在桌边；先看它们会怎样回应你。');
    }
  }

  private installButcherLife(): void {
    this.addBreathingLight(640, 118, 255, 150, 0xe2bd73, .075, 1);
    if (this.state.settings.reducedMotion) return;
    const wineGlints = [96, 247, 1035, 1215].map((x, index) => {
      const glint = this.add.ellipse(x, 474, 12, 34, 0xd6c8ad, .02).setDepth(2).setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({ targets: glint, alpha: { from: .008, to: .07 }, duration: 1200 + index * 150, yoyo: true, repeat: -1, delay: index * 130 });
      return glint;
    });
    void wineGlints;
  }

  private createEnvironmentalClues(): void {
    const wall = this.add.zone(42, 360, 82, 360).setDepth(8).setInteractive({ useHandCursor: true });
    wall.on('pointerdown', () => {
      this.ui.setCaption('指节敲过左墙。最左边那只猪立刻把左肩贴过去，像是在确认熟悉的边界还在。');
      this.audio.playSfx('knock', .18);
      this.animatePigGesture(0, -1, 'wall');
    });

    const lamp = this.add.zone(640, 105, 240, 160).setDepth(8).setInteractive({ useHandCursor: true });
    lamp.on('pointerdown', () => {
      this.ui.setCaption('灯罩轻晃。第三席抬头追着光，第四席却只在灯右边停住目光；第二席还回头量了一下它和第三席的距离。');
      this.audio.playSfx('glass', .16);
      this.animateLampReaction();
    });

    const portrait = this.add.zone(885, 206, 310, 190).setDepth(8).setInteractive({ useHandCursor: true });
    portrait.on('pointerdown', () => {
      this.ui.setCaption('农场画被碰歪一点。第四席马上别开脸；最右边那只猪却慢慢抬眼，倒数第二席也跟着看向右边。');
      this.audio.playSfx('paper', .12);
      this.animatePigGesture(3, -1, 'portrait');
      this.time.delayedCall(120, () => this.animatePigGesture(5, 1, 'portrait'));
      this.time.delayedCall(220, () => this.animatePigGesture(4, 1, 'portrait'));
    });

    PIG_HEADS.forEach((x, index) => {
      const zone = this.add.zone(x, 342, 120, 150).setDepth(25).setInteractive({ useHandCursor: true });
      zone.on('pointerdown', () => this.describeSeatBehavior(index));
    });
  }

  private describeSeatBehavior(index: number): void {
    const lines = [
      '它吃之前先伸左手去找墙；摸到以后才肯低头。',
      '它先看最左边那位，又朝灯看了一眼，像是在用两段距离确认自己的位置。',
      '灯光落下来时，它把盘子往光里推了半寸，却始终没有越过灯的左侧。',
      '它对灯右边最近的一席很安静；只要视线碰到农场画，鼻子就立刻转开。',
      '它没有独自确认位置，而是先看最右边那位，再把椅子朝对方靠近一点。',
      '它一直坐在桌子的尽头。碰到农场画时，反而是它最后一个把目光移开。',
    ] as const;
    this.ui.setCaption(lines[index] ?? '它没有离开旧座位留下的习惯。');
    this.audio.playSfx('breath', .09);
    this.animatePigGesture(index, index < 3 ? -1 : 1, 'look');
  }

  private animatePigGesture(index: number, direction: -1 | 1, kind: 'wall' | 'portrait' | 'look'): void {
    const x = PIG_HEADS[index] ?? 640;
    const y = 354;
    const eye = this.add.ellipse(x + direction * 12, y - 18, 12, 5, 0x15110f, .78).setDepth(24);
    const trace = this.add.line(x, y, direction * 12, 0, direction * (kind === 'wall' ? 58 : 38), kind === 'portrait' ? -18 : 5, 0x8b7356, .28).setLineWidth(2).setDepth(23);
    if (this.state.settings.reducedMotion) {
      this.time.delayedCall(180, () => { eye.destroy(); trace.destroy(); });
      return;
    }
    this.tweens.add({ targets: eye, x: eye.x + direction * 8, duration: 120, yoyo: true, hold: 180, onComplete: () => eye.destroy() });
    this.tweens.add({ targets: trace, alpha: 0, duration: 420, onComplete: () => trace.destroy() });
  }

  private animateLampReaction(): void {
    const glow = this.add.ellipse(640, 128, 260, 180, 0xe2bd73, .02).setDepth(7).setBlendMode(Phaser.BlendModes.ADD);
    if (this.state.settings.reducedMotion) { glow.setAlpha(.09); this.time.delayedCall(220, () => glow.destroy()); return; }
    this.tweens.add({ targets: glow, scaleX: 1.15, scaleY: 1.08, alpha: .12, duration: 220, yoyo: true, repeat: 1, onComplete: () => glow.destroy() });
    this.time.delayedCall(80, () => this.animatePigGesture(2, 1, 'look'));
    this.time.delayedCall(160, () => this.animatePigGesture(3, -1, 'look'));
    this.time.delayedCall(240, () => this.animatePigGesture(1, 1, 'look'));
  }

  private drawSeatMarks(): void {
    SEATS.forEach((seat, index) => {
      const plate = this.add.ellipse(seat.x, seat.y - 7, 104, 38, 0xd8c6a1, .035).setStrokeStyle(1.2, 0x6b5841, .28).setDepth(4);
      const notch = this.add.rectangle(seat.x, seat.y + 15, 64, 10, 0x4a392a, .12).setStrokeStyle(1, 0xbca77f, .28).setDepth(5);
      if (!this.state.settings.reducedMotion) this.tweens.add({ targets: [plate, notch], alpha: { from: .04, to: .12 }, duration: 1750, delay: index * 120, yoyo: true, repeat: -1 });
    });
  }

  private createTokenTray(): void {
    const tray = this.add.rectangle(640, 661, 740, 80, 0x5b4632, .16).setStrokeStyle(2, 0x6b5843, .38).setDepth(3).setAngle(-.2);
    const lip = this.add.rectangle(640, 699, 720, 8, 0x33271e, .22).setDepth(4);
    tray.setName('butcher-token-tray'); lip.setName('butcher-token-tray-lip');
  }

  private createIdentityTokens(): void {
    ANIMALS.forEach((animal, index) => {
      const homeX = 315 + index * 130;
      const homeY = 657 + (index % 2 === 0 ? -5 : 5);
      this.homes[animal.id] = { x: homeX, y: homeY };
      const token = this.add.container(homeX, homeY).setDepth(11);
      const shadow = this.add.ellipse(4, 6, 66, 22, 0x0f0c08, .22);
      const wood = this.add.ellipse(0, 0, 62, 48, 0xb99f76, .96).setStrokeStyle(2.2, 0x4f3f2f, .9);
      const motif = this.drawAnimalMotif(animal.motif);
      token.add([shadow, wood, motif]);
      token.setSize(76, 62).setInteractive({ useHandCursor: true });
      this.input.setDraggable(token);
      this.tokens.set(animal.id, token);

      const savedSeatId = Object.keys(this.occupied).find((seatId) => this.occupied[seatId] === animal.id);
      const savedSeat = SEATS.find((seat) => seat.id === savedSeatId);
      if (savedSeat) token.setPosition(savedSeat.x, savedSeat.y).disableInteractive().setScale(.78);

      token.on('pointerdown', () => {
        this.ui.setCaption(`${animal.label}。${animal.note}`);
        this.audio.playSfx('wood', .09);
      });
      token.on('dragstart', () => token.setDepth(20).setScale(1.05).setAngle(index % 2 === 0 ? -2 : 2));
      token.on('drag', (_p: Phaser.Input.Pointer, x: number, y: number) => token.setPosition(x, y));
      token.on('dragend', () => {
        token.setDepth(11).setScale(1).setAngle(0);
        this.placeAnimal(animal, token);
      });
    });
  }

  private drawAnimalMotif(kind: AnimalSpec['motif']): Phaser.GameObjects.Graphics {
    const g = this.add.graphics();
    g.lineStyle(2.3, 0x493a2b, .92);
    g.fillStyle(0x715c41, .20);
    switch (kind) {
      case 'bramble':
        g.beginPath(); g.moveTo(-18, 12); g.lineTo(-8, 2); g.lineTo(-13, -6); g.lineTo(-2, -3); g.lineTo(5, -14); g.lineTo(8, -2); g.lineTo(18, -7); g.strokePath();
        break;
      case 'oat':
        [-7, 0, 7].forEach((x, i) => { g.lineBetween(x, 16, x + (i - 1) * 3, -12); g.strokeEllipse(x - 5, -8 + i * 3, 9, 5); g.strokeEllipse(x + 4, -2 + i * 2, 9, 5); });
        break;
      case 'milk':
        g.strokeRect(-10, -10, 20, 25); g.strokeRect(-6, -16, 12, 7); g.beginPath(); g.moveTo(10, -5); g.lineTo(17, 0); g.lineTo(10, 6); g.strokePath();
        break;
      case 'potato':
        g.strokeEllipse(-8, 1, 20, 15); g.strokeEllipse(7, -3, 22, 17); g.fillCircle(-8, -1, 1.5); g.fillCircle(9, -5, 1.5); break;
      case 'carrot':
        g.beginPath(); g.moveTo(-8, -8); g.lineTo(9, -6); g.lineTo(1, 17); g.closePath(); g.strokePath(); g.lineBetween(-3, -9, -8, -16); g.lineBetween(2, -9, 2, -18); g.lineBetween(7, -8, 12, -15); break;
      case 'bread':
        g.beginPath(); g.moveTo(-17, 8); g.lineTo(-15, -6); g.lineTo(-8, -13); g.lineTo(0, -16); g.lineTo(8, -13); g.lineTo(15, -6); g.lineTo(17, 8); g.closePath(); g.strokePath(); g.lineBetween(-7, -8, -3, 2); g.lineBetween(1, -10, 5, 1); break;
    }
    return g;
  }

  private placeAnimal(animal: AnimalSpec, token: Phaser.GameObjects.Container): void {
    const nearest = SEATS.map((seat) => ({ seat, d: Phaser.Math.Distance.Between(token.x, token.y, seat.x, seat.y) })).sort((a, b) => a.d - b.d)[0];
    const home = this.homes[animal.id];
    if (!home) return;
    if (!nearest || nearest.d > 92) { this.settleContainer(token, home.x, home.y); return; }

    const expectedSeat = BUTCHER_SEATING[animal.id];
    const occupiedBy = this.occupied[nearest.seat.id];
    if (occupiedBy && occupiedBy !== animal.id) {
      this.ui.setCaption('两块木牌碰在同一只盘沿上。那只猪把酒杯推开，连看都不肯看第二块。');
      this.reactAtSeat(nearest.seat, false);
      this.settleContainer(token, home.x, home.y);
      return;
    }
    if (expectedSeat !== nearest.seat.id) {
      this.store.mutate((state) => { state.mistakes += 1; }, false);
      this.ui.setCaption(this.feedbackFor(animal.id, nearest.seat.id));
      this.audio.playSfx('wood', .2);
      this.reactAtSeat(nearest.seat, false);
      this.animatePigGesture(SEATS.findIndex((seat) => seat.id === nearest.seat.id), nearest.seat.x < 640 ? -1 : 1, 'look');
      this.settleContainer(token, home.x, home.y, 250);
      return;
    }

    Object.keys(this.occupied).forEach((key) => { if (this.occupied[key] === animal.id) delete this.occupied[key]; });
    this.occupied[nearest.seat.id] = animal.id;
    token.disableInteractive().setScale(.78);
    this.settleContainer(token, nearest.seat.x, nearest.seat.y, 220);
    this.store.mutate((state) => { state.butcher.seats = { ...this.occupied }; }, false);
    this.audio.playSfx('paper', .20);
    this.reactAtSeat(nearest.seat, true);
    this.chewAtSeat(nearest.seat);
    if (seatingSolved(this.occupied)) this.revealSeventhChair();
  }

  private feedbackFor(animal: string, seat: string): string {
    if (animal === 'bramble') return '荆棘的木牌一靠近这里，最左边那位就把手重新伸向墙。位置还没有对上。';
    if (animal === 'oat') return '燕麦要同时量荆棘和灯的距离。这一席让两段距离都变得不对。';
    if (animal === 'milk') return '白奶认的是灯左边最近的那一点亮处；这里的灯影落错了方向。';
    if (animal === 'potato') return seat.startsWith('portrait') || seat === 'right-end' ? '土豆的木牌刚靠近农场画，那只猪就把脸别开。' : '土豆没有停下；它一直盯着灯右边最近的那只盘子。';
    if (animal === 'carrot') return '胡萝卜没有独自坐下。它先在右边找黑麦，再确认两把椅子都压在农场画下。';
    return '黑麦的木牌在这里停不住。最右端那只猪还在等它。';
  }

  private reactAtSeat(seat: SeatSpec, accepted: boolean): void {
    const ring = this.add.ellipse(seat.x, 468, 122, 78, accepted ? 0xd1b786 : 0x8f4d42, accepted ? .04 : .025)
      .setStrokeStyle(accepted ? 2 : 3, accepted ? 0xd8c49b : 0xa96658, accepted ? .38 : .55).setDepth(10);
    if (this.state.settings.reducedMotion) { this.time.delayedCall(180, () => ring.destroy()); return; }
    this.tweens.add({ targets: ring, scaleX: accepted ? 1.08 : 1.14, scaleY: accepted ? 1.08 : .9, alpha: 0, duration: accepted ? 420 : 300, ease: 'Sine.easeOut', onComplete: () => ring.destroy() });
  }

  private chewAtSeat(seat: SeatSpec): void {
    const index = SEATS.findIndex((item) => item.id === seat.id);
    const x = PIG_HEADS[Math.max(0, Math.min(PIG_HEADS.length - 1, index))]!;
    const y = 354;
    const mouth = this.add.ellipse(x, y + 22, 31, 3, 0x1c1511, .88).setDepth(22);
    const crumb = this.add.circle(x + 11, y + 30, 2.5, 0xc7aa73, .65).setDepth(23).setAlpha(0);
    this.audio.playSfx('breath', .12);
    if (this.state.settings.reducedMotion) {
      mouth.setDisplaySize(31, 12); crumb.setAlpha(.6);
      this.time.delayedCall(260, () => { mouth.destroy(); crumb.destroy(); });
      return;
    }
    mouth.setScale(1, .18);
    this.tweens.add({ targets: mouth, scaleY: 3.8, duration: 115, yoyo: true, repeat: 2, hold: 70, ease: 'Sine.easeInOut', onComplete: () => mouth.destroy() });
    this.tweens.add({ targets: crumb, alpha: .65, x: x + 18, y: y + 40, duration: 250, delay: 130, yoyo: true, onComplete: () => crumb.destroy() });
  }

  private revealSeventhChair(): void {
    if (this.children.getByName('seventh-chair-zone') || this.state.butcher.chairPulled) return;
    this.ui.setCaption('六块木牌都不再被推开。桌前那把真正空着的椅子，忽然显得比六个名字都更具体。');
    this.tokens.forEach((token) => token.disableInteractive());
    const zone = this.add.zone(640, 603, 220, 220).setDepth(28).setName('seventh-chair-zone').setInteractive({ useHandCursor: true });
    this.chairZone = zone;
    this.input.setDraggable(zone);
    let startY = 0;
    let pull = 0;
    const chairTrace = this.add.graphics().setDepth(20).setAlpha(.18);
    chairTrace.lineStyle(4, 0xd3c2a0, .65);
    chairTrace.strokeRoundedRect(575, 525, 130, 180, 18);
    chairTrace.lineBetween(600, 555, 605, 690); chairTrace.lineBetween(640, 548, 640, 690); chairTrace.lineBetween(680, 555, 675, 690);
    chairTrace.setName('seventh-chair-trace');

    zone.on('dragstart', (pointer: Phaser.Input.Pointer) => {
      startY = pointer.worldY; pull = 0;
      this.focusCamera(640, 565, 1.045, 150);
      this.audio.playSfx('wood', .18);
    });
    zone.on('drag', (pointer: Phaser.Input.Pointer) => {
      pull = Phaser.Math.Clamp(pointer.worldY - startY, 0, 138);
      chairTrace.setY(pull * .52).setAlpha(.16 + pull / 460);
      if (!this.state.settings.reducedMotion) this.cameras.main.setScroll(0, Phaser.Math.Clamp(pull * .025, 0, 4));
    });
    zone.on('dragend', () => {
      if (pull < 74) {
        this.ui.setCaption('椅脚离开磨痕一小段，又被桌布的下缘挡回去。');
        chairTrace.setY(0).setAlpha(.18);
        this.resetCamera(180);
        return;
      }
      zone.disableInteractive();
      this.store.mutate((state) => { state.butcher.chairPulled = true; }, false);
      this.audio.playSfx('wood', .58);
      if (!this.state.settings.reducedMotion) {
        this.tweens.add({ targets: chairTrace, y: 72, alpha: .46, duration: 260, ease: 'Cubic.easeOut' });
        this.cameras.main.shake(150, .0025);
      }
      this.ui.setCaption('椅子真正离开旧磨痕以后，桌布后面露出一道以前被椅背挡住的窄抽屉。');
      this.time.delayedCall(this.state.settings.reducedMotion ? 0 : 260, () => this.revealUnderTableDrawer());
    });
  }

  private revealUnderTableDrawer(): void {
    if (this.children.getByName('butcher-secret-drawer') || this.state.butcher.completed) return;
    this.chairZone?.disableInteractive();
    const cavity = this.add.rectangle(640, 555, 176, 58, 0x17120e, .86).setStrokeStyle(2.5, 0x49382a, .9).setDepth(21).setName('butcher-secret-drawer');
    const drawer = this.add.rectangle(640, 553, 166, 50, 0x654a33, .96).setStrokeStyle(2.5, 0x33271e, .92).setDepth(23);
    const handle = this.add.ellipse(640, 552, 26, 12, 0x8a7656, .9).setStrokeStyle(1.5, 0x3e3023, .8).setDepth(24);
    const pickup = this.add.zone(640, 553, 190, 72).setDepth(26).setInteractive({ useHandCursor: true });
    let opened = false;

    pickup.on('pointerdown', () => {
      if (!opened) {
        opened = true;
        this.audio.playSfx('wood', .42);
        this.ui.setCaption('抽屉被拉出来。里面没有刀，也没有账本，只有一块被手指磨得发亮的薄木片。');
        if (this.state.settings.reducedMotion) {
          drawer.setY(592); handle.setY(590); this.createLipResidue(640, 553, pickup);
        } else {
          this.tweens.add({ targets: [drawer, handle], y: '+=42', duration: 360, ease: 'Cubic.easeOut', onComplete: () => this.createLipResidue(640, 553, pickup) });
        }
        return;
      }
    });
    cavity.setAlpha(.86);
  }

  private createLipResidue(x: number, y: number, drawerPickup: Phaser.GameObjects.Zone): void {
    drawerPickup.disableInteractive();
    const residue = this.add.container(x, y).setDepth(25).setScale(.76).setAlpha(0);
    const shadow = this.add.ellipse(3, 7, 82, 24, 0x080605, .32);
    const glass = this.add.ellipse(0, 0, 78, 56, 0xb9c6b9, .28).setStrokeStyle(2.5, 0xd7c5a0, .82);
    const lips = this.add.graphics();
    lips.lineStyle(3.5, 0x755445, .92);
    lips.strokeEllipse(0, -3, 52, 20);
    lips.lineBetween(-24, 2, 24, 2);
    lips.strokeEllipse(0, 4, 48, 14);
    residue.add([shadow, glass, lips]);
    const zone = this.add.zone(x, y, 110, 80).setDepth(27).setInteractive({ useHandCursor: true });

    if (this.state.settings.reducedMotion) residue.setAlpha(1).setScale(1);
    else this.tweens.add({ targets: residue, y: y - 14, scale: 1, alpha: 1, duration: 380, ease: 'Back.easeOut' });

    zone.on('pointerdown', () => {
      zone.disableInteractive();
      this.store.mutate((state) => { state.butcher.completed = true; });
      this.completeMask('butcher', 'butcher-care');
      this.audio.playSfx('glass', .42);
      this.ui.setCaption('嘴唇残响不是从刀口里留下的。它来自格伦每天都叫一遍名字、却从不指望得到回答的那一刻。');
      if (!this.state.settings.reducedMotion) {
        this.tweens.add({ targets: residue, scale: 1.16, alpha: .16, duration: 430, yoyo: true, onComplete: () => residue.setAlpha(.78) });
        this.time.delayedCall(180, () => this.resetCamera(230));
      }
      this.time.delayedCall(this.state.settings.reducedMotion ? 0 : 520, () => this.addNavArrow('forward', () => this.navigate('shop')));
    });
  }

  private renderSolvedTable(): void {
    const cavity = this.add.rectangle(640, 555, 176, 58, 0x17120e, .62).setStrokeStyle(2, 0x49382a, .72).setDepth(5);
    const drawer = this.add.rectangle(640, 594, 166, 42, 0x654a33, .7).setStrokeStyle(2, 0x33271e, .7).setDepth(6);
    const trace = this.add.ellipse(640, 548, 72, 48, 0xb9c6b9, .11).setStrokeStyle(2, 0xd7c5a0, .28).setDepth(7);
    cavity.setName('butcher-solved-cavity'); drawer.setName('butcher-solved-drawer'); trace.setName('butcher-solved-residue');
  }
}
