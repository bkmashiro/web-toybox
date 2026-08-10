const DEFAULT_VOLUME = 0.75;
const OUTPUT_BOOST = 2;

export class FrogVoice {
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

  private hit(frequency: number, duration: number, level: number, type: OscillatorType): void {
    if (!this.enabled || !this.context || this.volume === 0) return;
    const context = this.context;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const filter = context.createBiquadFilter();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(60, frequency * 0.62), context.currentTime + duration);
    filter.type = 'bandpass';
    filter.frequency.value = frequency * 1.5;
    filter.Q.value = 0.8;
    gain.gain.value = level * this.volume * OUTPUT_BOOST;
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
    oscillator.connect(filter).connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + duration);
  }

  gear(): void { this.hit(980, 0.018, 0.018, 'square'); }
  hop(): void { this.hit(330, 0.055, 0.035, 'triangle'); }
  land(speed = 1): void { this.hit(190, 0.11, 0.05 * Math.min(1.4, speed), 'sawtooth'); }

  destroy(): void {
    void this.context?.close().catch(() => undefined);
    this.context = undefined;
    this.enabled = false;
  }
}
