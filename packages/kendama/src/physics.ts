export interface Vec2 {
  x: number;
  y: number;
}

export interface Body2D extends Vec2 {
  vx: number;
  vy: number;
}

export type KendamaCatch = 'none' | 'big-cup' | 'small-cup' | 'base-cup' | 'spike';

export interface KendamaState {
  handle: Body2D;
  ball: Body2D;
  ropeLength: number;
  ballRadius: number;
  tilt: number;
  caught: KendamaCatch;
  impactSerial: number;
  impactSpeed: number;
  impactKind: KendamaCatch | 'edge';
}

export interface KendamaInput extends Vec2 {
  held: boolean;
}

export interface KendamaBounds {
  width: number;
  height: number;
}

export interface KendamaGeometry {
  stringAnchor: Vec2;
  bigCup: Vec2;
  smallCup: Vec2;
  baseCup: Vec2;
  spike: Vec2;
}

const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));
const rotate = (point: Vec2, angle: number): Vec2 => ({
  x: point.x * Math.cos(angle) - point.y * Math.sin(angle),
  y: point.x * Math.sin(angle) + point.y * Math.cos(angle),
});

export function createKendamaState(width: number, height: number): KendamaState {
  const safeWidth = Math.max(240, width);
  const safeHeight = Math.max(320, height);
  const handle = { x: safeWidth * 0.5, y: safeHeight * 0.42, vx: 0, vy: 0 };
  const ropeLength = Math.min(184, safeHeight * 0.3);
  return {
    handle,
    ball: { x: handle.x + ropeLength * 0.34, y: handle.y + ropeLength, vx: 0, vy: 0 },
    ropeLength,
    ballRadius: 24,
    tilt: -0.08,
    caught: 'none',
    impactSerial: 0,
    impactSpeed: 0,
    impactKind: 'edge',
  };
}

export function getKendamaGeometry(state: KendamaState): KendamaGeometry {
  const local = {
    stringAnchor: { x: 0, y: 56 },
    bigCup: { x: -43, y: -30 },
    smallCup: { x: 34, y: -34 },
    baseCup: { x: 0, y: 71 },
    spike: { x: 0, y: -86 },
  };
  const place = (point: Vec2): Vec2 => {
    const rotated = rotate(point, state.tilt);
    return { x: state.handle.x + rotated.x, y: state.handle.y + rotated.y };
  };
  return {
    stringAnchor: place(local.stringAnchor),
    bigCup: place(local.bigCup),
    smallCup: place(local.smallCup),
    baseCup: place(local.baseCup),
    spike: place(local.spike),
  };
}

function signalImpact(state: KendamaState, speed: number, kind: KendamaState['impactKind']): void {
  if (speed < 45) return;
  state.impactSerial += 1;
  state.impactSpeed = speed;
  state.impactKind = kind;
}

function caughtPosition(state: KendamaState, geometry: KendamaGeometry): Vec2 | undefined {
  if (state.caught === 'big-cup') return { x: geometry.bigCup.x, y: geometry.bigCup.y - state.ballRadius * 0.82 };
  if (state.caught === 'small-cup') return { x: geometry.smallCup.x, y: geometry.smallCup.y - state.ballRadius * 0.82 };
  if (state.caught === 'base-cup') return { x: geometry.baseCup.x, y: geometry.baseCup.y + state.ballRadius * 0.82 };
  if (state.caught === 'spike') return { x: geometry.spike.x, y: geometry.spike.y - state.ballRadius * 0.38 };
  return undefined;
}

