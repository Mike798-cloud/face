import { eventBus } from '../core/EventBus';
import type { AudioManager } from '../core/AudioManager';
import type { GameStore } from '../core/GameStore';
import type { ObservationId, RelationId, SceneId } from '../core/GameState';
import { HINTS, OBSERVATIONS, RELATIONS, RESIDUE_LABELS } from '../data/gameData';
import { relationFor } from '../game/puzzles/logic';

export class UI {
  private readonly root: HTMLElement;
  private readonly store: GameStore;
  private readonly audio: AudioManager;
  private currentScene: SceneId = 'shop';
  private shell: HTMLElement | null = null;
  private drawer: HTMLElement | null = null;
  private objectiveLabel: HTMLElement | null = null;
  private modal: HTMLElement | null = null;
  private toastTimer: number | null = null;
  private captionTimer: number | null = null;
  private drawerExpanded = false;
  private sceneItems: Array<{ id: string; label: string; icon: string }> = [];
  private selectedSceneItem: string | null = null;

  constructor(root: HTMLElement, store: GameStore, audio: AudioManager) {
    this.root = root;
    this.store = store;
    this.audio = audio;
    eventBus.on('toast', ({ text, tone }) => this.toast(text, tone));
    eventBus.on('openNotebook', () => this.openNotebook());
    eventBus.on('openHint', () => this.openHint());
    eventBus.on('openSettings', () => this.openSettings());
    eventBus.on('stateChanged', () => this.refresh());
  }

  renderTitle(onStart: (continueGame: boolean) => void): void {
    this.closeModal();
    this.shell = null;
    this.drawer = null;
    this.objectiveLabel = null;
    this.drawerExpanded = false;
    this.sceneItems = [];
    this.selectedSceneItem = null;
    const hasSave = this.store.hasSave();
    this.root.innerHTML = `
      <main class="title-screen">
        <div class="title-paper">
          <div class="title-kicker">THE FACE OF IT · 第七码头手记</div>
          <h1>面 目</h1>
          <p class="title-sub">海湾第七码头 · 无面匠人的最后一夜</p>
          <p class="title-copy">这里没有一张脸只属于一个人。师父失踪后的最后一夜，阿七必须把一门传了太久的手艺重新做一遍，才知道自己究竟被谁定义过。</p>
          <div class="title-actions">
            ${hasSave ? '<button id="continue-btn" class="paper-button primary">继续旧档</button>' : ''}
            <button id="new-btn" class="paper-button">${hasSave ? '从头开始' : '进入面具铺'}</button>
            <button id="settings-btn" class="paper-button quiet">设置</button>
          </div>
          <p class="title-foot">建议横屏与耳机 · 主线约 60–75 分钟</p>
        </div>
      </main>`;
    const titleScreen = this.root.querySelector<HTMLElement>('.title-screen');
    if (titleScreen) titleScreen.style.setProperty('--title-art', `url("${import.meta.env.BASE_URL}assets/images/coast-house.webp")`);
    this.root.querySelector<HTMLButtonElement>('#continue-btn')?.addEventListener('click', () => { this.audio.unlock(); onStart(true); });
    this.root.querySelector<HTMLButtonElement>('#new-btn')?.addEventListener('click', () => {
      if (hasSave && !window.confirm('从头开始会覆盖当前主线进度。设置与二周目标记会保留。继续吗？')) return;
      this.audio.unlock();
      this.store.reset();
      onStart(false);
    });
    this.root.querySelector<HTMLButtonElement>('#settings-btn')?.addEventListener('click', () => this.openSettings());
  }

