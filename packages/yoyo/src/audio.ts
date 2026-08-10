import type { YoyoPhase } from './physics';

const DEFAULT_VOLUME = 0.75;
const OUTPUT_BOOST = 2;

export class YoyoVoice {
  private context?: AudioContext;
  private oscillator?: OscillatorNode;
  private gain?: GainNode;
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
    const AudioContextClass = window.AudioContext
      ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return false;

    let resume: Promise<void> | undefined;
    if (!this.context) {
      const context = new AudioContextClass();
      this.context = context;
      if (context.state !== 'running') resume = context.resume().catch(() => undefined);

      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const filter = context.createBiquadFilter();
      oscillator.type = 'triangle';
      oscillator.frequency.value = 90;
      filter.type = 'lowpass';
      filter.frequency.value = 1200;
      gain.gain.value = 0;
      oscillator.connect(filter).connect(gain).connect(context.destination);
      oscillator.start();
      this.oscillator = oscillator;
      this.gain = gain;
    } else if (this.context.state !== 'running') {
      resume = this.context.resume().catch(() => undefined);
    }

    await resume;
    this.enabled = this.context.state === 'running';
    return this.enabled;
  }

  update(spin: number, taut: boolean, phase: YoyoPhase): void {
    if (!this.enabled || !this.context || !this.oscillator || !this.gain) return;
    const now = this.context.currentTime;
    const amount = Math.min(1, Math.abs(spin) / 110);
    this.oscillator.frequency.setTargetAtTime(72 + amount * 210, now, 0.025);
    const level = (taut ? 0.018 : 0.009) * amount * (phase === 'returning' ? 1.25 : 1) * this.volume * OUTPUT_BOOST;
    this.gain.gain.setTargetAtTime(level, now, 0.035);
  }

  strike(speed: number): void {
    if (!this.enabled || !this.context || this.volume === 0) return;
    const context = this.context;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = 150 + Math.min(500, speed * 0.35);
    gain.gain.value = Math.min(0.16, speed / 5000) * this.volume * OUTPUT_BOOST;
    oscillator.connect(gain).connect(context.destination);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.09);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.1);
  }

  destroy(): void {
    try { this.oscillator?.stop(); } catch {}
    void this.context?.close().catch(() => undefined);
    this.context = undefined;
    this.enabled = false;
  }
}
