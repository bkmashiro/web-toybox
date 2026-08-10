import '../../src/toy-page.css';
import { bindAudioControls } from '../../src/audio-controls';
import { mountYoyo } from '@web-toybox/yoyo';

const stage = document.querySelector<HTMLElement>('#stage')!;
const soundButton = document.querySelector<HTMLButtonElement>('#sound-unlock')!;
const volume = document.querySelector<HTMLInputElement>('#volume')!;
const volumeOutput = document.querySelector<HTMLOutputElement>('#volume-output')!;
const returnButton = document.querySelector<HTMLButtonElement>('#return')!;
const releaseButton = document.querySelector<HTMLButtonElement>('#release')!;
const resetButton = document.querySelector<HTMLButtonElement>('#reset')!;
const phase = document.querySelector<HTMLOutputElement>('#phase')!;
const spin = document.querySelector<HTMLOutputElement>('#spin')!;
const length = document.querySelector<HTMLOutputElement>('#length')!;

const yoyo = mountYoyo(stage, { sound: true, volume: 0.75 });
bindAudioControls({ target: yoyo, button: soundButton, volume, volumeOutput });

returnButton.addEventListener('click', yoyo.return);
releaseButton.addEventListener('click', yoyo.release);
resetButton.addEventListener('click', yoyo.reset);

const names = { falling: '下落', sleeping: '睡眠', returning: '回线' } as const;
setInterval(() => {
  phase.value = names[yoyo.state.phase];
  spin.value = `${Math.abs(yoyo.state.disc.angularVelocity).toFixed(0)} rad/s`;
  length.value = `${yoyo.state.stringLength.toFixed(0)} px`;
}, 120);

(window as Window & { __yoyo?: unknown }).__yoyo = yoyo;
