# @web-toybox/yoyo

Dependency-free Canvas 2D yo-yo with string constraint, disc spin, sleep and return phases, Pointer Events, and procedural Web Audio.

```ts
import { mountYoyo } from '@web-toybox/yoyo';

const yoyo = mountYoyo(document.body, { volume: 0.75 });
soundButton.addEventListener('click', () => yoyo.unlockSound());
volumeInput.addEventListener('input', () => {
  yoyo.setVolume(Number(volumeInput.value) / 100);
});
```

`volume` and `setVolume()` accept a normalized value from `0` to `1`. Audio initialization is lazy and `unlockSound()` must run from a trusted user interaction.
