# @web-toybox/jacobs-ladder

Dependency-free deterministic wooden slat cascade with Canvas 2D, Web Component API, Pointer Events, and procedural impact sound.

```ts
import { mountJacobsLadder } from '@web-toybox/jacobs-ladder';

const ladder = mountJacobsLadder(document.body, { volume: 0.75 });
soundButton.addEventListener('click', () => ladder.unlockSound());
volumeInput.addEventListener('input', () => {
  ladder.setVolume(Number(volumeInput.value) / 100);
});
```

`volume` and `setVolume()` accept a normalized value from `0` to `1`. Audio initialization is lazy and `unlockSound()` must run from a trusted user interaction.
