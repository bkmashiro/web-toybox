# @web-toybox/marble-maze

Dependency-free Canvas 2D marble maze with tilt physics, traps, a brass goal, and procedural sound.

```ts
import { mountMarbleMaze } from '@web-toybox/marble-maze';
const toy = mountMarbleMaze(document.body, { volume: 0.75 });
toy.reset();
```

AudioContext creation is lazy and only occurs in `unlockSound()` after user interaction.
