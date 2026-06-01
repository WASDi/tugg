type SoundName =
  | 'machine_start'
  | 'machine_stop'
  | 'machine_run'
  | 'chop_small'
  | 'chop_medium'
  | 'chop_large';

export class AudioManager {
  private readonly audio = new Audio();
  private lastSoundWasStop = false;

  private src(name: SoundName): string {
    return `/assets/sounds/${name}.ogg`;
  }

  play(name: SoundName): void {
    this.lastSoundWasStop = name === 'machine_stop';

    this.audio.pause();
    this.audio.loop = name === 'machine_run';
    this.audio.src = this.src(name);
    this.audio.currentTime = 0;

    this.audio.onended = () => {
      if (!this.lastSoundWasStop) {
        this.playLoop();
      }
    };

    this.audio.play().catch(() => {
      // autoplay policy — silently ignored until user interaction
    });
  }

  private playLoop(): void {
    this.audio.loop = true;
    this.audio.src = this.src('machine_run');
    this.audio.currentTime = 0;
    this.audio.play().catch(() => undefined);
  }

  stop(): void {
    this.audio.pause();
    this.audio.src = '';
    this.lastSoundWasStop = true;
  }
}
