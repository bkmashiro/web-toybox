export interface SlidingState {
  size: number;
  cells: number[];
  moves: number;
  history: number[];
  won: boolean;
}

export function createSlidingState(size = 4): SlidingState {
  const total = size * size;
  return { size, cells: [...Array.from({ length: total - 1 }, (_, index) => index + 1), 0], moves: 0, history: [], won: true };
}

export function isSolved(state: SlidingState): boolean {
  return state.cells.every((value, index) => index === state.cells.length - 1 ? value === 0 : value === index + 1);
}

function adjacent(size: number, first: number, second: number): boolean {
  const ax = first % size;
  const ay = Math.floor(first / size);
  const bx = second % size;
  const by = Math.floor(second / size);
  return Math.abs(ax - bx) + Math.abs(ay - by) === 1;
}

export function moveTile(state: SlidingState, tile: number, countMove = true): boolean {
  if (!Number.isInteger(tile) || tile <= 0) return false;
  const tileIndex = state.cells.indexOf(tile);
  const blankIndex = state.cells.indexOf(0);
  if (tileIndex < 0 || !adjacent(state.size, tileIndex, blankIndex)) return false;
  state.cells[blankIndex] = tile;
  state.cells[tileIndex] = 0;
  if (countMove) state.moves += 1;
  state.won = isSolved(state);
  return true;
}

function randomFactory(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    return value / 0x100000000;
  };
}

export function shuffleSliding(state: SlidingState, seed = Date.now(), turns = 180): void {
  const fresh = createSlidingState(state.size);
  state.cells = fresh.cells;
  state.moves = 0;
  state.history = [];
  const random = randomFactory(seed);
  let previousBlank = -1;
  for (let turn = 0; turn < Math.max(1, turns); turn += 1) {
    const blank = state.cells.indexOf(0);
    const options = state.cells
      .map((tile, index) => ({ tile, index }))
      .filter(({ tile, index }) => tile > 0 && adjacent(state.size, index, blank) && index !== previousBlank);
    const choice = options[Math.floor(random() * options.length)] ?? options[0];
    previousBlank = blank;
    moveTile(state, choice.tile, false);
    state.history.push(choice.tile);
  }
  if (isSolved(state)) {
    const blank = state.cells.indexOf(0);
    const choice = state.cells.find((tile, index) => tile > 0 && adjacent(state.size, index, blank));
    if (choice) {
      moveTile(state, choice, false);
      state.history.push(choice);
    }
  }
  state.won = false;
}
