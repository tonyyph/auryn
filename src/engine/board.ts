import type { Board, Cell, Direction, Merge, MoveResult, Rng, Tile, TileMotion } from './types';

export const BOARD_SIZE = 4;
export const WIN_VALUE = 2048;
export const SPAWN_FOUR_CHANCE = 0.1;

export function emptyBoard(size = BOARD_SIZE): Board {
  return { size, tiles: [], score: 0, moves: 0, nextId: 1 };
}

export function emptyCells(board: Board): Cell[] {
  const taken = new Set(board.tiles.map((t) => t.row * board.size + t.col));
  const cells: Cell[] = [];
  for (let row = 0; row < board.size; row++) {
    for (let col = 0; col < board.size; col++) {
      if (!taken.has(row * board.size + col)) cells.push({ row, col });
    }
  }
  return cells;
}

/** Adds one tile (2 at 90%, 4 at 10%) to a random empty cell. Null if the board is full. */
export function spawnTile(board: Board, rng: Rng): { board: Board; tile: Tile } | null {
  const cells = emptyCells(board);
  if (cells.length === 0) return null;
  const cell = cells[Math.min(cells.length - 1, Math.floor(rng() * cells.length))];
  const value = rng() < SPAWN_FOUR_CHANCE ? 4 : 2;
  const tile: Tile = { id: board.nextId, value, row: cell.row, col: cell.col };
  return { board: { ...board, tiles: [...board.tiles, tile], nextId: board.nextId + 1 }, tile };
}

export function newBoard(rng: Rng, size = BOARD_SIZE): Board {
  let board = emptyBoard(size);
  for (let i = 0; i < 2; i++) {
    const spawned = spawnTile(board, rng);
    if (spawned) board = spawned.board;
  }
  return board;
}

/**
 * Cell of the k-th position along line `line`, counted from the edge the tiles move toward.
 */
function cellAt(direction: Direction, size: number, line: number, k: number): Cell {
  switch (direction) {
    case 'left':
      return { row: line, col: k };
    case 'right':
      return { row: line, col: size - 1 - k };
    case 'up':
      return { row: k, col: line };
    case 'down':
      return { row: size - 1 - k, col: line };
  }
}

export function tileGrid(board: Board): (Tile | null)[][] {
  const grid: (Tile | null)[][] = Array.from({ length: board.size }, () =>
    Array.from({ length: board.size }, () => null),
  );
  for (const t of board.tiles) grid[t.row][t.col] = t;
  return grid;
}

/**
 * Slides and merges every line toward `direction`. Does not spawn.
 * A tile merges at most once per move; merges resolve from the leading edge.
 */
export function slide(board: Board, direction: Direction) {
  const grid = tileGrid(board);
  const tiles: Tile[] = [];
  const motions: TileMotion[] = [];
  const merges: Merge[] = [];
  let scoreGained = 0;

  for (let line = 0; line < board.size; line++) {
    const placed: { tile: Tile; merged: boolean }[] = [];
    for (let k = 0; k < board.size; k++) {
      const from = cellAt(direction, board.size, line, k);
      const tile = grid[from.row][from.col];
      if (!tile) continue;
      const last = placed[placed.length - 1];
      if (last && !last.merged && last.tile.value === tile.value) {
        const value = tile.value * 2;
        last.tile = { ...last.tile, value };
        last.merged = true;
        const at = { row: last.tile.row, col: last.tile.col };
        merges.push({ survivorId: last.tile.id, consumedId: tile.id, value, at });
        motions.push({ id: tile.id, from, to: at });
        scoreGained += value;
      } else {
        const to = cellAt(direction, board.size, line, placed.length);
        placed.push({ tile: { ...tile, row: to.row, col: to.col }, merged: false });
        motions.push({ id: tile.id, from, to });
      }
    }
    for (const p of placed) tiles.push(p.tile);
  }

  const changed = motions.some((m) => m.from.row !== m.to.row || m.from.col !== m.to.col);
  return { tiles, motions, merges, scoreGained, changed };
}

/**
 * Applies one player move. If nothing slides or merges the move is invalid: the board is
 * returned untouched (same object), with no spawn, no score and no move counted.
 */
export function move(board: Board, direction: Direction, rng: Rng): MoveResult {
  const slid = slide(board, direction);
  if (!slid.changed) {
    return {
      direction,
      changed: false,
      before: board,
      after: board,
      motions: [],
      merges: [],
      spawned: null,
      scoreGained: 0,
    };
  }
  const moved: Board = {
    ...board,
    tiles: slid.tiles,
    score: board.score + slid.scoreGained,
    moves: board.moves + 1,
  };
  const spawned = spawnTile(moved, rng);
  return {
    direction,
    changed: true,
    before: board,
    after: spawned ? spawned.board : moved,
    motions: slid.motions,
    merges: slid.merges,
    spawned: spawned ? spawned.tile : null,
    scoreGained: slid.scoreGained,
  };
}

export function canMove(board: Board): boolean {
  if (board.tiles.length < board.size * board.size) return true;
  const grid = tileGrid(board);
  for (let r = 0; r < board.size; r++) {
    for (let c = 0; c < board.size; c++) {
      const v = grid[r][c]?.value;
      if (c + 1 < board.size && grid[r][c + 1]?.value === v) return true;
      if (r + 1 < board.size && grid[r + 1][c]?.value === v) return true;
    }
  }
  return false;
}

export const isGameOver = (board: Board) => !canMove(board);

export function maxTile(board: Board): number {
  return board.tiles.reduce((m, t) => Math.max(m, t.value), 0);
}

/** Builds a board from a value grid (0 = empty). Handy for tests and dev presets. */
export function boardFromValues(values: number[][], extra: Partial<Board> = {}): Board {
  const tiles: Tile[] = [];
  let id = 1;
  values.forEach((rowValues, row) =>
    rowValues.forEach((value, col) => {
      if (value) tiles.push({ id: id++, value, row, col });
    }),
  );
  return { size: values.length, tiles, score: 0, moves: 0, nextId: id, ...extra };
}

export function boardValues(board: Board): number[][] {
  return tileGrid(board).map((row) => row.map((t) => t?.value ?? 0));
}
