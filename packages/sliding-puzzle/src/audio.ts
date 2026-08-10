import {
  createToySynth,
  defineSound,
  defineSynthConfig,
  toneLayer,
  type AudioPlaybackState,
} from '@web-toybox/toy-audio';

export const slidingSynthConfig = defineSynthConfig({
  volume: 0.75,
  sounds: {
    slide: defineSound(toneLayer({
      wave: 'sine', frequency: 240, endFrequency: 172.8,
      duration: 0.075, gain: 0.19,
    })),
  },
});

export class SlidingVoice {
  private readonly synth = createToySynth(slidingSynthConfig);

  get playbackState(): AudioPlaybackState { return this.synth.playbackState; }
  setVolume(value: number): void { this.synth.setVolume(value); }
  unlock(): Promise<boolean> { return this.synth.unlock(); }
  click(pitch = 240): void { this.synth.trigger('slide', { pitch: pitch / 240 }); }
  destroy(): void { this.synth.destroy(); }
}
