import { describe, expect, it } from 'vitest';
import { bindAudioControls } from '../src/audio-controls';

type Listener = (event: { target?: unknown; isTrusted?: boolean }) => void;

class FakeEventSource {
  readonly listeners = new Map<string, Set<Listener>>();

  addEventListener(type: string, listener: EventListenerOrEventListenerObject): void {
    const set = this.listeners.get(type) ?? new Set<Listener>();
    set.add(listener as Listener);
    this.listeners.set(type, set);
  }

  removeEventListener(type: string, listener: EventListenerOrEventListenerObject): void {
    this.listeners.get(type)?.delete(listener as Listener);
  }

  emit(type: string, target: unknown = {}, isTrusted = true): void {
    for (const listener of [...(this.listeners.get(type) ?? [])]) listener({ target, isTrusted });
  }

  count(): number {
    return [...this.listeners.values()].reduce((sum, listeners) => sum + listeners.size, 0);
  }
}

class FakeControl extends FakeEventSource {
  hidden = false;
  disabled = false;
  textContent = '';
  value = '75';

  contains(target: unknown): boolean {
    return target === this;
  }
}

const settle = async (): Promise<void> => {
  await Promise.resolve();
  await Promise.resolve();
};

function createTarget(results: boolean[]) {
  return {
    playbackState: 'uninitialized',
    unlockCalls: 0,
    volumes: [] as number[],
    async unlockSound() {
      this.unlockCalls += 1;
      const running = results.shift() ?? false;
      this.playbackState = running ? 'running' : 'suspended';
      return running;
    },
    setVolume(value: number) {
      this.volumes.push(value);
    },
  };
}

describe('bindAudioControls', () => {
  it('ignores synthetic interactions', async () => {
    const events = new FakeEventSource();
    const button = new FakeControl();
    const volume = new FakeControl();
    const output = new FakeControl();
    const target = createTarget([true]);

    bindAudioControls({ target, button, volume, volumeOutput: output, eventSource: events, userActivation: { hasBeenActive: false } });
    events.emit('pointerdown', {}, false);
    await settle();
    expect(target.unlockCalls).toBe(0);
    expect(target.playbackState).toBe('uninitialized');
  });

  it('unlocks on the first ordinary trusted interaction and disarms after running', async () => {
    const events = new FakeEventSource();
    const button = new FakeControl();
    const volume = new FakeControl();
    const output = new FakeControl();
    const target = createTarget([true]);

    bindAudioControls({ target, button, volume, volumeOutput: output, eventSource: events, userActivation: { hasBeenActive: false } });

    expect(target.unlockCalls).toBe(0);
    expect(events.count()).toBe(4);
    events.emit('pointerdown');
    await settle();

    expect(target.unlockCalls).toBe(1);
    expect(button.hidden).toBe(true);
    expect(events.count()).toBe(0);
  });

  it('keeps gesture fallbacks armed after a failed resume', async () => {
    const events = new FakeEventSource();
    const button = new FakeControl();
    const volume = new FakeControl();
    const output = new FakeControl();
    const target = createTarget([false, true]);

    bindAudioControls({ target, button, volume, volumeOutput: output, eventSource: events, userActivation: { hasBeenActive: false } });
    events.emit('touchstart');
    await settle();

    expect(button.hidden).toBe(false);
    expect(button.textContent).toContain('点一下');
    expect(events.count()).toBe(4);

    events.emit('click');
    await settle();
    expect(target.unlockCalls).toBe(2);
    expect(button.hidden).toBe(true);
  });

  it('uses prior browser activation without demanding another click', async () => {
    const events = new FakeEventSource();
    const button = new FakeControl();
    const volume = new FakeControl();
    const output = new FakeControl();
    const target = createTarget([true]);

    bindAudioControls({ target, button, volume, volumeOutput: output, eventSource: events, userActivation: { hasBeenActive: true } });
    await settle();

    expect(target.unlockCalls).toBe(1);
    expect(button.hidden).toBe(true);
  });

  it('leaves the explicit sound button to its own handler', async () => {
    const events = new FakeEventSource();
    const button = new FakeControl();
    const volume = new FakeControl();
    const output = new FakeControl();
    const target = createTarget([true]);

    bindAudioControls({ target, button, volume, volumeOutput: output, eventSource: events, userActivation: { hasBeenActive: false } });
    events.emit('pointerdown', button);
    await settle();
    expect(target.unlockCalls).toBe(0);

    button.emit('click', button);
    await settle();
    expect(target.unlockCalls).toBe(1);
  });

  it('normalizes the volume slider and updates its visible percentage', () => {
    const events = new FakeEventSource();
    const button = new FakeControl();
    const volume = new FakeControl();
    const output = new FakeControl();
    const target = createTarget([]);

    bindAudioControls({ target, button, volume, volumeOutput: output, eventSource: events, userActivation: { hasBeenActive: false } });
    expect(target.volumes).toEqual([0.75]);
    expect(output.value).toBe('75%');

    volume.value = '140';
    volume.emit('input', volume);
    expect(target.volumes.at(-1)).toBe(1);
    expect(output.value).toBe('100%');
  });
});
