import Phaser from 'phaser';
import { BaseScene } from './BaseScene';
import { mayorSolved } from '../puzzles/logic';
import { SCENE_INTROS } from '../../data/storyData';

interface Statement { id: string; publicText: string; privateText: string; }
interface CardRecord {
  id: string;
  card: Phaser.GameObjects.Container;
  paper: Phaser.GameObjects.Rectangle;
  home: { x: number; y: number };
}

const STATEMENTS: Statement[] = [
  { id: 'ledger', publicText: '“账本应当公开。”', privateText: '抽屉里没有第二本账。' },
  { id: 'harbor', publicText: '“先修码头，再修我的办公室。”', privateText: '办公室预算仍是去年的数字。' },
  { id: 'subsidy', publicText: '“补助不得经过家族账户。”', privateText: '汇款栏没有奥斯文家族印章。' },
  { id: 'family', publicText: '“我的家人从未受益。”', privateText: '窗后压着一张侄子的供货单。' },
  { id: 'tax', publicText: '“今年没有新增税款。”', privateText: '桌边印章写着“临时雾税”。' },
  { id: 'speech', publicText: '“我从未删改演讲稿。”', privateText: '火盆里有三条同色纸边。' },
];

export class MayorScene extends BaseScene {
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
    if (this.state.mayor.completed) { this.addNavArrow('forward', () => this.navigate('shop')); return; }

    const lectern = this.add.rectangle(610, 430, 300, 250, 0x654931, .035).setStrokeStyle(2, 0xd0b985, .22).setDepth(3);
    const slotPositions = [{ x: 525, y: 405 }, { x: 695, y: 405 }, { x: 610, y: 495 }] as const;
    slotPositions.forEach((slot) => {
      this.add.rectangle(slot.x, slot.y, 164, 58, 0xd7c6a0, .055).setStrokeStyle(1.5, 0xcab388, .30).setDepth(4);
      this.add.rectangle(slot.x, slot.y - 30, 26, 6, 0x8b7757, .58).setStrokeStyle(1, 0x3d3327, .55).setDepth(5);
    });
    const selected = new Set(this.state.mayor.selected);

    const records: CardRecord[] = [];
    STATEMENTS.forEach((statement, index) => {
      const homes = [
        { x: 250, y: 548 }, { x: 430, y: 592 }, { x: 1080, y: 565 },
        { x: 1020, y: 205 }, { x: 875, y: 585 }, { x: 730, y: 603 },
      ] as const;
      const home = homes[index] ?? { x: 160 + index * 150, y: 620 };
      const card = this.add.container(home.x, home.y).setDepth(8);
      const paper = this.add.rectangle(0, 0, 178, 62, selected.has(statement.id) ? 0x69705f : 0xd0bd98).setStrokeStyle(2, 0x3d3327);
      const text = this.add.text(0, 0, statement.publicText, {
        fontFamily: 'Georgia, "Noto Serif SC", serif', fontSize: '14px', color: '#2d2922',
        align: 'center', wordWrap: { width: 160 },
      }).setOrigin(.5);
      const fold = this.add.triangle(78, -23, 0, 0, 12, 0, 12, 12, 0x7d6a4e, .42);
      card.add([paper, text, fold]);
      card.setSize(184, 68).setInteractive({ useHandCursor: true });
      this.input.setDraggable(card);
      let flipped = false;
      let dragged = false;
      card.on('pointerdown', () => { dragged = false; });
      card.on('pointerup', () => {
        if (dragged) return;
        flipped = !flipped;
        text.setText(flipped ? statement.privateText : statement.publicText);
        paper.setFillStyle(selected.has(statement.id) ? 0x69705f : (flipped ? 0xc1af8d : 0xd0bd98));
        this.audio.playSfx('paper', .12);
        if (!this.state.settings.reducedMotion) this.tweens.add({ targets: card, scaleX: .94, duration: 80, yoyo: true, ease: 'Sine.easeInOut' });
      });
      card.on('dragstart', () => { dragged = true; card.setDepth(14).setScale(1.02); });
      card.on('drag', (_p: Phaser.Input.Pointer, x: number, y: number) => card.setPosition(x, y));
      card.on('dragend', () => {
        card.setDepth(8).setScale(1);
        if (lectern.getBounds().contains(card.x, card.y)) {
          if (!selected.has(statement.id) && selected.size >= 3) {
            this.ui.setCaption('讲台只容得下三张。多出来的纸滑到地上。');
            this.moveContainer(card, home.x, home.y);
            return;
          }
          const wasNew = !selected.has(statement.id);
          selected.add(statement.id);
          paper.setFillStyle(0x69705f);
          if (wasNew) this.applyStatementReaction(statement.id);
          this.persist([...selected]);
          this.layoutSelected(records, selected);
          this.checkSolved([...selected], records.map((record) => record.card));
          return;
        }

        if (selected.delete(statement.id)) {
          paper.setFillStyle(0xd0bd98);
          this.persist([...selected]);
          this.layoutSelected(records, selected);
        }
        this.moveContainer(card, home.x, home.y);
      });
      records.push({ id: statement.id, card, paper, home });
    });

