export type Cell = -1 | 0 | 1;
export type Position = [number, number];
export interface PegMove { from: Position; over: Position; to: Position }
export interface PegState { board: Cell[][]; moves: number; finished: boolean }

const valid = (row: number, column: number): boolean => (
  row >= 0 && row < 7 && column >= 0 && column < 7
  && (row >= 2 && row <= 4 || column >= 2 && column <= 4)
);

export function createPegState(): PegState {
  const board: Cell[][] = Array.from({ length: 7 }, (_, row) =>
    Array.from({ length: 7 }, (_, column): Cell => valid(row, column) ? 1 : -1));
  board[3][3] = 0;
  return { board, moves: 0, finished: false };
}

export function remainingPegs(state: PegState): number {
  return state.board.flat().filter((cell) => cell === 1).length;
}

export function legalMoves(state: PegState): PegMove[] {
  const moves: PegMove[] = [];
  const directions: Position[] = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  for (let row = 0; row < 7; row += 1) {
    for (let column = 0; column < 7; column += 1) {
      if (state.board[row][column] !== 1) continue;
      for (const [dr, dc] of directions) {
        const over: Position = [row + dr, column + dc];
        const to: Position = [row + dr * 2, column + dc * 2];
        if (valid(to[0], to[1]) && state.board[over[0]][over[1]] === 1 && state.board[to[0]][to[1]] === 0) {
          moves.push({ from: [row, column], over, to });
        }
      }
    }
  }
  return moves;
}

export function playMove(state: PegState, from: Position, to: Position): boolean {
  const move = legalMoves(state).find((candidate) =>
    candidate.from[0] === from[0] && candidate.from[1] === from[1]
    && candidate.to[0] === to[0] && candidate.to[1] === to[1]);
  if (!move) return false;
  state.board[move.from[0]][move.from[1]] = 0;
  state.board[move.over[0]][move.over[1]] = 0;
  state.board[move.to[0]][move.to[1]] = 1;
  state.moves += 1;
  state.finished = legalMoves(state).length === 0;
  return true;
}