function tryCatch(state: KendamaState, geometry: KendamaGeometry): void {
  if (state.caught !== 'none' || state.ball.vy < 0) return;
  const candidates: Array<{ kind: KendamaCatch; point: Vec2; radius: number }> = [
    { kind: 'big-cup', point: geometry.bigCup, radius: 30 },
    { kind: 'small-cup', point: geometry.smallCup, radius: 24 },
    { kind: 'base-cup', point: geometry.baseCup, radius: 22 },
  ];
  for (const candidate of candidates) {
    const distance = Math.hypot(state.ball.x - candidate.point.x, state.ball.y - candidate.point.y);
    if (distance <= state.ballRadius + candidate.radius && state.ball.y <= candidate.point.y + 4) {
      state.caught = candidate.kind;
      signalImpact(state, Math.hypot(state.ball.vx, state.ball.vy), candidate.kind);
      return;
    }
  }
  const spikeDistance = Math.hypot(state.ball.x - geometry.spike.x, state.ball.y - geometry.spike.y);
  if (spikeDistance < state.ballRadius * 0.48 && Math.hypot(state.ball.vx, state.ball.vy) < 560) {
    state.caught = 'spike';
    signalImpact(state, Math.hypot(state.ball.vx, state.ball.vy), 'spike');
  }
}

export function releaseKendama(state: KendamaState): void {
  if (state.caught === 'none') return;
  state.caught = 'none';
  state.ball.vx += state.handle.vx * 0.7;
  state.ball.vy -= 80 + Math.abs(state.handle.vy) * 0.25;
}

export function stepKendama(
  state: KendamaState,
  input: KendamaInput,
  dt: number,
  bounds: KendamaBounds,
): void {
  const step = clamp(Number.isFinite(dt) ? dt : 0, 0, 1 / 30);
  const width = Math.max(1, bounds.width);
  const height = Math.max(1, bounds.height);

  if (input.held && Number.isFinite(input.x) && Number.isFinite(input.y)) {
    const ax = (input.x - state.handle.x) * 105 - state.handle.vx * 17;
    const ay = (input.y - state.handle.y) * 105 - state.handle.vy * 17;
    state.handle.vx += ax * step;
    state.handle.vy += ay * step;
  } else {
    const decay = Math.exp(-7 * step);
    state.handle.vx *= decay;
    state.handle.vy *= decay;
  }

  state.handle.x = clamp(state.handle.x + state.handle.vx * step, 64, width - 64);
  state.handle.y = clamp(state.handle.y + state.handle.vy * step, 100, height - 100);
  const targetTilt = clamp(state.handle.vx * 0.0025, -0.72, 0.72);
  state.tilt += (targetTilt - state.tilt) * Math.min(1, step * 10);

  const geometry = getKendamaGeometry(state);
  const attached = caughtPosition(state, geometry);
  if (attached) {
    state.ball.x = attached.x;
    state.ball.y = attached.y;
    state.ball.vx = state.handle.vx;
    state.ball.vy = state.handle.vy;
    return;
  }

  state.ball.vy += 1180 * step;
  const drag = Math.exp(-0.16 * step);
  state.ball.vx *= drag;
  state.ball.vy *= drag;
  state.ball.x += state.ball.vx * step;
  state.ball.y += state.ball.vy * step;

  const dx = state.ball.x - geometry.stringAnchor.x;
  const dy = state.ball.y - geometry.stringAnchor.y;
  const distance = Math.hypot(dx, dy);
  if (distance > state.ropeLength && distance > 0) {
    const nx = dx / distance;
    const ny = dy / distance;
    state.ball.x = geometry.stringAnchor.x + nx * state.ropeLength;
    state.ball.y = geometry.stringAnchor.y + ny * state.ropeLength;
    const relativeOutward = (state.ball.vx - state.handle.vx) * nx + (state.ball.vy - state.handle.vy) * ny;
    if (relativeOutward > 0) {
      state.ball.vx -= relativeOutward * nx;
      state.ball.vy -= relativeOutward * ny;
    }
  }

  const radius = state.ballRadius;
  if (state.ball.x < radius || state.ball.x > width - radius) {
    signalImpact(state, Math.abs(state.ball.vx), 'edge');
    state.ball.x = clamp(state.ball.x, radius, width - radius);
    state.ball.vx *= -0.56;
  }
  if (state.ball.y < radius || state.ball.y > height - radius) {
    signalImpact(state, Math.abs(state.ball.vy), 'edge');
    state.ball.y = clamp(state.ball.y, radius, height - radius);
    state.ball.vy *= -0.48;
  }

  tryCatch(state, geometry);
}