  renderGameShell(): HTMLElement {
    this.root.innerHTML = `
      <main class="game-shell ${this.store.state.settings.largeTargets ? 'large-targets' : ''}">
        <div class="world-frame">
          <div id="game-host" class="game-host" aria-label="游戏场景"></div>
          <div class="grain" aria-hidden="true"></div>
          <div class="scene-objective" id="scene-objective" aria-live="polite"></div>
          <nav class="utility-rail" aria-label="游戏工具">
            <button data-tool="notebook" aria-label="观察卡">◎</button>
            <button data-tool="hint" aria-label="提示">?</button>
            <button data-tool="settings" aria-label="设置">⚙</button>
            <button data-tool="title" aria-label="返回封面">⌂</button>
          </nav>
          <aside class="world-caption" id="world-caption" aria-live="polite"></aside>
          <section class="inventory-drawer is-collapsed" id="inventory-drawer" aria-label="残响栏"></section>
        </div>
      </main>`;
    this.shell = this.root.querySelector<HTMLElement>('.game-shell');
    this.drawer = this.root.querySelector<HTMLElement>('#inventory-drawer');
    this.objectiveLabel = this.root.querySelector<HTMLElement>('#scene-objective');
    this.root.querySelector<HTMLButtonElement>('[data-tool="notebook"]')?.addEventListener('click', () => eventBus.emit('openNotebook', undefined));
    this.root.querySelector<HTMLButtonElement>('[data-tool="hint"]')?.addEventListener('click', () => eventBus.emit('openHint', undefined));
    this.root.querySelector<HTMLButtonElement>('[data-tool="settings"]')?.addEventListener('click', () => eventBus.emit('openSettings', undefined));
    this.root.querySelector<HTMLButtonElement>('[data-tool="title"]')?.addEventListener('click', () => eventBus.emit('title', undefined));
    this.refresh();
    return this.root.querySelector<HTMLElement>('#game-host')!;
  }

  setScene(scene: SceneId): void {
    if (scene !== this.currentScene) {
      this.sceneItems = [];
      this.selectedSceneItem = null;
    }
    this.currentScene = scene;
    this.shell?.setAttribute('data-scene', scene);
    this.refresh();
  }

  setSceneItems(items: Array<{ id: string; label: string; icon: string }>): void {
    this.sceneItems = [...items];
    if (this.selectedSceneItem && !this.sceneItems.some((item) => item.id === this.selectedSceneItem)) this.selectedSceneItem = null;
    if (items.length > 0) this.drawerExpanded = true;
    this.refresh();
  }

  getSelectedSceneItem(): string | null { return this.selectedSceneItem; }

  consumeSceneItem(id: string): void {
    this.sceneItems = this.sceneItems.filter((item) => item.id !== id);
    if (this.selectedSceneItem === id) this.selectedSceneItem = null;
    if (this.sceneItems.length === 0 && this.store.state.residues.length === 0) this.drawerExpanded = false;
    this.refresh();
  }

  setObjective(text: string): void {
    if (!this.objectiveLabel) return;
    // Kept for screen readers and debugging, but deliberately not presented as an on-screen instruction.
    this.objectiveLabel.textContent = text;
  }

  setCinematicMode(active: boolean): void {
    this.shell?.classList.toggle('cinematic-mode', active);
  }

  setCaption(text: string): void {
    const caption = this.root.querySelector<HTMLElement>('#world-caption');
    if (!caption) return;
    caption.textContent = text;
    caption.classList.add('show');
    if (this.captionTimer !== null) window.clearTimeout(this.captionTimer);
    const holdMs = this.store.state.settings.reducedMotion ? 1800 : Math.max(2800, Math.min(8200, 900 + text.length * 82));
    this.captionTimer = window.setTimeout(() => {
      caption.classList.remove('show');
      this.captionTimer = null;
    }, holdMs);
  }

