import {
  createToySynth,
  defineSound,
  defineSynthConfig,
  toneLayer,
  type AudioPlaybackState,
} from '@web-toybox/toy-audio';

const hit = (frequency: number, duration: number, gain: number, wave: OscillatorType) =>
  defineSound(toneLayer({
    wave, frequency, endFrequency: Math.max(60, frequency * 0.62),
    duration, gain, filter: { type: 'bandpass', frequency: frequency * 1.5, q: 0.8 },
  }));

export const frogSynthConfig = defineSynthConfig({
  volume: 0.75,
  sounds: {
    gear: hit(980, 0.018, 0.036, 'square'),
    hop: hit(330, 0.055, 0.07, 'triangle'),
    land: hit(190, 0.11, 0.1, 'sawtooth'),
  },
});

export class FrogVoice {
  private readonly synth = createToySynth(frogSynthConfig);

  get playbackState(): AudioPlaybackState { return this.synth.playbackState; }
  setVolume(value: number): void { this.synth.setVolume(value); }
  unlock(): Promise<boolean> { return this.synth.unlock(); }
  gear(): void { this.synth.trigger('gear'); }
  hop(): void { this.synth.trigger('hop'); }
  land(speed = 1): void { this.synth.trigger('land', { gain: Math.min(1.4, speed) }); }
  destroy(): void { this.synth.destroy(); }
}
