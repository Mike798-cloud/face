import Phaser from 'phaser';
import { BaseScene } from './BaseScene';
import { SCENE_INTROS } from '../../data/storyData';

type TraceId = 'trace-rubbing' | 'trace-thread' | 'trace-ticket';
type CraftKey = 'appearance' | 'habit' | 'witness';

interface TraceSpec {
  id: TraceId;
  craft: CraftKey;
  x: number;
  y: number;
  width: number;
  height: number;
  inspect: string;
}

const MASK_POS = { x: 754, y: 514 } as const;
const TRACE_SPECS: readonly TraceSpec[] = [
  {
    id: 'trace-rubbing', craft: 'appearance', x: 470, y: 523, width: 112, height: 81,
    inspect: '旧拓片的纸边已经磨软，中央留下的脸型比普通面具略窄。',
  },
  {
    id: 'trace-thread', craft: 'habit', x: 590, y: 531, width: 106, height: 77,
    inspect: '旧线有几处被反复打结又拆开，颜色和针枕边缘残留的线头一样。',
  },
  {
    id: 'trace-ticket', craft: 'witness', x: 304, y: 548, width: 112, height: 81,
    inspect: '票根被许多手指摸过，窄边的宽度恰好和薄面壳下颌那道夹缝一致。',
  },
] as const;

const JAR_X = [132, 286, 438, 590, 742, 894, 1046, 1195] as const;
const DISCOVERY_JAR_INDEX = 4;

export class SecretScene extends BaseScene {
  private workMask: Phaser.GameObjects.Image | null = null;
  private traceSprites = new Map<TraceId, Phaser.GameObjects.Image>();

  constructor() { super('secret'); }

  preload(): void {
    this.preloadImage('bg-secret', 'secret-room.webp');
    this.preloadImage('trace-rubbing', 'interaction/trace-rubbing.webp');
    this.preloadImage('trace-thread', 'interaction/trace-thread.webp');
    this.preloadImage('trace-ticket', 'interaction/trace-ticket.webp');
    // Re-use the hand-painted blank mask already present elsewhere in the game rather than
    // drawing a programmer-art oval on top of the scene.
    this.preloadImage('secret-mask-source', 'interaction/secret-mask.webp');
    this.preloadImage('secret-water-peek', 'water-memory.webp');
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
      this.ui.setSceneItems([]);
      this.renderCompletedBench();
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

    this.normalizeLegacyCraftOrder();

    // The old implementation put the two box objects into a tiny HTML inventory and asked
    // the player to click three faint receptacles. In this room the evidence now stays in
    // the world: the player can see it, pick it up and physically use it on the workpiece.
    this.ui.setSceneItems([]);
    this.installJarPuzzle();
    this.createClothDrawer();

    if (this.shouldShowMask()) this.showWorkMask(false);
    this.restoreAppliedStages();
    this.createAvailableTraceSprites();

    const affordanceFlag = 'secret-pointclick-v54-seen';
    if (!this.state.hiddenFlags.includes(affordanceFlag)) {
      this.store.mutate((state) => {
        if (!state.hiddenFlags.includes(`${intro.flag}:seen`)) state.hiddenFlags.push(`${intro.flag}:seen`);
        state.hiddenFlags.push(affordanceFlag);
      });
      this.ui.setCaption('八只玻璃罐里，只有第五只的塞口被磨得发白。师父带进后室的东西从来不是先写用途，而是先留下它们被手碰过的地方。');
      this.scheduleFirstActionAffordance();
    }
  }

  private normalizeLegacyCraftOrder(): void {
    // v5.3 allowed the three materials to be solved in any order. The new physical craft is
    // sequential; promote impossible old partial combinations so no existing save is trapped.
    if (this.state.craft.witness && (!this.state.craft.habit || !this.state.craft.appearance)) {
      this.store.mutate((state) => { state.craft.appearance = true; state.craft.habit = true; }, false);
      return;
    }
    if (this.state.craft.habit && !this.state.craft.appearance) {
      this.store.mutate((state) => { state.craft.appearance = true; }, false);
    }
  }

