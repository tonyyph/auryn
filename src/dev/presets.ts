import { boardFromValues, type Session, type Stats } from '../engine';

/** Dev-only boards for previews and simulator screenshots. Never reachable in production. */
const make = (values: number[][], score: number, moves: number, extra: Partial<Session> = {}): Session => {
  const board = boardFromValues(values, { score, moves });
  return { gameId: `dev-${score}`, board, undo: null, celebrated: false, finishCounted: false, winCounted: false, bestAtStart: 0, ...extra };
};

export const PRESETS: Record<string, { session: Session; stats?: Partial<Stats> }> = {
  sparse: {
    session: make([[0, 0, 0, 0], [0, 2, 0, 0], [0, 0, 0, 4], [0, 0, 0, 0]], 0, 1),
  },
  mid: {
    session: make(
      [
        [2, 8, 32, 4],
        [0, 16, 64, 2],
        [0, 4, 128, 8],
        [0, 0, 2, 4],
      ],
      1248,
      140,
    ),
    stats: { bestScore: 12480 },
  },
  late: {
    session: make(
      [
        [4096, 2048, 1024, 512],
        [16, 32, 128, 256],
        [8, 4, 64, 2],
        [2, 0, 4, 0],
      ],
      61248,
      2310,
      { celebrated: true, winCounted: true },
    ),
    stats: { bestScore: 61248, largestTile: 4096, gamesReached2048: 2, gamesFinished: 14, totalMoves: 18420 },
  },
  combo: {
    session: make(
      [
        [2, 2, 4, 4],
        [8, 8, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 64],
      ],
      2400,
      120,
      { bestAtStart: 2000 },
    ),
    stats: { bestScore: 2400 },
  },
  nearWin: {
    session: make(
      [
        [1024, 1024, 8, 2],
        [4, 64, 16, 0],
        [2, 0, 0, 0],
        [0, 0, 0, 0],
      ],
      20124,
      880,
    ),
  },
  nearOver: {
    session: make(
      [
        [2, 4, 2, 4],
        [4, 2, 4, 2],
        [2, 4, 2, 4],
        [0, 4, 2, 128],
      ],
      3120,
      320,
      { bestAtStart: 2000 },
    ),
    stats: { bestScore: 3120 },
  },
  full: {
    session: make(
      [
        [2, 4, 8, 16],
        [32, 64, 128, 256],
        [512, 1024, 2048, 4096],
        [8192, 16384, 32768, 65536],
      ],
      987654,
      9999,
      { celebrated: true, winCounted: true },
    ),
    stats: { bestScore: 987654 },
  },
};
