import { mergeSynthConfig, type ToySynthConfig, type ToySynthConfigInput, type TriggerOptions } from './config';
import { renderSound } from './primitives';
import { LazyAudioSession, type AudioPlaybackState } from './session';

export class ToySynth {
  private settings: Readonly<ToySynthConfig>;
  private readonly session: LazyAudioSession;

  constructor(config: Readonly<ToySynthConfig>) {
    this.settings = config;
    this.session = new LazyAudioSession({ volume: config.volume });
  }

  get config(): Readonly<ToySynthConfig> { return this.settings; }
  get playbackState(): AudioPlaybackState { return this.session.playbackState; }
  get runningContext(): AudioContext | undefined { return this.session.runningContext; }
  get volume(): number { return this.session.volume; }

  configure(next: ToySynthConfigInput): this {
    this.settings = mergeSynthConfig(this.settings, next);
    this.session.setVolume(this.settings.volume);
    return this;
  }

  setVolume(value: number): void {
    this.session.setVolume(value);
    this.settings = mergeSynthConfig(this.settings, { volume: this.session.volume });
  }

  unlock(): Promise<boolean> { return this.session.unlock(); }

  trigger(name: string, options: TriggerOptions = {}): boolean {
    const sound = this.settings.sounds[name];
    return sound ? renderSound(this.session, sound, options) : false;
  }

  destroy(): void { this.session.destroy(); }
}

export const createToySynth = (config: Readonly<ToySynthConfig>): ToySynth =>
  new ToySynth(config);
