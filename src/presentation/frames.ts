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
 * showing its OLD value. Consumed tiles slide under their survivor. Nothing spawns yet.
 */
export function motionFrame(result: MoveResult): Frame {
  const consumed = new Set(result.merges.map((m) => m.consumedId));
  const byId = new Map(result.before.tiles.map((t) => [t.id, t]));
  const tiles: RenderTile[] = result.motions.map((m) => ({
    id: m.id,
    value: byId.get(m.id)?.value ?? 0,
    cell: m.to,
    under: consumed.has(m.id),
    pulse: 0,
    spawn: false,
  }));
  // Draw consumed tiles first so survivors sit on top.
  tiles.sort((a, b) => Number(b.under) - Number(a.under));
  return { phase: 'motion', tiles };
}

/**
 * Phase 2: consumed tiles are gone, survivors show their doubled value and pulse,
 * the spawned tile fades in. Positions are identical to the end of phase 1, so the
 * swap is invisible apart from the intended pulse — no flicker, no ghost tiles.
 */
export function resolvedFrame(result: MoveResult, turnKey: number): Frame {
  return settledFrame(result.after, {
    pulseIds: new Set(result.merges.map((m) => m.survivorId)),
    pulseKey: turnKey,
    spawnIds: result.spawned ? new Set([result.spawned.id]) : undefined,
  });
}
