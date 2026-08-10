import { describe, expect, it } from 'vitest';
import { RetroKendamaElement } from '../packages/kendama/src/kendama';
import { JacobsLadderElement } from '../packages/jacobs-ladder/src/ladder';
import { TinFrogElement } from '../packages/tin-frog/src/frog';
import { RetroYoyoElement } from '../packages/yoyo/src/yoyo';

describe('component volume API', () => {
  it.each([
    ['kendama', RetroKendamaElement],
    ['yoyo', RetroYoyoElement],
    ['jacobs ladder', JacobsLadderElement],
    ['tin frog', TinFrogElement],
  ])('%s exposes setVolume()', (_name, ElementClass) => {
    expect(ElementClass.prototype.setVolume).toBeTypeOf('function');
  });
});
