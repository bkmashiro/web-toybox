export interface Vec2 {
  x: number;
  y: number;
}

export interface Body2D extends Vec2 {
  vx: number;
  vy: number;
}

export interface RigidBall2D extends Body2D {
  angle: number;
  angularVelocity: number;
}

export type KendamaMode = 'normal' | 'hard';
export type KendamaCatch = 'none' | 'big-cup' | 'small-cup' | 'base-cup' | 'spike';

export interface KendamaState {
  handle: Body2D;
  ball: RigidBall2D;
  ropeLength: number;
  ballRadius: number;
  tilt: number;
  caught: KendamaCatch;
  mode: KendamaMode;
  releaseGrace: number;
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
  upperCupAxis: Vec2;
  baseCupAxis: Vec2;
  spikeAxis: Vec2;
}

const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));
const dot = (a: Vec2, b: Vec2) => a.x * b.x + a.y * b.y;
const cross = (a: Vec2, b: Vec2) => a.x * b.y - a.y * b.x;
const rotate = (point: Vec2, angle: number): Vec2 => ({
  x: point.x * Math.cos(angle) - point.y * Math.sin(angle),
  y: point.x * Math.sin(angle) + point.y * Math.cos(angle),
});
const normalizeAngle = (angle: number) => Math.atan2(Math.sin(angle), Math.cos(angle));

export function createKendamaState(width: number, height: number, mode: KendamaMode = 'normal'): KendamaState {
  const safeWidth = Math.max(240, width);
  const safeHeight = Math.max(320, height);
  const handle = { x: safeWidth * 0.5, y: safeHeight * 0.42, vx: 0, vy: 0 };
  const ropeLength = Math.min(184, safeHeight * 0.3);
  return {
    handle,
    ball: {
      x: handle.x + ropeLength * 0.34,
      y: handle.y + ropeLength,
      vx: 0,
      vy: 0,
      angle: Math.PI * 0.58,
      angularVelocity: 0,
    },
    ropeLength,
    ballRadius: 24,
    tilt: -0.08,
    caught: 'none',
    mode,
    releaseGrace: 0,
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
    upperCupAxis: rotate({ x: 0, y: -1 }, state.tilt),
    baseCupAxis: rotate({ x: 0, y: 1 }, state.tilt),
    spikeAxis: rotate({ x: 0, y: -1 }, state.tilt),
  };
}

export function getBallHole(state: KendamaState): Vec2 {
  const distance = state.ballRadius * 0.72;
  return {
    x: state.ball.x + Math.cos(state.ball.angle) * distance,
    y: state.ball.y + Math.sin(state.ball.angle) * distance,
  };
}

function signalImpact(state: KendamaState, speed: number, kind: KendamaState['impactKind']): void {
  if (speed < 45) return;
  state.impactSerial += 1;
  state.impactSpeed = speed;
  state.impactKind = kind;
}

function caughtPose(state: KendamaState, geometry: KendamaGeometry): { position: Vec2; angle?: number } | undefined {
  if (state.caught === 'spike') return {
    position: {
      x: geometry.spike.x + geometry.spikeAxis.x * state.ballRadius * 0.72,
      y: geometry.spike.y + geometry.spikeAxis.y * state.ballRadius * 0.72,
    },
    angle: Math.atan2(-geometry.spikeAxis.y, -geometry.spikeAxis.x),
  };
  return undefined;
}

interface CupCandidate {
  kind: Exclude<KendamaCatch, 'none' | 'spike'>;
  point: Vec2;
  axis: Vec2;
  radius: number;
}

