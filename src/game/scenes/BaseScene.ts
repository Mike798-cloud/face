import Phaser from 'phaser';
import { eventBus } from '../../core/EventBus';
import type { GameStore } from '../../core/GameStore';
import type { AudioManager } from '../../core/AudioManager';
import type { GameState, MaskId, ObservationId, ResidueId, SceneId } from '../../core/GameState';
import type { UI } from '../../ui/UI';
import { MASK_RESIDUES } from '../../data/gameData';
import { VOICEOVER_EN } from '../../data/voiceoverData';
import { WORLD_DIALOGUE } from '../../data/dialogueData';

export interface SceneInitData {
  store: GameStore;
  ui: UI;
  audio: AudioManager;
}

type AtmosphereKind = 'dust' | 'fog' | 'water' | 'embers' | 'still';

export abstract class BaseScene extends Phaser.Scene {
  protected store!: GameStore;
  protected ui!: UI;
  protected audio!: AudioManager;
  private transitionPending = false;
  private cinematicActive = false;

  init(data: SceneInitData): void {
    this.store = data.store;
    this.ui = data.ui;
    this.audio = data.audio;
    this.transitionPending = false;
    this.cinematicActive = false;
  }

  protected get state(): GameState {
    return this.store.state;
  }

  protected asset(path: string): string {
    return `${import.meta.env.BASE_URL}assets/${path}`;
  }

  protected preloadImage(key: string, file: string): void {
    if (this.textures.exists(key)) return;
    this.load.image(key, this.asset(`images/${file}`));
  }

  protected addBackground(key: string): Phaser.GameObjects.Image {
    const background = this.add.image(640, 360, key).setDisplaySize(1280, 720).setDepth(-20);
    if (!this.state.settings.reducedMotion) this.cameras.main.fadeIn(220, 12, 12, 10);
    this.time.delayedCall(0, () => {
      this.installDiegeticDialogue();
      this.installWorldInspectables();
    });
    return background;
  }

  private installDiegeticDialogue(): void {
    type DialogueKey = keyof typeof WORLD_DIALOGUE;
    const specs: Partial<Record<string, { key: DialogueKey; x: number; y: number; w: number; h: number; fxX: number; fxY: number }>> = {
      water: { key: 'waterWoman', x: 125, y: 255, w: 120, h: 115, fxX: 125, fxY: 255 },
      mayor: { key: 'mayor', x: 590, y: 300, w: 250, h: 390, fxX: 590, fxY: 235 },
      butcher: { key: 'butcher', x: 640, y: 585, w: 190, h: 220, fxX: 640, fxY: 570 },
      elaine: { key: 'elaine', x: 680, y: 350, w: 260, h: 500, fxX: 610, fxY: 250 },
      milo: { key: 'milo', x: 480, y: 380, w: 190, h: 390, fxX: 480, fxY: 310 },
      postman: { key: 'postman', x: 640, y: 430, w: 190, h: 155, fxX: 640, fxY: 430 },
      soren: { key: 'soren', x: 270, y: 375, w: 230, h: 420, fxX: 255, fxY: 255 },
    };
    const spec = specs[this.scene.key];
    if (!spec) return;
    const line = WORLD_DIALOGUE[spec.key];
    const zone = this.addDialogueZone(spec.x, spec.y, spec.w, spec.h, line.voiceId, line.zh, () => {
      this.audio.playSfx(this.scene.key === 'postman' ? 'paper' : 'breath', .07);
      const ripple = this.add.ellipse(spec.fxX, spec.fxY, 42, 18, 0xe1d3b6, .025).setStrokeStyle(1.2, 0xd8c7a7, .28).setDepth(30);
      if (this.state.settings.reducedMotion) { this.time.delayedCall(180, () => ripple.destroy()); return; }
      this.tweens.add({ targets: ripple, scaleX: 2.6, scaleY: 2.6, alpha: 0, duration: 520, ease: 'Sine.easeOut', onComplete: () => ripple.destroy() });
    });
    zone.setDepth(this.scene.key === 'butcher' || this.scene.key === 'mayor' ? 6 : 18);
  }

