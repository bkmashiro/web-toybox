# @web-toybox/pinboard

Dependency-free Canvas 2D brass peg pinboard with marble collisions, scoring pockets, and procedural sound.

```ts
import { mountPinboard } from '@web-toybox/pinboard';
const toy = mountPinboard(document.body, { volume: 0.75 });
toy.reset();
```

AudioContext creation is lazy and only occurs in `unlockSound()` after user interaction.
