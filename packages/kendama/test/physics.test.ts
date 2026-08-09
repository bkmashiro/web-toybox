import { describe, expect, it } from 'vitest';
import { createKendamaState, getKendamaGeometry, stepKendama } from '../src/physics';

const finiteState = (state: ReturnType<typeof createKendamaState>) => [
  state.handle.x, state.handle.y, state.handle.vx, state.handle.vy,
  state.ball.x, state.ball.y, state.ball.vx, state.ball.vy,
].every(Number.isFinite);

describe('kendama physics', () => {
  it('stays finite and keeps the ball inside the rope constraint', () => {
    const state = createKendamaState(390, 720);
    state.ball.x += 900;
    state.ball.y += 700;

    stepKendama(state, { held: false, x: 0, y: 0 }, 1 / 60, { width: 390, height: 720 });

    const anchor = getKendamaGeometry(state).stringAnchor;
    const distance = Math.hypot(state.ball.x - anchor.x, state.ball.y - anchor.y);
    expect(finiteState(state)).toBe(true);
    expect(distance).toBeLessThanOrEqual(state.ropeLength + 0.001);
  });

  it('moves the wooden body toward a held pointer', () => {
    const state = createKendamaState(800, 700);
    const before = state.handle.x;

    for (let index = 0; index < 12; index += 1) {
      stepKendama(state, { held: true, x: 650, y: 250 }, 1 / 120, { width: 800, height: 700 });
    }

    expect(state.handle.x).toBeGreaterThan(before + 20);
  });

  it('catches a descending ball in the large cup', () => {
    const state = createKendamaState(800, 700);
    const cup = getKendamaGeometry(state).bigCup;
    state.ball.x = cup.x;
    state.ball.y = cup.y - state.ballRadius - 2;
    state.ball.vx = 5;
    state.ball.vy = 90;

    stepKendama(state, { held: false, x: 0, y: 0 }, 1 / 120, { width: 800, height: 700 });

    expect(state.caught).toBe('big-cup');
  });

  it('keeps the ball visible after repeated viewport collisions', () => {
    const state = createKendamaState(320, 420);
    state.ball.vx = 5000;
    state.ball.vy = 5000;

    for (let index = 0; index < 240; index += 1) {
      stepKendama(state, { held: false, x: 0, y: 0 }, 1 / 120, { width: 320, height: 420 });
    }

    expect(state.ball.x).toBeGreaterThanOrEqual(state.ballRadius);
    expect(state.ball.x).toBeLessThanOrEqual(320 - state.ballRadius);
    expect(state.ball.y).toBeGreaterThanOrEqual(state.ballRadius);
    expect(state.ball.y).toBeLessThanOrEqual(420 - state.ballRadius);
  });
});
