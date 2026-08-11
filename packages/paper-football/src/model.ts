export interface PaperDisc { x: number; y: number; vx: number; vy: number; radius: number; angle: number; moving: boolean }
export interface PaperFootballState {
  width: number;
  height: number;
  paper: PaperDisc;
  start: { x: number; y: number };
  goal: { x: number; width: number };
  score: number;
  shots: number;
}
export interface PaperFootballStepResult { railHit: boolean; goal: boolean; stopped: boolean }

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

export function createPaperFootballState(width = 640, height = 520): PaperFootballState {
  const radius = Math.max(13, Math.min(width, height) * 0.034);
  const start = { x: width / 2, y: height * 0.82 };
  return {
    width,
    height,
    start,
    paper: { ...start, vx: 0, vy: 0, radius, angle: 0, moving: false },
    goal: { x: width / 2, width: Math.min(width * 0.34, 210) },
    score: 0,
    shots: 0,
  };
}

function resetPaper(state: PaperFootballState): void {
  Object.assign(state.paper, { ...state.start, vx: 0, vy: 0, angle: 0, moving: false });
}

export function resetPaperFootball(state: PaperFootballState): void {
  state.score = 0;
  state.shots = 0;
  resetPaper(state);
}

export function kickPaperFootball(state: PaperFootballState, vx: number, vy: number): boolean {
  if (state.paper.moving || !Number.isFinite(vx) || !Number.isFinite(vy)) return false;
  const speed = Math.hypot(vx, vy);
  if (speed < 35) return false;
  const scale = Math.min(1, 900 / speed);
  state.paper.vx = vx * scale;
  state.paper.vy = vy * scale;
  state.paper.moving = true;
  state.shots += 1;
  return true;
}

export function stepPaperFootball(state: PaperFootballState, seconds: number): PaperFootballStepResult {
  if (!state.paper.moving) return { railHit: false, goal: false, stopped: true };
  const dt = clamp(Number.isFinite(seconds) ? seconds : 0, 0, 0.05);
  const paper = state.paper;
  paper.x += paper.vx * dt;
  paper.y += paper.vy * dt;
  paper.angle += Math.hypot(paper.vx, paper.vy) * dt * 0.012;
  const damping = Math.exp(-1.25 * dt);
  paper.vx *= damping;
  paper.vy *= damping;

  let railHit = false;
  if (paper.x < paper.radius) {
    paper.x = paper.radius; paper.vx = Math.abs(paper.vx) * 0.72; railHit = true;
  } else if (paper.x > state.width - paper.radius) {
    paper.x = state.width - paper.radius; paper.vx = -Math.abs(paper.vx) * 0.72; railHit = true;
  }
  if (paper.y - paper.radius <= 0) {
    const inGoal = Math.abs(paper.x - state.goal.x) <= state.goal.width / 2;
    if (inGoal) {
      state.score += 1;
      resetPaper(state);
      return { railHit, goal: true, stopped: true };
    }
    paper.y = paper.radius;
    paper.vy = Math.abs(paper.vy) * 0.7;
    railHit = true;
  } else if (paper.y > state.height - paper.radius) {
    paper.y = state.height - paper.radius;
    paper.vy = -Math.abs(paper.vy) * 0.7;
    railHit = true;
  }

  if (Math.hypot(paper.vx, paper.vy) < 10) {
    paper.vx = 0; paper.vy = 0; paper.moving = false;
    return { railHit, goal: false, stopped: true };
  }
  return { railHit, goal: false, stopped: false };
}
