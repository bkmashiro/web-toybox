import { describe, expect, it } from 'vitest';
import { createMarbleMazeState, stepMarbleMaze } from '../src/model';

describe('marble maze model', () => {
  it('accelerates from tilt while keeping the ball inside the tray', () => {
    const state = createMarbleMazeState(640, 520);
    const startX = state.ball.x;
    for (let i = 0; i < 30; i += 1) stepMarbleMaze(state, { x: 0.7, y: 0 }, 1 / 60);
    expect(state.ball.x).toBeGreaterThan(startX);
    expect(state.ball.x).toBeLessThanOrEqual(state.width - state.ball.radius);
  });

  it('reflects from a finite wall instead of crossing it', () => {
    const state = createMarbleMazeState(300, 240);
    state.walls = [{ x: 140, y: 30, width: 20, height: 180 }];
    Object.assign(state.ball, { x: 120, y: 100, vx: 260, vy: 0 });
    const result = stepMarbleMaze(state, { x: 0, y: 0 }, 0.05);
    expect(result.wallHit).toBe(true);
    expect(state.ball.x).toBeLessThanOrEqual(140 - state.ball.radius);
    expect(state.ball.vx).toBeLessThan(0);
  });

  it('resets on a trap and wins only at the brass goal', () => {
    const state = createMarbleMazeState(400, 300);
    const trap = state.traps[0];
    Object.assign(state.ball, { x: trap.x, y: trap.y, vx: 0, vy: 0 });
    expect(stepMarbleMaze(state, { x: 0, y: 0 }, 1 / 60).trap).toBe(true);
    expect(state.ball.x).toBe(state.start.x);
    Object.assign(state.ball, { x: state.goal.x, y: state.goal.y, vx: 0, vy: 0 });
    expect(stepMarbleMaze(state, { x: 0, y: 0 }, 1 / 60).won).toBe(true);
    expect(state.status).toBe('won');
  });
});
