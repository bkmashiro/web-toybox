import { createToySynth, defineSound, defineSynthConfig, toneLayer, type AudioPlaybackState } from '@web-toybox/toy-audio';

export const pinboardSynthConfig = defineSynthConfig({
  volume: 0.75,
  sounds: {
    peg: defineSound(toneLayer({ wave: 'triangle', frequency: 980, endFrequency: 620, duration: 0.022, gain: 0.045 })),
    pocket: defineSound(toneLayer({ wave: 'sine', frequency: 330, endFrequency: 440, duration: 0.16, gain: 0.105 })),
  },
});
export class PinboardVoice {
  private readonly synth = createToySynth(pinboardSynthConfig);
  get playbackState(): AudioPlaybackState { return this.synth.playbackState; }
  setVolume(value: number): void { this.synth.setVolume(value); }
  unlock(): Promise<boolean> { return this.synth.unlock(); }
  peg(speed = 1): void { this.synth.trigger('peg', { gain: Math.min(1.2, Math.max(0.35, speed)), pitch: 0.85 + Math.random() * 0.22 }); }
  pocket(index: number): void { this.synth.trigger('pocket', { pitch: 0.82 + index * 0.1 }); }
  destroy(): void { this.synth.destroy(); }
}
