import { BaseScene } from './BaseScene';
import { SCENE_INTROS } from '../../data/storyData';

type TraceId = 'trace-rubbing' | 'trace-thread' | 'trace-ticket';
type MaterialId = 'appearance' | 'habit' | 'witness';

interface BenchTarget {
  id: MaterialId;
  accepts: TraceId;
  x: number;
  y: number;
  width: number;
  height: number;
}

const TRACE_ITEMS: Readonly<Record<TraceId, { label: string; icon: string }>> = {
  'trace-rubbing': { label: '旧拓片', icon: 'assets/images/interaction/trace-rubbing.webp' },
  'trace-thread': { label: '磨旧线团', icon: 'assets/images/interaction/trace-thread.webp' },
  'trace-ticket': { label: '见证票根', icon: 'assets/images/interaction/trace-ticket.webp' },
};

const TARGETS: readonly BenchTarget[] = [
  { id: 'appearance', accepts: 'trace-rubbing', x: 400, y: 558, width: 165, height: 112 },
  { id: 'habit', accepts: 'trace-thread', x: 645, y: 540, width: 165, height: 126 },
  { id: 'witness', accepts: 'trace-ticket', x: 922, y: 553, width: 190, height: 118 },
];

export class SecretScene extends BaseScene {
  constructor() { super('secret'); }

  preload(): void {
    this.preloadImage('bg-secret', 'secret-room.webp');
    this.preloadImage('trace-rubbing', 'interaction/trace-rubbing.webp');
    this.preloadImage('trace-thread', 'interaction/trace-thread.webp');
    this.preloadImage('trace-ticket', 'interaction/trace-ticket.webp');
  }

  create(): void {
    this.ui.setScene('secret');
    this.audio.playAmbient('shop', .17);
    this.addBackground('bg-secret');
    this.addAtmosphere('dust', 16);
    this.installJarLife();
    const intro = SCENE_INTROS.secret!;
    this.setObjective(intro.objective);

    if (this.state.craft.completed) {
      this.addNavArrow('forward', () => this.navigate('water'));
      return;
    }

    // Compatibility only for saves created before the physical box-loot flow existed.
    // New saves must click both objects in the open box; entering this room no longer
    // manufactures missing evidence.
    if (this.state.prologue.opened && !this.state.hiddenFlags.includes('prologue-box-opened-v52')) {
      this.store.mutate((state) => {
        if (!state.hiddenFlags.includes('trace-rubbing-found')) state.hiddenFlags.push('trace-rubbing-found');
        if (!state.hiddenFlags.includes('trace-thread-found')) state.hiddenFlags.push('trace-thread-found');
      }, false);
    }

    this.installBenchTargets();
    this.createClothDrawer();
    this.syncSceneInventory();
    if (!this.state.hiddenFlags.includes(`${intro.flag}:seen`)) {
      this.store.mutate((state) => { state.hiddenFlags.push(`${intro.flag}:seen`); });
      this.ui.setCaption('后室里留下来的，像是三种不同的人生碎屑：轮廓、习惯，还有旁人曾经在场的证明。');
    }
  }

