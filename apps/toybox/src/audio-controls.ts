export interface AudioControlTarget {
  readonly playbackState: string;
  unlockSound(): Promise<boolean>;
  setVolume(value: number): void;
}

interface ListenerTarget {
  addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
}

interface ButtonControl extends ListenerTarget {
  hidden: boolean;
  disabled: boolean;
  textContent: string | null;
  contains(target: Node | null): boolean;
}

interface VolumeControl extends ListenerTarget {
  value: string;
}

interface VolumeOutput {
  value: string;
}

interface UserActivationState {
  readonly hasBeenActive: boolean;
}

export interface AudioControlsOptions {
  target: AudioControlTarget;
  button: ButtonControl;
  volume: VolumeControl;
  volumeOutput: VolumeOutput;
  eventSource?: ListenerTarget;
  userActivation?: UserActivationState;
}

const UNLOCK_EVENTS = ['touchstart', 'pointerdown', 'click', 'keydown'] as const;

export function bindAudioControls({
  target,
  button,
  volume,
  volumeOutput,
  eventSource = document,
  userActivation = navigator.userActivation,
}: AudioControlsOptions): () => void {
  let inFlight: Promise<boolean> | undefined;
  let armed = true;

  const disarm = (): void => {
    if (!armed) return;
    armed = false;
    for (const type of UNLOCK_EVENTS) eventSource.removeEventListener(type, onGesture, true);
  };

  const markRunning = (): void => {
    button.hidden = true;
    disarm();
  };

  const attempt = (event?: Event): Promise<boolean> => {
    if (event?.isTrusted === false) return Promise.resolve(false);
    if (event?.target && button.contains(event.target as Node)) return Promise.resolve(false);
    if (target.playbackState === 'running') {
      markRunning();
      return Promise.resolve(true);
    }
    if (inFlight) return inFlight;

    button.textContent = '正在打开声音…';
    inFlight = target.unlockSound()
      .then((running) => {
        if (running || target.playbackState === 'running') {
          markRunning();
          return true;
        }
        button.hidden = false;
        button.textContent = target.playbackState === 'unsupported'
          ? '这个浏览器不支持声音'
          : '点一下打开声音';
        button.disabled = target.playbackState === 'unsupported';
        return false;
      })
      .catch(() => {
        button.hidden = false;
        button.textContent = '点一下打开声音';
        return false;
      })
      .finally(() => {
        inFlight = undefined;
      });
    return inFlight;
  };

  function onGesture(event: Event): void {
    void attempt(event);
  }

  const onButton = (): void => {
    void attempt();
  };

  const onVolume = (): void => {
    const percent = Math.min(100, Math.max(0, Number(volume.value) || 0));
    volumeOutput.value = `${Math.round(percent)}%`;
    target.setVolume(percent / 100);
  };

  for (const type of UNLOCK_EVENTS) eventSource.addEventListener(type, onGesture, true);
  button.addEventListener('click', onButton);
  volume.addEventListener('input', onVolume);
  onVolume();

  if (target.playbackState === 'running') markRunning();
  else if (userActivation?.hasBeenActive) void attempt();

  return () => {
    disarm();
    button.removeEventListener('click', onButton);
    volume.removeEventListener('input', onVolume);
  };
}
