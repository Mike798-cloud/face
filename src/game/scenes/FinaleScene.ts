import Phaser from 'phaser';
import { BaseScene } from './BaseScene';
import type { FinaleStationId, ResidueId } from '../../core/GameState';
import { FINALE_PAIRS, finalePairCorrect } from '../puzzles/logic';
import { RESIDUE_LABELS } from '../../data/gameData';
import { SCENE_INTROS } from '../../data/storyData';

interface TokenRecord { id: ResidueId; obj: Phaser.GameObjects.Container; home: { x: number; y: number }; }
interface StationSpec { id: FinaleStationId; x: number; y: number; label: string; }

const STATIONS: StationSpec[] = [
  { id: 'mirror', x: 250, y: 410, label: '复写镜' },
  { id: 'rhythm', x: 640, y: 410, label: '节律槽' },
  { id: 'warmth', x: 1030, y: 410, label: '温声台' },
];

export class FinaleScene extends BaseScene {
  private tokens: TokenRecord[] = [];
  private blankToken: TokenRecord | null = null;
  private resolvingWrongPair = false;

  constructor() { super('finale'); }
  preload(): void { this.preloadImage('bg-finale', 'finale.webp'); }

  create(): void {
    this.ui.setScene('finale');
    this.audio.playAmbient('shop', .11);
    this.addBackground('bg-finale');
    this.addAtmosphere('dust', 10);
    this.installFinaleLife();
    const intro = SCENE_INTROS.finale!;
    this.setObjective(intro.objective);
    if (this.state.finale.completed) { this.addNavArrow('forward', () => this.navigate('ending')); return; }

    this.normalizeAssignments();
    STATIONS.forEach((station) => this.drawStation(station));
    this.createResidueTokens();
    this.restoreStationState();

    if (Object.values(this.state.finale.stations).every((item) => item.completed) || this.state.finale.motherShown) this.showMotherState();
    if (!this.state.hiddenFlags.includes(`${intro.flag}:seen`)) {
      this.store.mutate((state) => { state.hiddenFlags.push(`${intro.flag}:seen`); });
      this.ui.setCaption('三台机器都留着成对的槽位。此前得到的残响第一次不再只是收藏物，而像是三组等待互相验证的材料。');
    }
  }


  private installFinaleLife(): void {
    const machineSpecs = [
      { x: 250, y: 420, sound: 'clock' },
      { x: 640, y: 405, sound: 'glass' },
      { x: 1030, y: 420, sound: 'wood' },
    ] as const;
    machineSpecs.forEach((spec, index) => {
      const zone = this.add.zone(spec.x, spec.y, 250, 330).setDepth(4).setInteractive({ useHandCursor: true });
      zone.on('pointerdown', () => {
        this.audio.playSfx(spec.sound, .10);
        const ring = this.add.ellipse(spec.x, spec.y + 10, 120, 120, 0xc7b58f, .001).setStrokeStyle(2, 0xc7b58f, .4).setDepth(9).setScale(.65);
        if (this.state.settings.reducedMotion) { this.time.delayedCall(140, () => ring.destroy()); return; }
        this.tweens.add({ targets: ring, scaleX: 1.55, scaleY: 1.55, alpha: 0, duration: 620 + index * 80, ease: 'Sine.easeOut', onComplete: () => ring.destroy() });
      });
    });
    const voidZone = this.add.zone(640, 340, 150, 235).setDepth(4).setInteractive({ useHandCursor: true });
    voidZone.on('pointerdown', () => {
      this.audio.playSfx('breath', .08);
      const dark = this.add.rectangle(640, 355, 110, 185, 0x060706, .16).setDepth(8);
      if (this.state.settings.reducedMotion) { this.time.delayedCall(150, () => dark.destroy()); return; }
      this.tweens.add({ targets: dark, scaleX: .82, scaleY: 1.06, alpha: .02, duration: 520, yoyo: true, ease: 'Sine.easeInOut', onComplete: () => dark.destroy() });
    });
  }

