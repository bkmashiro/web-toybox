export interface PinboardPeg { id: number; x: number; y: number; radius: number }
export interface PinboardBall { x: number; y: number; vx: number; vy: number; radius: number; active: boolean; lastPeg?: number }
export interface PinboardState {
  width: number;
  height: number;
  ball: PinboardBall;
  pegs: PinboardPeg[];
  launcherX: number;
  pockets: readonly number[];
  score: number;
  drops: number;
}
export interface PinboardStepResult { pegHits: number; pocket?: number; scoreDelta: number }

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

export function createPinboardState(width = 640, height = 520): PinboardState {
  const ballRadius = Math.max(8, Math.min(width, height) * 0.019);
  const pegRadius = ballRadius * 0.58;
  const pegs: PinboardPeg[] = [];
  let id = 0;
  for (let row = 0; row < 6; row += 1) {
    const columns = row % 2 === 0 ? 7 : 6;
    const gap = width / 8;
    const offset = row % 2 === 0 ? gap : gap * 1.5;
    for (let column = 0; column < columns; column += 1) {
      pegs.push({ id: id++, x: offset + column * gap, y: height * 0.2 + row * height * 0.105, radius: pegRadius });
    }
  }
  const launcherX = width / 2;
  return {
    width,
    height,
    launcherX,
    ball: { x: launcherX, y: ballRadius * 2.5, vx: 0, vy: 0, radius: ballRadius, active: false },
    pegs,
    pockets: [10, 25, 50, 25, 10],
    score: 0,
    drops: 0,
  };
}

export function setPinboardLauncher(state: PinboardState, x: number): void {
  if (state.ball.active || !Number.isFinite(x)) return;
  state.launcherX = clamp(x, state.ball.radius, state.width - state.ball.radius);
  state.ball.x = state.launcherX;
}

export function dropPinboardBall(state: PinboardState): boolean {
  if (state.ball.active) return false;
  Object.assign(state.ball, { x: state.launcherX, y: state.ball.radius * 2.5, vx: 0, vy: 35, active: true, lastPeg: undefined });
  return true;
}

function resetBall(state: PinboardState): void {
  Object.assign(state.ball, { x: state.launcherX, y: state.ball.radius * 2.5, vx: 0, vy: 0, active: false, lastPeg: undefined });
}

export function resetPinboard(state: PinboardState): void {
  state.score = 0;
  state.drops = 0;
  state.launcherX = state.width / 2;
  resetBall(state);
}

export function stepPinboard(state: PinboardState, seconds: number): PinboardStepResult {
  if (!state.ball.active) return { pegHits: 0, scoreDelta: 0 };
  const dt = clamp(Number.isFinite(seconds) ? seconds : 0, 0, 0.05);
  const ball = state.ball;
  ball.vy += 720 * dt;
  ball.vx *= Math.exp(-0.16 * dt);
  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;

  if (ball.x < ball.radius) { ball.x = ball.radius; ball.vx = Math.abs(ball.vx) * 0.72; }
  if (ball.x > state.width - ball.radius) { ball.x = state.width - ball.radius; ball.vx = -Math.abs(ball.vx) * 0.72; }

  let pegHits = 0;
  let touching: number | undefined;
  for (const peg of state.pegs) {
    const dx = ball.x - peg.x;
    const dy = ball.y - peg.y;
    const minimum = ball.radius + peg.radius;
    const distanceSquared = dx * dx + dy * dy;
    if (distanceSquared >= minimum * minimum) continue;
    const distance = Math.sqrt(distanceSquared) || 0.001;
    const nx = distanceSquared === 0 ? (peg.id % 2 ? -1 : 1) : dx / distance;
    const ny = distanceSquared === 0 ? 0 : dy / distance;
    ball.x = peg.x + nx * minimum;
    ball.y = peg.y + ny * minimum;
    const normalSpeed = ball.vx * nx + ball.vy * ny;
    if (normalSpeed < 0) {
      ball.vx -= 1.72 * normalSpeed * nx;
      ball.vy -= 1.72 * normalSpeed * ny;
    }
    touching = peg.id;
    if (ball.lastPeg !== peg.id) pegHits += 1;
  }
  ball.lastPeg = touching;

  if (ball.y >= state.height - ball.radius * 2.2) {
    const pocket = clamp(Math.floor(ball.x / (state.width / state.pockets.length)), 0, state.pockets.length - 1);
    const scoreDelta = state.pockets[pocket];
    state.score += scoreDelta;
    state.drops += 1;
    resetBall(state);
    return { pegHits, pocket, scoreDelta };
  }
  return { pegHits, scoreDelta: 0 };
}
