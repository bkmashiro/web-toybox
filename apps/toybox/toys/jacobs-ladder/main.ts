import '../../src/toy-page.css';
import { bindAudioControls } from '../../src/audio-controls';
import { mountJacobsLadder } from '@web-toybox/jacobs-ladder';

const stage = document.querySelector<HTMLElement>('#stage')!;
const soundButton = document.querySelector<HTMLButtonElement>('#sound-unlock')!;
const volume = document.querySelector<HTMLInputElement>('#volume')!;
const volumeOutput = document.querySelector<HTMLOutputElement>('#volume-output')!;
const flip = document.querySelector<HTMLButtonElement>('#flip')!;
const reset = document.querySelector<HTMLButtonElement>('#reset')!;
const phase = document.querySelector('#phase')!;
const count = document.querySelector('#count')!;

const toy = mountJacobsLadder(stage, { slats: 8, sound: true, volume: 0.75 });
bindAudioControls({ target: toy, button: soundButton, volume, volumeOutput });

flip.addEventListener('click', toy.flip);
reset.addEventListener('click', toy.reset);
setInterval(() => {
  phase.textContent = toy.state.phase === 'flipping' ? '接力翻动' : toy.state.phase === 'settled' ? '翻到底' : '待翻';
  const end = toy.state.direction === 1
    ? toy.state.slats.filter((slat) => slat.progress === 1).length
    : toy.state.slats.filter((slat) => slat.progress === 0).length;
  count.textContent = `${end} / ${toy.state.slats.length}`;
}, 80);

Object.assign(window, { __ladder: toy });
