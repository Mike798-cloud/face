import type { GameSettings } from './GameState';

export class AudioManager {
  private ambient: HTMLAudioElement | null = null;
  private ambientName: string | null = null;
  private ambientTargetVolume = .25;
  private fadeTimer: number | null = null;
  private voice: HTMLAudioElement | null = null;
  private voiceRetry: ((event: Event) => void) | null = null;
  private settings: GameSettings;
  private readonly sfxTemplates = new Map<string, HTMLAudioElement>();
  private unlocked = false;

  constructor(settings: GameSettings) {
    this.settings = settings;
  }

  updateSettings(settings: GameSettings): void {
    this.settings = settings;
    if (!settings.sound) { this.stopAmbient(); this.stopVoice(); return; }
    // The settings checkbox itself is a user gesture. Re-prime media immediately when sound
    // is turned back on instead of waiting for a later puzzle click.
    this.unlock();
  }

  /** Prime HTMLMediaElement playback while a real user gesture is active. */
  unlock(): void {
    if (this.unlocked || !this.settings.sound) return;
    const probe = new Audio(`${import.meta.env.BASE_URL}assets/audio/voice/opening-v46-1.ogg`);
    probe.preload = 'auto';
    probe.volume = 0.001;
    void probe.play().then(() => {
      this.unlocked = true;
      probe.pause();
      probe.currentTime = 0;
    }).catch(() => {
      // Do not mark the manager as unlocked on a rejected promise. playVoice will reserve
      // the next gesture for retrying the actual line instead of silently losing it.
      this.unlocked = false;
    });
  }

  playAmbient(name: string, volume = 0.25): void {
    if (!this.settings.sound) return;
    this.ambientTargetVolume = volume;
    const effectiveVolume = this.voice ? volume * .34 : volume;
    if (this.ambient && this.ambientName === name) {
      this.ambient.volume = effectiveVolume;
      if (this.ambient.paused) void this.ambient.play().catch(() => undefined);
      return;
    }

    const next = new Audio(`${import.meta.env.BASE_URL}assets/audio/${name}.wav`);
    next.loop = true;
    next.preload = 'auto';
    next.volume = this.ambient ? 0 : effectiveVolume;
    void next.play().catch(() => undefined);

    const previous = this.ambient;
    this.ambient = next;
    this.ambientName = name;
    this.clearFadeTimer();

    if (!previous) return;
    const duration = 320;
    const tickMs = 32;
    const steps = Math.max(1, Math.round(duration / tickMs));
    const previousStart = previous.volume;
    let step = 0;
    this.fadeTimer = window.setInterval(() => {
      step += 1;
      const t = Math.min(1, step / steps);
      previous.volume = Math.max(0, previousStart * (1 - t));
      next.volume = Math.min(effectiveVolume, effectiveVolume * t);
      if (t >= 1) {
        this.clearFadeTimer();
        previous.pause();
        previous.currentTime = 0;
      }
    }, tickMs);
  }

  stopAmbient(): void {
    this.clearFadeTimer();
    if (!this.ambient) return;
    this.ambient.pause();
    this.ambient.currentTime = 0;
    this.ambient = null;
    this.ambientName = null;
  }

