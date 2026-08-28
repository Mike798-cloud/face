import Phaser from 'phaser';
import { BaseScene } from './BaseScene';
import { isFinaleUnlocked, isHiddenUnlocked, type MaskId } from '../../core/GameState';
import { CHAPTER_TWO_CINEMATIC } from '../../data/storyData';
import { WORLD_DIALOGUE } from '../../data/dialogueData';

type TraceIdForShop = 'trace-rubbing' | 'trace-thread';

export class ShopScene extends BaseScene {
  constructor() { super('shop'); }

  preload(): void {
    this.preloadImage('bg-shop', 'mask-shop.webp');
    this.preloadImage('bg-shop-clean', 'mask-shop-clean.webp');
    this.preloadImage('film-coast', 'coast-house.webp');
    this.preloadImage('shop-box', 'interaction/shop-box.png');
    this.preloadImage('shop-box-base', 'interaction/shop-box-base.png');
    this.preloadImage('shop-box-lid', 'interaction/shop-box-lid.png');
    this.preloadImage('shop-stool', 'interaction/shop-stool.png');
    this.preloadImage('brass-key', 'interaction/brass-key.png');
    this.preloadImage('trace-rubbing', 'interaction/trace-rubbing.webp');
    this.preloadImage('trace-thread', 'interaction/trace-thread.webp');
  }

  create(): void {
    this.ui.setScene('shop');
    const prologueActive = !this.state.prologue.opened;
    this.addBackground(prologueActive ? 'bg-shop-clean' : 'bg-shop');
    this.addAtmosphere('dust', 22);

    if (prologueActive) {
      if (!this.state.hiddenFlags.includes('opening-film-v46')) {
        this.audio.playAmbient('sea', .15);
        this.playOpeningFilm(() => {
          this.audio.playAmbient('shop', .21);
          this.createPrologue();
        });
      } else {
        this.audio.playAmbient('shop', .21);
        this.createPrologue();
      }
      return;
    }

    this.audio.playAmbient('shop', .22);
    this.createHub();
    if (this.state.water.completed && this.state.completedMasks.length === 0 && !this.state.hiddenFlags.includes(`${CHAPTER_TWO_CINEMATIC.flag}:seen`)) {
      this.store.mutate((state) => { state.hiddenFlags.push(`${CHAPTER_TWO_CINEMATIC.flag}:seen`); });
      this.ui.setCaption('墙上的旧订单像是同时轻轻转过身来。第二章从这里开始，但不再打断你继续走动。');
    }
    if (this.state.completedMasks.length >= 3 && !this.state.soren.completed && !this.state.hiddenFlags.includes('cine-soren-unlock:seen')) {
      this.store.mutate((state) => { state.hiddenFlags.push('cine-soren-unlock:seen'); });
      this.ui.setCaption('第三张面具归位后，后墙里回了一下声。砖缝里滑出一张写着“索伦”的旧名片。');
    }
    if (this.state.completedMasks.length >= 5 && this.state.soren.completed && !this.state.blank.completed && !this.state.hiddenFlags.includes('cine-blank-unlock:seen')) {
      this.store.mutate((state) => { state.hiddenFlags.push('cine-blank-unlock:seen'); });
      this.ui.setCaption('最后一张订单挂回墙上时，工作台多出一张没有署名的素白面具。');
    }
    if (isFinaleUnlocked(this.state) && this.state.soren.completed && this.state.blank.completed && !this.state.hiddenFlags.includes('cine-finale-unlock:seen')) {
      this.store.mutate((state) => { state.hiddenFlags.push('cine-finale-unlock:seen'); });
      this.ui.setCaption('七种残响回到铺子后，后墙里的机器终于重新咬合。');
    }
  }