    this.layoutSelected(records, selected, false);
    if (!this.state.hiddenFlags.includes(`${intro.flag}:seen`)) {
      this.store.mutate((state) => { state.hiddenFlags.push(`${intro.flag}:seen`); });
      this.ui.setCaption('奥斯文把演讲稿散在两个房间里。正面的话很体面，背后的痕迹却未必肯替它们作证。');
    }
  }

  private installMayorLife(): void {
    this.addBlinkEasterEgg(190, 150, 150, 190, 18, 12, 'paper');
    this.addPulseEasterEgg(910, 290, 210, 180, 0xc7b792, 'glass');
    if (!this.state.settings.reducedMotion) {
      const dustPaper = this.add.rectangle(890, 174, 34, 22, 0xd7c9a8, .12).setDepth(2).setAngle(-8);
      this.tweens.add({ targets: dustPaper, y: 181, angle: 3, alpha: { from: .06, to: .17 }, duration: 2400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      const leaf = this.add.ellipse(1115, 300, 14, 42, 0x4b5e48, .08).setDepth(2).setAngle(-22);
      this.tweens.add({ targets: leaf, angle: -12, x: 1118, duration: 1900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
  }

  private layoutSelected(records: CardRecord[], selected: Set<string>, animate = true): void {
    const slots = [
      { x: 525, y: 405 },
      { x: 695, y: 405 },
      { x: 610, y: 495 },
    ];
    const order = this.state.mayor.selected.filter((id) => selected.has(id));
    records.forEach((record) => {
      if (!selected.has(record.id)) return;
      const index = order.indexOf(record.id);
      const slot = slots[Math.max(0, index)] ?? slots[slots.length - 1]!;
      if (animate) this.moveContainer(record.card, slot.x, slot.y, 150);
      else record.card.setPosition(slot.x, slot.y);
      record.paper.setFillStyle(0x69705f);
    });
  }

  private persist(selected: string[]): void {
    this.store.mutate((s) => { s.mayor.selected = selected; }, false);
  }

  private applyStatementReaction(id: string): void {
    const reactions: Record<string, string> = {
      ledger: '私人抽屉没有自己弹开。', harbor: '窗外的码头灯先亮了一盏。', subsidy: '家族印章仍留在盒里。',
      family: '右侧供货单从窗缝里滑出半截。', tax: '桌边“临时雾税”的印章渗出湿墨。', speech: '火盆里的三条纸边突然卷起。',
    };
    this.ui.setCaption(reactions[id] ?? '两个房间都沉默了一瞬。');
    this.audio.playSfx('paper', .35);
  }

  private checkSolved(selected: string[], cards: Phaser.GameObjects.Container[]): void {
    if (!mayorSolved(selected)) return;
    this.store.mutate((s) => { s.mayor.completed = true; });
    this.completeMask('mayor', 'mayor-contradiction');
    cards.forEach((card) => card.disableInteractive());
    this.ui.setCaption('没有一句话被判作“真理”。只是两边都不再需要替它撒谎。鼻梁残响从讲台木纹里浮出来。');
    this.audio.playSfx('wood', .55);
    if (!this.state.settings.reducedMotion) { this.focusCamera(640, 330, 1.04, 240); this.time.delayedCall(360, () => this.resetCamera(220)); }
    this.time.delayedCall(this.state.settings.reducedMotion ? 0 : 520, () => this.addNavArrow('forward', () => this.navigate('shop')));
  }
}
