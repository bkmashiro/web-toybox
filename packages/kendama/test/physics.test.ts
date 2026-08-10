import { describe, expect, it } from 'vitest';
import { createKendamaState, getKendamaGeometry, releaseKendama, stepKendama } from '../src/physics';

const finiteState = (state: ReturnType<typeof createKendamaState>) => [
  state.handle.x, state.handle.y, state.handle.vx, state.handle.vy,
  state.ball.x, state.ball.y, state.ball.vx, state.ball.vy,
  state.ball.angle, state.ball.angularVelocity,
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

    let supported = false;
    for (let index = 0; index < 20; index += 1) {
      stepKendama(state, { held: false, x: 0, y: 0 }, 1 / 120, { width: 800, height: 700 });
      supported ||= state.caught === 'big-cup';
    }

    expect(supported).toBe(true);
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

  it('rotates a finite-radius ball when the taut string pulls away from its hole', () => {
    const state = createKendamaState(800, 700, 'hard');
    state.ball.angle = 0;
    state.ball.angularVelocity = 0;
    state.ball.x = state.handle.x + state.ropeLength;
    state.ball.y = state.handle.y + 40;

    for (let index = 0; index < 30; index += 1) {
      stepKendama(state, { held: true, x: state.handle.x - 80, y: state.handle.y }, 1 / 120, { width: 800, height: 700 });
    }

    expect(finiteState(state)).toBe(true);
    expect(Math.abs(state.ball.angularVelocity)).toBeGreaterThan(0.05);
    expect(Math.abs(state.ball.angle)).toBeGreaterThan(0.005);
  });

  it('does not recatch on the first frames after releasing a seated ball', () => {
    const state = createKendamaState(800, 700, 'hard');
    state.caught = 'big-cup';
    releaseKendama(state);
    const cup = getKendamaGeometry(state).bigCup;
    state.ball.x = cup.x;
    state.ball.y = cup.y - state.ballRadius;
    state.ball.vx = 0;
    state.ball.vy = 60;

    for (let index = 0; index < 12; index += 1) {
      stepKendama(state, { held: false, x: 0, y: 0 }, 1 / 120, { width: 800, height: 700 });
    }

    expect(state.caught).toBe('none');
    expect(state.releaseGrace).toBeGreaterThan(0);
  });

  it('does not pin a cup-supported ball to the handle velocity', () => {
    const state = createKendamaState(800, 700, 'hard');
    const geometry = getKendamaGeometry(state);
    state.caught = 'big-cup';
    state.ball.x = geometry.bigCup.x + geometry.upperCupAxis.x * state.ballRadius * 0.82;
    state.ball.y = geometry.bigCup.y + geometry.upperCupAxis.y * state.ballRadius * 0.82;
    state.ball.vx = -45;
    state.ball.vy = 20;
    state.handle.vx = 160;

    stepKendama(state, { held: false, x: 0, y: 0 }, 1 / 120, { width: 800, height: 700 });

    expect(state.ball.vx).not.toBeCloseTo(state.handle.vx, 6);
    expect(state.ball.vy).not.toBeCloseTo(state.handle.vy, 6);
  });

  it('lets a seated ball leave when the cup is swept sideways', () => {
    const state = createKendamaState(800, 700, 'hard');
    const initial = getKendamaGeometry(state);
    state.caught = 'big-cup';
    state.ball.x = initial.bigCup.x + initial.upperCupAxis.x * state.ballRadius * 0.82;
    state.ball.y = initial.bigCup.y + initial.upperCupAxis.y * state.ballRadius * 0.82;

    for (let index = 0; index < 36; index += 1) {
      stepKendama(
        state,
        { held: true, x: state.handle.x + 260, y: state.handle.y },
        1 / 120,
        { width: 800, height: 700 },
      );
    }

    const cup = getKendamaGeometry(state).bigCup;
    expect(state.caught).toBe('none');
    expect(Math.hypot(state.ball.x - cup.x, state.ball.y - cup.y)).toBeGreaterThan(state.ballRadius * 1.2);
  });

  it('keeps a released cup ball free through the cooldown window', () => {
    const state = createKendamaState(800, 700, 'hard');
    const geometry = getKendamaGeometry(state);
    state.caught = 'big-cup';
    state.ball.x = geometry.bigCup.x + geometry.upperCupAxis.x * state.ballRadius * 0.82;
    state.ball.y = geometry.bigCup.y + geometry.upperCupAxis.y * state.ballRadius * 0.82;
    releaseKendama(state);

    let recaughtEarly = false;
    for (let index = 0; index < 36; index += 1) {
      stepKendama(state, { held: false, x: 0, y: 0 }, 1 / 120, { width: 800, height: 700 });
      recaughtEarly ||= state.caught === 'big-cup';
    }

    expect(state.releaseGrace).toBe(0);
    expect(recaughtEarly).toBe(false);
  });

  it('requires the ball center to enter the narrow hard-mode cup mouth', () => {
    const centered = createKendamaState(800, 700, 'hard');
    const bigCup = getKendamaGeometry(centered).bigCup;
    centered.ball.x = bigCup.x;
    centered.ball.y = bigCup.y - centered.ballRadius - 1;
    centered.ball.vx = 0;
    centered.ball.vy = 85;
    let centeredContact = false;
    for (let index = 0; index < 20; index += 1) {
      stepKendama(centered, { held: false, x: 0, y: 0 }, 1 / 120, { width: 800, height: 700 });
      centeredContact ||= centered.caught === 'big-cup';
    }
    expect(centeredContact).toBe(true);

    const rimHit = createKendamaState(800, 700, 'hard');
    const rimCup = getKendamaGeometry(rimHit).bigCup;
    rimHit.ball.x = rimCup.x + 22;
    rimHit.ball.y = rimCup.y - rimHit.ballRadius - 1;
    rimHit.ball.vx = 0;
    rimHit.ball.vy = 85;
    let rimWasCaught = false;
    for (let index = 0; index < 20; index += 1) {
      stepKendama(rimHit, { held: false, x: 0, y: 0 }, 1 / 120, { width: 800, height: 700 });
      rimWasCaught ||= rimHit.caught === 'big-cup';
    }
    expect(rimWasCaught).toBe(false);
  });

  it('only inserts the spike when the ball hole points at the tip', () => {
    const placeAtSpike = (aligned: boolean) => {
      const state = createKendamaState(800, 700, 'hard');
      const geometry = getKendamaGeometry(state);
      const axis = geometry.spikeAxis;
      state.ball.x = geometry.spike.x + axis.x * state.ballRadius * 0.72;
      state.ball.y = geometry.spike.y + axis.y * state.ballRadius * 0.72;
      state.ball.vx = -axis.x * 70;
      state.ball.vy = -axis.y * 70;
      state.ball.angle = Math.atan2(-axis.y, -axis.x) + (aligned ? 0 : Math.PI / 2);
      state.ball.angularVelocity = 0;
      stepKendama(state, { held: false, x: 0, y: 0 }, 1 / 240, { width: 800, height: 700 });
      return state;
    };

    expect(placeAtSpike(false).caught).toBe('none');
    expect(placeAtSpike(true).caught).toBe('spike');
  });
});