  /**
   * A real moving opening sequence rather than a static illustration with text on top.
   * Rain, fog, birds, window light, a hard cut and three distinct camera compositions run
   * independently from the subtitles. Every spoken line is a packaged audio file.
   */
  private playOpeningFilm(onDone: () => void): void {
    this.ui.setCinematicMode(true);
    const reduced = this.state.settings.reducedMotion;
    const depth = 130;
    const coast = this.add.image(640, 360, 'film-coast').setDisplaySize(1390, 782).setDepth(depth).setAlpha(1);
    const shop = this.add.image(640, 360, 'bg-shop').setDisplaySize(1280, 720).setDepth(depth + 1).setAlpha(0);
    const shade = this.add.rectangle(640, 360, 1280, 720, 0x060706, .12).setDepth(depth + 5);
    const top = this.add.rectangle(640, 31, 1280, 62, 0x060706, .98).setDepth(depth + 10);
    const bottom = this.add.rectangle(640, 675, 1280, 90, 0x060706, .98).setDepth(depth + 10);
    const subtitle = this.add.text(640, 642, '', {
      fontFamily: 'Georgia, "Noto Serif SC", serif', fontSize: '20px', color: '#eee3ce',
      align: 'center', wordWrap: { width: 1030 }, lineSpacing: 7,
    }).setOrigin(.5).setDepth(depth + 11).setAlpha(0);
    const shutter = this.add.rectangle(640, 360, 1280, 720, 0x050605, 1).setDepth(depth + 14);
    const capture = this.add.zone(640, 360, 1280, 720).setDepth(depth + 15).setInteractive({ useHandCursor: true });
    const moving: Phaser.GameObjects.GameObject[] = [coast, shop, shade, top, bottom, subtitle, shutter, capture];

    const rain: Phaser.GameObjects.Rectangle[] = [];
    for (let i = 0; i < 86; i += 1) {
      const drop = this.add.rectangle(
        Phaser.Math.Between(-100, 1280), Phaser.Math.Between(-150, 760),
        Phaser.Math.FloatBetween(.8, 1.5), Phaser.Math.Between(25, 66),
        0xd9ddda, Phaser.Math.FloatBetween(.05, .16),
      ).setRotation(.18).setDepth(depth + 7);
      rain.push(drop); moving.push(drop);
      if (!reduced) this.tweens.add({
        targets: drop, x: drop.x + 165, y: 820, alpha: 0,
        duration: Phaser.Math.Between(720, 1250), delay: Phaser.Math.Between(0, 1500), repeat: -1,
        onRepeat: () => drop.setPosition(Phaser.Math.Between(-130, 1180), Phaser.Math.Between(-160, 30)).setAlpha(Phaser.Math.FloatBetween(.05, .16)),
      });
    }

    for (let i = 0; i < 9; i += 1) {
      const fog = this.add.ellipse(-180 + i * 195, 470 + (i % 3) * 42, 430 + (i % 2) * 100, 102, 0xd4d8d2, .035).setDepth(depth + 6);
      moving.push(fog);
      if (!reduced) this.tweens.add({ targets: fog, x: fog.x + 690, alpha: { from: .015, to: .08 }, duration: 6200 + i * 250, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }

    const makeBird = (x: number, y: number, scale: number, delay: number): void => {
      const bird = this.add.graphics().setDepth(depth + 8).setPosition(x, y).setAlpha(.66);
      bird.lineStyle(2.1 * scale, 0x141714, .72);
      bird.beginPath(); bird.moveTo(-18 * scale, 2); bird.lineTo(-8 * scale, -8 * scale); bird.lineTo(0, 1); bird.lineTo(8 * scale, -8 * scale); bird.lineTo(18 * scale, 2); bird.strokePath();
      moving.push(bird);
      if (!reduced) {
        this.tweens.add({ targets: bird, scaleY: { from: .32, to: 1.22 }, duration: 150 + Math.round(scale * 35), yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        this.tweens.add({ targets: bird, x: 1420, y: y - 110, duration: 5200 + Math.round((1 - scale) * 2500), delay, repeat: -1, repeatDelay: 1700, onRepeat: () => bird.setPosition(-100, Phaser.Math.Between(80, 210)) });
      }
    };
    makeBird(-90, 120, .95, 250); makeBird(-180, 188, .68, 1800); makeBird(-300, 94, .5, 3500);

    const windowGlow = this.add.rectangle(810, 280, 165, 160, 0xe6c77e, .015).setBlendMode(Phaser.BlendModes.ADD).setDepth(depth + 4);
    const lampGlow = this.add.ellipse(390, 395, 210, 150, 0xe2bf78, 0).setBlendMode(Phaser.BlendModes.ADD).setDepth(depth + 8);
    const mirrorGlint = this.add.rectangle(150, 330, 6, 370, 0xe0e8e5, 0).setAngle(13).setBlendMode(Phaser.BlendModes.ADD).setDepth(depth + 8);
    moving.push(windowGlow, lampGlow, mirrorGlint);
    if (!reduced) {
      this.tweens.add({ targets: windowGlow, alpha: { from: .01, to: .09 }, duration: 1250, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.tweens.add({ targets: shutter, alpha: 0, duration: 620, ease: 'Sine.easeOut' });
    } else shutter.setAlpha(0);

    const lines = [
      '第七码头的雨总从海上斜着来。它擦过钟楼的铜绿，也擦过一扇迟迟不肯熄灯的窗。',
      '屋里还留着刚被人碰过的温度：半杯茶，一件挂在门后的外衣，一把没有收回鞘里的小刀。师父不在。',
      '阿七在这里长大，学会从木纹里认年份，从刀口的声音里认力道。师父说，一张脸是世上最省事的地址。',
      '这夜里，地址还在，人却不见了。雨声贴着玻璃往下走，工作台上的旧木盒安静得像一封没有写收件人的信。',
    ] as const;
    const voices = ['opening-v46-1', 'opening-v46-2', 'opening-v46-3', 'opening-v46-4'] as const;

    let index = 0;
    let finished = false;
    let fallback: Phaser.Time.TimerEvent | null = null;
    const cutTo = (shot: number): void => {
      if (reduced) return;
      this.tweens.killTweensOf(coast); this.tweens.killTweensOf(shop);
      if (shot === 0) {
        coast.setAlpha(1).setPosition(640, 360).setScale(1.02); shop.setAlpha(0);
        this.tweens.add({ targets: coast, x: 700, y: 346, scaleX: 1.11, scaleY: 1.11, duration: 8500, ease: 'Sine.easeInOut' });
      } else {
        coast.setAlpha(0); shop.setAlpha(1);
        const shots = [
          { x: 642, y: 366, scale: 1.055 },
          { x: 780, y: 345, scale: 1.26 },
          { x: 510, y: 410, scale: 1.32 },
        ] as const;
        const target = shots[Math.min(shot - 1, shots.length - 1)]!;
        shop.setPosition(target.x + (shot % 2 ? -28 : 28), target.y + 8).setScale(target.scale * .94);
        this.tweens.add({ targets: shop, x: target.x, y: target.y, scaleX: target.scale, scaleY: target.scale, duration: 7600, ease: 'Sine.easeInOut' });
        this.tweens.add({ targets: lampGlow, alpha: shot === 3 ? .18 : .07, duration: 650, yoyo: shot === 3, repeat: shot === 3 ? 3 : 0, ease: 'Sine.easeInOut' });
        if (shot === 2) this.tweens.add({ targets: mirrorGlint, alpha: { from: 0, to: .17 }, x: 230, duration: 1200, yoyo: true, repeat: 1, ease: 'Sine.easeInOut' });
      }
    };

    const finish = (): void => {
      if (finished) return;
      finished = true;
      fallback?.remove(false); fallback = null;
      this.audio.stopVoice();
      capture.disableInteractive();
      this.store.mutate((state) => { if (!state.hiddenFlags.includes('opening-film-v46')) state.hiddenFlags.push('opening-film-v46'); });
      const done = (): void => {
        moving.forEach((obj) => { this.tweens.killTweensOf(obj); obj.destroy(); });
        this.ui.setCinematicMode(false);
        onDone();
      };
      if (reduced) { done(); return; }
      shutter.setAlpha(0);
      this.tweens.add({ targets: shutter, alpha: 1, duration: 300, onComplete: done });
    };

    const showLine = (): void => {
      if (finished) return;
      if (index >= lines.length) { finish(); return; }
      fallback?.remove(false); fallback = null;
      cutTo(index);
      subtitle.setText(lines[index]!).setAlpha(reduced ? 1 : 0).setY(650);
      if (!reduced) this.tweens.add({ targets: subtitle, alpha: 1, y: 642, duration: 360, ease: 'Sine.easeOut' });
      const voiceId = voices[index]!;
      const lineAtStart = index;
      this.audio.playVoice(voiceId, .68, () => {
        if (finished || lineAtStart !== index) return;
        this.time.delayedCall(reduced ? 120 : 620, () => {
          if (finished || lineAtStart !== index) return;
          subtitle.setAlpha(0); index += 1; showLine();
        });
      });
      // Defensive fallback for browsers that never dispatch ended after a media failure.
      fallback = this.time.delayedCall(14500, () => {
        if (finished || lineAtStart !== index) return;
        this.audio.stopVoice(); subtitle.setAlpha(0); index += 1; showLine();
      });
    };

    capture.on('pointerdown', () => {
      if (finished) return;
      this.audio.stopVoice();
      fallback?.remove(false); fallback = null;
      subtitle.setAlpha(0);
      index += 1;
      if (index >= lines.length) finish();
      else {
        if (!reduced) this.cameras.main.flash(55, 225, 218, 202, false);
        showLine();
      }
    });

    showLine();
  }

  /**
   * Reworked prologue again: the doll, the masks and the lamp now all matter.
   * The player hears an in-world line, restores the darkened workshop, reaches the
   * high latch with the stool, glimpses a three-mask sequence, then earns the key.
   */
  private createPrologue(): void {
    this.setObjective('在铺子里找出师父昨夜没有收尾的几件小事。');
    this.syncPrologueInventory();
    const boxWasOpened = this.state.hiddenFlags.includes('prologue-box-opened-v52');

    const box = this.add.image(640, 500, 'shop-box').setDisplaySize(150, 95).setDepth(10).setInteractive({ useHandCursor: true });
    const lock = this.add.rectangle(640, 505, 12, 9, 0x2b2119, .84).setStrokeStyle(1, 0xa58a62, .65).setDepth(12);

    const stoolHome = { x: 640, y: 610 };
    const stool = this.add.image(stoolHome.x, stoolHome.y, 'shop-stool').setDisplaySize(118, 154).setDepth(9).setInteractive({ useHandCursor: true });
    this.input.setDraggable(stool);
    const stoolShadow = this.add.ellipse(stool.x, 681, 92, 16, 0x17130f, .11).setDepth(7);
    stool.on('dragstart', () => { stool.setDepth(15); this.audio.playSfx('wood', .11); });
    stool.on('drag', (_pointer: Phaser.Input.Pointer, x: number, y: number) => {
      const nx = Phaser.Math.Clamp(x, 350, 930);
      const ny = Phaser.Math.Clamp(y, 555, 630);
      stool.setPosition(nx, ny);
      stoolShadow.setPosition(nx, ny + 71).setScale(1 + Math.abs(nx - stoolHome.x) / 1500, 1);
    });
    stool.on('dragend', () => {
      stool.setDepth(9);
      this.audio.playSfx('wood', .16);
      if (!this.state.settings.reducedMotion) this.tweens.add({ targets: stool, y: Phaser.Math.Clamp(stool.y + 2, 555, 630), duration: 90, yoyo: true, ease: 'Sine.easeOut' });
    });

    let lampOn = true;
    const lampGlow = this.add.ellipse(390, 400, 198, 136, 0xe8c77d, .10).setBlendMode(Phaser.BlendModes.ADD).setDepth(6);
    const lampBeam = this.add.triangle(430, 440, 0, 0, 238, 78, 54, 142, 0xe7cb8d, .06).setBlendMode(Phaser.BlendModes.ADD).setDepth(5);
    const roomShade = this.add.rectangle(640, 360, 1280, 720, 0x060707, 0).setDepth(4).setBlendMode(Phaser.BlendModes.MULTIPLY);
    const lampZone = this.add.zone(385, 385, 180, 170).setDepth(20).setInteractive({ useHandCursor: true });
    const lampSwitch = this.add.circle(350, 442, 7, 0x9b805b, .42).setStrokeStyle(1.2, 0x33281f, .6).setDepth(19);

    const puzzleMasks = [
      { id: 'a', x: 520, y: 205 },
      { id: 'b', x: 680, y: 205 },
      { id: 'c', x: 600, y: 312 },
    ] as const;

    let keySprite: Phaser.GameObjects.Image | null = null;
    const canRevealKey = (): boolean =>
      this.state.hiddenFlags.includes('prologue-doll-spoken')
      && this.state.hiddenFlags.includes('prologue-masks-settled')
      && !lampOn;
    const spawnKey = (): void => {
      if (!canRevealKey() || this.state.hiddenFlags.includes('prologue-key-found') || keySprite) return;
      keySprite = this.add.image(822, 171, 'brass-key').setDisplaySize(62, 26).setDepth(24).setAlpha(0).setInteractive({ useHandCursor: true });
      if (this.state.settings.reducedMotion) keySprite.setAlpha(1);
      else {
        keySprite.setY(156);
        this.tweens.add({ targets: keySprite, alpha: 1, y: 171, duration: 260, ease: 'Cubic.easeOut' });
        this.tweens.add({ targets: keySprite, angle: { from: -6, to: 5 }, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      }
      keySprite.on('pointerdown', () => {
        if (!keySprite) return;
        const reachable = Phaser.Math.Distance.Between(stool.x, stool.y, 820, 590) < 145;
        if (!reachable) {
          this.audio.playSfx('wood', .08);
          this.ui.setCaption('钥匙挂得太高。脚下那把矮凳正好能挪动。');
          return;
        }
        this.audio.playSfx('glass', .14);
        this.store.mutate((state) => {
          if (!state.hiddenFlags.includes('prologue-key-found')) state.hiddenFlags.push('prologue-key-found');
          state.prologue.eyes = true;
          state.prologue.nose = true;
        });
        this.syncPrologueInventory();
        keySprite.disableInteractive();
        this.tweens.killTweensOf(keySprite);
        if (this.state.settings.reducedMotion) { keySprite.destroy(); keySprite = null; return; }
        this.tweens.add({ targets: keySprite, x: 640, y: 692, scaleX: .58, scaleY: .58, alpha: 0, duration: 340, ease: 'Cubic.easeIn', onComplete: () => { keySprite?.destroy(); keySprite = null; } });
      });
    };

    const setLamp = (on: boolean): void => {
      lampOn = on;
      this.audio.playSfx('wood', .12);
      this.tweens.killTweensOf(lampSwitch);
      if (this.state.settings.reducedMotion) lampSwitch.setScale(on ? 1 : .82, on ? 1 : 1.18);
      else this.tweens.add({ targets: lampSwitch, scaleX: on ? 1 : .82, scaleY: on ? 1 : 1.18, duration: 120, ease: 'Sine.easeOut' });
      if (this.state.settings.reducedMotion) {
        lampGlow.setAlpha(on ? .10 : 0); lampBeam.setAlpha(on ? .06 : 0); roomShade.setAlpha(on ? 0 : .20);
      } else {
        this.tweens.add({ targets: lampGlow, alpha: on ? .10 : 0, duration: 150 });
        this.tweens.add({ targets: lampBeam, alpha: on ? .06 : 0, duration: 150 });
        this.tweens.add({ targets: roomShade, alpha: on ? 0 : .20, duration: 180 });
      }
      if (!on) {
        this.store.mutate((state) => { state.prologue.mouth = true; }, false);
        spawnKey();
      } else if (keySprite && !this.state.hiddenFlags.includes('prologue-key-found')) {
        this.tweens.killTweensOf(keySprite);
        keySprite.destroy(); keySprite = null;
      }
    };
    lampZone.on('pointerdown', () => setLamp(!lampOn));

    const doll = WORLD_DIALOGUE.shopDoll;
    const dollZone = this.addDialogueZone(875, 340, 175, 280, doll.voiceId, doll.zh, () => {
      const firstLook = !this.state.hiddenFlags.includes('prologue-doll-spoken');
      this.store.mutate((state) => {
        if (!state.hiddenFlags.includes('prologue-doll-spoken')) state.hiddenFlags.push('prologue-doll-spoken');
        state.prologue.ears = true;
      }, false);
      this.audio.playSfx('wood', .07);
      const eyeLeft = this.add.ellipse(865, 305, 6, 2, 0x171310, .72).setDepth(23);
      const eyeRight = this.add.ellipse(885, 305, 6, 2, 0x171310, .72).setDepth(23);
      if (this.state.settings.reducedMotion) this.time.delayedCall(180, () => { eyeLeft.destroy(); eyeRight.destroy(); });
      else this.tweens.add({ targets: [eyeLeft, eyeRight], x: '-=5', duration: 180, yoyo: true, hold: 240, onComplete: () => { eyeLeft.destroy(); eyeRight.destroy(); } });

      // The doll is not decoration: the first response visibly wakes the three masks that
      // form the workshop's unfinished sequence. The clue lives in the room, not in a UI hint.
      if (firstLook) {
        puzzleMasks.forEach((mask, index) => {
          this.time.delayedCall(this.state.settings.reducedMotion ? 0 : 180 + index * 150, () => this.animateWallMask(mask.x, mask.y));
        });
        this.ui.setCaption('木偶的眼珠偏向墙面。三张面具先后轻轻动了一下，随后又恢复安静。');
      }
      spawnKey();
    });
    dollZone.setDepth(22);
    const closed = new Set<string>(puzzleMasks.filter((mask) => this.state.hiddenFlags.includes(`prologue-mask-closed:${mask.id}`)).map((mask) => mask.id));
    const mouths = new Map<string, Phaser.GameObjects.Ellipse>();

    const settleMasksIfReady = (): void => {
      if (closed.size < puzzleMasks.length || this.state.hiddenFlags.includes('prologue-masks-settled')) return;
      this.store.mutate((state) => {
        state.hiddenFlags.push('prologue-masks-settled');
        state.prologue.brows = true;
      });
      this.audio.playSfx('breath', .18);
      this.ui.setCaption('第三张嘴合上以后，墙面终于安静。台灯的嗡鸣忽然显得格外响。');
      if (!this.state.settings.reducedMotion) this.cameras.main.flash(60, 225, 216, 194, false);
      spawnKey();
    };

    puzzleMasks.forEach((mask) => {
      if (!closed.has(mask.id)) {
        const mouth = this.add.ellipse(mask.x, mask.y + 18, 30, 12, 0x171310, .88).setStrokeStyle(1, 0x6e5946, .42).setDepth(26);
        mouths.set(mask.id, mouth);
        if (!this.state.settings.reducedMotion) this.tweens.add({ targets: mouth, scaleY: { from: .72, to: 1.12 }, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      }
      const zone = this.add.zone(mask.x, mask.y, 62, 86).setDepth(27).setInteractive({ useHandCursor: true });
      zone.on('pointerdown', () => {
        if (closed.has(mask.id)) {
          this.animateWallMask(mask.x, mask.y);
          return;
        }
        closed.add(mask.id);
        this.store.mutate((state) => { state.hiddenFlags.push(`prologue-mask-closed:${mask.id}`); }, false);
        this.audio.playSfx('breath', .14);
        const mouth = mouths.get(mask.id);
        if (mouth) {
          this.tweens.killTweensOf(mouth);
          if (this.state.settings.reducedMotion) mouth.destroy();
          else this.tweens.add({ targets: mouth, scaleY: .08, alpha: .25, duration: 160, ease: 'Sine.easeIn', onComplete: () => mouth.destroy() });
          mouths.delete(mask.id);
        }
        const seam = this.add.rectangle(mask.x, mask.y + 18, 25, 2, 0x2a211a, .62).setDepth(25);
        if (!this.state.settings.reducedMotion) this.tweens.add({ targets: seam, alpha: { from: .25, to: .72 }, duration: 220 });
        settleMasksIfReady();
      });
    });

    const otherMasks = [[440, 205], [600, 205], [440, 312], [520, 312], [680, 312]] as const;
    otherMasks.forEach(([x, y]) => {
      const zone = this.add.zone(x, y, 58, 82).setDepth(20).setInteractive({ useHandCursor: true });
      zone.on('pointerdown', () => this.animateWallMask(x, y));
    });
    settleMasksIfReady();
    if (this.state.hiddenFlags.includes('prologue-masks-settled') && !lampOn) spawnKey();

    if (boxWasOpened) {
      box.disableInteractive();
      this.renderOpenedBox(box, lock, false);
    } else {
      box.on('pointerdown', () => {
        if (this.state.prologue.opened) return;
        if (this.ui.getSelectedSceneItem() !== 'brass-key') {
          this.audio.playSfx('knock', .18);
          this.ui.setCaption('盒盖被锁舌咬得很紧。锁孔边缘有一圈新鲜的黄铜擦痕。');
          if (!this.state.settings.reducedMotion) this.tweens.add({ targets: [box, lock], x: '+=3', duration: 45, yoyo: true, repeat: 2 });
          return;
        }
        this.ui.consumeSceneItem('brass-key');
        const inserted = this.add.image(640, 508, 'brass-key').setDisplaySize(54, 23).setDepth(24);
        this.audio.playSfx('wood', .2);
        const unlock = (): void => {
          this.store.mutate((state) => { if (!state.hiddenFlags.includes('prologue-key-used')) state.hiddenFlags.push('prologue-key-used'); });
          lock.setFillStyle(0xa68b63, .45);
          this.audio.playSfx('knock-double', .28);
          if (this.state.settings.reducedMotion) { inserted.destroy(); this.openBox(box, lock); return; }
          this.tweens.add({ targets: inserted, angle: 90, duration: 280, ease: 'Sine.easeInOut', onComplete: () => {
            this.tweens.add({ targets: inserted, alpha: 0, duration: 150, onComplete: () => { inserted.destroy(); this.openBox(box, lock); } });
          } });
        };
        if (this.state.settings.reducedMotion) unlock();
        else this.tweens.add({ targets: inserted, x: 641, y: 510, scaleX: .74, scaleY: .74, duration: 180, ease: 'Cubic.easeIn', onComplete: unlock });
      });
    }

    this.addBlinkEasterEgg(150, 328, 130, 300, 22, 13, 'glass');
  }

  private animateWallMask(x: number, y: number): void {
    this.audio.playSfx('breath', .12);
    const mouth = this.add.ellipse(x, y + 17, 26, 2, 0x171310, .88).setDepth(28).setStrokeStyle(1, 0x6e5946, .42);
    const eyes = [
      this.add.ellipse(x - 10, y - 10, 9, 2, 0x171310, .78).setDepth(28),
      this.add.ellipse(x + 10, y - 10, 9, 2, 0x171310, .78).setDepth(28),
    ];
    if (this.state.settings.reducedMotion) {
      mouth.setDisplaySize(26, 12);
      this.time.delayedCall(180, () => [mouth, ...eyes].forEach((item) => item.destroy()));
      return;
    }
    mouth.setScale(.22, .18);
    this.tweens.add({ targets: mouth, scaleX: 1, scaleY: 5.2, duration: 135, yoyo: true, hold: 210, ease: 'Back.easeOut', onComplete: () => mouth.destroy() });
    this.tweens.add({ targets: eyes, scaleY: .15, duration: 80, yoyo: true, repeat: 1, hold: 80, onComplete: () => eyes.forEach((item) => item.destroy()) });
  }

  private installShopMaskEggs(hub: boolean): void {
    const decorative = hub
      ? [[520, 312], [600, 312], [680, 312]] as const
      : [[440, 205], [520, 205], [600, 205], [680, 205], [440, 312], [520, 312], [600, 312], [680, 312]] as const;
    decorative.forEach(([x, y]) => {
      const zone = this.add.zone(x, y, 58, 82).setDepth(20).setInteractive({ useHandCursor: true });
      zone.on('pointerdown', () => this.animateWallMask(x, y));
    });
  }

  private openBox(box: Phaser.GameObjects.Image, lock: Phaser.GameObjects.Rectangle): void {
    if (this.state.prologue.opened || this.state.hiddenFlags.includes('prologue-box-opened-v52')) return;
    this.store.mutate((state) => {
      if (!state.hiddenFlags.includes('prologue-box-opened-v52')) state.hiddenFlags.push('prologue-box-opened-v52');
    });
    this.audio.playSfx('wood', .65);
    box.disableInteractive();
    this.renderOpenedBox(box, lock, true);
  }

  /**
   * Render a real hinged lid and physical loot. The front of the case stays in place while
   * the lid rises from its rear edge; the two traces are collected only when clicked.
   */
  private renderOpenedBox(box: Phaser.GameObjects.Image, lock: Phaser.GameObjects.Rectangle, animate: boolean): void {
    lock.setVisible(false);
    box.setTexture('shop-box-base').setDisplaySize(150, 64).setPosition(640, 516).setDepth(12);

    const cavity = this.add.rectangle(640, 491, 136, 42, 0x17120e, .94)
      .setStrokeStyle(1.4, 0x8f7452, .48).setDepth(9);
    const lid = this.add.image(640, 489, 'shop-box-lid')
      .setName('prologue-box-lid')
      .setDisplaySize(150, 20)
      .setOrigin(.5, 1)
      .setDepth(10);
    const hinge = this.add.rectangle(640, 490, 116, 3, 0x8d7352, .72).setDepth(13);
    const lidScaleX = lid.scaleX;
    const lidBaseScaleY = lid.scaleY;
    const targetLidScaleY = lidBaseScaleY * 3.15;

    if (!animate || this.state.settings.reducedMotion) {
      lid.setScale(lidScaleX, targetLidScaleY);
      cavity.setAlpha(.94);
    } else {
      cavity.setAlpha(0);
      lid.setScale(lidScaleX, lidBaseScaleY * .22);
      this.tweens.add({ targets: lid, scaleY: targetLidScaleY, duration: 360, ease: 'Back.easeOut' });
      this.tweens.add({ targets: cavity, alpha: .94, duration: 180, delay: 130 });
      this.tweens.add({ targets: hinge, scaleX: { from: .84, to: 1 }, duration: 220, ease: 'Sine.easeOut' });
    }

    const remaining: TraceIdForShop[] = [];
    if (!this.state.hiddenFlags.includes('trace-rubbing-found')) remaining.push('trace-rubbing');
    if (!this.state.hiddenFlags.includes('trace-thread-found')) remaining.push('trace-thread');

    const spawnLoot = (id: TraceIdForShop, x: number, angle: number): void => {
      const image = this.add.image(x, 493, id)
        .setName(`prologue-loot:${id}`)
        .setDisplaySize(id === 'trace-rubbing' ? 54 : 50, id === 'trace-rubbing' ? 40 : 38)
        .setAngle(angle)
        .setDepth(15)
        .setAlpha(animate && !this.state.settings.reducedMotion ? 0 : .96)
        .setInteractive({ useHandCursor: true });
      const targetScaleX = image.scaleX;
      const targetScaleY = image.scaleY;
      if (animate && !this.state.settings.reducedMotion) {
        image.setY(500).setScale(targetScaleX * .84, targetScaleY * .84);
        this.tweens.add({ targets: image, alpha: .96, y: 493, scaleX: targetScaleX, scaleY: targetScaleY, duration: 250, delay: 250, ease: 'Back.easeOut' });
      }
      image.on('pointerdown', () => this.pickupBoxTrace(id, image));
    };

    if (remaining.includes('trace-rubbing')) spawnLoot('trace-rubbing', 615, -6);
    if (remaining.includes('trace-thread')) spawnLoot('trace-thread', 665, 8);

    this.time.delayedCall(animate && !this.state.settings.reducedMotion ? 540 : 80, () => {
      if (remaining.length === 2) this.ui.setCaption('盒盖向上翻开。盒底压着一张旧拓片和一团磨亮的旧线，两样都可以拿起。');
      else if (remaining.length === 1) this.ui.setCaption('木盒还敞着，盒底剩下的那件东西仍可以拿起。');
      else this.finishPrologueLoot();
    });
  }

  private pickupBoxTrace(id: TraceIdForShop, image: Phaser.GameObjects.Image): void {
    const flag = `${id}-found`;
    if (this.state.hiddenFlags.includes(flag)) return;
    image.disableInteractive();
    this.store.mutate((state) => {
      if (!state.hiddenFlags.includes(flag)) state.hiddenFlags.push(flag);
    });
    this.syncPrologueInventory();
    this.audio.playSfx(id === 'trace-thread' ? 'stitch' : 'paper', .32);

    const complete = (): void => {
      image.destroy();
      const bothFound = this.state.hiddenFlags.includes('trace-rubbing-found')
        && this.state.hiddenFlags.includes('trace-thread-found');
      if (bothFound) this.finishPrologueLoot();
      else this.ui.setCaption(id === 'trace-rubbing' ? '旧拓片收进了物品栏。盒底还留着一团磨旧的线。' : '旧线收进了物品栏。盒底还压着一张薄拓片。');
    };
    if (this.state.settings.reducedMotion) { complete(); return; }
    this.tweens.add({
      targets: image,
      x: 640, y: 692, scaleX: image.scaleX * .48, scaleY: image.scaleY * .48, alpha: 0,
      duration: 330, ease: 'Cubic.easeIn', onComplete: complete,
    });
  }

  private syncPrologueInventory(): void {
    const items: Array<{ id: string; label: string; icon: string }> = [];
    if (this.state.hiddenFlags.includes('prologue-key-found') && !this.state.hiddenFlags.includes('prologue-key-used')) {
      items.push({ id: 'brass-key', label: '黄铜钥匙', icon: 'assets/images/interaction/brass-key.png' });
    }
    if (this.state.hiddenFlags.includes('trace-rubbing-found')) {
      items.push({ id: 'trace-rubbing', label: '旧拓片', icon: 'assets/images/interaction/trace-rubbing.webp' });
    }
    if (this.state.hiddenFlags.includes('trace-thread-found')) {
      items.push({ id: 'trace-thread', label: '磨旧线团', icon: 'assets/images/interaction/trace-thread.webp' });
    }
    this.ui.setSceneItems(items);
  }

  private finishPrologueLoot(): void {
    if (!this.state.hiddenFlags.includes('trace-rubbing-found') || !this.state.hiddenFlags.includes('trace-thread-found')) return;
    if (!this.state.prologue.opened) {
      this.store.mutate((state) => {
        state.prologue.opened = true;
        state.prologue.eyes = true;
        state.prologue.mouth = true;
        state.prologue.ears = true;
        state.prologue.nose = true;
        state.prologue.brows = true;
        state.started = true;
        state.currentScene = 'secret';
        if (!state.observations.includes('box-relations')) state.observations.push('box-relations');
      });
    }
    this.ui.setCaption('两样旧物都拿在手里。右侧后室门仍虚掩着，工作台像在等它们回到原来的位置。');
    if (!this.children.getByName('prologue-forward')) {
      const arrow = this.addNavArrow('forward', () => this.navigate('secret'));
      arrow.setName('prologue-forward');
    }
  }

  private createHub(): void {
    const completed = new Set(this.state.completedMasks);
    const masks: Array<{ id: MaskId; x: number; y: number }> = [
      { id: 'mayor', x: 440, y: 205 },
      { id: 'butcher', x: 520, y: 205 },
      { id: 'elaine', x: 600, y: 205 },
      { id: 'milo', x: 680, y: 205 },
      { id: 'postman', x: 440, y: 312 },
    ];
    masks.forEach(({ id, x, y }) => {
      const zone = this.add.zone(x, y, 70, 98).setDepth(22).setInteractive({ useHandCursor: true });
      zone.on('pointerdown', () => {
        this.animateWallMask(x, y);
        if (completed.has(id)) return;
        this.focusCamera(x, y, 1.12, 180);
        this.time.delayedCall(this.state.settings.reducedMotion ? 0 : 280, () => this.navigate(id));
      });
    });
    this.installShopMaskEggs(true);
    this.addBlinkEasterEgg(150, 328, 130, 300, 22, 13, 'glass');

    if (!this.state.craft.completed) {
      this.add.zone(1150, 370, 170, 420).setDepth(12).setInteractive({ useHandCursor: true }).on('pointerdown', () => this.navigate('secret'));
    } else if (!this.state.water.completed) {
      this.add.zone(145, 360, 210, 500).setDepth(12).setInteractive({ useHandCursor: true }).on('pointerdown', () => this.navigate('water'));
    }
    if (isHiddenUnlocked(this.state) && !this.state.soren.completed) {
      this.add.zone(1150, 370, 170, 420).setDepth(13).setInteractive({ useHandCursor: true }).on('pointerdown', () => this.navigate('soren'));
    }
    if (this.state.completedMasks.length >= 5 && this.state.soren.completed && !this.state.blank.completed) {
      this.add.zone(690, 430, 105, 140).setDepth(13).setInteractive({ useHandCursor: true }).on('pointerdown', () => this.navigate('blank'));
    }
    if (isFinaleUnlocked(this.state) && this.state.soren.completed && this.state.blank.completed) {
      this.add.zone(1150, 370, 170, 420).setDepth(14).setInteractive({ useHandCursor: true }).on('pointerdown', () => this.navigate('finale'));
    }
    this.renderShopChanges();
  }

  private renderShopChanges(): void {
    const count = this.state.completedMasks.length;
    if (count >= 1) this.addBreathingLight(385, 386, 135, 90, 0xe2bd77, .055, 4);
    if (count >= 2) this.addPulseEasterEgg(713, 454, 72, 70, 0xc8ad83, 'wood');
    if (count >= 3) this.addBlinkEasterEgg(876, 312, 110, 175, 11, 9, 'breath');
    if (count >= 4) this.addPulseEasterEgg(1150, 370, 150, 390, 0x9b8c72, 'wood');
    if (count >= 5 && !this.state.observations.includes('shop-memory')) this.markObservation('shop-memory');
  }
}
