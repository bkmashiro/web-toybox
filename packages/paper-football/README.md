# @web-toybox/paper-football

Dependency-free Canvas 2D tabletop paper football with flick physics, rails, goals, and procedural sound.

```ts
import { mountPaperFootball } from '@web-toybox/paper-football';
const toy = mountPaperFootball(document.body, { volume: 0.75 });
toy.reset();
```

AudioContext creation is lazy and only occurs in `unlockSound()` after user interaction.
