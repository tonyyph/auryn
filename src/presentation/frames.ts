import type { Board, Cell, MoveResult } from '../engine';

/**
 * What the board draws. A frame is derived from committed rules state; it is never
 * persisted and never fed back into the engine.
 */
export interface RenderTile {
  id: number;
  value: number;
  cell: Cell;
  /** Draw under the other tiles: a consumed tile sliding under its survivor. */
  under: boolean;
  /** Bumped when the tile is the result of a merge, to trigger the pulse. */
  pulse: number;
  /**
   * Motion frames only: the value a survivor shows once the turn resolves. The tile swaps
   * faces on the UI thread at the resolve moment, so the swap never waits on React.
   */
  next?: number;
  /** Tile appeared in this frame and should animate in. */
  spawn: boolean;
}

export interface Frame {
  phase: 'motion' | 'settled';
  tiles: RenderTile[];
}

/** A resting board: every tile at its committed cell. */
export function settledFrame(board: Board, opts: { spawnIds?: ReadonlySet<number>; pulseIds?: ReadonlySet<number>; pulseKey?: number } = {}): Frame {
  return {
    phase: 'settled',
    tiles: board.tiles.map((t) => ({
      id: t.id,
      value: t.value,
      cell: { row: t.row, col: t.col },
      under: false,
      pulse: opts.pulseIds?.has(t.id) ? (opts.pulseKey ?? 1) : 0,
      spawn: opts.spawnIds?.has(t.id) ?? false,
    })),
  };
}

/**
 * Phase 1 of a turn: every tile of the previous board slides to its destination still
 * showing its OLD value. Consumed tiles slide under their survivor. Everything that happens
 * when the turn resolves is scheduled here too, delayed on the UI thread: survivors carry
 * their `next` value and the turn's pulse key, consumed tiles vanish, and the spawned tile
 * is mounted with `spawn` (it appears at the resolve moment, not now).
 */
export function motionFrame(result: MoveResult, turnKey: number): Frame {
  const consumed = new Set(result.merges.map((m) => m.consumedId));
  const merged = new Map(result.merges.map((m) => [m.survivorId, m.value]));
  const byId = new Map(result.before.tiles.map((t) => [t.id, t]));
  const tiles: RenderTile[] = result.motions.map((m) => ({
    id: m.id,
    value: byId.get(m.id)?.value ?? 0,
    cell: m.to,
    under: consumed.has(m.id),
    pulse: merged.has(m.id) ? turnKey : 0,
    spawn: false,
    next: merged.get(m.id),
  }));
  // Draw consumed tiles first so survivors sit on top.
  tiles.sort((a, b) => Number(b.under) - Number(a.under));
  const sp = result.spawned;
  if (sp) tiles.push({ id: sp.id, value: sp.value, cell: { row: sp.row, col: sp.col }, under: false, pulse: 0, spawn: true });
  return { phase: 'motion', tiles };
}

/**
 * Phase 2: consumed tiles are gone, survivors show their doubled value. The pulse key and
 * the spawned tile match phase 1, so nothing restarts: this frame only makes the committed
 * state structural (no ghosts, no second faces) and looks identical to the end of phase 1.
 */
export function resolvedFrame(result: MoveResult, turnKey: number): Frame {
  return settledFrame(result.after, {
    pulseIds: new Set(result.merges.map((m) => m.survivorId)),
    pulseKey: turnKey,
    spawnIds: result.spawned ? new Set([result.spawned.id]) : undefined,
  });
}
