import '../../src/toy-page.css';
import { mountKendama } from '@web-toybox/kendama';

const stage = document.querySelector<HTMLElement>('#stage')!;
const soundButton = document.querySelector<HTMLButtonElement>('#sound-unlock')!;
const resetButton = document.querySelector<HTMLButtonElement>('#reset')!;
const releaseButton = document.querySelector<HTMLButtonElement>('#release')!;
const catchOutput = document.querySelector<HTMLOutputElement>('#catch-state')!;
const speedOutput = document.querySelector<HTMLOutputElement>('#ball-speed')!;

const kendama = mountKendama(stage, { sound: true });

soundButton.addEventListener('click', async () => {
  soundButton.textContent = '正在打开…';
  const running = await kendama.unlockSound();
  if (running) soundButton.hidden = true;
  else soundButton.textContent = '再点一下打开声音';
});
resetButton.addEventListener('click', kendama.reset);
releaseButton.addEventListener('click', kendama.release);

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
}, 120);

(window as Window & { __kendama?: unknown }).__kendama = kendama;
