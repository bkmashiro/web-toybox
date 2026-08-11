import '../../src/toy-page.css';
import { bindAudioControls } from '../../src/audio-controls';
import { mountPinboard } from '@web-toybox/pinboard';
const toy = mountPinboard(document.querySelector<HTMLElement>('#stage')!, { sound: true, volume: 0.75 });
bindAudioControls({ target: toy, button: document.querySelector<HTMLButtonElement>('#sound-unlock')!, volume: document.querySelector<HTMLInputElement>('#volume')!, volumeOutput: document.querySelector<HTMLOutputElement>('#volume-output')! });
document.querySelector<HTMLButtonElement>('#drop')!.addEventListener('click', () => toy.drop()); document.querySelector<HTMLButtonElement>('#reset')!.addEventListener('click', toy.reset);
const metric = document.querySelector<HTMLOutputElement>('#metric')!; const status = document.querySelector<HTMLOutputElement>('#status')!;
setInterval(() => { metric.value = `${toy.state.score} 分`; status.value = `${toy.state.drops} 颗`; }, 100);
(window as Window & { __pinboard?: unknown }).__pinboard = toy;