  private installWorldInspectables(): void {
    type Reaction = 'glint' | 'tap' | 'sway' | 'ring';
    interface Spec { x: number; y: number; w: number; h: number; text: string; sound: string; reaction: Reaction; }
    const map: Partial<Record<string, readonly Spec[]>> = {
      secret: [
        { x: 390, y: 166, w: 170, h: 145, text: '玻璃罐壁有一圈被手掌反复擦亮的弧。里面的东西换过很多次，罐子的位置却几乎没有动。', sound: 'glass', reaction: 'glint' },
        { x: 805, y: 172, w: 180, h: 150, text: '这一排罐塞并不齐。有一只塞子比其余的磨得更薄，像曾被人在犹豫时开合很多遍。', sound: 'glass', reaction: 'tap' },
        { x: 1060, y: 462, w: 175, h: 125, text: '工作台右端留着一圈浅色水印。杯子早已拿走，木头仍记得它曾经每天停在这里。', sound: 'wood', reaction: 'ring' },
      ],
      water: [
        { x: 690, y: 92, w: 150, h: 130, text: '钟壳没有锈，分针轴却留下了逆向摩擦的亮边。这里最固执的东西，反而最像曾经被人强行纠正过。', sound: 'clock', reaction: 'ring' },
        { x: 385, y: 407, w: 220, h: 150, text: '桌脚在水里并没有漂。只有桌上的纸页不断换方向，像记忆在反复决定先说哪一句。', sound: 'paper', reaction: 'sway' },
        { x: 804, y: 447, w: 190, h: 215, text: '椅背上有两道互相覆盖的抓痕。一道向前，一道向后；后来的那一道更深。', sound: 'wood', reaction: 'tap' },
        { x: 1112, y: 333, w: 200, h: 330, text: '书柜门缝里夹着一张泡软的纸角。字已经散了，只剩纸纤维朝着同一个方向卷起。', sound: 'paper', reaction: 'glint' },
      ],
      elaine: [
        { x: 106, y: 195, w: 170, h: 310, text: '墙上的旧面具并不完全贴合钉子。每一张背面都有同一处被拇指磨亮的缺口。', sound: 'paper', reaction: 'sway' },
        { x: 1010, y: 230, w: 170, h: 320, text: '右墙的肖像来自不同年份。相框换过，钉孔却总比画框高半指，像挂画的人习惯先抬手再回落。', sound: 'paper', reaction: 'tap' },
        { x: 1115, y: 390, w: 170, h: 520, text: '幕布下沿有一条比别处更深的折线。有人每次谢幕后都从同一个位置把它抓住。', sound: 'paper', reaction: 'sway' },
      ],
      milo: [
        { x: 165, y: 250, w: 210, h: 380, text: '衣柜门把手很低，刚好是孩子踮脚能够到的高度。门板上的抓痕全在里面，不在外面。', sound: 'wood', reaction: 'tap' },
        { x: 650, y: 103, w: 310, h: 120, text: '书架上的钟每天都停在同一格灰尘上。房间会变成什么样，和它几点钟没有关系。', sound: 'clock', reaction: 'glint' },
        { x: 1117, y: 330, w: 145, h: 250, text: '床头灯的开关被磨得发白。恐惧来临以前，这只手曾经很多次先去找光。', sound: 'glass', reaction: 'ring' },
        { x: 218, y: 628, w: 250, h: 105, text: '地毯下面没有怪物，只有四个被反复压平的角。人越害怕某个地方，越会记得它真实的重量。', sound: 'paper', reaction: 'sway' },
      ],
      postman: [
        { x: 216, y: 220, w: 130, h: 230, text: '路灯的玻璃朝海一侧更浑。几十年的盐雾只从一个方向来，埃利亚斯从来不需要路牌确认它。', sound: 'glass', reaction: 'glint' },
        { x: 427, y: 171, w: 170, h: 130, text: '帆船每次经过这里都先收一角帆。海上的路线会变，岸上的脚步却曾经三十年不肯变。', sound: 'sea', reaction: 'sway' },
        { x: 1030, y: 172, w: 170, h: 210, text: '灯塔的光扫回来时，总比脚下的海风慢半拍。这里有两种循环，它们从来没有同步。', sound: 'sea', reaction: 'ring' },
        { x: 650, y: 430, w: 180, h: 170, text: '邮箱铰链右侧比左侧亮。有人无数次用同一只手、同一个角度掀开过它。', sound: 'paper', reaction: 'tap' },
      ],
      soren: [
        { x: 28, y: 198, w: 100, h: 250, text: '墙上的小龛没有供奉物，只有一层薄灰在内侧断开。有人常把手伸进去确认空间有多深。', sound: 'knock', reaction: 'tap' },
        { x: 855, y: 430, w: 190, h: 115, text: '石碗的边缘有两处不同的磨痕。索伦分不清谁的脸，却记得两个人端碗时手指落下的位置并不一样。', sound: 'glass', reaction: 'ring' },
        { x: 1055, y: 520, w: 180, h: 170, text: '最右边的凳脚短了一点。坐下的人会先向左挪半寸，再开口说话。', sound: 'wood', reaction: 'sway' },
      ],
      blank: [
        { x: 414, y: 474, w: 160, h: 180, text: '旧照片边缘被拇指摸软。照片里的人已经不在，纸张却因此比新相框更像一件活过的东西。', sound: 'paper', reaction: 'glint' },
        { x: 642, y: 500, w: 220, h: 120, text: '桌上的薄册没有标题。第一页被撕掉以后，后面的纸反而更容易翻开。', sound: 'paper', reaction: 'sway' },
      ],
      finale: [
        { x: 275, y: 216, w: 250, h: 165, text: '左台玻璃罩内侧有一道手指擦过的弧。有人曾经在机器给出结果以后，又伸手进去确认了一遍。', sound: 'glass', reaction: 'glint' },
        { x: 640, y: 212, w: 230, h: 160, text: '中央刻度最常停在中间，却不是因为那里最正确，只因为机械臂回位时一定经过那里。', sound: 'clock', reaction: 'ring' },
        { x: 1030, y: 215, w: 250, h: 165, text: '右台的黄铜边缘比别处暖。机器冷却以后，这一块仍会多留几秒人的体温。', sound: 'wood', reaction: 'tap' },
      ],
      ending: [
        { x: 150, y: 330, w: 160, h: 300, text: '旧镜上的裂纹没有继续长。镜子并不要求裂缝被修好，只负责把站在前面的人照回来。', sound: 'glass', reaction: 'glint' },
        { x: 390, y: 390, w: 160, h: 170, text: '灯油只剩薄薄一层。它仍然亮着，不因为有人命令它照向哪一张脸。', sound: 'glass', reaction: 'ring' },
      ],
    };
    const specs = map[this.scene.key];
    if (!specs) return;
    specs.forEach((spec) => {
      const zone = this.add.zone(spec.x, spec.y, spec.w, spec.h).setDepth(3).setInteractive({ useHandCursor: true });
      zone.on('pointerdown', () => {
        this.ui.setCaption(spec.text);
        this.audio.playSfx(spec.sound, .08);
        this.playInspectableReaction(spec.x, spec.y, spec.w, spec.h, spec.reaction);
      });
    });
  }

  private playInspectableReaction(x: number, y: number, width: number, height: number, reaction: 'glint' | 'tap' | 'sway' | 'ring'): void {
    if (reaction === 'glint') {
      const glint = this.add.rectangle(x - width * .22, y, 3, Math.max(38, height * .62), 0xeadfc8, .08)
        .setAngle(17).setBlendMode(Phaser.BlendModes.ADD).setDepth(4);
      if (this.state.settings.reducedMotion) { this.time.delayedCall(140, () => glint.destroy()); return; }
      this.tweens.add({ targets: glint, x: x + width * .22, alpha: 0, duration: 480, onComplete: () => glint.destroy() });
      return;
    }
    if (reaction === 'ring') {
      const ring = this.add.ellipse(x, y, Math.max(28, width * .22), Math.max(20, height * .18), 0xd7c39d, .015)
        .setStrokeStyle(1.5, 0xd7c39d, .34).setDepth(4);
      if (this.state.settings.reducedMotion) { this.time.delayedCall(140, () => ring.destroy()); return; }
      this.tweens.add({ targets: ring, scaleX: 2.15, scaleY: 1.75, alpha: 0, duration: 500, onComplete: () => ring.destroy() });
      return;
    }
    const mark = reaction === 'tap'
      ? this.add.rectangle(x, y, Math.max(20, width * .18), Math.max(14, height * .12), 0xc6b18b, .025).setStrokeStyle(1.5, 0xc6b18b, .3).setDepth(4)
      : this.add.ellipse(x, y, Math.max(24, width * .2), Math.max(18, height * .16), 0xc6b18b, .018).setStrokeStyle(1.2, 0xc6b18b, .28).setDepth(4);
    if (this.state.settings.reducedMotion) { this.time.delayedCall(140, () => mark.destroy()); return; }
    this.tweens.add({ targets: mark, x: x + (reaction === 'sway' ? 10 : 0), angle: reaction === 'sway' ? 3 : 0, scale: 1.15, alpha: 0, duration: 380, yoyo: reaction === 'sway', onComplete: () => mark.destroy() });
  }

  protected setObjective(text: string): void {
    this.ui.setObjective(text);
  }

