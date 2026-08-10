import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createToySynth,
  defaultSoundConfigs,
  defaultToySynthConfig,
  defineSound,
  defineSynthConfig,
  noiseLayer,
  toneLayer,
} from '../src';

class FakeParam {
  values: number[] = [];
  value = 0;
  setValueAtTime(value: number): void { this.values.push(value); this.value = value; }
  exponentialRampToValueAtTime(value: number): void { this.values.push(value); this.value = value; }
  linearRampToValueAtTime(value: number): void { this.values.push(value); this.value = value; }
}

class FakeNode {
  connect(): this { return this; }
}

class FakeOscillator extends FakeNode {
  type: OscillatorType = 'sine';
  frequency = new FakeParam();
  started = false;
  stopped = false;
  start(): void { this.started = true; }
  stop(): void { this.stopped = true; }
}

class FakeGain extends FakeNode { gain = new FakeParam(); }
class FakeFilter extends FakeNode {
  type: BiquadFilterType = 'lowpass';
  frequency = new FakeParam();
  Q = new FakeParam();
}
class FakeBufferSource extends FakeNode {
  buffer?: AudioBuffer;
  started = false;
  stopped = false;
  start(): void { this.started = true; }
  stop(): void { this.stopped = true; }
}

class FakeAudioContext {
  static instances: FakeAudioContext[] = [];
  state: AudioContextState = 'suspended';
  currentTime = 1;
  destination = new FakeNode();
  oscillators: FakeOscillator[] = [];
  gains: FakeGain[] = [];
  filters: FakeFilter[] = [];
  buffers: Float32Array[] = [];
  sources: FakeBufferSource[] = [];
  constructor() { FakeAudioContext.instances.push(this); }
  async resume(): Promise<void> { this.state = 'running'; }
  async close(): Promise<void> { this.state = 'closed'; }
  createOscillator(): OscillatorNode { const node = new FakeOscillator(); this.oscillators.push(node); return node as unknown as OscillatorNode; }
  createGain(): GainNode { const node = new FakeGain(); this.gains.push(node); return node as unknown as GainNode; }
  createBiquadFilter(): BiquadFilterNode { const node = new FakeFilter(); this.filters.push(node); return node as unknown as BiquadFilterNode; }
  createBuffer(_channels: number, length: number): AudioBuffer {
    const data = new Float32Array(length); this.buffers.push(data);
    return { getChannelData: () => data } as unknown as AudioBuffer;
  }
  createBufferSource(): AudioBufferSourceNode { const node = new FakeBufferSource(); this.sources.push(node); return node as unknown as AudioBufferSourceNode; }
}

beforeEach(() => {
  FakeAudioContext.instances = [];
  vi.stubGlobal('window', { AudioContext: FakeAudioContext });
});
afterEach(() => vi.unstubAllGlobals());

describe('configuration-driven toy synth', () => {
  it('stays lazy until unlock and reuses one running context', async () => {
    const synth = createToySynth(defaultToySynthConfig);
    expect(synth.playbackState).toBe('uninitialized');
    expect(FakeAudioContext.instances).toHaveLength(0);
    await expect(synth.unlock()).resolves.toBe(true);
    await expect(synth.unlock()).resolves.toBe(true);
    expect(synth.playbackState).toBe('running');
    expect(FakeAudioContext.instances).toHaveLength(1);
  });

  it('reports unsupported without constructing a context', async () => {
    vi.stubGlobal('window', {});
    const synth = createToySynth(defaultToySynthConfig);
    expect(synth.playbackState).toBe('unsupported');
    await expect(synth.unlock()).resolves.toBe(false);
    expect(FakeAudioContext.instances).toHaveLength(0);
  });

  it('clamps finite volume and true mute creates no source', async () => {
    const synth = createToySynth(defineSynthConfig({ volume: 2, sounds: defaultSoundConfigs }));
    expect(synth.volume).toBe(1);
    await synth.unlock();
    synth.setVolume(-1);
    expect(synth.volume).toBe(0);
    expect(synth.trigger('wood-click')).toBe(false);
    expect(FakeAudioContext.instances[0].oscillators).toHaveLength(0);
    synth.setVolume(Number.NaN);
    expect(synth.volume).toBe(0);
  });

  it('closes cleanly and can unlock a fresh context after destroy', async () => {
    const synth = createToySynth(defaultToySynthConfig);
    await synth.unlock();
    synth.destroy();
    expect(synth.playbackState).toBe('uninitialized');
    await synth.unlock();
    expect(FakeAudioContext.instances).toHaveLength(2);
  });

  it('loads a custom layered config and applies trigger overrides', async () => {
    const config = defineSynthConfig({
      volume: 0.5,
      sounds: {
        custom: defineSound(
          toneLayer({ wave: 'triangle', frequency: 420, endFrequency: 180, duration: 0.08, gain: 0.2, filter: { type: 'lowpass', frequency: 1700, pitchTracking: 1 } }),
          noiseLayer({ duration: 0.04, gain: 0.1, filter: { type: 'highpass', frequency: 900 } }),
        ),
      },
    });
    const synth = createToySynth(config);
    await synth.unlock();
    expect(synth.trigger('custom', { pitch: 0.5, gain: 2, duration: 1.5 })).toBe(true);
    const context = FakeAudioContext.instances[0];
    expect(context.oscillators[0].type).toBe('triangle');
    expect(context.oscillators[0].frequency.values).toEqual([210, 90]);
    expect(context.gains[0].gain.values.every(Number.isFinite)).toBe(true);
    expect(context.filters[0].frequency.values).toEqual([850]);
    expect(context.sources).toHaveLength(1);
    expect([...context.buffers[0]].every(Number.isFinite)).toBe(true);
  });

  it('merges custom sounds at runtime without discarding loaded defaults', async () => {
    const synth = createToySynth(defaultToySynthConfig);
    synth.configure({ sounds: { extra: defineSound(toneLayer({ frequency: 510 })) } });
    await synth.unlock();
    expect(synth.trigger('wood-click')).toBe(true);
    expect(synth.trigger('extra')).toBe(true);
    expect(synth.trigger('missing')).toBe(false);
  });

  it('ships six immutable default sound configurations', async () => {
    const synth = createToySynth(defaultToySynthConfig);
    await synth.unlock();
    expect(Object.keys(defaultSoundConfigs)).toEqual([
      'wood-click', 'tile-slide', 'ceramic-clack', 'spring-tick', 'tin-impact', 'soft-bounce',
    ]);
    expect(Object.isFrozen(defaultSoundConfigs)).toBe(true);
    expect(Object.isFrozen(defaultSoundConfigs['wood-click'].layers[0])).toBe(true);
    expect(Object.isFrozen(defaultSoundConfigs['ceramic-clack'].layers[0].filter)).toBe(true);
    expect(Object.values(defaultSoundConfigs).map((sound) => synth.trigger(
      Object.entries(defaultSoundConfigs).find(([, candidate]) => candidate === sound)![0],
    ))).toEqual([true, true, true, true, true, true]);
    const context = FakeAudioContext.instances[0];
    expect(context.oscillators.length + context.sources.length).toBeGreaterThanOrEqual(6);
  });
});