  /**
   * The workbench is deliberately point-and-click rather than a labelled matching UI:
   * select an object in the drawer, then try it on a physical fixture in the room.
   */
  private installBenchTargets(): void {
    TARGETS.forEach((target) => {
      const tray = this.add.rectangle(target.x, target.y, target.width * .82, target.height * .64, 0x2b2119, .10)
        .setStrokeStyle(2, 0xb9a382, .32).setDepth(7);
      const icon = this.add.graphics().setDepth(8).setAlpha(.52);
      icon.lineStyle(2, 0x9f8967, .72);
      if (target.id === 'appearance') {
        icon.strokeEllipse(target.x, target.y, 44, 56);
        icon.lineBetween(target.x - 10, target.y - 6, target.x + 10, target.y - 6);
      } else if (target.id === 'habit') {
        icon.beginPath(); icon.moveTo(target.x - 28, target.y + 10); icon.lineTo(target.x - 12, target.y - 10); icon.lineTo(target.x + 4, target.y + 10); icon.lineTo(target.x + 20, target.y - 10); icon.strokePath();
      } else {
        icon.strokeRect(target.x - 34, target.y - 20, 68, 40);
        icon.lineBetween(target.x - 24, target.y, target.x + 24, target.y);
      }
      if (!this.state.settings.reducedMotion) this.tweens.add({ targets: tray, alpha: { from: .07, to: .13 }, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

      const solved = this.state.craft[target.id];
      if (solved) this.renderPlacedTrace(target, target.accepts, false);

      const zone = this.add.zone(target.x, target.y, target.width, target.height)
        .setDepth(18)
        .setInteractive({ useHandCursor: true });

      zone.on('pointerdown', () => {
        if (this.state.craft[target.id]) {
          this.audio.playSfx('wood', .07);
          return;
        }
        const selected = this.ui.getSelectedSceneItem() as TraceId | null;
        if (!selected) {
          this.reactBench(target, false, false);
          return;
        }
        if (selected !== target.accepts) {
          this.store.mutate((state) => { state.craft.mistakes += 1; state.mistakes += 1; }, false);
          this.reactBench(target, false, true);
          return;
        }
        this.placeTrace(target, selected);
      });
    });
  }

  private placeTrace(target: BenchTarget, trace: TraceId): void {
    this.store.mutate((state) => { state.craft[target.id] = true; });
    this.ui.consumeSceneItem(trace);
    this.audio.playSfx(target.id === 'habit' ? 'stitch' : 'paper', .34);
    this.renderPlacedTrace(target, trace, true);
    this.reactBench(target, true, false);
    if (this.state.craft.appearance && this.state.craft.habit && this.state.craft.witness) {
      this.time.delayedCall(this.state.settings.reducedMotion ? 160 : 520, () => this.finishCraft());
    }
  }

  private renderPlacedTrace(target: BenchTarget, trace: TraceId, animate: boolean): void {
    if (this.children.getByName(`placed:${trace}`)) return;
    const image = this.add.image(target.x, target.y, trace).setName(`placed:${trace}`).setDepth(12).setAlpha(animate ? 0 : .9);
    if (trace === 'trace-thread') image.setDisplaySize(92, 70).setAngle(-5);
    else image.setDisplaySize(trace === 'trace-ticket' ? 112 : 104, trace === 'trace-ticket' ? 72 : 78).setAngle(trace === 'trace-rubbing' ? 3 : -2);
    if (!animate || this.state.settings.reducedMotion) { image.setAlpha(.9); return; }
    image.setScale(.72).setY(target.y - 14);
    this.tweens.add({ targets: image, alpha: .92, scaleX: 1, scaleY: 1, y: target.y, duration: 260, ease: 'Back.easeOut' });
  }

  private reactBench(target: BenchTarget, accepted: boolean, wrongItem: boolean): void {
    this.audio.playSfx(accepted ? 'wood' : 'knock', accepted ? .16 : .08);
    const color = accepted ? 0xc6ad7d : 0x8b6955;
    const ring = this.add.ellipse(target.x, target.y, target.width * .65, target.height * .56, color, .012)
      .setStrokeStyle(1.5, color, accepted ? .28 : .18).setDepth(16);
    if (!accepted && !wrongItem) {
      const descriptions: Record<MaterialId, string> = {
        appearance: '木模边缘压着浅浅的脸型轮廓，像在等一张能够留下外貌的薄纸。',
        habit: '几枚针脚把木面磨得发亮，像在等一股多年反复回来的旧线。',
        witness: '纸签旁留着一道扁长的压痕，像是给一张旧票根预留的位置。',
      };
      this.ui.setCaption(descriptions[target.id]);
    }
    if (wrongItem) this.ui.setCaption('这件东西在这里显得不合身。');
    if (this.state.settings.reducedMotion) {
      this.time.delayedCall(150, () => ring.destroy());
      return;
    }
    this.tweens.add({
      targets: ring,
      scaleX: accepted ? 1.16 : .9,
      scaleY: accepted ? 1.16 : 1.05,
      alpha: 0,
      duration: accepted ? 430 : 260,
      ease: 'Sine.easeOut',
      onComplete: () => ring.destroy(),
    });
    if (wrongItem) this.cameras.main.shake(95, .0008);
  }

  private syncSceneInventory(): void {
    const items: Array<{ id: string; label: string; icon: string }> = [];
    if (this.state.hiddenFlags.includes('trace-rubbing-found') && !this.state.craft.appearance) {
      items.push({ id: 'trace-rubbing', ...TRACE_ITEMS['trace-rubbing'] });
    }
    if (this.state.hiddenFlags.includes('trace-thread-found') && !this.state.craft.habit) {
      items.push({ id: 'trace-thread', ...TRACE_ITEMS['trace-thread'] });
    }
    if (this.state.hiddenFlags.includes('secret-ticket-found') && !this.state.craft.witness) {
      items.push({ id: 'trace-ticket', ...TRACE_ITEMS['trace-ticket'] });
    }
    this.ui.setSceneItems(items);
  }

  /**
   * More grounded than the old invisible latch: the folded cloth hides a shallow drawer.
   * Moving the cloth aside reveals the witness ticket as a proper physical object.
   */
  private createClothDrawer(): void {
    if (this.state.hiddenFlags.includes('secret-ticket-found') || this.state.craft.witness) return;
    const cloth = this.add.ellipse(230, 544, 200, 86, 0xc6b8a3, .16).setStrokeStyle(2, 0x6e6051, .3).setDepth(11).setAngle(-6).setInteractive({ useHandCursor: true });
    const folds = this.add.graphics().setDepth(12).setAlpha(.38);
    folds.lineStyle(2, 0x6f6254, .52);
    folds.beginPath();
    folds.moveTo(150, 530); folds.lineTo(194, 516); folds.lineTo(232, 548); folds.lineTo(270, 522);
    folds.moveTo(166, 552); folds.lineTo(208, 542); folds.lineTo(252, 574); folds.lineTo(305, 554);
    folds.strokePath();
    const drawer = this.add.rectangle(256, 576, 120, 28, 0x2d231b, .76).setStrokeStyle(2, 0x15100c, .46).setDepth(8).setAlpha(0);
    const ticket = this.add.image(256, 554, 'trace-ticket').setDisplaySize(92, 58).setDepth(9).setAlpha(0).setInteractive({ useHandCursor: true });
    ticket.disableInteractive();

    let opened = false;
    const reveal = (): void => {
      if (opened) return;
      opened = true;
      this.audio.playSfx('paper', .24);
      this.ui.setCaption('棉布底下压着一个浅抽屉，里面只留了一张旧票根。');
      ticket.setInteractive({ useHandCursor: true });
      if (this.state.settings.reducedMotion) {
        cloth.setVisible(false); folds.setVisible(false); drawer.setAlpha(1); ticket.setAlpha(.95);
        return;
      }
      this.tweens.add({ targets: [cloth, folds], x: '-=88', y: '+=18', angle: -18, alpha: 0, duration: 260, ease: 'Cubic.easeOut', onComplete: () => { cloth.setVisible(false); folds.setVisible(false); } });
      this.tweens.add({ targets: drawer, alpha: 1, y: 590, duration: 220, ease: 'Sine.easeOut' });
      this.tweens.add({ targets: ticket, alpha: .95, y: 566, duration: 260, delay: 80, ease: 'Sine.easeOut' });
    };

    cloth.on('pointerdown', reveal);
    ticket.on('pointerdown', () => {
      this.store.mutate((state) => {
        if (!state.hiddenFlags.includes('secret-ticket-found')) state.hiddenFlags.push('secret-ticket-found');
      });
      this.syncSceneInventory();
      this.audio.playSfx('paper', .3);
      ticket.disableInteractive();
      if (this.state.settings.reducedMotion) { ticket.destroy(); drawer.destroy(); return; }
      this.tweens.add({ targets: ticket, x: 640, y: 692, scaleX: .58, scaleY: .58, alpha: 0, duration: 320, ease: 'Cubic.easeIn', onComplete: () => { ticket.destroy(); drawer.destroy(); } });
    });
  }

  private installJarLife(): void {
    const xs = [132, 286, 438, 590, 742, 894, 1046, 1195];
    xs.forEach((x, i) => {
      this.addMouthEasterEgg(x, 236, 104, 190, 24 + (i % 3) * 3, 10 + (i % 2) * 3, 'breath');
      if (!this.state.settings.reducedMotion && i % 2 === 0) {
        const bubble = this.add.circle(x + 25, 300, 3, 0xcdd7d1, .16).setDepth(2);
        this.tweens.add({ targets: bubble, y: 185, x: x + 18, alpha: 0, duration: 2800 + i * 130, repeat: -1, delay: i * 260, onRepeat: () => bubble.setPosition(x + 25, 305).setAlpha(.16) });
      }
    });
  }

  private finishCraft(): void {
    if (this.state.craft.completed) return;
    this.ui.setSceneItems([]);
    this.store.mutate((s) => { s.craft.completed = true; s.currentScene = 'water'; });
    const mask = this.add.ellipse(645, 455, 180, 230, 0xc6b18b, .9).setStrokeStyle(5, 0x3a2c21).setDepth(10);
    if (!this.state.settings.reducedMotion) this.tweens.add({ targets: mask, alpha: { from: .2, to: .92 }, scale: { from: .7, to: 1 }, duration: 1300 });
    this.audio.playSfx('wood', .5);
    this.ui.setCaption('拓片、旧线和票根都落进木模后，后墙传来一声闷钟。一滴水从地面缓慢升向天花板。');
    this.time.delayedCall(this.state.settings.reducedMotion ? 0 : 520, () => this.addNavArrow('forward', () => this.navigate('water')));
  }
}