  private normalizeAssignments(): void {
    const seen = new Set<ResidueId>();
    this.store.mutate((s) => {
      (Object.keys(s.finale.stations) as FinaleStationId[]).forEach((id) => {
        const station = s.finale.stations[id];
        if (station.completed) {
          station.pair = [...FINALE_PAIRS[id]];
          station.pair.forEach((residue) => seen.add(residue));
          return;
        }
        station.pair = station.pair.filter((residue) => {
          if (residue === 'blank' || seen.has(residue)) return false;
          seen.add(residue);
          return true;
        }).slice(0, 2);
        if (station.pair.length === 2 && !finalePairCorrect(id, station.pair)) station.pair = [];
      });
    }, false);
  }

  private drawStation(station: StationSpec): void {
    // The machines now advertise their two expected kinds of evidence through face-part silhouettes.
    this.add.zone(station.x, station.y, 270, 360).setDepth(3);
    const sockets = [-38, 38].map((dx) => this.add.circle(station.x + dx, station.y + 112, 25, 0x10110f, .24).setStrokeStyle(2, 0xc1af8f, .34).setDepth(5));
    const icon = this.add.graphics().setDepth(6).setAlpha(.56);
    icon.lineStyle(2, 0xc9b794, .75);
    if (station.id === 'mirror') {
      icon.strokeEllipse(station.x - 38, station.y + 112, 24, 12);
      icon.beginPath(); icon.moveTo(station.x + 38, station.y + 97); icon.lineTo(station.x + 30, station.y + 120); icon.lineTo(station.x + 46, station.y + 120); icon.strokePath();
    } else if (station.id === 'rhythm') {
      icon.beginPath(); icon.arc(station.x - 38, station.y + 112, 11, Phaser.Math.DegToRad(-70), Phaser.Math.DegToRad(105)); icon.strokePath();
      icon.beginPath(); icon.moveTo(station.x + 25, station.y + 115); icon.lineTo(station.x + 38, station.y + 103); icon.lineTo(station.x + 51, station.y + 115); icon.strokePath();
    } else {
      icon.lineBetween(station.x - 50, station.y + 112, station.x - 26, station.y + 112);
      icon.strokeCircle(station.x + 38, station.y + 112, 10);
    }
    if (!this.state.settings.reducedMotion) this.tweens.add({ targets: sockets, alpha: { from: .16, to: .34 }, duration: 1900, yoyo: true, repeat: -1 });
  }

  private createResidueTokens(): void {
    const ids = this.state.residues.filter((id) => id !== 'blank');
    ids.forEach((id, index) => {
      const x = 160 + index * 160;
      const y = 628;
      const token = this.makeToken(id, x, y);
      this.tokens.push({ id, obj: token, home: { x, y } });
      token.on('dragstart', () => token.setDepth(18).setScale(1.035));
      token.on('dragend', () => {
        token.setDepth(12).setScale(1);
        this.dropToken(id, token);
      });
    });
  }

  private makeToken(id: ResidueId, x: number, y: number): Phaser.GameObjects.Container {
    const token = this.add.container(x, y).setDepth(12);
    const short: Record<ResidueId, string> = { discern: '辨', speech: '言', hear: '听', see: '见', act: '行', warm: '温', blank: '空' };
    const body = this.add.circle(0, 0, 34, id === 'blank' ? 0xbccbc4 : 0x9e8d6e, id === 'blank' ? .28 : .88).setStrokeStyle(2.5, 0x332a20);
    const text = this.add.text(0, 0, short[id], {
      fontFamily: 'Georgia, "Noto Serif SC", serif', fontSize: '18px', color: id === 'blank' ? '#e4eee8' : '#2e2821', align: 'center',
    }).setOrigin(.5);
    token.add([body, text]);
    token.setSize(76, 76).setInteractive({ useHandCursor: true });
    this.input.setDraggable(token);
    token.on('pointerdown', () => this.ui.setCaption(RESIDUE_LABELS[id]));
    token.on('drag', (_p: Phaser.Input.Pointer, dx: number, dy: number) => token.setPosition(dx, dy));
    return token;
  }