  refresh(): void {
    if (!this.drawer) return;
    const residues = this.store.state.residues;
    const residueSlots = residues.map((id) => `<span class="residue-chip" data-residue="${id}">${RESIDUE_LABELS[id]}</span>`).join('');
    const itemSlots = this.sceneItems.map((item) => `
      <button type="button" class="scene-item ${this.selectedSceneItem === item.id ? 'is-selected' : ''}" data-scene-item="${item.id}" aria-label="${item.label}" title="${item.label}">
        <img src="${import.meta.env.BASE_URL}${item.icon}" alt="" draggable="false">
      </button>`).join('');
    const total = residues.length + this.sceneItems.length;
    this.drawer.classList.toggle('is-expanded', this.drawerExpanded);
    this.drawer.classList.toggle('is-collapsed', !this.drawerExpanded);
    this.drawer.classList.toggle('has-scene-items', this.sceneItems.length > 0);
    this.drawer.innerHTML = `
      <button class="drawer-toggle" type="button" aria-label="${this.drawerExpanded ? '收起物品栏' : '展开物品栏'}" aria-expanded="${this.drawerExpanded}">
        <span class="drawer-chevron">${this.drawerExpanded ? '⌄' : '⌃'}</span>
        <span class="drawer-count">${total ? total : '·'}</span>
      </button>
      <div class="drawer-items" aria-hidden="${!this.drawerExpanded}">
        ${itemSlots}${residueSlots || (itemSlots ? '' : '<span class="inventory-quiet">···</span>')}
      </div>`;
    this.drawer.querySelector<HTMLButtonElement>('.drawer-toggle')?.addEventListener('click', () => {
      this.drawerExpanded = !this.drawerExpanded;
      this.refresh();
    });
    this.drawer.querySelectorAll<HTMLButtonElement>('[data-scene-item]').forEach((button) => button.addEventListener('click', () => {
      const id = button.dataset.sceneItem ?? null;
      this.selectedSceneItem = this.selectedSceneItem === id ? null : id;
      this.refresh();
    }));
    this.shell?.classList.toggle('large-targets', this.store.state.settings.largeTargets);
  }