  private shouldShowMask(): boolean {
    return this.state.hiddenFlags.includes('secret-mask-revealed-v54')
      || this.state.craft.appearance
      || this.state.craft.habit
      || this.state.craft.witness;
  }

  private installJarPuzzle(): void {
    JAR_X.forEach((x, index) => {
      const zone = this.add.zone(x, 238, 118, 226).setDepth(22).setInteractive({ useHandCursor: true });
      zone.on('pointerdown', () => {
        if (index === DISCOVERY_JAR_INDEX) {
          this.openDiscoveryJar();
          return;
        }
        this.audio.playSfx('glass', .09);
        const notes = [
          '第一只罐塞被旧蜡封死，里面的脸没有一点松动。',
          '第二只罐底压着几根断线，却没有新近开合的痕迹。',
          '第三只罐壁被擦得很亮，塞口却仍完整地黏着旧蜡。',
          '第四只罐里的面壳向左偏着，像很多年没人把它扶正。',
          '第六只罐塞有灰，没有手指最近留下的油光。',
          '第七只罐的玻璃很冷，里面那张脸只在气泡经过时轻轻晃。',
          '最右一只罐底有一道旧水线，塞口却从未被重新撬过。',
        ];
        const noteIndex = index > DISCOVERY_JAR_INDEX ? index - 1 : index;
        this.ui.setCaption(notes[noteIndex] ?? '玻璃发出很轻的一声，塞子没有动。');
        this.tapJar(x);
      });
    });

    // A physical wear mark, not a UI ring: the worn stopper catches light a little differently.
    if (!this.shouldShowMask()) {
      const wear = this.add.rectangle(JAR_X[DISCOVERY_JAR_INDEX], 118, 66, 7, 0xe3d5b8, .10)
        .setAngle(-1).setDepth(5).setBlendMode(Phaser.BlendModes.ADD);
      if (!this.state.settings.reducedMotion) {
        this.tweens.add({ targets: wear, alpha: { from: .035, to: .18 }, x: wear.x + 4, duration: 2200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      }
    }
  }

  private openDiscoveryJar(): void {
    if (this.shouldShowMask()) {
      this.audio.playSfx('glass', .08);
      this.ui.setCaption('第五只罐已经空了。桌上的薄面壳正是从这里取下来的。');
      return;
    }

    this.store.mutate((state) => {
      if (!state.hiddenFlags.includes('secret-mask-revealed-v54')) state.hiddenFlags.push('secret-mask-revealed-v54');
    });
    this.audio.playSfx('glass', .34);
    this.focusCamera(JAR_X[DISCOVERY_JAR_INDEX], 260, 1.055, 180);

    const emptyGlass = this.add.rectangle(JAR_X[DISCOVERY_JAR_INDEX], 244, 96, 176, 0x2a302c, .20)
      .setStrokeStyle(1.2, 0xcbd0c4, .18).setDepth(7).setAlpha(0);
    if (this.state.settings.reducedMotion) emptyGlass.setAlpha(.72);
    else this.tweens.add({ targets: emptyGlass, alpha: .72, duration: 260, ease: 'Sine.easeOut' });

    this.showWorkMask(true);
    this.ui.setCaption('磨薄的塞子一提就松。罐里的薄面壳没有名字，落到工作台上时，下颌那道窄夹缝正对着桌边的纸屑。');
    this.time.delayedCall(this.state.settings.reducedMotion ? 0 : 360, () => this.resetCamera(220));
  }

  private showWorkMask(fromJar: boolean): void {
    if (this.workMask) return;
    const startX = fromJar ? JAR_X[DISCOVERY_JAR_INDEX] : MASK_POS.x;
    const startY = fromJar ? 242 : MASK_POS.y;
    const image = this.add.image(startX, startY, 'secret-mask-source')
      .setDisplaySize(122, 184)
      .setDepth(13)
      .setAlpha(fromJar ? .12 : .94)
      .setInteractive({ useHandCursor: true });

    this.workMask = image;

    image.on('pointerdown', () => this.describeMaskStage());

    if (!fromJar || this.state.settings.reducedMotion) {
      image.setPosition(MASK_POS.x, MASK_POS.y).setAlpha(.94);
      return;
    }
    image.setScale(.42);
    this.tweens.add({
      targets: image,
      x: MASK_POS.x,
      y: MASK_POS.y,
      alpha: .94,
      scaleX: 1,
      scaleY: 1,
      angle: 4,
      duration: 520,
      ease: 'Cubic.easeOut',
      onComplete: () => image.setAngle(0),
    });
  }

  private describeMaskStage(): void {
    if (!this.state.craft.appearance) {
      this.ui.setCaption('薄面壳表面几乎没有纹理，额前却留着一层纸纤维压过的浅毛边。旧拓片的脸型和它差不多大。');
      return;
    }
    if (!this.state.craft.habit) {
      this.ui.setCaption('轮廓已经留在面壳上。边缘一圈细孔仍是空的，孔距和桌上针脚留下的旧磨痕完全一样。');
      return;
    }
    if (!this.state.craft.witness) {
      this.ui.setCaption('线沿着轮廓收紧以后，下颌那道扁长夹缝才真正张开，宽度只够容下一张旧票根。');
      return;
    }
    this.ui.setCaption('拓片、旧线和票根没有组成一张“正确的脸”，只是让这只薄面壳第一次有了来历。');
  }

  private createAvailableTraceSprites(): void {
    if (this.state.hiddenFlags.includes('trace-rubbing-found') && !this.state.craft.appearance) this.createTraceSprite('trace-rubbing');
    if (this.state.hiddenFlags.includes('trace-thread-found') && !this.state.craft.habit) this.createTraceSprite('trace-thread');
    if (this.state.hiddenFlags.includes('secret-ticket-found') && !this.state.craft.witness) this.createTraceSprite('trace-ticket');
  }

  private createTraceSprite(id: TraceId): void {
    if (this.traceSprites.has(id)) return;
    const spec = TRACE_SPECS.find((item) => item.id === id);
    if (!spec) return;
    const sprite = this.add.image(spec.x, spec.y, id)
      .setDisplaySize(spec.width, spec.height)
      .setDepth(15)
      .setInteractive({ useHandCursor: true });
    this.input.setDraggable(sprite);
    this.traceSprites.set(id, sprite);

    sprite.on('pointerdown', () => {
      this.ui.setCaption(spec.inspect);
      this.audio.playSfx(id === 'trace-thread' ? 'stitch' : 'paper', .10);
    });
    sprite.on('dragstart', () => {
      sprite.setDepth(30).setScale(1.045);
      this.focusCamera(sprite.x, sprite.y, 1.025, 100);
    });
    sprite.on('drag', (_pointer: Phaser.Input.Pointer, x: number, y: number) => sprite.setPosition(x, y));
    sprite.on('dragend', () => {
      sprite.setDepth(15).setScale(1);
      this.resetCamera(110);
      this.tryApplyTrace(spec, sprite);
    });

    if (!this.state.settings.reducedMotion) {
      this.tweens.add({ targets: sprite, y: spec.y - 3, duration: 1500 + TRACE_SPECS.indexOf(spec) * 160, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
  }

  private tryApplyTrace(spec: TraceSpec, sprite: Phaser.GameObjects.Image): void {
    if (!this.workMask || Phaser.Math.Distance.Between(sprite.x, sprite.y, MASK_POS.x, MASK_POS.y) > 118) {
      this.returnTrace(spec, sprite);
      return;
    }

    if (spec.id === 'trace-rubbing' && this.state.craft.appearance) {
      this.returnTrace(spec, sprite); return;
    }
    if (spec.id === 'trace-thread' && !this.state.craft.appearance) {
      this.ui.setCaption('线一碰到空白面壳就滑下来。没有先留下轮廓，针脚根本不知道该沿着哪里走。');
      this.audio.playSfx('stitch', .12);
      this.returnTrace(spec, sprite);
      return;
    }
    if (spec.id === 'trace-ticket' && !this.state.craft.habit) {
      this.ui.setCaption('票根能塞进下颌的窄缝，却会立刻掉出来。边缘的线还没有把夹口收住。');
      this.audio.playSfx('paper', .12);
      this.returnTrace(spec, sprite);
      return;
    }

    sprite.disableInteractive();
    this.tweens.killTweensOf(sprite);
    const targetY = spec.id === 'trace-ticket' ? MASK_POS.y + 42 : MASK_POS.y;
    const finish = (): void => {
      this.store.mutate((state) => { state.craft[spec.craft] = true; });
      this.traceSprites.delete(spec.id);
      sprite.destroy();
      this.renderAppliedStage(spec.id, true);
      if (this.state.craft.appearance && this.state.craft.habit && this.state.craft.witness) {
        this.time.delayedCall(this.state.settings.reducedMotion ? 120 : 620, () => this.finishCraft());
      }
    };

    this.audio.playSfx(spec.id === 'trace-thread' ? 'stitch' : 'paper', .30);
    if (this.state.settings.reducedMotion) {
      sprite.setPosition(MASK_POS.x, targetY);
      finish();
      return;
    }
    this.tweens.add({
      targets: sprite,
      x: MASK_POS.x,
      y: targetY,
      scaleX: .72,
      scaleY: .72,
      angle: spec.id === 'trace-thread' ? -6 : 2,
      alpha: .45,
      duration: 300,
      ease: 'Cubic.easeIn',
      onComplete: finish,
    });
  }

  private returnTrace(spec: TraceSpec, sprite: Phaser.GameObjects.Image): void {
    this.tweens.killTweensOf(sprite);
    if (this.state.settings.reducedMotion) {
      sprite.setPosition(spec.x, spec.y).setScale(1).setAlpha(1).setAngle(0);
      return;
    }
    this.tweens.add({ targets: sprite, x: spec.x, y: spec.y, scaleX: 1, scaleY: 1, alpha: 1, angle: 0, duration: 220, ease: 'Back.easeOut' });
  }

  private restoreAppliedStages(): void {
    if (this.state.craft.appearance) this.renderAppliedStage('trace-rubbing', false);
    if (this.state.craft.habit) this.renderAppliedStage('trace-thread', false);
    if (this.state.craft.witness) this.renderAppliedStage('trace-ticket', false);
  }

  private renderAppliedStage(id: TraceId, announce: boolean): void {
    if (this.children.getByName(`secret-applied:${id}`)) return;
    if (id === 'trace-rubbing') {
      const paper = this.add.image(MASK_POS.x, MASK_POS.y - 2, 'trace-rubbing')
        .setName(`secret-applied:${id}`).setDisplaySize(78, 56).setAlpha(.30).setDepth(14).setAngle(2);
      if (!this.state.settings.reducedMotion && announce) this.tweens.add({ targets: paper, alpha: { from: .05, to: .34 }, duration: 420, ease: 'Sine.easeOut' });
      if (announce) this.ui.setCaption('拓片伏在面壳上时，旧轮廓一点点转印下来。纸被揭开，留下的不是五官，只是一条曾经被认真量过的边。');
      return;
    }

    if (id === 'trace-thread') {
      const holder = this.add.container(MASK_POS.x, MASK_POS.y).setName(`secret-applied:${id}`).setDepth(15);
      const stitches = this.add.graphics();
      stitches.lineStyle(2.2, 0x3a2d24, .78);
      for (let i = 0; i < 12; i += 1) {
        const a = Phaser.Math.DegToRad(-150 + i * 27);
        const x = Math.cos(a) * 50;
        const y = Math.sin(a) * 72;
        const nx = Math.cos(a) * 57;
        const ny = Math.sin(a) * 79;
        stitches.lineBetween(x, y, nx, ny);
      }
      holder.add(stitches);
      if (!this.state.settings.reducedMotion && announce) {
        holder.setAlpha(.08);
        this.tweens.add({ targets: holder, alpha: 1, duration: 520, ease: 'Sine.easeOut' });
      }
      if (announce) this.ui.setCaption('旧线沿着已经留下的轮廓走了一圈。十二个针孔没有完全对称，却和那根线被反复打结的位置一一接上。');
      return;
    }

    const ticket = this.add.image(MASK_POS.x, MASK_POS.y + 49, 'trace-ticket')
      .setName(`secret-applied:${id}`).setDisplaySize(62, 45).setAlpha(.72).setDepth(16).setAngle(-1);
    if (!this.state.settings.reducedMotion && announce) {
      ticket.setY(MASK_POS.y + 70).setAlpha(.05);
      this.tweens.add({ targets: ticket, y: MASK_POS.y + 49, alpha: .78, duration: 360, ease: 'Back.easeOut' });
    }
    if (announce) this.ui.setCaption('票根推进下颌夹缝时，线边同时收紧。它证明不了这张脸“是谁”，只证明曾有人在某个时间、某个地方见过这个人。');
  }

  /**
   * The folded cloth is a genuine piece of scene geometry: moving it exposes a drawer, and
   * the ticket stays on the table as a draggable world object rather than jumping to UI.
   */
  private createClothDrawer(): void {
    if (this.state.craft.witness) return;
    if (this.state.hiddenFlags.includes('secret-ticket-found')) {
      this.createTraceSprite('trace-ticket');
      return;
    }

    const cloth = this.add.ellipse(218, 514, 198, 84, 0xc6b8a3, .17)
      .setStrokeStyle(2, 0x6e6051, .30).setDepth(12).setAngle(-6).setInteractive({ useHandCursor: true });
    const folds = this.add.graphics().setDepth(13).setAlpha(.40);
    folds.lineStyle(2, 0x6f6254, .52);
    folds.beginPath();
    folds.moveTo(142, 500); folds.lineTo(184, 487); folds.lineTo(220, 520); folds.lineTo(258, 492);
    folds.moveTo(158, 522); folds.lineTo(202, 512); folds.lineTo(244, 542); folds.lineTo(296, 525);
    folds.strokePath();
    const drawer = this.add.rectangle(246, 552, 126, 30, 0x2d231b, .78).setStrokeStyle(2, 0x15100c, .46).setDepth(9).setAlpha(0);

    const reveal = (): void => {
      cloth.disableInteractive();
      this.store.mutate((state) => {
        if (!state.hiddenFlags.includes('secret-ticket-found')) state.hiddenFlags.push('secret-ticket-found');
      });
      this.audio.playSfx('paper', .24);
      this.ui.setCaption('棉布被移开以后，浅抽屉自己露出一指宽。里面压着的不是说明书，而是一张边缘被摸亮的旧票根。');
      if (this.state.settings.reducedMotion) {
        cloth.setVisible(false); folds.setVisible(false); drawer.setAlpha(1);
        this.createTraceSprite('trace-ticket');
        return;
      }
      this.tweens.add({ targets: [cloth, folds], x: '-=86', y: '+=17', angle: -17, alpha: 0, duration: 260, ease: 'Cubic.easeOut', onComplete: () => { cloth.setVisible(false); folds.setVisible(false); } });
      this.tweens.add({ targets: drawer, alpha: 1, y: 566, duration: 220, ease: 'Sine.easeOut' });
      this.time.delayedCall(120, () => this.createTraceSprite('trace-ticket'));
    };
    cloth.on('pointerdown', reveal);

    if (!this.state.settings.reducedMotion) {
      this.time.delayedCall(5200, () => {
        if (!cloth.active || this.state.hiddenFlags.includes('secret-ticket-found')) return;
        this.tweens.add({ targets: cloth, x: cloth.x - 5, angle: -8, duration: 170, yoyo: true, repeat: 1, ease: 'Sine.easeInOut' });
      });
    }
  }

  private scheduleFirstActionAffordance(): void {
    if (this.state.settings.reducedMotion || this.shouldShowMask()) return;
    this.time.delayedCall(4200, () => {
      if (this.shouldShowMask()) return;
      const x = JAR_X[DISCOVERY_JAR_INDEX];
      const glint = this.add.rectangle(x - 24, 152, 3, 96, 0xf0e5ca, .08)
        .setAngle(13).setDepth(24).setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({ targets: glint, x: x + 28, alpha: 0, duration: 720, ease: 'Sine.easeOut', onComplete: () => glint.destroy() });
    });
  }

  private tapJar(x: number): void {
    if (this.state.settings.reducedMotion) return;
    const glint = this.add.ellipse(x, 235, 88, 184, 0xdde2d7, .008).setStrokeStyle(1.4, 0xdde2d7, .20).setDepth(23);
    this.tweens.add({ targets: glint, x: x + 3, alpha: 0, duration: 330, ease: 'Sine.easeOut', onComplete: () => glint.destroy() });
  }

  private installJarLife(): void {
    JAR_X.forEach((x, i) => {
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
    this.store.mutate((state) => { state.craft.completed = true; state.currentScene = 'water'; });
    this.audio.playSfx('wood', .48);
    this.focusCamera(MASK_POS.x, MASK_POS.y, 1.08, 240);

    const mask = this.workMask;
    if (mask && !this.state.settings.reducedMotion) {
      this.tweens.add({ targets: mask, y: MASK_POS.y - 34, scaleX: 1.08, scaleY: 1.08, alpha: .98, duration: 560, yoyo: true, hold: 160, ease: 'Sine.easeInOut' });
    }
    const drop = this.add.circle(MASK_POS.x + 12, MASK_POS.y + 68, 6, 0xb9d0cf, .52).setStrokeStyle(1, 0xe0eeee, .46).setDepth(26);
    if (this.state.settings.reducedMotion) drop.setY(MASK_POS.y - 120).setAlpha(.18);
    else this.tweens.add({ targets: drop, y: MASK_POS.y - 170, x: MASK_POS.x - 10, alpha: .08, duration: 1150, ease: 'Sine.easeInOut' });

    this.ui.setCaption('三样东西都落回薄面壳以后，八只玻璃罐同时起了一层雾。最反常的是那滴从工作台边缘离开的水——它没有落下，而是慢慢升向天花板。');
    this.time.delayedCall(this.state.settings.reducedMotion ? 80 : 420, () => this.revealWaterPassage(true));
    this.time.delayedCall(this.state.settings.reducedMotion ? 160 : 980, () => {
      this.resetCamera(220);
      this.addNavArrow('forward', () => this.navigate('water'));
    });
  }

  private revealWaterPassage(animate: boolean): void {
    if (this.children.getByName('secret-water-passage')) return;
    const cavity = this.add.rectangle(640, 352, 190, 250, 0x111817, .94)
      .setStrokeStyle(5, 0x27251f, .88).setDepth(6).setName('secret-water-passage');
    const water = this.add.image(640, 352, 'secret-water-peek').setDisplaySize(176, 234).setDepth(7).setAlpha(animate ? 0 : .42);
    const slab = this.add.rectangle(640, 352, 196, 254, 0x57564a, .96).setStrokeStyle(4, 0x2a2924, .86).setDepth(8);
    const seam = this.add.rectangle(640, 352, 160, 2, 0xb3aa91, .16).setDepth(9);
    cavity.setAlpha(animate ? .1 : .94);
    if (!animate || this.state.settings.reducedMotion) {
      slab.setY(502).setScale(1, .16).setAlpha(.18);
      seam.setY(480).setAlpha(.08);
      water.setAlpha(.42);
      return;
    }
    this.audio.playSfx('wood', .34);
    this.tweens.add({ targets: cavity, alpha: .94, duration: 260, ease: 'Sine.easeOut' });
    this.tweens.add({ targets: water, alpha: .42, duration: 520, delay: 180, ease: 'Sine.easeOut' });
    this.tweens.add({ targets: slab, y: 500, scaleY: .16, alpha: .18, duration: 560, ease: 'Cubic.easeInOut' });
    this.tweens.add({ targets: seam, y: 480, alpha: .08, duration: 560, ease: 'Cubic.easeInOut' });
  }

  private renderCompletedBench(): void {
    this.showWorkMask(false);
    this.renderAppliedStage('trace-rubbing', false);
    this.renderAppliedStage('trace-thread', false);
    this.renderAppliedStage('trace-ticket', false);
    this.revealWaterPassage(false);
  }
}
