import {
  createToySynth,
  defineSound,
  defineSynthConfig,
  toneLayer,
  type AudioPlaybackState,
} from '@web-toybox/toy-audio';

export const tangramSynthConfig = defineSynthConfig({
  volume: 0.75,
  sounds: {
    click: defineSound(toneLayer({
      wave: 'triangle', frequency: 360, duration: 0.055, gain: 0.16,
    })),
  },
});

export class TangramVoice {
  private readonly synth = createToySynth(tangramSynthConfig);

  get playbackState(): AudioPlaybackState { return this.synth.playbackState; }
  setVolume(value: number): void { this.synth.setVolume(value); }
  unlock(): Promise<boolean> { return this.synth.unlock(); }
  click(pitch = 360): void { this.synth.trigger('click', { pitch: pitch / 360 }); }
  destroy(): void { this.synth.destroy(); }
}
