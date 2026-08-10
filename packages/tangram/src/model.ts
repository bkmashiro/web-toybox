export interface Vec2 { x: number; y: number }
export interface TangramPiece { id: string; color: string; points: Vec2[]; x: number; y: number; rotation: number }
export interface TangramState { width: number; height: number; pieces: TangramPiece[] }

const triangle = (width: number, height: number): Vec2[] => [
  { x: -width / 2, y: -height / 3 },
  { x: width / 2, y: -height / 3 },
  { x: 0, y: height * 2 / 3 },
];

const scalePoints = (points: Vec2[], scale: number): Vec2[] => points.map((point) => ({
  x: point.x * scale,
  y: point.y * scale,
}));

export function createTangramState(width = 640, height = 520): TangramState {
  const cx = width / 2;
  const cy = height / 2;
  const scale = Math.min(1, Math.max(0.62, width / 580));
  const topGap = Math.min(150 * scale, width * 0.26);
  const bottomGap = Math.min(95 * scale, width * 0.21);
  const top = cy - 86 * scale;
  const bottom = cy + 65 * scale;
  return {
    width,
    height,
    pieces: [
      { id: 'large-red', color: '#c94b36', points: triangle(112 * scale, 96 * scale), x: cx - topGap, y: top, rotation: -Math.PI / 4 },
      { id: 'large-blue', color: '#315c78', points: triangle(112 * scale, 96 * scale), x: cx, y: top, rotation: Math.PI / 4 },
      { id: 'medium-ochre', color: '#c48a32', points: triangle(82 * scale, 70 * scale), x: cx + topGap, y: top + 12 * scale, rotation: Math.PI / 2 },
      { id: 'small-green', color: '#557552', points: triangle(61 * scale, 54 * scale), x: cx - bottomGap * 1.5, y: bottom, rotation: 0 },
      { id: 'small-cream', color: '#e8c983', points: triangle(61 * scale, 54 * scale), x: cx - bottomGap * 0.5, y: bottom + 12 * scale, rotation: Math.PI },
      { id: 'square', color: '#9d5938', points: scalePoints([{ x: -27, y: -27 }, { x: 27, y: -27 }, { x: 27, y: 27 }, { x: -27, y: 27 }], scale), x: cx + bottomGap * 0.5, y: bottom + 5 * scale, rotation: Math.PI / 4 },
      { id: 'parallelogram', color: '#6b5475', points: scalePoints([{ x: -42, y: -25 }, { x: 18, y: -25 }, { x: 42, y: 25 }, { x: -18, y: 25 }], scale), x: cx + bottomGap * 1.5, y: bottom, rotation: 0 },
    ],
  };
}

function localPoint(piece: TangramPiece, x: number, y: number): Vec2 {
  const dx = x - piece.x;
  const dy = y - piece.y;
  const cosine = Math.cos(-piece.rotation);
  const sine = Math.sin(-piece.rotation);
  return { x: dx * cosine - dy * sine, y: dx * sine + dy * cosine };
}

function contains(points: Vec2[], point: Vec2): boolean {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i, i += 1) {
    const a = points[i];
    const b = points[j];
    if ((a.y > point.y) !== (b.y > point.y)
      && point.x < (b.x - a.x) * (point.y - a.y) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}

export function hitPiece(state: TangramState, x: number, y: number): string | undefined {
  for (let index = state.pieces.length - 1; index >= 0; index -= 1) {
    const piece = state.pieces[index];
    if (contains(piece.points, localPoint(piece, x, y))) return piece.id;
  }
  return undefined;
}

export function movePiece(state: TangramState, id: string, x: number, y: number): boolean {
  const piece = state.pieces.find((candidate) => candidate.id === id);
  if (!piece || !Number.isFinite(x) || !Number.isFinite(y)) return false;
  piece.x = x;
  piece.y = y;
  return true;
}

export function resizeTangramState(state: TangramState, width: number, height: number): void {
  if (!(width > 0) || !(height > 0) || !(state.width > 0) || !(state.height > 0)) return;
  const scaleX = width / state.width;
  const scaleY = height / state.height;
  const shapeScale = Math.min(scaleX, scaleY);
  for (const piece of state.pieces) {
    piece.x = Math.min(width, Math.max(0, piece.x * scaleX));
    piece.y = Math.min(height, Math.max(0, piece.y * scaleY));
    piece.points = scalePoints(piece.points, shapeScale);
  }
  state.width = width;
  state.height = height;
}

export function rotatePiece(state: TangramState, id: string): boolean {
  const piece = state.pieces.find((candidate) => candidate.id === id);
  if (!piece) return false;
  piece.rotation = (piece.rotation + Math.PI / 4) % (Math.PI * 2);
  return true;
}

export function bringPieceToFront(state: TangramState, id: string): void {
  const index = state.pieces.findIndex((piece) => piece.id === id);
  if (index < 0) return;
  state.pieces.push(state.pieces.splice(index, 1)[0]);
}