  private dropToken(id: ResidueId, token: Phaser.GameObjects.Container): void {
    const record = this.tokens.find((item) => item.obj === token);
    if (!record) return;
    if (this.resolvingWrongPair) { this.moveContainer(token, record.home.x, record.home.y); return; }

    const nearest = STATIONS
      .map((station) => ({ station, d: Phaser.Math.Distance.Between(token.x, token.y, station.x, station.y) }))
      .sort((a, b) => a.d - b.d)[0];
    if (!nearest || nearest.d > 165) {
      this.removeFromIncompleteStations(id);
      this.moveContainer(token, record.home.x, record.home.y);
      return;
    }

    const stationState = this.state.finale.stations[nearest.station.id];
    if (stationState.completed) {
      this.ui.setCaption('这座台已经稳定，不再接受新的残响。');
      this.moveContainer(token, record.home.x, record.home.y);
      return;
    }

    this.removeFromIncompleteStations(id, nearest.station.id);
    const current = [...this.state.finale.stations[nearest.station.id].pair];
    if (current.length >= 2 && !current.includes(id)) {
      this.ui.setCaption('机器已经咬住两种残响，第三种被原样推开。');
      this.moveContainer(token, record.home.x, record.home.y);
      return;
    }
    if (!current.includes(id)) current.push(id);
    const nextPair = current.slice(0, 2);
    this.store.mutate((s) => { s.finale.stations[nearest.station.id].pair = [...nextPair]; }, false);
    this.syncStationPairVisual(nearest.station.id);

    if (nextPair.length < 2) return;
    if (!finalePairCorrect(nearest.station.id, nextPair)) {
      this.resolvingWrongPair = true;
      nextPair.forEach((rid) => this.tokens.find((candidate) => candidate.id === rid)?.obj.disableInteractive());
      this.partialReaction(nearest.station.id, nextPair);
      this.time.delayedCall(520, () => {
        nextPair.forEach((rid) => {
          const item = this.tokens.find((candidate) => candidate.id === rid);
          if (!item) return;
          item.obj.setInteractive({ useHandCursor: true });
          this.input.setDraggable(item.obj);
          this.moveContainer(item.obj, item.home.x, item.home.y, 180);
        });
        this.store.mutate((s) => { s.finale.stations[nearest.station.id].pair = []; s.mistakes += 1; }, false);
        this.resolvingWrongPair = false;
      });
      return;
    }

    nextPair.forEach((rid) => this.tokens.find((candidate) => candidate.id === rid)?.obj.disableInteractive());
    this.activateStation(nearest.station.id);
  }

  private removeFromIncompleteStations(id: ResidueId, except?: FinaleStationId): void {
    (Object.keys(this.state.finale.stations) as FinaleStationId[]).forEach((stationId) => {
      if (stationId === except || this.state.finale.stations[stationId].completed) return;
      const pair = this.state.finale.stations[stationId].pair;
      if (!pair.includes(id)) return;
      this.store.mutate((s) => { s.finale.stations[stationId].pair = s.finale.stations[stationId].pair.filter((residue) => residue !== id); }, false);
      this.syncStationPairVisual(stationId);
    });
  }

  private syncStationPairVisual(stationId: FinaleStationId): void {
    const station = STATIONS.find((candidate) => candidate.id === stationId);
    if (!station) return;
    const pair = this.state.finale.stations[stationId].pair;
    pair.forEach((rid, index) => {
      const token = this.tokens.find((candidate) => candidate.id === rid);
      if (token) this.moveContainer(token.obj, station.x + (index === 0 ? -48 : 48), station.y + 112, 135);
    });
  }

  private partialReaction(station: FinaleStationId, pair: readonly ResidueId[]): void {
    const label = pair.map((id) => RESIDUE_LABELS[id].split(' · ')[0]).join(' + ');
    const text: Record<FinaleStationId, string> = {
      mirror: `${label}只让镜中轮廓出现一层，第二层墨迹仍被盖住。`,
      rhythm: `${label}产生了节奏，但每到第七拍就重新起头。`,
      warmth: `${label}留下形状，却没有距离与体温。`,
    };
    this.ui.setCaption(text[station]);
    this.audio.playSfx('glass', .22);
  }

