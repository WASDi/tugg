type SoundName =
  | 'machine_start'
  | 'machine_stop'
  | 'machine_run'
  | 'chop_small'
  | 'chop_medium'
  | 'chop_large';

const ALL_SOUNDS: SoundName[] = [
  'machine_start',
  'machine_stop',
  'machine_run',
  'chop_small',
  'chop_medium',
  'chop_large',
];

export class AudioManager {
  private readonly sounds: Record<SoundName, HTMLAudioElement>;
  private lastSoundWasStop = false;
  private unlocked = false;

  constructor() {
    const map: Partial<Record<SoundName, HTMLAudioElement>> = {};
    for (const name of ALL_SOUNDS) {
      const a = new Audio(`./assets/sounds/${name}.ogg`);
      a.preload = 'auto';
      map[name] = a;
    }
    this.sounds = map as Record<SoundName, HTMLAudioElement>;
  }

  unlock(): void {
    if (this.unlocked) return;
    this.unlocked = true;

    // Create silent AudioContext and resume it — this unlocks audio on most mobile browsers
    // without touching the shared HTMLAudioElements.
    try {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      if (AC) {
        const ctx = new AC();
        if (ctx.state === 'suspended') ctx.resume();
        // Play a silent 1-sample buffer so the context is truly "started"
        const buf = ctx.createBuffer(1, 1, ctx.sampleRate);
        const src = ctx.createBufferSource();
        src.buffer = buf;
        src.connect(ctx.destination);
        src.start();
      }
    } catch (_) {}
  }

  play(name: SoundName): void {
    this.unlock();
    this.lastSoundWasStop = name === 'machine_stop';

    // Pause all, clear stale onended
    for (const s of Object.values(this.sounds)) {
      s.pause();
      s.onended = null;
    }

    const audio = this.sounds[name];
    audio.currentTime = 0;
    audio.loop = name === 'machine_run';

    if (!this.lastSoundWasStop && name !== 'machine_run') {
      audio.onended = () => {
        const run = this.sounds['machine_run'];
        run.currentTime = 0;
        run.loop = true;
        run.play().catch(err => console.error('audio play failed (onended)', 'machine_run', err));
      };
    }

    audio.play().catch(err => console.error('audio play failed', name, err));
  }

  stop(): void {
    for (const s of Object.values(this.sounds)) {
      s.pause();
      s.onended = null;
    }
    this.lastSoundWasStop = true;
  }
}
