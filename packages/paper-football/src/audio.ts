import { createToySynth, defineSound, defineSynthConfig, noiseLayer, toneLayer, type AudioPlaybackState } from '@web-toybox/toy-audio';

export const paperFootballSynthConfig = defineSynthConfig({
  volume: 0.75,
  sounds: {
    flick: defineSound(noiseLayer({ duration: 0.055, gain: 0.065, filter: { type: 'bandpass', frequency: 1250, q: 0.9 } })),
    rail: defineSound(toneLayer({ wave: 'triangle', frequency: 245, endFrequency: 160, duration: 0.05, gain: 0.08 })),
    goal: defineSound(
      toneLayer({ wave: 'square', frequency: 392, duration: 0.16, gain: 0.055 }),
      toneLayer({ wave: 'triangle', frequency: 587, duration: 0.24, gain: 0.075 }),
    ),
  },
});
export class PaperFootballVoice {
  private readonly synth = createToySynth(paperFootballSynthConfig);
  get playbackState(): AudioPlaybackState { return this.synth.playbackState; }
  setVolume(value: number): void { this.synth.setVolume(value); }
  unlock(): Promise<boolean> { return this.synth.unlock(); }
  flick(speed = 1): void { this.synth.trigger('flick', { gain: Math.min(1.25, Math.max(0.4, speed)) }); }
  rail(speed = 1): void { this.synth.trigger('rail', { gain: Math.min(1.2, Math.max(0.35, speed)) }); }
  goal(): void { this.synth.trigger('goal'); }
  destroy(): void { this.synth.destroy(); }
}