function resolveCupContact(state: KendamaState, candidate: CupCandidate): boolean {
  const relative = { x: state.ball.x - candidate.point.x, y: state.ball.y - candidate.point.y };
  const tangent = { x: -candidate.axis.y, y: candidate.axis.x };
  const axial = dot(relative, candidate.axis);
  const lateral = dot(relative, tangent);

  for (const side of [-1, 1]) {
    const rim = {
      x: candidate.point.x + tangent.x * candidate.radius * side,
      y: candidate.point.y + tangent.y * candidate.radius * side,
    };
    const dx = state.ball.x - rim.x;
    const dy = state.ball.y - rim.y;
    const distance = Math.hypot(dx, dy);
    if (distance >= state.ballRadius || distance <= 0) continue;
    const normal = { x: dx / distance, y: dy / distance };
    const penetration = state.ballRadius - distance;
    state.ball.x += normal.x * penetration;
    state.ball.y += normal.y * penetration;
    const incoming = (state.ball.vx - state.handle.vx) * normal.x + (state.ball.vy - state.handle.vy) * normal.y;
    if (incoming < 0) {
      state.ball.vx -= incoming * normal.x * 1.34;
      state.ball.vy -= incoming * normal.y * 1.34;
      state.ball.angularVelocity += side * incoming * 0.025;
      signalImpact(state, Math.abs(incoming), candidate.kind);
    }
    return true;
  }

  const mouthHalfWidth = Math.max(4, candidate.radius - state.ballRadius * 0.72);
  const normalizedLateral = lateral / mouthHalfWidth;
  if (Math.abs(normalizedLateral) > 1) return false;

  const seatHeight = state.ballRadius * 0.78;
  const bowlRise = state.ballRadius * 0.36 * normalizedLateral * normalizedLateral;
  const surfaceHeight = seatHeight + bowlRise;
  if (axial < -state.ballRadius * 0.25 || axial >= surfaceHeight) return false;

  const slope = 2 * state.ballRadius * 0.36 * normalizedLateral / mouthHalfWidth;
  const rawNormal = {
    x: candidate.axis.x - tangent.x * slope,
    y: candidate.axis.y - tangent.y * slope,
  };
  const normalLength = Math.hypot(rawNormal.x, rawNormal.y) || 1;
  const normal = { x: rawNormal.x / normalLength, y: rawNormal.y / normalLength };
  const correction = (surfaceHeight - axial) / Math.max(0.45, dot(normal, candidate.axis));
  state.ball.x += normal.x * correction;
  state.ball.y += normal.y * correction;

  const relativeVelocity = {
    x: state.ball.vx - state.handle.vx,
    y: state.ball.vy - state.handle.vy,
  };
  const incoming = dot(relativeVelocity, normal);
  if (incoming < 0) {
    const restitution = state.mode === 'hard' ? 0.06 : 0.11;
    const impulse = -(1 + restitution) * incoming;
    state.ball.vx += normal.x * impulse;
    state.ball.vy += normal.y * impulse;
    signalImpact(state, Math.abs(incoming), candidate.kind);
  }

  const surfaceTangent = { x: -normal.y, y: normal.x };
  const slip = (state.ball.vx - state.handle.vx) * surfaceTangent.x
    + (state.ball.vy - state.handle.vy) * surfaceTangent.y;
  const friction = state.mode === 'hard' ? 0.08 : 0.16;
  state.ball.vx -= surfaceTangent.x * slip * friction;
  state.ball.vy -= surfaceTangent.y * slip * friction;
  state.ball.angularVelocity += slip / Math.max(1, state.ballRadius) * 0.04;

  if (state.releaseGrace <= 0 && Math.abs(normalizedLateral) < 0.88) state.caught = candidate.kind;
  return true;
}

function hardSpikeContact(state: KendamaState, geometry: KendamaGeometry): boolean {
  const hole = getBallHole(state);
  const holeToTip = { x: geometry.spike.x - hole.x, y: geometry.spike.y - hole.y };
  const holeDistance = Math.hypot(holeToTip.x, holeToTip.y);
  const holeAxis = { x: Math.cos(state.ball.angle), y: Math.sin(state.ball.angle) };
  const targetHoleAxis = { x: -geometry.spikeAxis.x, y: -geometry.spikeAxis.y };
  const alignment = dot(holeAxis, targetHoleAxis);
  const relativeVelocity = {
    x: state.ball.vx - state.handle.vx,
    y: state.ball.vy - state.handle.vy,
  };
  const insertionSpeed = dot(relativeVelocity, targetHoleAxis);
  if (
    holeDistance <= state.ballRadius * 0.28
    && alignment >= Math.cos(Math.PI / 10)
    && insertionSpeed > 0
    && insertionSpeed < 360
    && Math.abs(state.ball.angularVelocity) < 5
  ) {
    state.caught = 'spike';
    signalImpact(state, Math.hypot(relativeVelocity.x, relativeVelocity.y), 'spike');
    return true;
  }
  return false;
}

function resolveContacts(state: KendamaState, geometry: KendamaGeometry): void {
  const margin = state.mode === 'hard' ? 0 : 3;
  const candidates: CupCandidate[] = [
    { kind: 'big-cup', point: geometry.bigCup, axis: geometry.upperCupAxis, radius: 30 + margin },
    { kind: 'small-cup', point: geometry.smallCup, axis: geometry.upperCupAxis, radius: 24 + margin },
    { kind: 'base-cup', point: geometry.baseCup, axis: geometry.baseCupAxis, radius: 22 + margin },
  ];
  for (const candidate of candidates) resolveCupContact(state, candidate);

  if (state.releaseGrace > 0) return;
  if (state.mode === 'hard') {
    hardSpikeContact(state, geometry);
    return;
  }

  const spikeDistance = Math.hypot(state.ball.x - geometry.spike.x, state.ball.y - geometry.spike.y);
  if (spikeDistance < state.ballRadius * 0.48 && Math.hypot(state.ball.vx, state.ball.vy) < 560) {
    state.caught = 'spike';
    signalImpact(state, Math.hypot(state.ball.vx, state.ball.vy), 'spike');
  }
}

