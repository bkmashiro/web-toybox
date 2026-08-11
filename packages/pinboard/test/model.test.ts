import { describe, expect, it } from 'vitest';
import { createPinboardState, dropPinboardBall, setPinboardLauncher, stepPinboard } from '../src/model';

describe('pinboard model', () => {
  it('clamps the launcher and drops one ball at a time', () => {
    const state = createPinboardState(600, 520);
    setPinboardLauncher(state, -100);
    expect(state.ball.x).toBe(state.ball.radius);
    expect(dropPinboardBall(state)).toBe(true);
    expect(dropPinboardBall(state)).toBe(false);
  });

  it('bounces from a round peg with a reported hit', () => {
    const state = createPinboardState(400, 360);
    const peg = state.pegs[0];
    Object.assign(state.ball, { active: true, x: peg.x, y: peg.y - peg.radius - state.ball.radius + 1, vx: 0, vy: 180 });
    const result = stepPinboard(state, 1 / 60);
    expect(result.pegHits).toBeGreaterThan(0);
    expect(state.ball.vy).toBeLessThan(180);
  });

  it('awards the pocket and prepares the next marble', () => {
    const state = createPinboardState(500, 420);
    Object.assign(state.ball, { active: true, x: 250, y: 400, vx: 0, vy: 120 });
    const result = stepPinboard(state, 1 / 30);
    expect(result.pocket).toBe(2);
    expect(result.scoreDelta).toBe(50);
    expect(state.score).toBe(50);
    expect(state.drops).toBe(1);
    expect(state.ball.active).toBe(false);
  });
});
