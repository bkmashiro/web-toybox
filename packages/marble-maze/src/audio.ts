import { createToySynth, defineSound, defineSynthConfig, noiseLayer, toneLayer, type AudioPlaybackState } from '@web-toybox/toy-audio';

export const marbleMazeSynthConfig = defineSynthConfig({
  volume: 0.75,
  sounds: {
    wall: defineSound(toneLayer({ wave: 'triangle', frequency: 390, endFrequency: 250, duration: 0.045, gain: 0.09 })),
    trap: defineSound(noiseLayer({ duration: 0.13, gain: 0.1, filter: { type: 'lowpass', frequency: 780, q: 0.7 } })),
    goal: defineSound(
      toneLayer({ wave: 'sine', frequency: 523, duration: 0.22, gain: 0.09 }),
      toneLayer({ wave: 'triangle', frequency: 784, duration: 0.27, gain: 0.065 }),
    ),
  },
});
export class MarbleMazeVoice {
  private readonly synth = createToySynth(marbleMazeSynthConfig);
  get playbackState(): AudioPlaybackState { return this.synth.playbackState; }
  setVolume(value: number): void { this.synth.setVolume(value); }
  unlock(): Promise<boolean> { return this.synth.unlock(); }
  wall(speed = 1): void { this.synth.trigger('wall', { gain: Math.min(1.25, Math.max(0.3, speed)) }); }
  trap(): void { this.synth.trigger('trap'); }
  goal(): void { this.synth.trigger('goal'); }
  destroy(): void { this.synth.destroy(); }
}
