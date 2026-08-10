import { describe, expect, it } from 'vitest';
import { createSlidingState, isSolved, moveTile, shuffleSliding } from '../src/model';

describe('sliding puzzle model', () => {
  it('moves only a tile next to the empty cell', () => {
    const state = createSlidingState();
    expect(moveTile(state, 15)).toBe(true);
    expect(state.cells.slice(-2)).toEqual([0, 15]);
    expect(moveTile(state, 1)).toBe(false);
  });

  it('produces a deterministic, solvable, non-finished shuffle', () => {
    const first = createSlidingState();
    const second = createSlidingState();
    shuffleSliding(first, 1979, 160);
    shuffleSliding(second, 1979, 160);
    expect(first.cells).toEqual(second.cells);
    expect(isSolved(first)).toBe(false);
    let safety = 0;
    while (first.history.length && safety < 300) {
      const tile = first.history.pop()!;
      expect(moveTile(first, tile, false)).toBe(true);
      safety += 1;
    }
    expect(isSolved(first)).toBe(true);
  });

  it('counts successful player moves only', () => {
    const state = createSlidingState();
    moveTile(state, 15);
    moveTile(state, 1);
    expect(state.moves).toBe(1);
  });
});
