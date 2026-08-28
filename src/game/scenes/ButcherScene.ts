import Phaser from 'phaser';
import { BaseScene } from './BaseScene';
import { BUTCHER_SEATING, seatingSolved } from '../puzzles/logic';
import { SCENE_INTROS } from '../../data/storyData';

interface AnimalSpec { id: string; label: string; note: string; }
interface SeatSpec { id: string; x: number; y: number; }

const ANIMALS: AnimalSpec[] = [
  { id: 'bramble', label: '荆棘', note: '进门以后先摸最左边的墙。只要还能碰到墙，它就肯吃。' },
  { id: 'oat', label: '燕麦', note: '总坐在荆棘右边；又比白奶离吊灯更远。' },
  { id: 'milk', label: '白奶', note: '喜欢灯照得到的位置，但只坐灯左边最近的一席。' },
  { id: 'potato', label: '土豆', note: '讨厌墙画，宁可坐灯右边最近的一席。' },
  { id: 'carrot', label: '胡萝卜', note: '一定坐在黑麦左边；它们都习惯待在墙画下面。' },
  { id: 'bread', label: '黑麦', note: '每次都坐最右端。离开前最后看一眼墙上的农场画。' },
];

const SEATS: readonly SeatSpec[] = [
  { id: 'left-end', x: 158, y: 520 },
  { id: 'left-inner', x: 365, y: 520 },
  { id: 'lamp-left', x: 570, y: 520 },
  { id: 'lamp-right', x: 790, y: 520 },
  { id: 'portrait-left', x: 995, y: 520 },
  { id: 'right-end', x: 1170, y: 520 },
];

export class ButcherScene extends BaseScene {
  private occupied: Record<string, string> = {};
  private homes: Record<string, { x: number; y: number }> = {};

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
    if (this.state.butcher.completed) { this.addNavArrow('forward', () => this.navigate('shop')); return; }

