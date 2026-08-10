# @web-toybox/tin-frog

Dependency-free wind-up tin frog with spring-energy storage, cam-driven gait, ballistic hops, finite stage bounds, procedural gear/tin sounds, and a Web Component API.

```ts
import { mountTinFrog } from '@web-toybox/tin-frog';

const frog = mountTinFrog(document.body, { volume: 0.75 });
soundButton.addEventListener('click', () => frog.unlockSound());
volumeInput.addEventListener('input', () => {
  frog.setVolume(Number(volumeInput.value) / 100);
});
```

`volume` and `setVolume()` accept a normalized value from `0` to `1`. Audio initialization is lazy and `unlockSound()` must run from a trusted user interaction.