  /**
   * A delayed sheen across a real scene object. It is intentionally weaker than a UI
   * hotspot ring: players still discover the object by looking at the room, but a long
   * idle no longer leaves them staring at a completely inert painting.
   */
  protected scheduleObjectGlint(x: number, y: number, width: number, height: number, delay = 4200): void {
    if (this.state.settings.reducedMotion) return;
    this.time.delayedCall(delay, () => {
      if (!this.scene.isActive()) return;
      const glint = this.add.rectangle(x - width * .34, y, 3, Math.max(34, height * .72), 0xefe4cd, .09)
        .setAngle(16).setBlendMode(Phaser.BlendModes.ADD).setDepth(29);
      this.tweens.add({
        targets: glint,
        x: x + width * .34,
        alpha: 0,
        duration: 720,
        ease: 'Sine.easeOut',
        onComplete: () => glint.destroy(),
      });
    });
  }

  protected addAtmosphere(kind: AtmosphereKind, count = 18): void {
    if (kind === 'still' || this.state.settings.reducedMotion) return;
    const depth = -2;
    if (kind === 'dust') {
      for (let i = 0; i < count; i += 1) {
        const mote = this.add.circle(Phaser.Math.Between(40, 1240), Phaser.Math.Between(80, 690), Phaser.Math.FloatBetween(1, 2.8), 0xe4d3ae, Phaser.Math.FloatBetween(.07, .18)).setDepth(depth);
        this.tweens.add({
          targets: mote,
          x: mote.x + Phaser.Math.Between(-45, 55),
          y: mote.y - Phaser.Math.Between(30, 95),
          alpha: { from: mote.alpha, to: 0 },
          duration: Phaser.Math.Between(3800, 7600),
          delay: Phaser.Math.Between(0, 2400),
          repeat: -1,
          onRepeat: () => {
            mote.setPosition(Phaser.Math.Between(40, 1240), Phaser.Math.Between(240, 700));
            mote.setAlpha(Phaser.Math.FloatBetween(.07, .18));
          },
        });
      }
      return;
    }
    if (kind === 'fog') {
      for (let i = 0; i < Math.max(7, Math.floor(count / 2)); i += 1) {
        const fog = this.add.ellipse(Phaser.Math.Between(-120, 1160), Phaser.Math.Between(120, 650), Phaser.Math.Between(250, 460), Phaser.Math.Between(60, 130), 0xc7cbc2, Phaser.Math.FloatBetween(.018, .055)).setDepth(depth);
        this.tweens.add({ targets: fog, x: fog.x + Phaser.Math.Between(260, 520), alpha: { from: fog.alpha, to: .01 }, duration: Phaser.Math.Between(7000, 12000), yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      }
      return;
    }
    if (kind === 'water') {
      for (let i = 0; i < count; i += 1) {
        const bubble = this.add.circle(Phaser.Math.Between(30, 1250), Phaser.Math.Between(420, 720), Phaser.Math.Between(2, 6), 0xc4d7d4, Phaser.Math.FloatBetween(.05, .2)).setStrokeStyle(1, 0xe0eeee, .12).setDepth(depth);
        this.tweens.add({
          targets: bubble,
          y: Phaser.Math.Between(-30, 180),
          x: bubble.x + Phaser.Math.Between(-40, 40),
          alpha: 0,
          duration: Phaser.Math.Between(5000, 9500),
          delay: Phaser.Math.Between(0, 2600),
          repeat: -1,
          onRepeat: () => bubble.setPosition(Phaser.Math.Between(30, 1250), Phaser.Math.Between(620, 760)).setAlpha(Phaser.Math.FloatBetween(.05, .2)),
        });
      }
      return;
    }
    for (let i = 0; i < Math.max(8, Math.floor(count / 2)); i += 1) {
      const ember = this.add.circle(Phaser.Math.Between(180, 1100), Phaser.Math.Between(350, 660), Phaser.Math.Between(1, 3), 0xd29a5a, Phaser.Math.FloatBetween(.08, .22)).setDepth(depth);
      this.tweens.add({ targets: ember, y: ember.y - Phaser.Math.Between(20, 70), x: ember.x + Phaser.Math.Between(-18, 18), alpha: 0, duration: Phaser.Math.Between(1600, 3400), repeat: -1, delay: Phaser.Math.Between(0, 1400), onRepeat: () => ember.setPosition(Phaser.Math.Between(180, 1100), Phaser.Math.Between(470, 690)).setAlpha(Phaser.Math.FloatBetween(.08, .22)) });
    }
  }

  private createCinematicMotifs(depth: number): Phaser.GameObjects.GameObject[] {
    const objects: Phaser.GameObjects.GameObject[] = [];
    const reduced = this.state.settings.reducedMotion;
    const keep = <T extends Phaser.GameObjects.GameObject>(item: T): T => { objects.push(item); return item; };
    const pulse = (target: Phaser.GameObjects.GameObject & { alpha: number }, from: number, to: number, duration: number): void => {
      if (reduced) { target.alpha = to; return; }
      this.tweens.add({ targets: target, alpha: { from, to }, duration, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    };
    const ring = (x: number, y: number, width: number, height: number, color: number, delay = 0): void => {
      const r = keep(this.add.ellipse(x, y, width, height, color, .001).setStrokeStyle(1.5, color, .24).setDepth(depth));
      if (reduced) return;
      r.setScale(.55).setAlpha(.2);
      this.tweens.add({ targets: r, scaleX: 1.75, scaleY: 1.75, alpha: 0, duration: 1800, delay, repeat: -1, repeatDelay: 520, ease: 'Sine.easeOut' });
    };

    switch (this.scene.key) {
      case 'shop': {
        for (let i = 0; i < 18; i += 1) {
          const rain = keep(this.add.rectangle(Phaser.Math.Between(40, 1240), Phaser.Math.Between(-80, 740), 1.2, Phaser.Math.Between(24, 46), 0xcbd1cc, Phaser.Math.FloatBetween(.045, .12)).setRotation(.16).setDepth(depth));
          if (!reduced) this.tweens.add({ targets: rain, x: rain.x + 95, y: 780, alpha: 0, duration: Phaser.Math.Between(720, 1180), delay: Phaser.Math.Between(0, 900), repeat: -1, onRepeat: () => rain.setPosition(Phaser.Math.Between(20, 1180), Phaser.Math.Between(-90, 120)).setAlpha(Phaser.Math.FloatBetween(.045, .12)) });
        }
        const bird = (x: number, y: number, scale: number, delay: number): void => {
          const wings = keep(this.add.graphics().setDepth(depth));
          wings.lineStyle(2.2 * scale, 0x171916, .6);
          wings.beginPath(); wings.moveTo(-18 * scale, 2); wings.lineTo(-8 * scale, -7 * scale); wings.lineTo(0, 1); wings.lineTo(8 * scale, -7 * scale); wings.lineTo(18 * scale, 2); wings.strokePath();
          wings.setPosition(x, y).setAlpha(.55);
          if (!reduced) {
            this.tweens.add({ targets: wings, scaleY: { from: .45, to: 1.15 }, duration: 165, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
            this.tweens.add({ targets: wings, x: x + 1480, y: y - 95, duration: 6800 / Math.max(.65, scale), delay, repeat: -1, repeatDelay: 1800, onRepeat: () => wings.setPosition(-80, Phaser.Math.Between(80, 240)) });
          }
        };
        bird(-40, 125, .9, 0); bird(-180, 190, .65, 2100); bird(-260, 95, .48, 3900);
        break;
      }
      case 'secret': {
        [140, 290, 440, 590, 740, 890, 1040, 1190].forEach((x, i) => {
          const b = keep(this.add.circle(x + 14, 305, 3 + (i % 2), 0xd8dfd6, .11).setDepth(depth));
          if (!reduced) this.tweens.add({ targets: b, y: 185, x: x + 6, alpha: 0, duration: 2100 + i * 110, delay: i * 120, repeat: -1, repeatDelay: 220, onRepeat: () => b.setPosition(x + 14, 310).setAlpha(.11) });
        });
        const thread = keep(this.add.rectangle(640, 215, 2, 138, 0x33251f, .23).setOrigin(.5, 0).setDepth(depth));
        if (!reduced) this.tweens.add({ targets: thread, angle: { from: -1.4, to: 1.6 }, duration: 1700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        break;
      }
      case 'water': {
        ring(390, 355, 120, 42, 0xbcd1ce, 0); ring(720, 450, 150, 52, 0xbcd1ce, 620);
        for (let i = 0; i < 8; i += 1) {
          const bubble = keep(this.add.circle(130 + i * 145, 675 - (i % 3) * 35, 3 + (i % 3), 0xcde1de, .12).setDepth(depth));
          if (!reduced) this.tweens.add({ targets: bubble, y: 140 + (i % 2) * 80, x: bubble.x + (i % 2 ? 24 : -20), alpha: 0, duration: 3000 + i * 170, delay: i * 140, repeat: -1, onRepeat: () => bubble.setPosition(130 + i * 145, 690 - (i % 3) * 35).setAlpha(.12) });
        }
        break;
      }
      case 'mayor': {
        const paper = keep(this.add.rectangle(305, 520, 150, 92, 0xd6c9ad, .08).setStrokeStyle(1, 0x6d5d47, .12).setAngle(-7).setDepth(depth));
        if (!reduced) this.tweens.add({ targets: paper, x: 360, y: 502, angle: 1, duration: 2150, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        const windowLight = keep(this.add.rectangle(1005, 282, 255, 345, 0xe6d8b9, .015).setRotation(.08).setBlendMode(Phaser.BlendModes.ADD).setDepth(depth));
        pulse(windowLight, .008, .06, 1750);
        for (let i = 0; i < 12; i += 1) {
          const drop = keep(this.add.rectangle(905 + (i % 5) * 48, 120 + (i % 4) * 63, 1.2, 28 + (i % 3) * 7, 0xd3d8d2, .08).setRotation(.08).setDepth(depth));
          if (!reduced) this.tweens.add({ targets: drop, y: drop.y + 320, x: drop.x + 18, alpha: 0, duration: 920 + i * 55, delay: i * 90, repeat: -1, onRepeat: () => drop.setY(105 + (i % 4) * 30).setAlpha(.08) });
        }
        break;
      }
      case 'butcher': {
        [356, 536, 716, 896].forEach((x, i) => {
          const steam = keep(this.add.ellipse(x, 420, 15, 38, 0xd8d0bd, .04).setDepth(depth));
          if (!reduced) this.tweens.add({ targets: steam, y: 365, x: x + (i % 2 ? 8 : -8), alpha: 0, scaleX: 1.4, duration: 1600 + i * 180, delay: i * 180, repeat: -1, repeatDelay: 500, onRepeat: () => steam.setPosition(x, 420).setScale(1).setAlpha(.04) });
        });
        const lamp = keep(this.add.ellipse(640, 110, 180, 90, 0xd6ae69, .018).setBlendMode(Phaser.BlendModes.ADD).setDepth(depth));
        pulse(lamp, .006, .065, 1550);
        break;
      }
      case 'elaine': {
        const bulbXs = [373, 793];
        bulbXs.forEach((x) => [70, 135, 205, 275, 350, 420].forEach((y, i) => {
          const bulb = keep(this.add.circle(x, y, 10, 0xf2d69a, .035).setBlendMode(Phaser.BlendModes.ADD).setDepth(depth));
          if (!reduced) this.tweens.add({ targets: bulb, alpha: { from: .018, to: .11 }, duration: 760 + i * 85, yoyo: true, repeat: -1, delay: i * 70, ease: 'Sine.easeInOut' });
        }));
        const curtainShade = keep(this.add.rectangle(1210, 330, 190, 620, 0x1c1110, .025).setRotation(-.015).setDepth(depth));
        if (!reduced) this.tweens.add({ targets: curtainShade, x: 1192, angle: .8, alpha: { from: .018, to: .055 }, duration: 2600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        break;
      }
      case 'milo': {
        [[1115, 303], [838, 122], [218, 627]].forEach(([x, y], i) => {
          const lid = keep(this.add.ellipse(x!, y!, 26 + i * 4, 5, 0x171814, .55).setDepth(depth));
          if (!reduced) this.tweens.add({ targets: lid, scaleY: { from: .1, to: 1 }, alpha: { from: .12, to: .62 }, duration: 90, yoyo: true, repeat: -1, repeatDelay: 1400 + i * 620, delay: 500 + i * 300 });
        });
        const shadow = keep(this.add.ellipse(530, 620, 280, 80, 0x17201b, .025).setDepth(depth));
        if (!reduced) this.tweens.add({ targets: shadow, scaleX: 1.15, alpha: .065, duration: 2100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        break;
      }
      case 'postman': {
        const beacon = keep(this.add.triangle(1032, 183, 0, 0, -350, 145, -20, 28, 0xe7dbb8, .035).setOrigin(0, .5).setBlendMode(Phaser.BlendModes.ADD).setDepth(depth));
        if (!reduced) this.tweens.add({ targets: beacon, angle: { from: -14, to: 18 }, alpha: { from: .012, to: .1 }, duration: 2100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        const lampGlow = keep(this.add.ellipse(217, 224, 92, 105, 0xe8c779, .035).setBlendMode(Phaser.BlendModes.ADD).setDepth(depth));
        pulse(lampGlow, .015, .095, 1500);
        for (let i = 0; i < 3; i += 1) {
          const gull = keep(this.add.graphics().setDepth(depth));
          gull.lineStyle(2, 0x171b19, .46); gull.beginPath(); gull.moveTo(-12, 2); gull.lineTo(-5, -6); gull.lineTo(0, 1); gull.lineTo(5, -6); gull.lineTo(12, 2); gull.strokePath();
          gull.setPosition(-60 - i * 110, 120 + i * 40);
          if (!reduced) {
            this.tweens.add({ targets: gull, scaleY: { from: .45, to: 1.1 }, duration: 180 + i * 20, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
            this.tweens.add({ targets: gull, x: 1340, y: gull.y - 70, duration: 5600 + i * 900, delay: i * 1250, repeat: -1, repeatDelay: 2000, onRepeat: () => gull.setPosition(-70, 110 + i * 45) });
          }
        }
        break;
      }
      case 'soren': {
        ring(658, 260, 80, 80, 0xc9b995, 0); ring(658, 260, 80, 80, 0xc9b995, 630);
        const bellShade = keep(this.add.ellipse(657, 258, 72, 88, 0xd1b986, .025).setDepth(depth));
        if (!reduced) this.tweens.add({ targets: bellShade, x: 664, angle: 1.5, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        break;
      }
      case 'blank': {
        const hand = keep(this.add.rectangle(861, 466, 2, 28, 0x352d23, .55).setOrigin(.5, 1).setDepth(depth));
        if (!reduced) this.tweens.add({ targets: hand, angle: 16, duration: 1700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        const glint = keep(this.add.rectangle(1120, 275, 3, 250, 0xe5e0d0, .025).setAngle(19).setBlendMode(Phaser.BlendModes.ADD).setDepth(depth));
        if (!reduced) this.tweens.add({ targets: glint, x: 1180, alpha: { from: .01, to: .12 }, duration: 1800, yoyo: true, repeat: -1, repeatDelay: 800 });
        break;
      }
      case 'finale': {
        ring(270, 405, 130, 130, 0xc8b58e, 0); ring(640, 410, 150, 150, 0xc8b58e, 500); ring(1030, 405, 130, 130, 0xc8b58e, 1000);
        const core = keep(this.add.rectangle(640, 394, 108, 180, 0xcab98f, .018).setBlendMode(Phaser.BlendModes.ADD).setDepth(depth));
        pulse(core, .006, .07, 1300);
        break;
      }
      case 'ending': {
        const lamp = keep(this.add.ellipse(390, 390, 150, 110, 0xe2bd77, .04).setBlendMode(Phaser.BlendModes.ADD).setDepth(depth));
        pulse(lamp, .012, .1, 1600);
        [440, 520, 600, 680].forEach((x, i) => {
          const mouth = keep(this.add.ellipse(x, 222, 20, 2, 0x171310, .5).setDepth(depth));
          if (!reduced) this.tweens.add({ targets: mouth, scaleY: 3.2, alpha: { from: .12, to: .62 }, duration: 120, yoyo: true, repeat: -1, repeatDelay: 1700 + i * 330, delay: i * 220 });
        });
        break;
      }
      default:
        break;
    }
    return objects;
  }

  protected focusCamera(x: number, y: number, zoom = 1.08, duration = 220): void {
    if (this.state.settings.reducedMotion) return;
    this.cameras.main.pan(x, y, duration, 'Sine.easeInOut');
    this.cameras.main.zoomTo(zoom, duration, 'Sine.easeInOut');
  }

  protected resetCamera(duration = 220): void {
    if (this.state.settings.reducedMotion) {
      this.cameras.main.setZoom(1).centerOn(640, 360).setRotation(0).setScroll(0, 0);
      return;
    }
    this.cameras.main.pan(640, 360, duration, 'Sine.easeInOut');
    this.cameras.main.zoomTo(1, duration, 'Sine.easeInOut');
    this.tweens.add({ targets: this.cameras.main, rotation: 0, scrollX: 0, scrollY: 0, duration, ease: 'Sine.easeInOut' });
  }

  private cinematicShots(): readonly { x: number; y: number; zoom: number; rotation: number }[] {
    const map: Partial<Record<string, readonly { x: number; y: number; zoom: number; rotation: number }[]>> = {
      shop: [{ x: 565, y: 350, zoom: 1.04, rotation: -.002 }, { x: 760, y: 335, zoom: 1.13, rotation: .0015 }, { x: 380, y: 380, zoom: 1.17, rotation: -.001 }],
      secret: [{ x: 470, y: 360, zoom: 1.08, rotation: -.002 }, { x: 795, y: 330, zoom: 1.15, rotation: .0015 }, { x: 640, y: 480, zoom: 1.12, rotation: -.001 }],
      water: [{ x: 420, y: 370, zoom: 1.1, rotation: -.003 }, { x: 1010, y: 255, zoom: 1.18, rotation: .002 }, { x: 640, y: 455, zoom: 1.14, rotation: -.001 }],
      mayor: [{ x: 330, y: 355, zoom: 1.1, rotation: -.0015 }, { x: 980, y: 310, zoom: 1.13, rotation: .001 }, { x: 610, y: 505, zoom: 1.16, rotation: -.001 }],
      butcher: [{ x: 640, y: 430, zoom: 1.11, rotation: -.0015 }, { x: 330, y: 390, zoom: 1.14, rotation: .001 }, { x: 930, y: 390, zoom: 1.14, rotation: -.001 }],
      elaine: [{ x: 540, y: 350, zoom: 1.12, rotation: -.001 }, { x: 820, y: 330, zoom: 1.17, rotation: .0015 }, { x: 1080, y: 360, zoom: 1.09, rotation: -.001 }],
      milo: [{ x: 410, y: 390, zoom: 1.13, rotation: -.002 }, { x: 930, y: 320, zoom: 1.16, rotation: .002 }, { x: 640, y: 500, zoom: 1.12, rotation: -.001 }],
      postman: [{ x: 480, y: 390, zoom: 1.06, rotation: -.001 }, { x: 1010, y: 245, zoom: 1.18, rotation: .002 }, { x: 650, y: 480, zoom: 1.11, rotation: -.001 }],
      soren: [{ x: 520, y: 370, zoom: 1.1, rotation: -.001 }, { x: 660, y: 260, zoom: 1.19, rotation: .001 }, { x: 910, y: 410, zoom: 1.12, rotation: -.001 }],
      blank: [{ x: 350, y: 365, zoom: 1.08, rotation: -.001 }, { x: 860, y: 450, zoom: 1.16, rotation: .001 }, { x: 1110, y: 280, zoom: 1.13, rotation: -.001 }],
      finale: [{ x: 270, y: 410, zoom: 1.12, rotation: -.001 }, { x: 640, y: 405, zoom: 1.16, rotation: .001 }, { x: 1030, y: 410, zoom: 1.12, rotation: -.001 }],
      ending: [{ x: 350, y: 370, zoom: 1.11, rotation: -.001 }, { x: 650, y: 290, zoom: 1.14, rotation: .001 }, { x: 1080, y: 410, zoom: 1.09, rotation: -.001 }],
    };
    return map[this.scene.key] ?? [{ x: 560, y: 342, zoom: 1.075, rotation: -.0024 }, { x: 714, y: 346, zoom: 1.115, rotation: .002 }, { x: 628, y: 390, zoom: 1.145, rotation: -.0015 }];
  }

  protected playCinematic(
    flag: string,
    kicker: string,
    lines: readonly string[],
    onDone: () => void,
    force = false,
  ): void {
    const seenFlag = `v46:${flag}`;
    if (!force && this.state.hiddenFlags.includes(seenFlag)) {
      onDone();
      return;
    }
    if (this.cinematicActive) return;
    this.cinematicActive = true;
    this.ui.setCinematicMode(true);

    const reduced = this.state.settings.reducedMotion;
    const depth = 200;
    const shade = this.add.rectangle(640, 360, 1280, 720, 0x080907, .18).setDepth(depth).setAlpha(0);
    const vignette = this.add.rectangle(640, 360, 1280, 720, 0x050605, .06).setDepth(depth + 1).setAlpha(0);
    const topBar = this.add.rectangle(640, -48, 1280, 96, 0x080907, .97).setDepth(depth + 4);
    const bottomBar = this.add.rectangle(640, 774, 1280, 176, 0x080907, .97).setDepth(depth + 4);
    const flicker = this.add.rectangle(640, 360, 1280, 720, 0xf1e2c4, .018).setDepth(depth + 3).setAlpha(0);
    const cut = this.add.rectangle(640, 360, 1280, 720, 0x050605, .9).setDepth(depth + 7).setAlpha(0);
    const lightLeak = this.add.rectangle(-220, 330, 270, 940, 0xd7b879, .035)
      .setRotation(-.11).setBlendMode(Phaser.BlendModes.ADD).setDepth(depth + 2).setAlpha(0);
    const kickerText = this.add.text(76, 84, kicker, {
      fontFamily: 'Georgia, "Noto Serif SC", serif',
      fontSize: '13px', color: '#c5b18d', letterSpacing: 3,
    }).setDepth(depth + 5).setAlpha(0);
    const lineText = this.add.text(82, 548, '', {
      fontFamily: 'Georgia, "Noto Serif SC", serif',
      fontSize: '20px', color: '#eee4d1', lineSpacing: 10,
      wordWrap: { width: 1010 },
    }).setDepth(depth + 5).setAlpha(0);
    const prompt = this.add.text(1185, 646, '◆', {
      fontFamily: 'Georgia, serif', fontSize: '13px', color: '#aa9b82',
    }).setOrigin(1, .5).setDepth(depth + 5).setAlpha(0);
    const capture = this.add.zone(640, 360, 1280, 720).setDepth(depth + 8).setInteractive();
    const motifs = this.createCinematicMotifs(depth + 2);
    // A separate painted shot layer makes the cinematic visibly move even though the game
    // scene underneath is static.  Each subtitle becomes a new photographic composition
    // rather than merely panning the whole canvas by a few pixels.
    const sourceBackground = this.children.list.find((child): child is Phaser.GameObjects.Image =>
      child instanceof Phaser.GameObjects.Image && child.depth <= -10 && child.texture.key !== '__MISSING',
    );
    const filmFrame = sourceBackground
      ? this.add.image(640, 360, sourceBackground.texture.key).setDisplaySize(1280, 720).setDepth(depth - 2).setAlpha(.99)
      : null;
    if (filmFrame && sourceBackground) sourceBackground.setAlpha(.02);

    const scratches = [286, 684, 1015].map((x, index) => {
      const line = this.add.rectangle(x, 360, index === 1 ? 1 : 2, 720, 0xe8dcc4, .05).setDepth(depth + 3).setAlpha(0);
      if (!reduced) {
        this.tweens.add({
          targets: line, x: x + (index % 2 === 0 ? 30 : -24), alpha: { from: .015, to: .075 },
          duration: 760 + index * 190, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
        });
      }
      return line;
    });

    let lineIndex = 0;
    let typedCount = 0;
    let typingEvent: Phaser.Time.TimerEvent | null = null;
    let autoAdvanceEvent: Phaser.Time.TimerEvent | null = null;
    const currentLine = (): string => lines[lineIndex] ?? '';
    const keyboard = this.input.keyboard;
    const shots = this.cinematicShots();
    const voiceLines = VOICEOVER_EN[flag];

    const drift = (): void => {
      if (reduced) return;
      const shot = shots[lineIndex % shots.length]!;
      if (filmFrame) {
        this.tweens.killTweensOf(filmFrame);
        const direction = lineIndex % 2 === 0 ? 1 : -1;
        this.tweens.add({
          targets: filmFrame,
          x: shot.x + direction * 34, y: shot.y - 12 + (lineIndex % 3) * 10,
          scaleX: shot.zoom * 1.045, scaleY: shot.zoom * 1.045,
          angle: Phaser.Math.RadToDeg(shot.rotation) * .42,
          duration: 2600, ease: 'Sine.easeInOut',
        });
      }
      this.tweens.killTweensOf(lightLeak);
      lightLeak.setPosition(lineIndex % 2 === 0 ? -210 : 1490, 330).setAlpha(.025);
      this.tweens.add({
        targets: lightLeak, x: lineIndex % 2 === 0 ? 1490 : -210, alpha: { from: .015, to: .075 },
        duration: 1900, ease: 'Sine.easeInOut',
      });
      this.tweens.add({ targets: vignette, alpha: { from: .04, to: .14 }, duration: 720, yoyo: true, ease: 'Sine.easeInOut' });
    };

    const revealCurrent = (): void => {
      const full = currentLine();
      typingEvent?.remove(false);
      typingEvent = null;
      typedCount = full.length;
      lineText.setText(full);
      prompt.setAlpha(.66);
    };

    const typeLine = (): void => {
      const full = currentLine();
      const voice = voiceLines?.[lineIndex];
      const lineAtStart = lineIndex;
      autoAdvanceEvent?.remove(false);
      autoAdvanceEvent = null;
      lineText.setText('').setAlpha(1).setY(552);
      prompt.setAlpha(0);
      typedCount = 0;
      drift();
      if (reduced) revealCurrent();
      else {
        typingEvent = this.time.addEvent({
          delay: 17,
          repeat: Math.max(0, full.length - 1),
          callback: () => {
            typedCount += 1;
            lineText.setText(full.slice(0, typedCount));
            if (typedCount >= full.length) prompt.setAlpha(.66);
          },
        });
      }
      if (voice) {
        this.audio.playVoice(`${flag}-${lineIndex + 1}`, .64, () => {
          if (!this.cinematicActive || lineAtStart !== lineIndex) return;
          revealCurrent();
          autoAdvanceEvent = this.time.delayedCall(reduced ? 180 : 620, () => {
            if (!this.cinematicActive || lineAtStart !== lineIndex) return;
            advance();
          });
        });
      }
    };

    const detachAdvanceKeys = (): void => {
      keyboard?.off('keydown-SPACE', advance);
      keyboard?.off('keydown-ENTER', advance);
    };

    const cleanup = (): void => {
      this.audio.stopVoice();
      typingEvent?.remove(false);
      autoAdvanceEvent?.remove(false);
      autoAdvanceEvent = null;
      detachAdvanceKeys();
      capture.disableInteractive();
      const finish = (): void => {
        motifs.forEach((item) => { this.tweens.killTweensOf(item); item.destroy(); });
        if (sourceBackground) sourceBackground.setAlpha(1);
        filmFrame?.destroy();
        [shade, vignette, topBar, bottomBar, flicker, cut, lightLeak, kickerText, lineText, prompt, capture, ...scratches]
          .forEach((item) => item.destroy());
        this.cinematicActive = false;
        this.ui.setCinematicMode(false);
        if (!this.state.hiddenFlags.includes(seenFlag)) this.store.mutate((state) => { state.hiddenFlags.push(seenFlag); });
        this.resetCamera(240);
        onDone();
      };
      if (reduced) { finish(); return; }
      this.tweens.add({ targets: [shade, vignette, kickerText, lineText, prompt, flicker, lightLeak, ...scratches], alpha: 0, duration: 190 });
      this.tweens.add({ targets: topBar, y: -48, duration: 230, ease: 'Sine.easeIn' });
      this.tweens.add({ targets: bottomBar, y: 774, duration: 230, ease: 'Sine.easeIn', onComplete: finish });
    };

    const advance = (): void => {
      autoAdvanceEvent?.remove(false);
      autoAdvanceEvent = null;
      const full = currentLine();
      if (typedCount < full.length) { revealCurrent(); return; }
      this.audio.stopVoice();
      lineIndex += 1;
      if (lineIndex >= lines.length) { cleanup(); return; }
      if (reduced) { typeLine(); return; }
      this.tweens.add({ targets: cut, alpha: .42, duration: 75, yoyo: true, ease: 'Sine.easeInOut' });
      this.tweens.add({ targets: lineText, alpha: 0, y: 538, duration: 145, onComplete: typeLine });
    };

    capture.on('pointerdown', advance);
    keyboard?.on('keydown-SPACE', advance);
    keyboard?.on('keydown-ENTER', advance);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      detachAdvanceKeys();
      typingEvent?.remove(false);
      autoAdvanceEvent?.remove(false);
      this.audio.stopVoice();
      this.ui.setCinematicMode(false);
    });

    if (reduced) {
      shade.setAlpha(.18); vignette.setAlpha(.08); topBar.y = 48; bottomBar.y = 632; kickerText.setAlpha(1);
      typeLine();
      return;
    }
    this.tweens.add({ targets: shade, alpha: .18, duration: 260 });
    this.tweens.add({ targets: vignette, alpha: .08, duration: 520 });
    this.tweens.add({ targets: topBar, y: 48, duration: 340, ease: 'Sine.easeOut' });
    this.tweens.add({ targets: bottomBar, y: 632, duration: 340, ease: 'Sine.easeOut' });
    this.tweens.add({ targets: kickerText, alpha: 1, duration: 380, delay: 100 });
    this.tweens.add({ targets: flicker, alpha: { from: .002, to: .032 }, duration: 105, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    scratches.forEach((line, index) => this.time.delayedCall(180 + index * 130, () => line.setAlpha(.04)));
    this.time.delayedCall(260, typeLine);
  }

  protected speakWorldLine(voiceId: string, text: string, volume = .68): void {
    this.ui.setCaption(text);
    this.audio.playVoice(voiceId, volume);
  }

  protected speakWorldLineOnce(voiceId: string, text: string, volume = .68): void {
    this.ui.setCaption(text);
    const flag = `voice-once-v52:${this.scene.key}:${voiceId}`;
    if (this.state.hiddenFlags.includes(flag)) return;
    // Persist "heard once" only after the browser confirms actual playback. If autoplay is
    // blocked, the line remains eligible on the next click instead of becoming permanently silent.
    this.audio.playVoice(voiceId, volume, undefined, () => {
      if (this.state.hiddenFlags.includes(flag)) return;
      this.store.mutate((state) => { state.hiddenFlags.push(flag); }, false);
    });
  }

  protected addDialogueZone(
    x: number, y: number, width: number, height: number, voiceId: string, text: string,
    onSpeak?: () => void,
  ): Phaser.GameObjects.Zone {
    const zone = this.add.zone(x, y, width, height).setDepth(31).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', () => {
      onSpeak?.();
      this.speakWorldLineOnce(voiceId, text);
    });
    return zone;
  }

  protected addMouthEasterEgg(
    x: number, y: number, hitWidth: number, hitHeight: number, mouthWidth = 34, mouthHeight = 16,
    sound = 'breath',
  ): Phaser.GameObjects.Zone {
    const zone = this.add.zone(x, y, hitWidth, hitHeight).setDepth(24).setInteractive({ useHandCursor: true });
    let busy = false;
    zone.on('pointerdown', () => {
      if (busy) return;
      busy = true;
      this.audio.playSfx(sound, .16);
      const mouth = this.add.ellipse(x, y + hitHeight * .16, mouthWidth, Math.max(2, mouthHeight * .16), 0x1d1713, .88)
        .setStrokeStyle(1.2, 0x6b5541, .6).setDepth(25);
      const lower = this.add.ellipse(x, y + hitHeight * .16 + 2, mouthWidth * .86, 2, 0xb49b7a, .24).setDepth(26).setAlpha(0);
      if (this.state.settings.reducedMotion) {
        mouth.setDisplaySize(mouthWidth, mouthHeight); lower.setAlpha(.28);
        this.time.delayedCall(220, () => { mouth.destroy(); lower.destroy(); busy = false; });
        return;
      }
      mouth.setScale(.3, .16);
      this.tweens.add({ targets: mouth, scaleX: 1, scaleY: 1, duration: 150, ease: 'Back.easeOut', yoyo: true, hold: 210, onComplete: () => { mouth.destroy(); busy = false; } });
      this.tweens.add({ targets: lower, alpha: .32, y: lower.y + 4, duration: 145, yoyo: true, hold: 180, onComplete: () => lower.destroy() });
    });
    return zone;
  }

  protected addBlinkEasterEgg(
    x: number, y: number, hitWidth: number, hitHeight: number, eyeGap = 14, eyeWidth = 12, sound = 'paper',
  ): Phaser.GameObjects.Zone {
    const zone = this.add.zone(x, y, hitWidth, hitHeight).setDepth(24).setInteractive({ useHandCursor: true });
    let busy = false;
    zone.on('pointerdown', () => {
      if (busy) return;
      busy = true;
      this.audio.playSfx(sound, .09);
      const left = this.add.ellipse(x - eyeGap, y, eyeWidth, 3, 0x1a1714, .86).setDepth(25);
      const right = this.add.ellipse(x + eyeGap, y, eyeWidth, 3, 0x1a1714, .86).setDepth(25);
      if (this.state.settings.reducedMotion) {
        this.time.delayedCall(150, () => { left.destroy(); right.destroy(); busy = false; });
        return;
      }
      this.tweens.add({ targets: [left, right], scaleY: { from: .12, to: 1 }, duration: 90, yoyo: true, repeat: 1, hold: 70, onComplete: () => { left.destroy(); right.destroy(); busy = false; } });
    });
    return zone;
  }

  protected addPulseEasterEgg(
    x: number, y: number, hitWidth: number, hitHeight: number, color = 0xd7c39d, sound = 'wood',
  ): Phaser.GameObjects.Zone {
    const zone = this.add.zone(x, y, hitWidth, hitHeight).setDepth(23).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', () => {
      this.audio.playSfx(sound, .1);
      const ring = this.add.ellipse(x, y, Math.max(18, hitWidth * .18), Math.max(14, hitHeight * .16), color, .025)
        .setStrokeStyle(2, color, .42).setDepth(24);
      if (this.state.settings.reducedMotion) { this.time.delayedCall(120, () => ring.destroy()); return; }
      this.tweens.add({ targets: ring, scaleX: 2.5, scaleY: 2.2, alpha: 0, duration: 520, ease: 'Sine.easeOut', onComplete: () => ring.destroy() });
    });
    return zone;
  }

  protected addBreathingLight(
    x: number, y: number, width: number, height: number, color = 0xe3c17f, alpha = .07, depth = -1,
  ): Phaser.GameObjects.Ellipse {
    const glow = this.add.ellipse(x, y, width, height, color, alpha).setBlendMode(Phaser.BlendModes.ADD).setDepth(depth);
    if (!this.state.settings.reducedMotion) {
      this.tweens.add({ targets: glow, alpha: { from: alpha * .45, to: alpha }, scaleX: 1.05, scaleY: .96, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    return glow;
  }

  protected label(x: number, y: number, text: string, size = 18, align: 'left' | 'center' = 'center'): Phaser.GameObjects.Text {
    return this.add.text(x, y, text, {
      fontFamily: 'Georgia, "Noto Serif SC", serif',
      fontSize: `${size}px`,
      color: '#eadfca',
      backgroundColor: '#1c1b17cc',
      padding: { x: 9, y: 6 },
      align,
      wordWrap: { width: 420 },
    }).setOrigin(align === 'center' ? 0.5 : 0, 0.5).setDepth(20);
  }

  protected button(x: number, y: number, text: string, onClick: () => void, width = 150): Phaser.GameObjects.Text {
    const button = this.add.text(x, y, text, {
      fontFamily: 'Georgia, "Noto Serif SC", serif',
      fontSize: '17px',
      color: '#efe1c2',
      backgroundColor: '#332a20ee',
      padding: { x: 14, y: 10 },
      align: 'center',
      fixedWidth: width,
    }).setOrigin(0.5).setDepth(30).setInteractive({ useHandCursor: true });
    button.on('pointerover', () => button.setBackgroundColor('#554632ee'));
    button.on('pointerout', () => button.setBackgroundColor('#332a20ee'));
    button.on('pointerdown', onClick);
    return button;
  }

  protected addSymbolButton(x: number, y: number, symbol: string, onClick: () => void, size = 50): Phaser.GameObjects.Text {
    const control = this.add.text(x, y, symbol, {
      fontFamily: 'Georgia, serif',
      fontSize: `${Math.round(size * .56)}px`,
      color: '#efe3ca',
      backgroundColor: '#1c1b17b8',
      padding: { x: 9, y: 5 },
      align: 'center',
      fixedWidth: size,
    }).setOrigin(.5).setDepth(38).setAlpha(.58).setInteractive({ useHandCursor: true });
    control.on('pointerover', () => control.setAlpha(.96));
    control.on('pointerout', () => control.setAlpha(.58));
    control.on('pointerdown', onClick);
    return control;
  }

  protected addNavArrow(direction: 'back' | 'forward', onClick: () => void, y = 360): Phaser.GameObjects.Text {
    const x = direction === 'back' ? 34 : 1246;
    return this.addSymbolButton(x, y, direction === 'back' ? '‹' : '›', onClick, 44);
  }

  protected navigate(scene: SceneId): void {
    if (this.transitionPending) return;
    this.transitionPending = true;
    if (this.state.settings.reducedMotion) {
      eventBus.emit('navigate', { scene });
      return;
    }
    this.cameras.main.fadeOut(240, 10, 10, 8);
    this.time.delayedCall(255, () => eventBus.emit('navigate', { scene }));
  }

  protected moveContainer(
    object: Phaser.GameObjects.Container,
    x: number,
    y: number,
    duration = 210,
    onComplete?: () => void,
  ): void {
    this.tweens.killTweensOf(object);
    if (this.state.settings.reducedMotion) {
      object.setPosition(x, y);
      onComplete?.();
      return;
    }
    const tweenConfig: Phaser.Types.Tweens.TweenBuilderConfig = {
      targets: object,
      x,
      y,
      duration,
      ease: 'Cubic.easeOut',
    };
    if (onComplete) tweenConfig.onComplete = onComplete;
    this.tweens.add(tweenConfig);
  }

  protected settleContainer(object: Phaser.GameObjects.Container, x: number, y: number, duration = 240, onComplete?: () => void): void {
    this.tweens.killTweensOf(object);
    if (this.state.settings.reducedMotion) {
      object.setPosition(x, y).setScale(1);
      onComplete?.();
      return;
    }
    const config: Phaser.Types.Tweens.TweenBuilderConfig = {
      targets: object,
      x,
      y,
      scaleX: 1,
      scaleY: 1,
      angle: 0,
      duration,
      ease: 'Back.easeOut',
    };
    if (onComplete) config.onComplete = onComplete;
    this.tweens.add(config);
  }

  protected nudge(object: Phaser.GameObjects.Container, amount = 8): void {
    if (this.state.settings.reducedMotion) return;
    this.tweens.killTweensOf(object);
    this.tweens.add({ targets: object, x: object.x + amount, yoyo: true, repeat: 1, duration: 65, ease: 'Sine.easeInOut' });
  }

  protected markObservation(id: ObservationId): void {
    this.store.mutate((state) => {
      if (!state.observations.includes(id)) state.observations.push(id);
    });
    eventBus.emit('stateChanged', undefined);
  }

  protected completeMask(mask: MaskId, observation: ObservationId, extraResidue?: ResidueId): void {
    const residue = extraResidue ?? MASK_RESIDUES[mask];
    this.store.mutate((state) => {
      if (!state.completedMasks.includes(mask)) state.completedMasks.push(mask);
      if (!state.residues.includes(residue)) state.residues.push(residue);
      if (!state.observations.includes(observation)) state.observations.push(observation);
      const marker = `${mask}-${state.completedMasks.length}`;
      if (!state.shopChanges.includes(marker)) state.shopChanges.push(marker);
    });
    eventBus.emit('stateChanged', undefined);
  }

  protected pulse(object: Phaser.GameObjects.Container): void {
    if (this.state.settings.reducedMotion) return;
    this.tweens.add({ targets: object, scaleX: 1.07, scaleY: 1.07, yoyo: true, duration: 120, ease: 'Sine.easeInOut' });
  }
}