    this.occupied = { ...this.state.butcher.seats };
    this.drawSeatMarks();
    this.createNameCards();
    if (seatingSolved(this.occupied) && !this.state.butcher.chairPulled) this.revealSeventhChair();
    if (!this.state.hiddenFlags.includes(`${intro.flag}:seen`)) {
      this.store.mutate((state) => { state.hiddenFlags.push(`${intro.flag}:seen`); });
      this.ui.setCaption('格伦没有给桌边的名字牌编号。每一只动物认的是座位、灯、墙画和彼此之间的距离。');
    }
  }

  private installButcherLife(): void {
    this.addBreathingLight(640, 118, 255, 150, 0xe2bd73, .075, 1);
    const heads = [[445, 329], [568, 329], [687, 329], [808, 329], [930, 329], [1050, 329]] as const;
    heads.forEach(([x, y], i) => this.addMouthEasterEgg(x, y, 92, 96, 27 + (i % 2) * 4, 12, 'breath'));
    this.addBlinkEasterEgg(972, 181, 165, 95, 18, 12, 'paper');
  }

  private drawSeatMarks(): void {
    SEATS.forEach((seat) => {
      const plate = this.add.ellipse(seat.x, seat.y - 8, 108, 42, 0xd8c6a1, .08).setStrokeStyle(1.5, 0x6b5841, .36).setDepth(4);
      const slot = this.add.rectangle(seat.x, seat.y + 14, 104, 28, 0x2b2119, .08).setStrokeStyle(1.5, 0xbca77f, .34).setDepth(5);
      if (!this.state.settings.reducedMotion) this.tweens.add({ targets: [plate, slot], alpha: { from: .07, to: .16 }, duration: 1800, yoyo: true, repeat: -1, delay: Phaser.Math.Between(0, 800) });
    });
  }

  private createNameCards(): void {
    ANIMALS.forEach((animal, index) => {
      const homeX = 330 + (index % 3) * 310;
      const homeY = 610 + Math.floor(index / 3) * 54;
      this.homes[animal.id] = { x: homeX, y: homeY };
      const card = this.add.container(homeX, homeY).setDepth(10);
      const shadow = this.add.rectangle(4, 5, 174, 40, 0x0f0c08, .22);
      const paper = this.add.rectangle(0, 0, 174, 40, 0xd2c19e, .96).setStrokeStyle(2, 0x574632, .85);
      const text = this.add.text(0, 0, animal.label, { fontFamily: 'Georgia, "Noto Serif SC", serif', fontSize: '15px', color: '#33291f', letterSpacing: 2 }).setOrigin(.5);
      card.add([shadow, paper, text]);
      card.setSize(186, 50).setInteractive({ useHandCursor: true });
      this.input.setDraggable(card);

      const savedSeatId = Object.keys(this.occupied).find((seatId) => this.occupied[seatId] === animal.id);
      const savedSeat = SEATS.find((seat) => seat.id === savedSeatId);
      if (savedSeat) card.setPosition(savedSeat.x, savedSeat.y).disableInteractive().setScale(.88);

      card.on('pointerdown', () => {
        this.ui.setCaption(`${animal.label}：${animal.note}`);
        if (!this.state.settings.reducedMotion) this.tweens.add({ targets: paper, alpha: .72, yoyo: true, duration: 110 });
      });
      card.on('dragstart', () => card.setDepth(18).setScale(1.04).setAngle(index % 2 === 0 ? -1 : 1));
      card.on('drag', (_p: Phaser.Input.Pointer, x: number, y: number) => card.setPosition(x, y));
      card.on('dragend', () => {
        card.setDepth(10);
        this.placeAnimal(animal, card);
      });
    });
  }

  private placeAnimal(animal: AnimalSpec, card: Phaser.GameObjects.Container): void {
    const nearest = SEATS.map((seat) => ({ seat, d: Phaser.Math.Distance.Between(card.x, card.y, seat.x, seat.y) })).sort((a, b) => a.d - b.d)[0];
    const home = this.homes[animal.id];
    if (!home) return;
    if (!nearest || nearest.d > 88) { this.settleContainer(card, home.x, home.y); return; }

    const expectedSeat = BUTCHER_SEATING[animal.id];
    const occupiedBy = this.occupied[nearest.seat.id];
    if (occupiedBy && occupiedBy !== animal.id) {
      this.ui.setCaption('两张名字牌压到同一个位置。桌边那只猪把酒杯轻轻推远。');
      this.reactAtSeat(nearest.seat, false);
      this.settleContainer(card, home.x, home.y);
      return;
    }
    if (expectedSeat !== nearest.seat.id) {
      this.store.mutate((s) => { s.mistakes += 1; }, false);
      this.ui.setCaption(this.feedbackFor(animal.id, nearest.seat.id));
      this.audio.playSfx('wood', .2);
      this.reactAtSeat(nearest.seat, false);
      this.settleContainer(card, home.x, home.y, 250);
      return;
    }

    Object.keys(this.occupied).forEach((key) => { if (this.occupied[key] === animal.id) delete this.occupied[key]; });
    this.occupied[nearest.seat.id] = animal.id;
    card.disableInteractive();
    this.settleContainer(card, nearest.seat.x, nearest.seat.y, 220);
    this.store.mutate((s) => { s.butcher.seats = { ...this.occupied }; }, false);
    this.audio.playSfx('paper', .22);
    this.reactAtSeat(nearest.seat, true);
    this.chewAtSeat(nearest.seat);
    if (seatingSolved(this.occupied)) this.revealSeventhChair();
  }

  private chewAtSeat(seat: SeatSpec): void {
    const index = SEATS.findIndex((item) => item.id === seat.id);
    const heads = [445, 568, 687, 808, 930, 1050] as const;
    const x = heads[Math.max(0, Math.min(heads.length - 1, index))]!;
    const y = 329;
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

  private feedbackFor(animal: string, seat: string): string {
    if (animal === 'bramble') return '荆棘把肩膀往最左边缩。它要先碰到墙。';
    if (animal === 'oat') return '燕麦回头看荆棘，又看了一眼灯。这个距离不对。';
    if (animal === 'milk') return '白奶盯着吊灯，却没有坐下。它认的是灯左边最近的一席。';
    if (animal === 'potato') return seat.startsWith('portrait') || seat === 'right-end' ? '土豆抬头看见墙画，立刻把盘子推远。' : '土豆盯着灯右边的位置，脚还没有停。';
    if (animal === 'carrot') return '胡萝卜先找黑麦。两张椅子必须挨着，而且都在墙画下面。';
    return '黑麦没有看桌子。它只在最右端坐下。';
  }

  private reactAtSeat(seat: SeatSpec, accepted: boolean): void {
    const ring = this.add.ellipse(seat.x, 435, 135, 95, accepted ? 0xd1b786 : 0x8f4d42, accepted ? .06 : .04)
      .setStrokeStyle(accepted ? 2 : 3, accepted ? 0xd8c49b : 0xa96658, accepted ? .36 : .55).setDepth(8);
    if (this.state.settings.reducedMotion) { this.time.delayedCall(180, () => ring.destroy()); return; }
    this.tweens.add({ targets: ring, scaleX: accepted ? 1.08 : 1.14, scaleY: accepted ? 1.08 : .9, alpha: 0, duration: accepted ? 420 : 300, ease: 'Sine.easeOut', onComplete: () => ring.destroy() });
  }

  private revealSeventhChair(): void {
    if (this.children.getByName('seventh-chair-zone')) return;
    this.ui.setCaption('六张名字牌同时安静下来。桌前那把真正空着的椅子，像是在等格伦自己。');
    const zone = this.add.zone(640, 600, 210, 220).setDepth(15).setName('seventh-chair-zone').setInteractive({ useHandCursor: true });
    this.input.setDraggable(zone);
    let startY = 0;
    let pull = 0;
    const outline = this.add.rectangle(640, 603, 150, 190, 0xd8c7a7, .015).setStrokeStyle(2, 0xd8c7a7, .18).setDepth(9);
    zone.on('dragstart', (pointer: Phaser.Input.Pointer) => {
      startY = pointer.worldY; pull = 0;
      this.focusCamera(640, 560, 1.035, 150);
      this.audio.playSfx('wood', .16);
    });
    zone.on('drag', (pointer: Phaser.Input.Pointer) => {
      pull = Phaser.Math.Clamp(pointer.worldY - startY, 0, 130);
      outline.setScale(1 + pull / 900).setAlpha(.02 + pull / 1000);
      if (!this.state.settings.reducedMotion) this.cameras.main.setScroll(0, Phaser.Math.Clamp(pull * .035, 0, 5));
    });
    zone.on('dragend', () => {
      if (pull < 72) {
        this.ui.setCaption('椅脚刚离开原来的磨痕，又被桌沿挡了回去。');
        outline.setScale(1).setAlpha(.015);
        this.resetCamera(180);
        return;
      }
      zone.disableInteractive();
      this.store.mutate((s) => { s.butcher.chairPulled = true; s.butcher.completed = true; });
      this.completeMask('butcher', 'butcher-care');
      this.audio.playSfx('wood', .58);
      if (!this.state.settings.reducedMotion) {
        this.tweens.add({ targets: outline, scaleX: 1.12, scaleY: 1.12, alpha: .28, duration: 180, yoyo: true, onComplete: () => outline.setAlpha(.02) });
        this.cameras.main.shake(150, .0025);
      }
      this.resetCamera(220);
      this.ui.setCaption('格伦坐下时，桌上没有多一份食物。嘴唇残响从他没说出口的告别里留下。');
      this.time.delayedCall(this.state.settings.reducedMotion ? 0 : 460, () => this.addNavArrow('forward', () => this.navigate('shop')));
    });
  }
}
