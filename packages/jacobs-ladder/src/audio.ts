import {
  createToySynth,
  defineSound,
  defineSynthConfig,
  toneLayer,
  type AudioPlaybackState,
} from '@web-toybox/toy-audio';

export const ladderSynthConfig = defineSynthConfig({
  volume: 0.75,
  sounds: {
    strike: defineSound(toneLayer({
      wave: 'triangle', frequency: 250, duration: 0.075, gain: 0.11,
      filter: { type: 'lowpass', frequency: 1_250 },
    })),
  },
});

export class LadderVoice {
  private readonly synth = createToySynth(ladderSynthConfig);

  get playbackState(): AudioPlaybackState { return this.synth.playbackState; }
  setVolume(value: number): void { this.synth.setVolume(value); }
  unlock(): Promise<boolean> { return this.synth.unlock(); }

  strike(index: number, count: number): void {
    const frequency = 250 + index / Math.max(1, count) * 170;
    this.synth.trigger('strike', { pitch: frequency / 250 });
  }

  destroy(): void { this.synth.destroy(); }
}
