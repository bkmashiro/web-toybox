export interface ToneFilterConfig {
  type?: BiquadFilterType;
  frequency: number;
  q?: number;
  /** 0 keeps the cutoff fixed; 1 follows the trigger pitch multiplier. */
  pitchTracking?: number;
}

export interface ToneLayerConfig {
  kind: 'tone';
  frequency: number;
  endFrequency?: number;
  pitchDuration?: number;
  wave?: OscillatorType;
  duration?: number;
  gain?: number;
  filter?: ToneFilterConfig;
}

export interface NoiseLayerConfig {
  kind: 'noise';
  duration?: number;
  gain?: number;
  filter?: ToneFilterConfig;
}

export type SoundLayerConfig = ToneLayerConfig | NoiseLayerConfig;
export interface SoundConfig { readonly layers: readonly Readonly<SoundLayerConfig>[] }
export interface ToySynthConfig {
  readonly volume: number;
  readonly sounds: Readonly<Record<string, Readonly<SoundConfig>>>;
}
export interface ToySynthConfigInput {
  volume?: number;
  sounds?: Readonly<Record<string, Readonly<SoundConfig>>>;
}
export interface TriggerOptions {
  gain?: number;
  pitch?: number;
  duration?: number;
}

const finite = (value: number | undefined, fallback: number): number => Number.isFinite(value) ? value as number : fallback;
const positive = (value: number | undefined, fallback: number): number => Math.max(0.0001, finite(value, fallback));
const filterConfig = (filter: ToneFilterConfig | undefined): ToneFilterConfig | undefined =>
  filter ? Object.freeze({ ...filter }) : undefined;

export const toneLayer = (config: Omit<ToneLayerConfig, 'kind'>): Readonly<ToneLayerConfig> => Object.freeze({
  ...config,
  kind: 'tone' as const,
  frequency: positive(config.frequency, 440),
  duration: Math.min(4, positive(config.duration, 0.08)),
  gain: Math.max(0, finite(config.gain, 0.12)),
  filter: filterConfig(config.filter),
});

export const noiseLayer = (config: Omit<NoiseLayerConfig, 'kind'> = {}): Readonly<NoiseLayerConfig> => Object.freeze({
  ...config,
  kind: 'noise' as const,
  duration: Math.min(4, positive(config.duration, 0.05)),
  gain: Math.max(0, finite(config.gain, 0.08)),
  filter: filterConfig(config.filter),
});

export const defineSound = (...layers: readonly Readonly<SoundLayerConfig>[]): Readonly<SoundConfig> => Object.freeze({
  layers: Object.freeze([...layers]),
});

export const defineSynthConfig = (input: ToySynthConfigInput = {}): Readonly<ToySynthConfig> => Object.freeze({
  volume: Math.min(1, Math.max(0, finite(input.volume, 0.75))),
  sounds: Object.freeze({ ...(input.sounds ?? {}) }),
});

export const mergeSynthConfig = (
  base: Readonly<ToySynthConfig>,
  next: ToySynthConfigInput,
): Readonly<ToySynthConfig> => defineSynthConfig({
  volume: next.volume ?? base.volume,
  sounds: { ...base.sounds, ...(next.sounds ?? {}) },
});
