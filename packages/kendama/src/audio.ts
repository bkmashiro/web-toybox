import {
  createToySynth,
  defineSound,
  defineSynthConfig,
  toneLayer,
  type AudioPlaybackState,
} from '@web-toybox/toy-audio';
import type { KendamaCatch } from './physics';

const impact = (frequency: number) => defineSound(toneLayer({
  wave: 'triangle', frequency, endFrequency: Math.max(70, frequency * 0.48),
  pitchDuration: 0.075, duration: 0.11, gain: 1,
  filter: { type: 'lowpass', frequency: 1_700 },
}));

export const kendamaSynthConfig = defineSynthConfig({
  volume: 0.75,
  sounds: {
    spike: impact(520),
    edge: impact(180),
    'small-cup': impact(390),
    cup: impact(300),
  },
});

export class KendamaVoice {
  private readonly synth = createToySynth(kendamaSynthConfig);

  get playbackState(): AudioPlaybackState { return this.synth.playbackState; }
  setVolume(value: number): void { this.synth.setVolume(value); }
  unlock(): Promise<boolean> { return this.synth.unlock(); }

  strike(speed: number, kind: KendamaCatch | 'edge'): void {
    const sound = kind === 'spike' || kind === 'edge' || kind === 'small-cup' ? kind : 'cup';
    const gain = Math.min(0.22, Math.max(0.025, speed / 3_200)) * 2;
    this.synth.trigger(sound, { gain });
  }

  destroy(): void { this.synth.destroy(); }
}
