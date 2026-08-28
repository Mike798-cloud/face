import Phaser from 'phaser';
import { BaseScene } from './BaseScene';
import { mayorSolved } from '../puzzles/logic';
import { SCENE_INTROS } from '../../data/storyData';

interface EvidenceSpec {
  id: string;
  title: string;
  claim: string;
  trace: string;
  source: { x: number; y: number; w: number; h: number };
  home: { x: number; y: number };
  motif: 'book' | 'harbor' | 'seal' | 'portrait' | 'tax' | 'paper';
}

interface EvidenceRecord {
  id: string;
  spec: EvidenceSpec;
  card: Phaser.GameObjects.Container;
  paper: Phaser.GameObjects.Rectangle;
  home: { x: number; y: number };
}

const EVIDENCE: readonly EvidenceSpec[] = [
  {
    id: 'ledger', title: '账簿', claim: '“账本应当公开。”',
    trace: '讲台下层只有这一本公开账，纸脊没有夹层，也没有第二本账留下的磨痕。',
    source: { x: 590, y: 548, w: 220, h: 150 }, home: { x: 448, y: 588 }, motif: 'book',
  },
  {
    id: 'harbor', title: '码头', claim: '“先修码头，再修我的办公室。”',
    trace: '玻璃城模底座刻着港区拨款日期；它确实早于办公室的修缮批次。',
    source: { x: 884, y: 422, w: 300, h: 185 }, home: { x: 892, y: 568 }, motif: 'harbor',
  },
  {
    id: 'subsidy', title: '补助', claim: '“补助不得经过家族账户。”',
    trace: '墙上汇款凭据的账户栏没有奥斯文家族印，封蜡也没有被重新揭过。',
    source: { x: 798, y: 178, w: 210, h: 165 }, home: { x: 792, y: 300 }, motif: 'seal',
  },
  {
    id: 'family', title: '家族', claim: '“我的家人从未受益。”',
    trace: '肖像背板里夹着侄子的供货单；折痕与框角完全吻合。',
    source: { x: 360, y: 194, w: 240, h: 300 }, home: { x: 382, y: 392 }, motif: 'portrait',
  },
  {
    id: 'tax', title: '税款', claim: '“今年没有新增税款。”',
    trace: '右侧许可证背面压着“临时雾税”的湿墨章，日期就在今年。',
    source: { x: 1012, y: 230, w: 150, h: 180 }, home: { x: 1010, y: 365 }, motif: 'tax',
  },
  {
    id: 'speech', title: '演说', claim: '“我从未删改演讲稿。”',
    trace: '花盆底下粘着三条同色稿纸边，撕口能和演讲稿页脚接上。',
    source: { x: 1148, y: 538, w: 185, h: 250 }, home: { x: 1090, y: 592 }, motif: 'paper',
  },
] as const;

const SLOT_POSITIONS = [
  { x: 524, y: 493 },
  { x: 657, y: 493 },
  { x: 590, y: 557 },
] as const;

export class MayorScene extends BaseScene {
  private records: EvidenceRecord[] = [];
  private selected = new Set<string>();
  private compartmentShown = false;

  constructor() { super('mayor'); }
  preload(): void { this.preloadImage('bg-mayor', 'mayor.webp'); }

  create(): void {
    this.ui.setScene('mayor');
    this.audio.playAmbient('mayor', .18);
    this.addBackground('bg-mayor');
    this.addAtmosphere('dust', 12);
    this.installMayorLife();
    const intro = SCENE_INTROS.mayor!;
    this.setObjective(intro.objective);

    if (this.state.mayor.completed) {
      this.renderSolvedLectern();
      this.addNavArrow('forward', () => this.navigate('shop'));
      return;
    }

    this.selected = new Set(this.state.mayor.selected);
    this.createLecternSockets();
    this.createEvidenceSources();
    this.layoutSelected(false);

    if (mayorSolved([...this.selected])) this.revealLecternCompartment();

    if (!this.state.hiddenFlags.includes(`${intro.flag}:seen`)) {
      this.store.mutate((state) => { state.hiddenFlags.push(`${intro.flag}:seen`); });
      this.ui.setCaption('演讲稿没有排成一道题。六处旧痕散在房间里；先碰一碰那些被人反复动过的地方。');
    }
  }

