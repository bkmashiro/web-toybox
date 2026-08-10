# @web-toybox/peg-solitaire

Dependency-free Canvas 2D peg solitaire with exact jump rules, move highlighting, procedural wooden clicks, and a Web Component API.

```ts
import { mountPegSolitaire } from '@web-toybox/peg-solitaire';
const puzzle = mountPegSolitaire(document.body, { volume: 0.75 });
puzzle.reset();
```

AudioContext creation is lazy and only occurs in `unlockSound()` after user interaction.