  toast(text: string, tone: 'normal' | 'good' | 'warning' = 'normal'): void {
    let el = document.querySelector<HTMLElement>('.game-toast');
    if (!el) {
      el = document.createElement('div');
      el.className = 'game-toast';
      document.body.appendChild(el);
    }
    el.dataset.tone = tone;
    el.textContent = text;
    el.classList.add('visible');
    if (this.toastTimer !== null) window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => el?.classList.remove('visible'), 2400);
  }

  openHint(): void {
    const hints = HINTS[this.currentScene];
    this.openModal('?', `
      <div class="hint-stack">
        <details open><summary>Ⅰ</summary><p>${hints[0]}</p></details>
        <details><summary>Ⅱ</summary><p>${hints[1]}</p></details>
        <details><summary>Ⅲ</summary><p>${hints[2]}</p></details>
      </div>`);
  }

  openSettings(): void {
    const s = this.store.state.settings;
    this.openModal('⚙', `
      <div class="settings-list">
        <label><input id="set-sound" type="checkbox" ${s.sound ? 'checked' : ''}> 声音与环境音</label>
        <label><input id="set-motion" type="checkbox" ${s.reducedMotion ? 'checked' : ''}> 减少镜头与动态效果</label>
        <label><input id="set-targets" type="checkbox" ${s.largeTargets ? 'checked' : ''}> 放大触屏操作区</label>
      </div>`);
    const bind = (id: string, key: 'sound' | 'reducedMotion' | 'largeTargets'): void => {
      this.modal?.querySelector<HTMLInputElement>(`#${id}`)?.addEventListener('change', (event) => {
        const input = event.currentTarget as HTMLInputElement;
        this.store.mutate((state) => { state.settings[key] = input.checked; });
        this.audio.updateSettings(this.store.state.settings);
        this.refresh();
      });
    };
    bind('set-sound', 'sound');
    bind('set-motion', 'reducedMotion');
    bind('set-targets', 'largeTargets');
  }

  openNotebook(): void {
    const cards = this.store.state.observations;
    const cardHtml = cards.length
      ? cards.map((id) => `<button class="observation-card" data-observation="${id}"><strong>${OBSERVATIONS[id].title}</strong><span>${OBSERVATIONS[id].text}</span></button>`).join('')
      : '<p class="empty-note">还没有可以并置的观察。</p>';
    this.openModal('◎', `
      <div class="observation-grid">${cardHtml}</div>
      <div class="relation-strip">
        <div id="relation-selection">尚未选卡</div>
        <button class="paper-button" id="relation-check" disabled>并置</button>
        <p id="relation-result"></p>
      </div>`);
    const selected: ObservationId[] = [];
    const buttons = [...(this.modal?.querySelectorAll<HTMLButtonElement>('[data-observation]') ?? [])];
    const update = (): void => {
      const selection = this.modal?.querySelector<HTMLElement>('#relation-selection');
      const check = this.modal?.querySelector<HTMLButtonElement>('#relation-check');
      if (selection) selection.textContent = selected.length ? selected.map((id) => OBSERVATIONS[id].title).join(' × ') : '尚未选卡';
      if (check) check.disabled = selected.length !== 2;
      buttons.forEach((button) => button.classList.toggle('selected', selected.includes(button.dataset.observation as ObservationId)));
    };
    buttons.forEach((button) => button.addEventListener('click', () => {
      const id = button.dataset.observation as ObservationId;
      const index = selected.indexOf(id);
      if (index >= 0) selected.splice(index, 1);
      else {
        if (selected.length >= 2) selected.shift();
        selected.push(id);
      }
      update();
    }));
    this.modal?.querySelector<HTMLButtonElement>('#relation-check')?.addEventListener('click', () => {
      if (selected.length !== 2) return;
      const first = selected[0];
      const second = selected[1];
      if (!first || !second) return;
      const relation = relationFor(first, second);
      const out = this.modal?.querySelector<HTMLElement>('#relation-result');
      if (!relation) {
        if (out) out.textContent = '两张纸没有形成新的互证。';
        return;
      }
      if (out) out.textContent = RELATIONS[relation].text;
      this.store.mutate((state) => {
        if (!state.linkedRelations.includes(relation)) state.linkedRelations.push(relation as RelationId);
      });
    });
    update();
  }

  openStory(title: string, paragraphs: readonly string[], onDone?: () => void): void {
    let index = 0;
    const next = (): void => {
      const current = paragraphs[index];
      if (current === undefined) {
        this.closeModal();
        onDone?.();
        return;
      }
      const body = this.modal?.querySelector<HTMLElement>('.story-lines');
      if (body) {
        const p = document.createElement('p');
        p.textContent = current;
        body.appendChild(p);
        requestAnimationFrame(() => p.classList.add('visible'));
      }
      index += 1;
      const button = this.modal?.querySelector<HTMLButtonElement>('#story-next');
      if (button) button.textContent = index >= paragraphs.length ? '进入场景' : '继续';
    };
    this.openModal(title, `<div class="story-lines"></div><button class="paper-button primary" id="story-next">继续</button>`, false);
    this.modal?.querySelector<HTMLButtonElement>('#story-next')?.addEventListener('click', next);
    next();
  }

  private openModal(title: string, bodyHtml: string, closable = true): void {
    this.closeModal();
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <section class="paper-modal" role="dialog" aria-modal="true" aria-label="${title}">
        <header><h2>${title}</h2>${closable ? '<button class="modal-close" aria-label="关闭">×</button>' : ''}</header>
        <div class="modal-body">${bodyHtml}</div>
      </section>`;
    document.body.appendChild(overlay);
    this.modal = overlay;
    overlay.querySelector<HTMLButtonElement>('.modal-close')?.addEventListener('click', () => this.closeModal());
    if (closable) overlay.addEventListener('pointerdown', (event) => {
      if (event.target === overlay) this.closeModal();
    });
  }

  private closeModal(): void {
    this.modal?.remove();
    this.modal = null;
  }
}