export function releaseKendama(state: KendamaState): void {
  if (state.caught === 'none') return;
  const geometry = getKendamaGeometry(state);
  const tangent = { x: -geometry.upperCupAxis.y, y: geometry.upperCupAxis.x };
  const rawReleaseAxis = state.caught === 'big-cup'
    ? { x: -tangent.x + geometry.upperCupAxis.x * 0.9, y: -tangent.y + geometry.upperCupAxis.y * 0.9 }
    : state.caught === 'small-cup'
      ? { x: tangent.x + geometry.upperCupAxis.x * 0.9, y: tangent.y + geometry.upperCupAxis.y * 0.9 }
      : state.caught === 'base-cup'
        ? geometry.baseCupAxis
        : geometry.spikeAxis;
  const releaseLength = Math.hypot(rawReleaseAxis.x, rawReleaseAxis.y) || 1;
  const releaseAxis = { x: rawReleaseAxis.x / releaseLength, y: rawReleaseAxis.y / releaseLength };
  state.caught = 'none';
  state.releaseGrace = state.mode === 'hard' ? 0.24 : 0.16;
  state.ball.x += releaseAxis.x * 6;
  state.ball.y += releaseAxis.y * 6;
  state.ball.vx += releaseAxis.x * 280 + state.handle.vx * 0.25;
  state.ball.vy += releaseAxis.y * 280 + state.handle.vy * 0.25;
  state.ball.angularVelocity += state.handle.vx * 0.015;
}

function constrainRope(state: KendamaState, geometry: KendamaGeometry): void {
  if (state.mode !== 'hard') {
    const dx = state.ball.x - geometry.stringAnchor.x;
    const dy = state.ball.y - geometry.stringAnchor.y;
    const distance = Math.hypot(dx, dy);
    if (distance <= state.ropeLength || distance <= 0) return;
    const normal = { x: dx / distance, y: dy / distance };
    state.ball.x = geometry.stringAnchor.x + normal.x * state.ropeLength;
    state.ball.y = geometry.stringAnchor.y + normal.y * state.ropeLength;
    const outward = (state.ball.vx - state.handle.vx) * normal.x + (state.ball.vy - state.handle.vy) * normal.y;
    if (outward > 0) {
      state.ball.vx -= outward * normal.x;
      state.ball.vy -= outward * normal.y;
    }
    return;
  }

  const hole = getBallHole(state);
  const dx = hole.x - geometry.stringAnchor.x;
  const dy = hole.y - geometry.stringAnchor.y;
  const distance = Math.hypot(dx, dy);
  if (distance <= state.ropeLength || distance <= 0) return;
  const normal = { x: dx / distance, y: dy / distance };
  const correction = distance - state.ropeLength;
  state.ball.x -= normal.x * correction;
  state.ball.y -= normal.y * correction;

  const arm = {
    x: Math.cos(state.ball.angle) * state.ballRadius * 0.72,
    y: Math.sin(state.ball.angle) * state.ballRadius * 0.72,
  };
  const holeVelocity = {
    x: state.ball.vx - state.ball.angularVelocity * arm.y,
    y: state.ball.vy + state.ball.angularVelocity * arm.x,
  };
  const outward = (holeVelocity.x - state.handle.vx) * normal.x + (holeVelocity.y - state.handle.vy) * normal.y;
  if (outward <= 0) return;
  const inertia = 0.5 * state.ballRadius * state.ballRadius;
  const armCrossNormal = cross(arm, normal);
  const impulseMagnitude = outward / (1 + armCrossNormal * armCrossNormal / inertia);
  const impulse = { x: -normal.x * impulseMagnitude, y: -normal.y * impulseMagnitude };
  state.ball.vx += impulse.x;
  state.ball.vy += impulse.y;
  state.ball.angularVelocity += cross(arm, impulse) / inertia;
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
  state.releaseGrace = Math.max(0, state.releaseGrace - step);
  if (state.caught !== 'spike') state.caught = 'none';

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
  const attached = caughtPose(state, geometry);
  if (attached) {
    state.ball.x = attached.position.x;
    state.ball.y = attached.position.y;
    state.ball.vx = state.handle.vx;
    state.ball.vy = state.handle.vy;
    state.ball.angularVelocity = 0;
    if (attached.angle !== undefined) state.ball.angle = attached.angle;
    return;
  }

  state.ball.vy += 1180 * step;
  const drag = Math.exp(-0.16 * step);
  state.ball.vx *= drag;
  state.ball.vy *= drag;
  state.ball.angularVelocity *= Math.exp(-0.32 * step);
  state.ball.x += state.ball.vx * step;
  state.ball.y += state.ball.vy * step;
  state.ball.angle = normalizeAngle(state.ball.angle + state.ball.angularVelocity * step);

  constrainRope(state, geometry);

  const radius = state.ballRadius;
  if (state.ball.x < radius || state.ball.x > width - radius) {
    signalImpact(state, Math.abs(state.ball.vx), 'edge');
    state.ball.x = clamp(state.ball.x, radius, width - radius);
    state.ball.vx *= -0.56;
    state.ball.angularVelocity += state.ball.vy * 0.006;
  }
  if (state.ball.y < radius || state.ball.y > height - radius) {
    signalImpact(state, Math.abs(state.ball.vy), 'edge');
    state.ball.y = clamp(state.ball.y, radius, height - radius);
    state.ball.vy *= -0.48;
    state.ball.angularVelocity -= state.ball.vx * 0.008;
  }

  resolveContacts(state, geometry);
}
