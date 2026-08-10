import {
  createToySynth,
  defineSound,
  defineSynthConfig,
  toneLayer,
  type AudioPlaybackState,
} from '@web-toybox/toy-audio';
import type { YoyoPhase } from './physics';

export const yoyoSynthConfig = defineSynthConfig({
  volume: 0.75,
  sounds: {
    strike: defineSound(toneLayer({
      wave: 'sine', frequency: 150, duration: 0.09, gain: 1,
    })),
  },
});

export class YoyoVoice {
  private readonly synth = createToySynth(yoyoSynthConfig);
  private oscillator?: OscillatorNode;
  private gain?: GainNode;

  get playbackState(): AudioPlaybackState { return this.synth.playbackState; }
  setVolume(value: number): void { this.synth.setVolume(value); }

  async unlock(): Promise<boolean> {
    const running = await this.synth.unlock();
    const context = this.synth.runningContext;
    if (!running || !context || this.oscillator) return running;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const filter = context.createBiquadFilter();
    oscillator.type = 'triangle';
    oscillator.frequency.value = 90;
    filter.type = 'lowpass';
    filter.frequency.value = 1_200;
    gain.gain.value = 0;
    oscillator.connect(filter).connect(gain).connect(context.destination);
    oscillator.start();
    this.oscillator = oscillator;
    this.gain = gain;
    return true;
  }

  update(spin: number, taut: boolean, phase: YoyoPhase): void {
    const context = this.synth.runningContext;
    if (!context || !this.oscillator || !this.gain) return;
    const now = context.currentTime;
    const amount = Math.min(1, Math.abs(spin) / 110);
    this.oscillator.frequency.setTargetAtTime(72 + amount * 210, now, 0.025);
    const level = (taut ? 0.018 : 0.009) * amount * (phase === 'returning' ? 1.25 : 1) * this.synth.volume * 2;
    this.gain.gain.setTargetAtTime(level, now, 0.035);
  }

  strike(speed: number): void {
    const frequency = 150 + Math.min(500, speed * 0.35);
    const gain = Math.min(0.16, speed / 5_000) * 2;
    this.synth.trigger('strike', { pitch: frequency / 150, gain });
  }

  destroy(): void {
    try { this.oscillator?.stop(); } catch {}
    this.oscillator = undefined;
    this.gain = undefined;
    this.synth.destroy();
  }
}
