import { describe, expect, it } from 'vitest';
import { createTangramState, hitPiece, movePiece, resizeTangramState, rotatePiece } from '../src/model';

describe('tangram model', () => {
  it('creates the seven classic pieces with unique ids', () => {
    const state = createTangramState(640, 520);
    expect(state.pieces).toHaveLength(7);
    expect(new Set(state.pieces.map((piece) => piece.id)).size).toBe(7);
  });

  it('hits the uppermost polygon rather than its bounding box', () => {
    const state = createTangramState(640, 520);
    const piece = state.pieces[0];
    piece.x = 220;
    piece.y = 180;
    piece.rotation = 0;
    expect(hitPiece(state, 220, 180)).toBe(piece.id);
    expect(hitPiece(state, 10, 10)).toBeUndefined();
  });

  it('moves and rotates one piece without mutating the others', () => {
    const state = createTangramState(640, 520);
    const first = state.pieces[0];
    const initialRotation = first.rotation;
    const untouched = { ...state.pieces[1] };
    movePiece(state, first.id, 300, 240);
    rotatePiece(state, first.id);
    expect(first.x).toBe(300);
    expect(first.y).toBe(240);
    expect(first.rotation).toBeCloseTo(initialRotation + Math.PI / 4);
    expect(state.pieces[1]).toEqual(untouched);
  });

  it('keeps every initial polygon vertex inside a narrow canvas', () => {
    const state = createTangramState(390, 540);
    for (const piece of state.pieces) {
      const cosine = Math.cos(piece.rotation);
      const sine = Math.sin(piece.rotation);
      for (const point of piece.points) {
        const x = piece.x + point.x * cosine - point.y * sine;
        const y = piece.y + point.x * sine + point.y * cosine;
        expect(x).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThanOrEqual(state.width);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(y).toBeLessThanOrEqual(state.height);
      }
    }
  });

  it('keeps an in-progress layout in bounds when the canvas narrows', () => {
    const state = createTangramState(760, 620);
    movePiece(state, 'large-red', 700, 540);
    resizeTangramState(state, 390, 540);
    expect(state.width).toBe(390);
    expect(state.height).toBe(540);
    for (const piece of state.pieces) {
      expect(piece.x).toBeGreaterThanOrEqual(0);
      expect(piece.x).toBeLessThanOrEqual(390);
      expect(piece.y).toBeGreaterThanOrEqual(0);
      expect(piece.y).toBeLessThanOrEqual(540);
    }
  });
});
