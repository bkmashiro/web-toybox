export type AudioPlaybackState = 'uninitialized' | 'suspended' | 'running' | 'unsupported';

export interface AudioSessionOptions {
  volume?: number;
}

type WebkitWindow = typeof window & { webkitAudioContext?: typeof AudioContext };

const contextConstructor = (): typeof AudioContext | undefined => {
  if (typeof window === 'undefined') return undefined;
  return window.AudioContext ?? (window as WebkitWindow).webkitAudioContext;
};

export class LazyAudioSession {
  private context?: AudioContext;
  private level: number;

  constructor(options: AudioSessionOptions = {}) {
    const volume = options.volume ?? 0.75;
    this.level = Number.isFinite(volume) ? Math.min(1, Math.max(0, volume)) : 0.75;
  }

  get playbackState(): AudioPlaybackState {
    if (!contextConstructor()) return 'unsupported';
    if (!this.context) return 'uninitialized';
    return this.context.state === 'running' ? 'running' : 'suspended';
  }

  get volume(): number { return this.level; }

  get runningContext(): AudioContext | undefined {
    return this.context?.state === 'running' ? this.context : undefined;
  }

  setVolume(value: number): void {
    if (Number.isFinite(value)) this.level = Math.min(1, Math.max(0, value));
  }

  async unlock(): Promise<boolean> {
    const Context = contextConstructor();
    if (!Context) return false;
    this.context ??= new Context();
    if (this.context.state !== 'running' && this.context.state !== 'closed') {
      await this.context.resume().catch(() => undefined);
    }
    return this.context.state === 'running';
  }

  destroy(): void {
    const context = this.context;
    this.context = undefined;
    if (context?.state !== 'closed') void context?.close().catch(() => undefined);
  }
}
