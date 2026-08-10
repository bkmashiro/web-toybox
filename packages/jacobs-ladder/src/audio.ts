const DEFAULT_VOLUME = 0.75;
const OUTPUT_BOOST = 2;

export class LadderVoice {
  private context?: AudioContext;
  private enabled = false;
  private volume = DEFAULT_VOLUME;

  get playbackState(): 'uninitialized' | 'suspended' | 'running' | 'unsupported' {
    if (typeof window === 'undefined' || !(window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)) return 'unsupported';
    if (!this.context) return 'uninitialized';
    return this.context.state === 'running' ? 'running' : 'suspended';
  }

  setVolume(value: number): void {
    if (Number.isFinite(value)) this.volume = Math.min(1, Math.max(0, value));
  }

  async unlock(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    const webkitWindow = window as typeof window & { webkitAudioContext?: typeof AudioContext };
    const AudioContextClass = window.AudioContext ?? webkitWindow.webkitAudioContext;
    if (!AudioContextClass) return false;
    this.context ??= new AudioContextClass();
    if (this.context.state !== 'running') await this.context.resume().catch(() => undefined);
    this.enabled = this.context.state === 'running';
    return this.enabled;
  }

  strike(index: number, count: number): void {
    if (!this.enabled || !this.context || this.volume === 0) return;
    const context = this.context;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const filter = context.createBiquadFilter();
    oscillator.type = 'triangle';
    oscillator.frequency.value = 250 + index / count * 170;
    filter.type = 'lowpass';
    filter.frequency.value = 1250;
    gain.gain.value = 0.055 * this.volume * OUTPUT_BOOST;
    oscillator.connect(filter).connect(gain).connect(context.destination);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.075);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.08);
  }

  destroy(): void {
    void this.context?.close().catch(() => undefined);
    this.context = undefined;
    this.enabled = false;
  }
}