  /**
   * Play a packaged voice line. If autoplay is blocked, the first following gesture is
   * consumed in the capture phase to start the line; it will not also skip the subtitle
   * or trigger a puzzle underneath it.
   */
  playVoice(id: string, volume = 0.62, onEnded?: () => void, onStarted?: () => void): void {
    if (!this.settings.sound) { onEnded?.(); return; }
    this.stopVoice();
    const audio = new Audio(`${import.meta.env.BASE_URL}assets/audio/voice/${id}.ogg`);
    audio.preload = 'auto';
    const profile = this.voiceProfile(id);
    audio.volume = Math.max(0, Math.min(1, volume * profile.gain));
    audio.playbackRate = profile.rate;
    audio.preservesPitch = true;
    this.voice = audio;

    let completed = false;
    const finish = (): void => {
      if (completed) return;
      completed = true;
      this.clearVoiceRetry();
      if (this.voice === audio) this.voice = null;
      this.restoreAmbientAfterVoice();
      onEnded?.();
    };
    audio.addEventListener('ended', finish, { once: true });
    audio.addEventListener('error', finish, { once: true });
    audio.addEventListener('playing', () => {
      this.unlocked = true;
      this.duckAmbientForVoice();
      onStarted?.();
    }, { once: true });

    const attempt = (): void => {
      void audio.play().catch(() => {
        this.clearVoiceRetry();
        const retry = (event: Event): void => {
          if (this.voice !== audio) return;
          // Reserve this gesture for unlocking the narration. Without capture-phase
          // consumption, the same tap reaches the cinematic and immediately skips it.
          if ('preventDefault' in event && event.cancelable) event.preventDefault();
          event.stopImmediatePropagation();
          this.clearVoiceRetry();
          void audio.play().catch(() => {
            // If a browser still refuses playback, keep the line pending for one more
            // real gesture instead of pretending it played.
            this.installVoiceRetry(retry);
          });
        };
        this.installVoiceRetry(retry);
      });
    };
    attempt();
  }

  stopVoice(): void {
    this.clearVoiceRetry();
    if (this.voice) {
      this.voice.pause();
      this.voice.currentTime = 0;
      this.voice = null;
    }
    this.restoreAmbientAfterVoice();
  }

  playSfx(name: string, volume = 0.5): void {
    if (!this.settings.sound) return;
    let template = this.sfxTemplates.get(name);
    if (!template) {
      template = new Audio(`${import.meta.env.BASE_URL}assets/audio/${name}.wav`);
      template.preload = 'auto';
      this.sfxTemplates.set(name, template);
    }
    const audio = template.cloneNode(true) as HTMLAudioElement;
    audio.volume = volume;
    void audio.play().catch(() => undefined);
  }

  private installVoiceRetry(retry: (event: Event) => void): void {
    this.voiceRetry = retry;
    window.addEventListener('pointerdown', retry, { capture: true, once: true });
    window.addEventListener('keydown', retry, { capture: true, once: true });
  }

  private clearVoiceRetry(): void {
    if (!this.voiceRetry) return;
    window.removeEventListener('pointerdown', this.voiceRetry, true);
    window.removeEventListener('keydown', this.voiceRetry, true);
    this.voiceRetry = null;
  }

  private duckAmbientForVoice(): void {
    if (!this.ambient) return;
    this.ambient.volume = Math.max(.015, this.ambientTargetVolume * .34);
  }

  private restoreAmbientAfterVoice(): void {
    if (!this.ambient || !this.settings.sound) return;
    this.ambient.volume = this.ambientTargetVolume;
  }

  private voiceProfile(id: string): { gain: number; rate: number } {
    // Character differentiation is deliberately restrained: the source performances carry
    // the timbre, while tiny pacing/gain differences keep the cast distinct without a
    // synthetic pitch-shifter sound.
    if (id.includes('shop-doll')) return { gain: .94, rate: .97 };
    if (id.includes('mayor')) return { gain: .92, rate: .96 };
    if (id.includes('butcher')) return { gain: 1.0, rate: .94 };
    if (id.includes('elaine')) return { gain: .90, rate: 1.02 };
    if (id.includes('milo')) return { gain: .88, rate: 1.04 };
    if (id.includes('postman')) return { gain: .96, rate: .98 };
    if (id.includes('soren')) return { gain: .92, rate: .93 };
    if (id.includes('water-woman')) return { gain: .90, rate: .95 };
    if (id.startsWith('opening-')) return { gain: .96, rate: .98 };
    return { gain: .90, rate: 1 };
  }

  private clearFadeTimer(): void {
    if (this.fadeTimer === null) return;
    window.clearInterval(this.fadeTimer);
    this.fadeTimer = null;
  }
}