  private activateStation(station: FinaleStationId): void {
    if (this.children.getByName(`station-action-${station}`)) return;
    if (station === 'mirror') this.activateMirror();
    if (station === 'rhythm') this.activateRhythm();
    if (station === 'warmth') this.activateWarmth();
  }

  private activateMirror(): void {
    this.ui.setCaption('左侧玻璃罩里浮出两层几乎重合的轮廓。窄镜片在表盘旁轻轻颤了一下。');
    const rail = this.add.rectangle(250, 490, 132, 8, 0xc5b492, .22).setDepth(8).setName('station-action-mirror');
    const lens = this.add.ellipse(205, 490, 32, 46, 0xd2ded7, .34).setStrokeStyle(2, 0xe7dbc5, .62).setDepth(9).setInteractive({ useHandCursor: true });
    this.input.setDraggable(lens);
    lens.on('dragstart', () => { lens.setScale(1.08); this.focusCamera(250, 420, 1.055, 140); });
    lens.on('drag', (_p: Phaser.Input.Pointer, x: number) => { lens.x = Phaser.Math.Clamp(x, 195, 305); });
    lens.on('dragend', () => {
      lens.setScale(1); this.resetCamera(150);
      if (lens.x > 292) this.completeStation('mirror', rail, lens);
      else if (this.state.settings.reducedMotion) lens.x = 205;
      else this.tweens.add({ targets: lens, x: 205, duration: 180, ease: 'Back.easeOut' });
    });
  }

  private activateRhythm(): void {
    this.ui.setCaption('中间的槽位开始重复同一段六拍。第六拍落下后，齿轮仍不肯停。');
    const wheel = this.add.circle(640, 430, 48, 0x5e5140).setStrokeStyle(4, 0xb6a17d).setDepth(8).setInteractive({ useHandCursor: true }).setName('station-action-rhythm');
    const indicator = this.add.graphics().setDepth(9);
    let count = Phaser.Math.Clamp(this.state.finale.stations.rhythm.phase, 0, 6);
    let reverseEnabled = false;
    const renderBeats = (): void => {
      indicator.clear();
      for (let i = 0; i < 6; i += 1) {
        const angle = Phaser.Math.DegToRad(-150 + i * 60);
        const x = 640 + Math.cos(angle) * 27;
        const y = 430 + Math.sin(angle) * 27;
        indicator.fillStyle(i < count ? 0xd9c69f : 0x2c261f, i < count ? .82 : .5);
        indicator.fillCircle(x, y, i < count ? 3.2 : 2.5);
      }
    };
    renderBeats();

    const enableReverse = (): void => {
      if (reverseEnabled) return;
      reverseEnabled = true;
      this.input.setDraggable(wheel);
      if (!this.state.settings.reducedMotion) this.tweens.add({ targets: wheel, x: 632, duration: 170, yoyo: true, repeat: 1, ease: 'Sine.easeInOut' });
      let startX = wheel.x;
      wheel.on('dragstart', () => { startX = wheel.x; wheel.setScale(1.04); });
      wheel.on('drag', (_p: Phaser.Input.Pointer, x: number) => { wheel.x = Phaser.Math.Clamp(x, 575, 705); });
      wheel.on('dragend', () => {
        wheel.setScale(1);
        if (wheel.x < startX - 35) this.completeStation('rhythm', wheel, indicator);
        else if (this.state.settings.reducedMotion) wheel.x = 640;
        else this.tweens.add({ targets: wheel, x: 640, duration: 150, ease: 'Sine.easeOut' });
      });
    };

    renderBeats();
    if (count >= 6) enableReverse();
    wheel.on('pointerdown', () => {
      if (count >= 6) return;
      count += 1;
      wheel.angle += 60;
      renderBeats();
      this.store.mutate((s) => { s.finale.stations.rhythm.phase = count; }, false);
      this.audio.playSfx('clock', .2);
      if (count === 6) enableReverse();
    });
  }

