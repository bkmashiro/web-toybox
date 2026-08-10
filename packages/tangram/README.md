# @web-toybox/tangram

Dependency-free Canvas 2D tangram with polygon hit-testing, drag, 45° rotation, procedural click sound, and a Web Component API.

```ts
import { mountTangram } from '@web-toybox/tangram';
const puzzle = mountTangram(document.body, { volume: 0.75 });
puzzle.reset();
```

AudioContext creation is lazy and only occurs in `unlockSound()` after user interaction.
