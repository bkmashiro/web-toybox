import {
  createToySynth,
  defineSound,
  defineSynthConfig,
  toneLayer,
  type AudioPlaybackState,
} from '@web-toybox/toy-audio';

export const pegSynthConfig = defineSynthConfig({
  volume: 0.75,
  sounds: {
    clack: defineSound(toneLayer({
      wave: 'triangle', frequency: 300, endFrequency: 174,
      duration: 0.095, gain: 0.18,
    })),
  },
});

export class PegVoice {
  private readonly synth = createToySynth(pegSynthConfig);

  get playbackState(): AudioPlaybackState { return this.synth.playbackState; }
  setVolume(value: number): void { this.synth.setVolume(value); }
  unlock(): Promise<boolean> { return this.synth.unlock(); }
  click(pitch = 300): void { this.synth.trigger('clack', { pitch: pitch / 300 }); }
  destroy(): void { this.synth.destroy(); }
}
