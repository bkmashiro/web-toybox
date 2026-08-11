import '../../src/toy-page.css';
import { bindAudioControls } from '../../src/audio-controls';
import { mountMarbleMaze } from '@web-toybox/marble-maze';
const toy = mountMarbleMaze(document.querySelector<HTMLElement>('#stage')!, { sound: true, volume: 0.75 });
bindAudioControls({ target: toy, button: document.querySelector<HTMLButtonElement>('#sound-unlock')!, volume: document.querySelector<HTMLInputElement>('#volume')!, volumeOutput: document.querySelector<HTMLOutputElement>('#volume-output')! });
document.querySelector<HTMLButtonElement>('#reset')!.addEventListener('click', toy.reset);
const metric = document.querySelector<HTMLOutputElement>('#metric')!; const status = document.querySelector<HTMLOutputElement>('#status')!;
setInterval(() => { metric.value = `${Math.abs(toy.state.elapsed).toFixed(1)} 秒`; status.value = toy.state.status === 'won' ? `进洞 · 掉落 ${toy.state.falls}` : toy.state.falls ? `掉落 ${toy.state.falls} 次` : '找出口'; }, 100);
(window as Window & { __marbleMaze?: unknown }).__marbleMaze = toy;
