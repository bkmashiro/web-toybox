export interface Vec2 { x: number; y: number }
export interface MazeWall { x: number; y: number; width: number; height: number }
export interface MazeHole extends Vec2 { radius: number }
export interface MazeBall extends Vec2 { vx: number; vy: number; radius: number }
export interface MarbleMazeState {
  width: number;
  height: number;
  ball: MazeBall;
  start: Vec2;
  goal: MazeHole;
  traps: MazeHole[];
  walls: MazeWall[];
  status: 'playing' | 'won';
  elapsed: number;
  falls: number;
}
export interface MazeStepResult { wallHit: boolean; trap: boolean; won: boolean }

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));
const distanceSquared = (a: Vec2, b: Vec2): number => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;

export function createMarbleMazeState(width = 640, height = 520): MarbleMazeState {
  const radius = Math.max(8, Math.min(width, height) * 0.021);
  const start = { x: width * 0.12, y: height * 0.15 };
  return {
    width,
    height,
    start,
    ball: { ...start, vx: 0, vy: 0, radius },
    goal: { x: width * 0.86, y: height * 0.84, radius: radius * 1.55 },
    traps: [
      { x: width * 0.72, y: height * 0.22, radius: radius * 1.35 },
      { x: width * 0.31, y: height * 0.62, radius: radius * 1.35 },
    ],
    walls: [
      { x: width * 0.24, y: height * 0.08, width: width * 0.025, height: height * 0.36 },
      { x: width * 0.24, y: height * 0.42, width: width * 0.37, height: height * 0.025 },
      { x: width * 0.48, y: height * 0.18, width: width * 0.025, height: height * 0.25 },
      { x: width * 0.61, y: height * 0.42, width: width * 0.025, height: height * 0.36 },
      { x: width * 0.12, y: height * 0.76, width: width * 0.49, height: height * 0.025 },
      { x: width * 0.78, y: height * 0.38, width: width * 0.025, height: height * 0.28 },
    ],
    status: 'playing',
    elapsed: 0,
    falls: 0,
  };
}

export function resetMarbleMaze(state: MarbleMazeState): void {
  Object.assign(state.ball, { ...state.start, vx: 0, vy: 0 });
  state.status = 'playing';
  state.elapsed = 0;
  state.falls = 0;
}

function overlapsWall(ball: MazeBall, wall: MazeWall): boolean {
  const x = clamp(ball.x, wall.x, wall.x + wall.width);
  const y = clamp(ball.y, wall.y, wall.y + wall.height);
  return (ball.x - x) ** 2 + (ball.y - y) ** 2 < ball.radius ** 2;
}

function resolveWall(ball: MazeBall, wall: MazeWall, previous: Vec2): boolean {
  if (!overlapsWall(ball, wall)) return false;
  const restitution = 0.56;
  if (previous.x + ball.radius <= wall.x) {
    ball.x = wall.x - ball.radius;
    ball.vx = -Math.abs(ball.vx) * restitution;
  } else if (previous.x - ball.radius >= wall.x + wall.width) {
    ball.x = wall.x + wall.width + ball.radius;
    ball.vx = Math.abs(ball.vx) * restitution;
  } else if (previous.y + ball.radius <= wall.y) {
    ball.y = wall.y - ball.radius;
    ball.vy = -Math.abs(ball.vy) * restitution;
  } else {
    ball.y = wall.y + wall.height + ball.radius;
    ball.vy = Math.abs(ball.vy) * restitution;
  }
  return true;
}

export function stepMarbleMaze(state: MarbleMazeState, tilt: Vec2, seconds: number): MazeStepResult {
  if (state.status === 'won') return { wallHit: false, trap: false, won: true };
  const dt = clamp(Number.isFinite(seconds) ? seconds : 0, 0, 0.05);
  const inputX = clamp(Number.isFinite(tilt.x) ? tilt.x : 0, -1, 1);
  const inputY = clamp(Number.isFinite(tilt.y) ? tilt.y : 0, -1, 1);
  const previous = { x: state.ball.x, y: state.ball.y };
  const acceleration = 560;
  state.ball.vx = (state.ball.vx + inputX * acceleration * dt) * Math.exp(-1.15 * dt);
  state.ball.vy = (state.ball.vy + inputY * acceleration * dt) * Math.exp(-1.15 * dt);
  state.ball.x += state.ball.vx * dt;
  state.ball.y += state.ball.vy * dt;

  let wallHit = false;
  if (state.ball.x < state.ball.radius) {
    state.ball.x = state.ball.radius; state.ball.vx = Math.abs(state.ball.vx) * 0.58; wallHit = true;
  } else if (state.ball.x > state.width - state.ball.radius) {
    state.ball.x = state.width - state.ball.radius; state.ball.vx = -Math.abs(state.ball.vx) * 0.58; wallHit = true;
  }
  if (state.ball.y < state.ball.radius) {
    state.ball.y = state.ball.radius; state.ball.vy = Math.abs(state.ball.vy) * 0.58; wallHit = true;
  } else if (state.ball.y > state.height - state.ball.radius) {
    state.ball.y = state.height - state.ball.radius; state.ball.vy = -Math.abs(state.ball.vy) * 0.58; wallHit = true;
  }
  for (const wall of state.walls) wallHit = resolveWall(state.ball, wall, previous) || wallHit;

  state.elapsed += dt;
  for (const trap of state.traps) {
    if (distanceSquared(state.ball, trap) <= trap.radius ** 2) {
      Object.assign(state.ball, { ...state.start, vx: 0, vy: 0 });
      state.falls += 1;
      return { wallHit, trap: true, won: false };
    }
  }
  if (distanceSquared(state.ball, state.goal) <= state.goal.radius ** 2) {
    state.status = 'won';
    state.ball.vx = 0;
    state.ball.vy = 0;
    return { wallHit, trap: false, won: true };
  }
  return { wallHit, trap: false, won: false };
}
