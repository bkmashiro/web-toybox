import { describe, expect, it } from 'vitest';
import { createPaperFootballState, kickPaperFootball, stepPaperFootball } from '../src/model';

describe('paper football model', () => {
  it('accepts one bounded flick while the paper is resting', () => {
    const state = createPaperFootballState(600, 500);
    expect(kickPaperFootball(state, 5000, -5000)).toBe(true);
    expect(Math.hypot(state.paper.vx, state.paper.vy)).toBeLessThanOrEqual(900.001);
    expect(state.shots).toBe(1);
    expect(kickPaperFootball(state, 0, -200)).toBe(false);
  });

  it('rebounds from the side rail', () => {
    const state = createPaperFootballState(400, 400);
    Object.assign(state.paper, { x: state.paper.radius + 1, y: 200, vx: -300, vy: 0, moving: true });
    const result = stepPaperFootball(state, 1 / 30);
    expect(result.railHit).toBe(true);
    expect(state.paper.vx).toBeGreaterThan(0);
  });

  it('scores only through the top goal mouth and resets the paper', () => {
    const state = createPaperFootballState(600, 500);
    Object.assign(state.paper, { x: state.width / 2, y: state.paper.radius + 1, vx: 0, vy: -260, moving: true });
    const result = stepPaperFootball(state, 1 / 30);
    expect(result.goal).toBe(true);
    expect(state.score).toBe(1);
    expect(state.paper.moving).toBe(false);
    expect(state.paper.y).toBe(state.start.y);
  });
});
