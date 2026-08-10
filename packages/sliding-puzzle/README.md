# @web-toybox/sliding-puzzle

Dependency-free solvable fifteen puzzle with deterministic legal-move shuffling, keyboard control, procedural wooden clicks, and a Web Component API.

```ts
import { mountSlidingPuzzle } from '@web-toybox/sliding-puzzle';
const puzzle = mountSlidingPuzzle(document.body, { volume: 0.75 });
puzzle.shuffle(1979);
```

AudioContext creation is lazy and only occurs in `unlockSound()` after user interaction.
