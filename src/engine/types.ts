export type Direction = 'up' | 'down' | 'left' | 'right';

export const DIRECTIONS: readonly Direction[] = ['up', 'down', 'left', 'right'];

/** Returns a float in [0, 1). Injected so tests can be deterministic. */
export type Rng = () => number;

export interface Cell {
  row: number;
  col: number;
}

/** A tile keeps its `id` for its whole life; position is not identity. */
export interface Tile extends Cell {
  id: number;
  value: number;
}

/** The complete rules state of one board. Immutable; every move returns a new one. */
export interface Board {
  size: number;
  tiles: readonly Tile[];
  score: number;
  /** Valid moves made on this board. */
  moves: number;
  /** Next id to hand out; always greater than every id on the board. */
  nextId: number;
}

export interface TileMotion {
  id: number;
  from: Cell;
  to: Cell;
}

/**
 * Two tiles that became one. The survivor keeps its id and doubles; the consumed
 * tile slides to the same cell and is removed.
 */
export interface Merge {
  survivorId: number;
  consumedId: number;
  value: number;
  at: Cell;
}

export interface MoveResult {
  direction: Direction;
  changed: boolean;
  before: Board;
  after: Board;
  /** One entry per tile on `before`, including consumed tiles. */
  motions: TileMotion[];
  merges: Merge[];
  spawned: Tile | null;
  scoreGained: number;
}
