import { describe, expect, it } from 'vitest';
import { RetroKendamaElement } from '../packages/kendama/src/kendama';
import { JacobsLadderElement } from '../packages/jacobs-ladder/src/ladder';
import { PegSolitaireElement } from '../packages/peg-solitaire/src/peg-solitaire';
import { SlidingPuzzleElement } from '../packages/sliding-puzzle/src/sliding-puzzle';
import { TangramPuzzleElement } from '../packages/tangram/src/tangram';
import { TinFrogElement } from '../packages/tin-frog/src/frog';
import { RetroYoyoElement } from '../packages/yoyo/src/yoyo';

describe('component volume API', () => {
  it.each([
    ['kendama', RetroKendamaElement],
    ['yoyo', RetroYoyoElement],
    ['jacobs ladder', JacobsLadderElement],
    ['peg solitaire', PegSolitaireElement],
    ['sliding puzzle', SlidingPuzzleElement],
    ['tangram', TangramPuzzleElement],
    ['tin frog', TinFrogElement],
  ])('%s exposes setVolume()', (_name, ElementClass) => {
    expect(ElementClass.prototype.setVolume).toBeTypeOf('function');
  });
});
