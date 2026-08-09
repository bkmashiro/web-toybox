import type { KendamaCatch } from './physics';

export class KendamaVoice {
  private context?: AudioContext;
  private enabled = false;

  get playbackState(): 'uninitialized' | 'suspended' | 'running' | 'unsupported' {
    if (typeof window === 'undefined' || !(window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)) return 'unsupported';
    if (!this.context) return 'uninitialized';
    return this.context.state === 'running' ? 'running' : 'suspended';
  }

  async unlock(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    const AudioContextClass = window.AudioContext
      ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return false;
    this.context ??= new AudioContextClass();
    if (this.context.state !== 'running' && this.context.state !== 'closed') {
      await this.context.resume().catch(() => undefined);
    }
    this.enabled = this.context.state === 'running';
    return this.enabled;
  }

  strike(speed: number, kind: KendamaCatch | 'edge'): void {
    const context = this.context;
    if (!this.enabled || !context || context.state !== 'running') return;
    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const filter = context.createBiquadFilter();
    const frequency = kind === 'spike' ? 520 : kind === 'edge' ? 180 : kind === 'small-cup' ? 390 : 300;
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(70, frequency * 0.48), now + 0.075);
    filter.type = 'lowpass';
    filter.frequency.value = 1700;
    gain.gain.setValueAtTime(Math.min(0.22, Math.max(0.025, speed / 3200)), now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);
    oscillator.connect(filter).connect(gain).connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.12);
  }

  destroy(): void {
    const context = this.context;
    this.context = undefined;
    this.enabled = false;
    if (context?.state !== 'closed') void context?.close().catch(() => undefined);
  }
}
