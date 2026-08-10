import '../../src/toy-page.css';
import { bindAudioControls } from '../../src/audio-controls';
import { mountTinFrog } from '@web-toybox/tin-frog';

const stage = document.querySelector<HTMLElement>('#stage')!;
const soundButton = document.querySelector<HTMLButtonElement>('#sound-unlock')!;
const volume = document.querySelector<HTMLInputElement>('#volume')!;
const volumeOutput = document.querySelector<HTMLOutputElement>('#volume-output')!;
const wind = document.querySelector<HTMLButtonElement>('#wind')!;
const reset = document.querySelector<HTMLButtonElement>('#reset')!;
const energy = document.querySelector('#energy')!;
const phase = document.querySelector('#phase')!;
const hops = document.querySelector('#hops')!;

const toy = mountTinFrog(stage, { sound: true, volume: 0.75 });
bindAudioControls({ target: toy, button: soundButton, volume, volumeOutput });

const start = (event: PointerEvent) => {
  event.preventDefault();
  wind.setPointerCapture(event.pointerId);
  toy.startWinding();
  wind.textContent = '正在上发条…';
};
const stop = () => {
  toy.stopWinding();
  wind.textContent = '按住上发条';
};
wind.addEventListener('pointerdown', start);
wind.addEventListener('pointerup', stop);
wind.addEventListener('pointercancel', stop);
reset.addEventListener('click', toy.reset);

const names = { idle: '待机', winding: '上发条', walking: '凸轮转动', airborne: '跳起', spent: '余力将尽' };
setInterval(() => {
  energy.textContent = `${Math.round(toy.state.springEnergy * 100)}%`;
  phase.textContent = names[toy.state.phase];
  hops.textContent = String(toy.state.hopSerial);
}, 80);

Object.assign(window, { __frog: toy });
