import { describe, expect, it } from 'vitest';
import { createPegState, legalMoves, playMove, remainingPegs } from '../src/model';

describe('peg solitaire model', () => {
  it('starts with thirty-two pegs and an empty centre', () => {
    const state = createPegState();
    expect(remainingPegs(state)).toBe(32);
    expect(state.board[3][3]).toBe(0);
  });

  it('allows the four opening jumps into the centre', () => {
    const moves = legalMoves(createPegState());
    expect(moves).toHaveLength(4);
    expect(moves).toContainEqual({ from: [1, 3], over: [2, 3], to: [3, 3] });
  });

  it('removes the jumped peg and rejects an illegal jump', () => {
    const state = createPegState();
    expect(playMove(state, [1, 3], [3, 3])).toBe(true);
    expect(state.board[1][3]).toBe(0);
    expect(state.board[2][3]).toBe(0);
    expect(state.board[3][3]).toBe(1);
    expect(remainingPegs(state)).toBe(31);
    expect(playMove(state, [3, 3], [3, 4])).toBe(false);
  });
});
