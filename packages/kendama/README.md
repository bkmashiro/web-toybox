# @web-toybox/kendama

A dependency-free, physics-driven kendama for the browser.

```ts
import { mountKendama } from '@web-toybox/kendama';

const kendama = mountKendama(document.body, {
  mode: 'hard',
  volume: 0.75,
});

soundButton.addEventListener('click', () => kendama.unlockSound());
volumeInput.addEventListener('input', () => {
  kendama.setVolume(Number(volumeInput.value) / 100);
});
```

`volume` and `setVolume()` accept a normalized value from `0` to `1`. Web Audio remains lazy: call `unlockSound()` from a trusted user interaction. No `AudioContext` is created during import or construction.

Or use the registered Web Component:

```html
<retro-kendama></retro-kendama>
```

The package has no runtime dependencies. It uses Canvas 2D, Pointer Events and Web Audio.

Normal mode offers forgiving proximity catches. Hard mode gives the ball angular state, attaches the string at the rotating hole, resolves finite ball/cup contact, and requires the hole position, angle, and relative speed to line up before spike insertion.
