# @web-toybox/toy-audio

Zero-dependency, configuration-driven procedural Web Audio for small browser toys. It creates no `AudioContext` during import or construction and ships no recordings or network assets.

## Load a config

```ts
import {
  createToySynth,
  defaultToySynthConfig,
} from '@web-toybox/toy-audio';

const synth = createToySynth(defaultToySynthConfig);

button.addEventListener('click', async (event) => {
  if (!event.isTrusted || !await synth.unlock()) return;
  synth.trigger('wood-click');
});
```

The built-in config contains:

```text
wood-click
tile-slide
ceramic-clack
spring-tick
tin-impact
soft-bounce
```

## Define and customize sounds

```ts
import {
  createToySynth,
  defineSound,
  defineSynthConfig,
  noiseLayer,
  toneLayer,
} from '@web-toybox/toy-audio';

const config = defineSynthConfig({
  volume: 0.75,
  sounds: {
    knock: defineSound(
      toneLayer({
        wave: 'triangle',
        frequency: 420,
        endFrequency: 190,
        duration: 0.09,
        gain: 0.18,
        filter: { type: 'lowpass', frequency: 1600 },
      }),
      noiseLayer({
        duration: 0.025,
        gain: 0.035,
        filter: { type: 'highpass', frequency: 900 },
      }),
    ),
  },
});

const synth = createToySynth(config);
await synth.unlock(); // only from a trusted interaction
synth.trigger('knock', { gain: 1.2, pitch: 0.9, duration: 1.1 });
```

`configure()` merges overrides without discarding already-loaded sounds:

```ts
synth.configure({
  volume: 0.5,
  sounds: {
    knock: customKnock,
  },
});
```

## API shape

- `createToySynth(config?)` — lazy synthesizer instance.
- `defineSynthConfig(config)` — normalize and freeze a synth configuration.
- `defineSound(...layers)` — compose one or more procedural layers.
- `toneLayer(config)` — oscillator, pitch sweep, envelope, and optional filter.
- `noiseLayer(config)` — generated noise burst, envelope, and optional filter.
- `defaultSoundConfigs` / `defaultToySynthConfig` — reusable defaults that can be spread or overridden.
- `synth.trigger(name, overrides?)` — play one named config.
- `synth.configure(partial)` — merge volume and named sounds.
- `synth.playbackState`, `unlock()`, `setVolume()`, `destroy()` — browser audio lifecycle.

All objects are ESM/CJS compatible and SSR-safe to import. Consumers must still call `unlock()` from a real trusted user interaction; programmatic events should be rejected with `event.isTrusted === false`.