  private activateWarmth(): void {
    this.ui.setCaption('右侧罩内的声膜一遍遍振动。旁边的遮片卡在半开的轨道上，下面还有一根未落到底的拉杆。');
    const membrane = this.add.circle(1030, 475, 58, 0xd3c0a0, .025).setStrokeStyle(2, 0xd7c6aa, .24).setDepth(8).setName('station-action-warmth');
    const rail = this.add.rectangle(1030, 520, 142, 8, 0x8f7a5c, .28).setDepth(8);
    const shutter = this.add.rectangle(982, 520, 42, 30, 0x6b5b47, .86).setStrokeStyle(2, 0x2f281f, .72).setDepth(9).setInteractive({ useHandCursor: true });
    const lever = this.add.zone(1138, 480, 56, 160).setDepth(9);
    const leverGlow = this.add.rectangle(1138, 480, 12, 126, 0xd4b47c, .08).setDepth(8);
    let leverEnabled = this.state.finale.stations.warmth.phase >= 1;

    const enableLever = (): void => {
      if (leverEnabled) return;
      leverEnabled = true;
      this.store.mutate((st) => { st.finale.stations.warmth.phase = 1; }, false);
      this.audio.playSfx('breath', .24);
      this.ui.setCaption('遮片盖住声膜后，重复停了。右侧拉杆松下一小截。');
      lever.setInteractive({ useHandCursor: true });
      this.input.setDraggable(lever);
      let startY = 0;
      let pull = 0;
      lever.on('dragstart', (pointer: Phaser.Input.Pointer) => { startY = pointer.worldY; pull = 0; this.focusCamera(1040, 440, 1.045, 140); });
      lever.on('drag', (pointer: Phaser.Input.Pointer) => { pull = Phaser.Math.Clamp(pointer.worldY - startY, 0, 105); leverGlow.setScale(1, 1 + pull / 180).setAlpha(.10 + pull / 600); });
      lever.on('dragend', () => {
        this.resetCamera(150);
        if (pull >= 70) this.completeStation('warmth', membrane, shutter, rail, lever, leverGlow);
        else { leverGlow.setScale(1).setAlpha(.10); }
      });
    };

    if (leverEnabled) {
      shutter.setX(1075);
      enableLever();
    } else {
      this.input.setDraggable(shutter);
      shutter.on('drag', (_pointer: Phaser.Input.Pointer, x: number) => { shutter.x = Phaser.Math.Clamp(x, 982, 1078); });
      shutter.on('dragend', () => {
        if (shutter.x >= 1055) {
          shutter.disableInteractive();
          if (this.state.settings.reducedMotion) shutter.x = 1075;
          else this.tweens.add({ targets: shutter, x: 1075, duration: 140, ease: 'Back.easeOut' });
          enableLever();
        } else if (this.state.settings.reducedMotion) shutter.x = 982;
        else this.tweens.add({ targets: shutter, x: 982, duration: 150, ease: 'Sine.easeOut' });
      });
    }
  }

  private completeStation(station: FinaleStationId, ...objects: Phaser.GameObjects.GameObject[]): void {
    if (this.state.finale.stations[station].completed) return;
    objects.forEach((object) => object.disableInteractive());
    this.store.mutate((s) => {
      s.finale.stations[station].completed = true;
      s.finale.stations[station].phase = 99;
      s.finale.stations[station].pair = [...FINALE_PAIRS[station]];
    });
    this.audio.playSfx('glass', .45);
    const labels: Record<FinaleStationId, string> = {
      mirror: '看见与辨别互相证明。', rhythm: '习惯与主动行动互相证明。', warmth: '表达与在场互相证明。',
    };
    this.ui.setCaption(labels[station]);
    if (Object.values(this.state.finale.stations).every((item) => item.completed)) {
      this.time.delayedCall(this.state.settings.reducedMotion ? 0 : 650, () => this.showMotherState());
    }
  }