  private installMayorLife(): void {
    this.addBlinkEasterEgg(190, 150, 150, 190, 18, 12, 'paper');
    if (!this.state.settings.reducedMotion) {
      const leaf = this.add.ellipse(1138, 320, 12, 46, 0x4b5e48, .08).setDepth(2).setAngle(-22);
      this.tweens.add({ targets: leaf, angle: -12, x: 1142, duration: 1900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      const domeGlint = this.add.rectangle(851, 384, 4, 180, 0xe4ddc8, .02).setDepth(2).setAngle(19).setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({ targets: domeGlint, x: 923, alpha: { from: .01, to: .09 }, duration: 2200, yoyo: true, repeat: -1, repeatDelay: 700 });
    }
  }

  private createLecternSockets(): void {
    const plate = this.add.rectangle(590, 525, 292, 190, 0x4c3828, .018).setStrokeStyle(1.5, 0xb79d72, .16).setDepth(3);
    SLOT_POSITIONS.forEach((slot, index) => {
      const socket = this.add.rectangle(slot.x, slot.y, 118, 48, 0x251d16, .09).setStrokeStyle(1.2, 0xbca27a, .30).setDepth(4);
      const clip = this.add.rectangle(slot.x, slot.y - 25, 24, 7, 0x7d694a, .72).setStrokeStyle(1, 0x33281d, .72).setDepth(5);
      if (!this.state.settings.reducedMotion) this.tweens.add({ targets: [socket, clip], alpha: { from: .25, to: .55 }, duration: 1700, delay: index * 180, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    });
    plate.setName('mayor-lectern-sockets');
  }

  private createEvidenceSources(): void {
    for (const spec of EVIDENCE) {
      const flag = `mayor-evidence:${spec.id}`;
      const discovered = this.state.hiddenFlags.includes(flag) || this.selected.has(spec.id);
      if (this.selected.has(spec.id) && !this.state.hiddenFlags.includes(flag)) {
        this.store.mutate((state) => { if (!state.hiddenFlags.includes(flag)) state.hiddenFlags.push(flag); }, false);
      }
      const zone = this.add.zone(spec.source.x, spec.source.y, spec.source.w, spec.source.h)
        .setDepth(7).setInteractive({ useHandCursor: true }).setName(`mayor-source-${spec.id}`);
      zone.on('pointerdown', () => {
        this.animateSource(spec);
        this.ui.setCaption(spec.trace);
        if (this.records.some((record) => record.id === spec.id)) return;
        this.store.mutate((state) => {
          const flag = `mayor-evidence:${spec.id}`;
          if (!state.hiddenFlags.includes(flag)) state.hiddenFlags.push(flag);
        }, false);
        this.createEvidenceSlip(spec, true);
      });
      if (discovered) this.createEvidenceSlip(spec, false);
    }
  }

  private animateSource(spec: EvidenceSpec): void {
    this.audio.playSfx(spec.id === 'harbor' ? 'glass' : 'paper', .14);
    if (this.state.settings.reducedMotion) return;
    const x = spec.source.x;
    const y = spec.source.y;
    switch (spec.id) {
      case 'ledger': {
        const drawer = this.add.rectangle(x, y + 20, 170, 48, 0x5c432f, .26).setStrokeStyle(2, 0x2f251d, .55).setDepth(9);
        this.tweens.add({ targets: drawer, y: y + 48, alpha: .08, duration: 420, yoyo: true, hold: 220, onComplete: () => drawer.destroy() });
        break;
      }
      case 'harbor': {
        const glint = this.add.rectangle(x - 76, y - 24, 5, 150, 0xefe7d4, .16).setAngle(17).setDepth(9).setBlendMode(Phaser.BlendModes.ADD);
        this.tweens.add({ targets: glint, x: x + 90, alpha: 0, duration: 720, onComplete: () => glint.destroy() });
        break;
      }
      case 'subsidy': {
        const seal = this.add.circle(x + 64, y + 38, 18, 0x6f705f, .44).setStrokeStyle(2, 0x37372f, .6).setDepth(9);
        this.tweens.add({ targets: seal, angle: 18, scale: 1.13, alpha: 0, duration: 520, yoyo: true, onComplete: () => seal.destroy() });
        break;
      }
      case 'family': {
        const invoice = this.add.rectangle(x + 70, y + 55, 92, 62, 0xd3c19d, .72).setStrokeStyle(1.5, 0x5a4935, .6).setDepth(9).setAngle(5);
        this.tweens.add({ targets: invoice, x: x + 122, angle: 1, duration: 430, yoyo: true, hold: 300, onComplete: () => invoice.destroy() });
        break;
      }
      case 'tax': {
        const stamp = this.add.rectangle(x, y + 42, 68, 34, 0x8a554b, .18).setStrokeStyle(2, 0x7f4d43, .72).setDepth(9).setAngle(-3);
        this.tweens.add({ targets: stamp, scaleX: 1.2, scaleY: 1.2, alpha: 0, duration: 540, onComplete: () => stamp.destroy() });
        break;
      }
      default: {
        const scrap = this.add.rectangle(x - 28, y + 78, 96, 18, 0xd4c29f, .5).setStrokeStyle(1, 0x5b4b39, .45).setDepth(9).setAngle(-7);
        this.tweens.add({ targets: scrap, y: y + 42, angle: -1, duration: 420, yoyo: true, hold: 280, onComplete: () => scrap.destroy() });
      }
    }
  }

  private createEvidenceSlip(spec: EvidenceSpec, animate: boolean): void {
    if (this.records.some((record) => record.id === spec.id)) return;
    const startX = animate ? spec.source.x : spec.home.x;
    const startY = animate ? spec.source.y : spec.home.y;
    const card = this.add.container(startX, startY).setDepth(12).setAlpha(animate ? .05 : 1);
    const shadow = this.add.rectangle(3, 5, 114, 44, 0x0f0c08, .18);
    const paper = this.add.rectangle(0, 0, 114, 44, this.selected.has(spec.id) ? 0x747762 : 0xcdbb98, .96).setStrokeStyle(1.8, 0x4d4031, .84);
    const motif = this.drawEvidenceMotif(spec.motif);
    const title = this.add.text(24, 0, spec.title, {
      fontFamily: 'Georgia, "Noto Serif SC", serif', fontSize: '14px', color: '#33291f', letterSpacing: 1,
    }).setOrigin(.5);
    card.add([shadow, paper, motif, title]);
    card.setSize(124, 54).setInteractive({ useHandCursor: true });
    this.input.setDraggable(card);

    const record: EvidenceRecord = { id: spec.id, spec, card, paper, home: spec.home };
    this.records.push(record);

    card.on('pointerdown', () => {
      this.ui.setCaption(`${spec.claim}　${spec.trace}`);
      this.audio.playSfx('paper', .10);
    });
    card.on('dragstart', () => card.setDepth(20).setScale(1.045).setAngle(-1));
    card.on('drag', (_pointer: Phaser.Input.Pointer, x: number, y: number) => card.setPosition(x, y));
    card.on('dragend', () => {
      card.setDepth(12).setScale(1).setAngle(0);
      this.placeEvidence(record);
    });

    if (animate) {
      if (this.state.settings.reducedMotion) card.setPosition(spec.home.x, spec.home.y).setAlpha(1);
      else this.tweens.add({ targets: card, x: spec.home.x, y: spec.home.y, alpha: 1, duration: 420, ease: 'Back.easeOut' });
    }

    if (this.selected.has(spec.id)) paper.setFillStyle(0x747762);
  }

  private drawEvidenceMotif(kind: EvidenceSpec['motif']): Phaser.GameObjects.Graphics {
    const g = this.add.graphics().setPosition(-30, 0);
    g.lineStyle(2, 0x4b4032, .88);
    g.fillStyle(0x8a7656, .14);
    switch (kind) {
      case 'book':
        g.fillRect(-17, -13, 34, 26); g.strokeRect(-17, -13, 34, 26); g.lineBetween(0, -13, 0, 13); break;
      case 'harbor':
        g.beginPath(); g.moveTo(-18, 8); g.lineTo(-8, 0); g.lineTo(0, 6); g.lineTo(10, -5); g.lineTo(18, 5); g.strokePath(); g.lineBetween(-18, 13, 18, 13); break;
      case 'seal':
        g.strokeCircle(0, 0, 14); g.strokeCircle(0, 0, 7); g.lineBetween(-4, 0, 4, 0); g.lineBetween(0, -4, 0, 4); break;
      case 'portrait':
        g.strokeRect(-15, -16, 30, 32); g.strokeCircle(0, -5, 6); g.beginPath(); g.moveTo(-9, 10); g.lineTo(0, 2); g.lineTo(9, 10); g.strokePath(); break;
      case 'tax':
        g.strokeRect(-17, -12, 34, 24); g.lineBetween(-12, -4, 12, -4); g.lineBetween(-12, 3, 8, 3); g.strokeCircle(10, 8, 5); break;
      case 'paper':
        g.beginPath(); g.moveTo(-17, -13); g.lineTo(12, -13); g.lineTo(17, -7); g.lineTo(17, 13); g.lineTo(-17, 13); g.closePath(); g.strokePath(); g.lineBetween(-11, -4, 11, -4); g.lineBetween(-11, 3, 8, 3); break;
    }
    return g;
  }

  private placeEvidence(record: EvidenceRecord): void {
    if (this.compartmentShown) {
      this.settleContainer(record.card, record.card.x, record.card.y);
      return;
    }
    const lecternBounds = new Phaser.Geom.Rectangle(430, 390, 330, 230);
    const inside = lecternBounds.contains(record.card.x, record.card.y);

    if (!inside) {
      if (this.selected.delete(record.id)) {
        record.paper.setFillStyle(0xcdbb98);
        this.persistSelection();
        this.layoutSelected();
      }
      this.settleContainer(record.card, record.home.x, record.home.y);
      return;
    }

    if (!this.selected.has(record.id) && this.selected.size >= 3) {
      this.ui.setCaption('第三只铜夹已经压住纸边。再塞一张，最早那张就会被挤出来。');
      this.audio.playSfx('wood', .18);
      this.nudge(record.card, 10);
      this.time.delayedCall(this.state.settings.reducedMotion ? 0 : 150, () => this.settleContainer(record.card, record.home.x, record.home.y));
      return;
    }

    this.selected.add(record.id);
    record.paper.setFillStyle(0x747762);
    this.persistSelection();
    this.layoutSelected();
    this.respondToSelection(record.spec);
    this.checkSelection();
  }

  private persistSelection(): void {
    const order = this.records.map((record) => record.id).filter((id) => this.selected.has(id));
    this.store.mutate((state) => { state.mayor.selected = order; }, false);
  }

  private layoutSelected(animate = true): void {
    const ordered = this.state.mayor.selected.filter((id) => this.selected.has(id));
    this.records.forEach((record) => {
      if (!this.selected.has(record.id)) return;
      const index = ordered.indexOf(record.id);
      const slot = SLOT_POSITIONS[Math.max(0, index)] ?? SLOT_POSITIONS[SLOT_POSITIONS.length - 1]!;
      record.paper.setFillStyle(0x747762);
      if (animate) this.settleContainer(record.card, slot.x, slot.y, 180);
      else record.card.setPosition(slot.x, slot.y);
    });
  }

  private respondToSelection(spec: EvidenceSpec): void {
    const isConsistent = ['ledger', 'harbor', 'subsidy'].includes(spec.id);
    const caption = isConsistent
      ? `${spec.title}这处痕迹与公开说法没有互相推开。铜夹稳稳扣住了纸边。`
      : `${spec.title}这处痕迹在公开说法背后留下了另一层重量。讲台木板轻轻弹了一下。`;
    this.ui.setCaption(caption);
    this.audio.playSfx(isConsistent ? 'paper' : 'wood', isConsistent ? .18 : .24);
    if (isConsistent || this.state.settings.reducedMotion) return;
    const ripple = this.add.rectangle(590, 556, 220, 82, 0x8f554a, .018).setStrokeStyle(2, 0x9b6658, .42).setDepth(10);
    this.tweens.add({ targets: ripple, scaleX: 1.05, alpha: 0, duration: 330, onComplete: () => ripple.destroy() });
  }

  private checkSelection(): void {
    if (this.selected.size !== 3) return;
    if (mayorSolved([...this.selected])) {
      this.revealLecternCompartment();
      return;
    }
    this.store.mutate((state) => { state.mistakes += 1; }, false);
    this.ui.setCaption('三处痕迹同时压住讲台时，木板仍有一角翘着。至少有一句公开话术正在和房间里的东西顶住彼此。');
    this.audio.playSfx('wood', .28);
  }

  private revealLecternCompartment(): void {
    if (this.compartmentShown || this.state.mayor.completed) return;
    this.compartmentShown = true;
    this.records.forEach((record) => record.card.disableInteractive());
    this.ui.setCaption('三张纸没有被判成“真理”。它们只是第一次同时没有遭到房间反驳。讲台前板松开了一线。');
    this.audio.playSfx('wood', .52);

    const cavity = this.add.rectangle(590, 610, 196, 86, 0x17120e, .88).setStrokeStyle(3, 0x463629, .9).setDepth(11).setAlpha(0);
    const door = this.add.rectangle(590, 589, 204, 94, 0x5a412e, .96).setStrokeStyle(3, 0x30251d, .92).setDepth(13).setOrigin(.5, 0);
    const hinge = this.add.rectangle(590, 586, 50, 7, 0x6e5a42, .92).setDepth(14);
    const residue = this.createNoseResidue(590, 610).setDepth(15).setAlpha(0).setScale(.72);
    const pickup = this.add.zone(590, 610, 110, 80).setDepth(16);

    const ready = (): void => {
      cavity.setAlpha(.95);
      residue.setAlpha(1);
      pickup.setInteractive({ useHandCursor: true });
      if (!this.state.settings.reducedMotion) this.tweens.add({ targets: residue, y: 600, scale: 1, duration: 360, ease: 'Back.easeOut' });
    };
    if (this.state.settings.reducedMotion) {
      door.setY(660).setScale(1, .12).setAlpha(.38);
      ready();
    } else {
      this.focusCamera(590, 570, 1.075, 240);
      this.tweens.add({ targets: door, y: 657, scaleY: .18, alpha: .42, duration: 480, ease: 'Cubic.easeInOut', onComplete: ready });
      this.tweens.add({ targets: hinge, y: 650, alpha: .45, duration: 480, ease: 'Cubic.easeInOut' });
    }

    pickup.on('pointerdown', () => {
      pickup.disableInteractive();
      this.store.mutate((state) => { state.mayor.completed = true; });
      this.completeMask('mayor', 'mayor-contradiction');
      this.audio.playSfx('glass', .42);
      this.ui.setCaption('鼻梁残响不是从一句漂亮话里来，而是从几处彼此不再冲突的痕迹之间浮出来。');
      if (!this.state.settings.reducedMotion) {
        this.tweens.add({ targets: residue, scale: 1.18, alpha: .1, duration: 460, yoyo: true, onComplete: () => residue.setAlpha(.82) });
        this.time.delayedCall(260, () => this.resetCamera(240));
      }
      this.time.delayedCall(this.state.settings.reducedMotion ? 0 : 520, () => this.addNavArrow('forward', () => this.navigate('shop')));
    });
  }

  private createNoseResidue(x: number, y: number): Phaser.GameObjects.Container {
    const holder = this.add.container(x, y);
    const shadow = this.add.ellipse(3, 7, 80, 26, 0x070605, .35);
    const glass = this.add.ellipse(0, 0, 74, 58, 0xb7c6bb, .28).setStrokeStyle(2.5, 0xd8c7a7, .82);
    const ridge = this.add.graphics();
    ridge.lineStyle(5, 0x6f5d47, .9);
    ridge.beginPath(); ridge.moveTo(-7, -17); ridge.lineTo(-3, -4); ridge.lineTo(-6, 13); ridge.lineTo(8, 13); ridge.strokePath();
    ridge.lineStyle(1.5, 0xe0cfab, .55); ridge.lineBetween(-1, -14, 2, 9);
    holder.add([shadow, glass, ridge]);
    return holder;
  }

  private renderSolvedLectern(): void {
    const cavity = this.add.rectangle(590, 610, 196, 86, 0x17120e, .72).setStrokeStyle(3, 0x463629, .85).setDepth(5);
    const lip = this.add.rectangle(590, 661, 204, 16, 0x5a412e, .75).setStrokeStyle(2, 0x30251d, .7).setDepth(6);
    const residue = this.createNoseResidue(590, 610).setDepth(7).setAlpha(.32);
    cavity.setName('mayor-solved-compartment'); lip.setName('mayor-solved-door'); residue.setName('mayor-solved-residue');
  }
}
