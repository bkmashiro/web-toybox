const DEFAULT_VOLUME = 0.75;

export class SlidingVoice {
  private context?: AudioContext;
  private volume = DEFAULT_VOLUME;

  get playbackState(): 'uninitialized' | 'suspended' | 'running' | 'unsupported' {
    if (typeof window === 'undefined' || !(window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)) return 'unsupported';
    if (!this.context) return 'uninitialized';
    return this.context.state === 'running' ? 'running' : 'suspended';
  }

  setVolume(value: number): void {
    this.volume = Math.min(1, Math.max(0, Number.isFinite(value) ? value : DEFAULT_VOLUME));
  }

  async unlock(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    const Context = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Context) return false;
    this.context ??= new Context();
    if (this.context.state !== 'running' && this.context.state !== 'closed') await this.context.resume().catch(() => undefined);
    return this.context.state === 'running';
  }

  click(pitch = 240): void {
    const context = this.context;
    if (!context || context.state !== 'running' || this.volume <= 0) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(pitch, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(pitch * 0.72, context.currentTime + 0.07);
    gain.gain.setValueAtTime(this.volume * 0.19, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.075);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.08);
  }

  destroy(): void {
    void this.context?.close();
    this.context = undefined;
  }
}