  private restoreStationState(): void {
    STATIONS.forEach((station) => {
      const state = this.state.finale.stations[station.id];
      if (state.completed) {
        this.add.circle(station.x, station.y, 72, 0xb9c1b0, .18).setStrokeStyle(3, 0xd7d0b9, .55).setDepth(7);
        this.audio.playSfx('glass', .08);
        FINALE_PAIRS[station.id].forEach((residue, index) => {
          const token = this.tokens.find((candidate) => candidate.id === residue);
          if (!token) return;
          token.obj.setPosition(station.x + (index === 0 ? -48 : 48), station.y + 112).disableInteractive().setAlpha(.42);
        });
        return;
      }
      this.syncStationPairVisual(station.id);
      if (state.pair.length === 2 && finalePairCorrect(station.id, state.pair)) {
        state.pair.forEach((residue) => this.tokens.find((candidate) => candidate.id === residue)?.obj.disableInteractive());
        this.activateStation(station.id);
      }
    });
  }

  private showMotherState(): void {
    if (!this.state.finale.motherShown) this.store.mutate((s) => { s.finale.motherShown = true; });
    if (this.children.getByName('mother-face')) return;
    const face = this.add.ellipse(640, 382, 138, 190, 0xc4b6a0, .34).setStrokeStyle(4, 0xe3d7be, .55).setDepth(15).setName('mother-face');
    this.ui.setCaption('三层投影自行叠在一起，玻璃上短暂出现一张熟悉得令人不安的脸。');
    if (!this.state.settings.reducedMotion) this.tweens.add({ targets: face, alpha: { from: .05, to: .34 }, duration: 1200, ease: 'Sine.easeOut' });
    this.createBlankToken();
  }

  private createBlankToken(): void {
    if (this.blankToken || !this.state.residues.includes('blank')) return;
    const obj = this.makeToken('blank', 640, 620);
    const record: TokenRecord = { id: 'blank', obj, home: { x: 640, y: 620 } };
    this.blankToken = record;
    const voidZone = this.add.circle(640, 505, 42, 0x050505, .68).setStrokeStyle(2, 0x7e7667, .22).setDepth(7).setAlpha(this.state.finale.transparentRejectedCount > 0 ? .9 : .22);
    obj.on('dragstart', () => obj.setScale(1.04));
    obj.on('dragend', () => {
      obj.setScale(1);
      if (Phaser.Math.Distance.Between(obj.x, obj.y, voidZone.x, voidZone.y) < 70 && this.state.finale.transparentRejectedCount > 0) {
        this.acceptVoid(obj, voidZone); return;
      }
      const station = STATIONS.find((candidate) => Phaser.Math.Distance.Between(obj.x, obj.y, candidate.x, candidate.y) < 165);
      if (station) {
        this.store.mutate((s) => { s.finale.transparentRejectedCount += 1; });
        this.ui.setCaption('透明残响一靠近刻字槽位便迅速发暗，随即被弹回桌面。');
        this.audio.playSfx('glass', .3);
        if (!this.state.settings.reducedMotion) this.tweens.add({ targets: obj, alpha: .25, duration: 80, yoyo: true, repeat: 1 });
        this.moveContainer(obj, record.home.x, record.home.y, 190);
        voidZone.setAlpha(.9);
        return;
      }
      this.moveContainer(obj, record.home.x, record.home.y, 180);
    });
  }

  private acceptVoid(token: Phaser.GameObjects.Container, voidZone: Phaser.GameObjects.Arc): void {
    token.disableInteractive();
    this.moveContainer(token, voidZone.x, voidZone.y, 180, () => token.setAlpha(.5));
    this.store.mutate((s) => { s.finale.voidAccepted = true; s.finale.completed = true; });
    this.audio.playSfx('glass', .7);
    this.cameras.main.shake(this.state.settings.reducedMotion ? 0 : 320, .004);
    this.ui.setCaption('没有刻字的空位安静地接住了它。玻璃深处，一道旧裂纹从左侧慢慢张开。');
    this.time.delayedCall(this.state.settings.reducedMotion ? 0 : 620, () => {
      this.ui.setCaption('六种残响都稳定下来，机器没有报错。真正多出来的，是那个没有刻字、却能安静接住空白的位置。');
      this.addNavArrow('forward', () => this.navigate('ending'));
    });
  }
}
