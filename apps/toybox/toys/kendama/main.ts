import '../../src/toy-page.css';
import { bindAudioControls } from '../../src/audio-controls';
import { mountKendama } from '@web-toybox/kendama';

const stage = document.querySelector<HTMLElement>('#stage')!;
const soundButton = document.querySelector<HTMLButtonElement>('#sound-unlock')!;
const volume = document.querySelector<HTMLInputElement>('#volume')!;
const volumeOutput = document.querySelector<HTMLOutputElement>('#volume-output')!;
const resetButton = document.querySelector<HTMLButtonElement>('#reset')!;
const releaseButton = document.querySelector<HTMLButtonElement>('#release')!;
const modeButton = document.querySelector<HTMLButtonElement>('#mode')!;
const catchOutput = document.querySelector<HTMLOutputElement>('#catch-state')!;
const speedOutput = document.querySelector<HTMLOutputElement>('#ball-speed')!;
const holeOutput = document.querySelector<HTMLOutputElement>('#hole-angle')!;

const kendama = mountKendama(stage, { sound: true, volume: 0.75, mode: 'hard' });
bindAudioControls({ target: kendama, button: soundButton, volume, volumeOutput });

resetButton.addEventListener('click', kendama.reset);
releaseButton.addEventListener('click', kendama.release);
modeButton.addEventListener('click', () => {
  const hard = kendama.state.mode !== 'hard';
  kendama.setMode(hard ? 'hard' : 'normal');
  modeButton.setAttribute('aria-pressed', String(hard));
  modeButton.textContent = `困难模式：${hard ? '开' : '关'}`;
});

const names = {
  none: '还在空中',
  'big-cup': '大皿接住了',
  'small-cup': '小皿接住了',
  'base-cup': '中皿接住了',
  spike: '剑尖入玉',
} as const;

setInterval(() => {
  catchOutput.value = names[kendama.state.caught];
  speedOutput.value = `${Math.hypot(kendama.state.ball.vx, kendama.state.ball.vy).toFixed(0)} px/s`;
  const degrees = ((kendama.state.ball.angle * 180 / Math.PI) % 360 + 360) % 360;
  holeOutput.value = `${degrees.toFixed(0)}°`;
}, 120);

(window as Window & { __kendama?: unknown }).__kendama = kendama;
