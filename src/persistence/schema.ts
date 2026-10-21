import { emptyStats, type Board, type Session, type Stats, type Tile } from '../engine';

export const SCHEMA_VERSION = 1;

export interface Envelope<T> {
  v: number;
  data: T;
}

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
const isNat = (x: unknown): x is number => typeof x === 'number' && Number.isInteger(x) && x >= 0;
const isPow2 = (x: unknown): x is number => isNat(x) && x >= 2 && (x & (x - 1)) === 0;

/** Opens a versioned envelope. Unknown versions are treated as missing data. */
export function unwrap(raw: string | null): unknown {
  if (!raw) return undefined;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isObj(parsed) || parsed.v !== SCHEMA_VERSION) return undefined;
    return parsed.data;
  } catch {
    return undefined;
  }
}

export const wrap = <T>(data: T) => JSON.stringify({ v: SCHEMA_VERSION, data } satisfies Envelope<T>);

export function parseBoard(x: unknown): Board | null {
  if (!isObj(x) || x.size !== 4 || !Array.isArray(x.tiles)) return null;
  if (!isNat(x.score) || !isNat(x.moves) || !isNat(x.nextId)) return null;
  const size = x.size;
  const ids = new Set<number>();
  const cells = new Set<number>();
  const tiles: Tile[] = [];
  for (const t of x.tiles) {
    if (!isObj(t) || !isNat(t.id) || !isPow2(t.value) || !isNat(t.row) || !isNat(t.col)) return null;
    if (t.row >= size || t.col >= size || t.id >= x.nextId) return null;
    const cell = t.row * size + t.col;
    if (ids.has(t.id) || cells.has(cell)) return null;
    ids.add(t.id);
    cells.add(cell);
    tiles.push({ id: t.id, value: t.value, row: t.row, col: t.col });
  }
  if (tiles.length === 0) return null;
  return { size, tiles, score: x.score, moves: x.moves, nextId: x.nextId };
}

/** A session is all-or-nothing: if any part is corrupt we start a fresh game. */
export function parseSession(x: unknown): Session | null {
  if (!isObj(x) || typeof x.gameId !== 'string') return null;
  const board = parseBoard(x.board);
  if (!board) return null;
  // A broken undo snapshot only costs the undo, not the game.
  const undo = x.undo == null ? null : parseBoard(x.undo);
  const flag = (k: string) => x[k] === true;
  return {
    gameId: x.gameId,
    board,
    undo: undo && undo.nextId <= board.nextId ? undo : null,
    celebrated: flag('celebrated'),
    finishCounted: flag('finishCounted'),
    winCounted: flag('winCounted'),
    // Missing → assume the current score was already the best, so no false "new best".
    bestAtStart: isNat(x.bestAtStart) ? x.bestAtStart : board.score,
  };
}

/** Stats recover field by field: one bad number does not wipe the rest. */
export function parseStats(x: unknown): Stats {
  const base = emptyStats();
  if (!isObj(x)) return base;
  const out = { ...base };
  for (const k of Object.keys(base) as (keyof Stats)[]) {
    const v = x[k];
    if (isNat(v)) out[k] = v;
  }
  return out;
}

export type Language = 'en' | 'vi';

export interface Settings {
  sound: boolean;
  haptics: boolean;
  /** The player's own choice; the system setting is applied on top and cannot be overridden. */
  reduceMotion: boolean;
  language: Language;
  /** Shows a four-way pad under the board for players who prefer buttons to swipes. */
  directionPad: boolean;
}

export const defaultSettings = (language: Language): Settings => ({
  sound: true,
  haptics: true,
  reduceMotion: false,
  language,
  directionPad: false,
});

export function parseSettings(x: unknown, fallbackLanguage: Language): Settings {
  const base = defaultSettings(fallbackLanguage);
  if (!isObj(x)) return base;
  const bool = (k: keyof Settings) => (typeof x[k] === 'boolean' ? (x[k] as boolean) : (base[k] as boolean));
  return {
    sound: bool('sound'),
    haptics: bool('haptics'),
    reduceMotion: bool('reduceMotion'),
    directionPad: bool('directionPad'),
    language: x.language === 'en' || x.language === 'vi' ? x.language : base.language,
  };
}

/** One-time onboarding marks. */
export interface Onboarding {
  /** Valid moves seen with the swipe hint visible; the hint retires after a few. */
  hintMoves: number;
}

export function parseOnboarding(x: unknown): Onboarding {
  return { hintMoves: isObj(x) && isNat(x.hintMoves) ? x.hintMoves : 0 };
}
