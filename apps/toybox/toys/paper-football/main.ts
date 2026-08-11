import '../../src/toy-page.css';
import { bindAudioControls } from '../../src/audio-controls';
import { mountPaperFootball } from '@web-toybox/paper-football';
const toy = mountPaperFootball(document.querySelector<HTMLElement>('#stage')!, { sound: true, volume: 0.75 });
bindAudioControls({ target: toy, button: document.querySelector<HTMLButtonElement>('#sound-unlock')!, volume: document.querySelector<HTMLInputElement>('#volume')!, volumeOutput: document.querySelector<HTMLOutputElement>('#volume-output')! });
document.querySelector<HTMLButtonElement>('#kick')!.addEventListener('click', () => toy.kick()); document.querySelector<HTMLButtonElement>('#reset')!.addEventListener('click', toy.reset);
const metric = document.querySelector<HTMLOutputElement>('#metric')!; const status = document.querySelector<HTMLOutputElement>('#status')!;
setInterval(() => { metric.value = `${toy.state.score} 球`; status.value = `${toy.state.shots} 次`; }, 100);
(window as Window & { __paperFootball?: unknown }).__paperFootball = toy;
