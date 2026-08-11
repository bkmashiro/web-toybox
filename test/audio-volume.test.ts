import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { KendamaVoice } from '../packages/kendama/src/audio';
import { LadderVoice } from '../packages/jacobs-ladder/src/audio';
import { MarbleMazeVoice } from '../packages/marble-maze/src/audio';
import { PaperFootballVoice } from '../packages/paper-football/src/audio';
import { PegVoice } from '../packages/peg-solitaire/src/audio';
import { PinboardVoice } from '../packages/pinboard/src/audio';
import { SlidingVoice } from '../packages/sliding-puzzle/src/audio';
import { TangramVoice } from '../packages/tangram/src/audio';
import { FrogVoice } from '../packages/tin-frog/src/audio';
import { YoyoVoice } from '../packages/yoyo/src/audio';

class FakeParam {
  private current = 0;
  readonly assigned: number[] = [];
  readonly targets: number[] = [];
  get value(): number { return this.current; }
  set value(value: number) { this.current = value; this.assigned.push(value); }
  setValueAtTime(value: number): void { this.value = value; }
  setTargetAtTime(value: number): void { this.value = value; this.targets.push(value); }
  exponentialRampToValueAtTime(value: number): void { this.value = value; }
}

class FakeNode {
  connect<T>(target: T): T { return target; }
}

class FakeGain extends FakeNode {
  gain = new FakeParam();
}

class FakeOscillator extends FakeNode {
  type: OscillatorType = 'sine';
  frequency = new FakeParam();
  start(): void {}
  stop(): void {}
}

class FakeFilter extends FakeNode {
  type: BiquadFilterType = 'lowpass';
  frequency = new FakeParam();
  Q = new FakeParam();
}

class FakeAudioContext {
  static instances: FakeAudioContext[] = [];
  state: AudioContextState = 'suspended';
  currentTime = 0;
  destination = new FakeNode();
  readonly calls = ['construct'];
  readonly gains: FakeGain[] = [];

  constructor() { FakeAudioContext.instances.push(this); }
  async resume(): Promise<void> { this.calls.push('resume'); this.state = 'running'; }
  async close(): Promise<void> { this.state = 'closed'; }
  createOscillator(): OscillatorNode {
    this.calls.push('oscillator');
    return new FakeOscillator() as unknown as OscillatorNode;
  }
  createGain(): GainNode {
    this.calls.push('gain');
    const gain = new FakeGain();
    this.gains.push(gain);
    return gain as unknown as GainNode;
  }
  createBiquadFilter(): BiquadFilterNode {
    this.calls.push('filter');
    return new FakeFilter() as unknown as BiquadFilterNode;
  }
}

const latestContext = (): FakeAudioContext => FakeAudioContext.instances[FakeAudioContext.instances.length - 1];

describe('procedural voice volume', () => {
  beforeEach(() => {
    FakeAudioContext.instances = [];
    vi.stubGlobal('window', { AudioContext: FakeAudioContext });
  });

  afterEach(() => vi.unstubAllGlobals());

  it('resumes before building the continuous yoyo graph', async () => {
    const voice = new YoyoVoice();
    await voice.unlock();
    const calls = FakeAudioContext.instances[0].calls;
    expect(calls.indexOf('resume')).toBeLessThan(calls.indexOf('oscillator'));
  });

  it('keeps new toy audio lazy until unlock and applies public volume', async () => {
    const voices = [new TangramVoice(), new SlidingVoice(), new PegVoice()];
    expect(FakeAudioContext.instances).toHaveLength(0);
    for (const voice of voices) {
      voice.setVolume(1);
      await voice.unlock();
      voice.click();
    }
    expect(FakeAudioContext.instances).toHaveLength(3);
    expect(FakeAudioContext.instances.map((context) => context.gains[0].gain.assigned[0])).toEqual([0.16, 0.19, 0.18]);
  });

  it('reports unsupported audio without constructing a context', () => {
    vi.stubGlobal('window', {});
    expect([new TangramVoice(), new SlidingVoice(), new PegVoice(), new MarbleMazeVoice(), new PinboardVoice(), new PaperFootballVoice()].map((voice) => voice.playbackState))
      .toEqual(['unsupported', 'unsupported', 'unsupported', 'unsupported', 'unsupported', 'unsupported']);
    expect(FakeAudioContext.instances).toHaveLength(0);
  });

  it('keeps all three physical game voices lazy and volume-controlled', async () => {
    const maze = new MarbleMazeVoice();
    const pinboard = new PinboardVoice();
    const football = new PaperFootballVoice();
    expect(FakeAudioContext.instances).toHaveLength(0);
    for (const voice of [maze, pinboard, football]) {
      voice.setVolume(0.4);
      await voice.unlock();
    }
    maze.wall();
    pinboard.peg();
    football.rail();
    expect(FakeAudioContext.instances).toHaveLength(3);
  });

  it('applies a normalized maximum volume to every voice', async () => {
    const kendama = new KendamaVoice();
    kendama.setVolume(1);
    await kendama.unlock();
    kendama.strike(3200, 'edge');
    expect(latestContext().gains[0].gain.assigned).toContainEqual(0.44);

    const ladder = new LadderVoice();
    ladder.setVolume(1);
    await ladder.unlock();
    ladder.strike(0, 8);
    expect(latestContext().gains[0].gain.assigned).toContainEqual(0.11);

    const frog = new FrogVoice();
    frog.setVolume(1);
    await frog.unlock();
    frog.land(1);
    expect(latestContext().gains[0].gain.assigned).toContainEqual(0.1);

    const yoyo = new YoyoVoice();
    yoyo.setVolume(1);
    await yoyo.unlock();
    yoyo.update(110, true, 'sleeping');
    const yoyoTargets = latestContext().gains[0].gain.targets;
    expect(yoyoTargets[yoyoTargets.length - 1]).toBeCloseTo(0.036);
  });

  it('clamps out-of-range public volume values', async () => {
    const voice = new KendamaVoice();
    voice.setVolume(-5);
    await voice.unlock();
    voice.strike(3200, 'edge');
    expect(FakeAudioContext.instances[0].gains).toHaveLength(0);
  });
});
