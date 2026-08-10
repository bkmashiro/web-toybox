import { defineSound, defineSynthConfig, noiseLayer, toneLayer } from './config';

export const defaultSoundConfigs = /* @__PURE__ */ (() => Object.freeze({
  'wood-click': defineSound(toneLayer({
    wave: 'triangle', frequency: 360, duration: 0.055, gain: 0.16,
  })),
  'tile-slide': defineSound(toneLayer({
    wave: 'sine', frequency: 240, endFrequency: 173, duration: 0.075, gain: 0.19,
  })),
  'ceramic-clack': defineSound(toneLayer({
    wave: 'triangle', frequency: 300, endFrequency: 174, duration: 0.095, gain: 0.18,
    filter: { type: 'lowpass', frequency: 1_800 },
  })),
  'spring-tick': defineSound(toneLayer({
    wave: 'square', frequency: 620, endFrequency: 330, duration: 0.045, gain: 0.09,
    filter: { type: 'bandpass', frequency: 1_100, q: 1.2 },
  })),
  'tin-impact': defineSound(
    toneLayer({
      wave: 'triangle', frequency: 420, endFrequency: 150, duration: 0.1, gain: 0.12,
      filter: { type: 'bandpass', frequency: 900, q: 0.8 },
    }),
    noiseLayer({ duration: 0.055, gain: 0.045, filter: { type: 'lowpass', frequency: 1_500 } }),
  ),
  'soft-bounce': defineSound(toneLayer({
    wave: 'sine', frequency: 170, endFrequency: 95, duration: 0.08, gain: 0.11,
  })),
}))();

export const defaultToySynthConfig = /* @__PURE__ */ defineSynthConfig({
  volume: 0.75,
  sounds: defaultSoundConfigs,
});
