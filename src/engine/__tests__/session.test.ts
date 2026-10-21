import {
  boardFromValues,
  boardValues,
  canUndo,
  emptyStats,
  hasProgress,
  newSession,
  playMove,
  scriptedRng,
  seededRng,
  startNewGame,
  undoMove,
  type Board,
  type Session,
  type Stats,
} from '..';

function sessionWith(board: Board, extra: Partial<Session> = {}): Session {
  return {
    gameId: 'test',
    board,
    undo: null,
    celebrated: false,
    finishCounted: false,
    winCounted: false,
    bestAtStart: 0,
    ...extra,
  };
}

const nearWin = () =>
  boardFromValues(
    [
      [1024, 1024, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    { score: 20000, moves: 500 },
  );

// One move (left) from game over: after it the board is full and stuck.
// Row 3 [0,4,2,8] slides to [4,2,8,_]; a scripted spawn puts a 2 in the last cell.
const nearOver = () =>
  boardFromValues(
    [
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [0, 4, 2, 8],
    ],
    { score: 300, moves: 40 },
  );

describe('playMove', () => {
  it('updates score, moves, best and largest tile', () => {
    const s = sessionWith(boardFromValues([[2, 2, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]));
    const o = playMove(s, emptyStats(), 'left', seededRng(1));
    expect(o.result.changed).toBe(true);
    expect(o.session.board.score).toBe(4);
    expect(o.session.board.moves).toBe(1);
    expect(o.stats).toMatchObject({ bestScore: 4, largestTile: 4, totalMoves: 1 });
    expect(canUndo(o.session)).toBe(true);
  });

  it('invalid move changes nothing and keeps the existing undo', () => {
    const prev = boardFromValues([[4, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]);
    const s = sessionWith(boardFromValues([[2, 4, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]), { undo: prev });
    const stats: Stats = emptyStats();
    const out = playMove(s, stats, 'left', seededRng(1));
    expect(out.session).toBe(s);
    expect(out.stats).toBe(stats);
    expect(out.session.undo).toBe(prev);
  });
});

describe('2048 milestone', () => {
  it('celebrates once, counts once and lets the game continue', () => {
    const rng = seededRng(3);
    let s = sessionWith(nearWin());
    let stats = emptyStats();
    const o = playMove(s, stats, 'left', rng);
    expect(o.celebrate).toBe(true);
    expect(o.stats.gamesReached2048).toBe(1);
    expect(o.session.celebrated).toBe(true);
    s = o.session;
    stats = o.stats;

    // keep playing: no further celebration
    for (const d of ['right', 'down', 'left', 'up', 'right'] as const) {
      const n = playMove(s, stats, d, rng);
      expect(n.celebrate).toBe(false);
      s = n.session;
      stats = n.stats;
    }
    expect(stats.gamesReached2048).toBe(1);
    expect(stats.largestTile).toBe(2048);
  });

  it('undoing the winning move and winning again does not celebrate or count twice', () => {
    const rng = seededRng(4);
    const won = playMove(sessionWith(nearWin()), emptyStats(), 'left', rng);
    const undone = undoMove(won.session, won.stats);
    expect(boardValues(undone.session.board)[0]).toEqual([1024, 1024, 0, 0]);
    expect(undone.session.celebrated).toBe(true);
    const again = playMove(undone.session, undone.stats, 'left', rng);
    expect(again.celebrate).toBe(false);
    expect(again.stats.gamesReached2048).toBe(1);
  });

  it('a restored game that already celebrated does not celebrate again', () => {
    const restored = sessionWith(
      boardFromValues([[2048, 2, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]),
      { celebrated: true, winCounted: true },
    );
    const o = playMove(restored, { ...emptyStats(), gamesReached2048: 1 }, 'right', seededRng(1));
    expect(o.celebrate).toBe(false);
    expect(o.stats.gamesReached2048).toBe(1);
  });
});

describe('undo', () => {
  it('restores board, score, move count and tile ids exactly, without spawning', () => {
    const rng = seededRng(11);
    const start = newSession(rng);
    const first = playMove(start, emptyStats(), 'left', rng);
    const a = first.result.changed ? first : playMove(start, emptyStats(), 'right', rng);
    expect(a.result.changed).toBe(true);
    const before = a.session.undo!;
    const u = undoMove(a.session, a.stats);
    expect(u.session.board).toEqual(before);
    expect(u.session.board.tiles).toHaveLength(before.tiles.length);
    expect(u.session.board.score).toBe(before.score);
    expect(u.session.board.moves).toBe(before.moves);
  });

  it('is single-step: disabled after use until the next valid move', () => {
    const s = sessionWith(boardFromValues([[2, 2, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]));
    const a = playMove(s, emptyStats(), 'left', seededRng(1));
    const u = undoMove(a.session, a.stats);
    expect(canUndo(u.session)).toBe(false);
    const again = undoMove(u.session, u.stats);
    expect(again.session).toBe(u.session);
    // an invalid move does not re-enable undo
    const blocked = sessionWith(boardFromValues([[2, 4, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]));
    expect(canUndo(playMove(blocked, emptyStats(), 'left', seededRng(1)).session)).toBe(false);
  });

  it('never lowers the best score and takes the move back off totalMoves', () => {
    const s = sessionWith(boardFromValues([[8, 8, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]));
    const a = playMove(s, emptyStats(), 'left', seededRng(1));
    expect(a.stats.bestScore).toBe(16);
    const u = undoMove(a.session, a.stats);
    expect(u.session.board.score).toBe(0);
    expect(u.stats.bestScore).toBe(16);
    expect(u.stats.totalMoves).toBe(0);
  });
});

describe('game over and statistics', () => {
  it('game over → undo → play on → game over counts the game once', () => {
    const rng = scriptedRng([0, 0.5]);
    const over = playMove(sessionWith(nearOver()), emptyStats(), 'left', rng);
    expect(over.gameOver).toBe(true);
    expect(over.stats.gamesFinished).toBe(1);

    const undone = undoMove(over.session, over.stats);
    expect(undone.session.finishCounted).toBe(true);
    const overAgain = playMove(undone.session, undone.stats, 'left', rng);
    expect(overAgain.gameOver).toBe(true);
    expect(overAgain.stats.gamesFinished).toBe(1);

    // and starting a new game afterwards does not count it again
    const fresh = startNewGame(overAgain.session, overAgain.stats, rng);
    expect(fresh.stats.gamesFinished).toBe(1);
  });

  it('abandoning a played game counts it as finished; an untouched one does not', () => {
    const rng = seededRng(8);
    const untouched = newSession(rng);
    expect(startNewGame(untouched, emptyStats(), rng).stats.gamesFinished).toBe(0);
    const s = sessionWith(boardFromValues([[2, 2, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]));
    const played = playMove(s, emptyStats(), 'left', rng);
    const fresh = startNewGame(played.session, played.stats, rng);
    expect(fresh.stats.gamesFinished).toBe(1);
    expect(fresh.session.board.tiles).toHaveLength(2);
    expect(fresh.session.undo).toBeNull();
    expect(fresh.session.celebrated).toBe(false);
    expect(fresh.session.bestAtStart).toBe(played.stats.bestScore);
  });

  it('hasProgress: only played, unfinished games need restart confirmation', () => {
    expect(hasProgress(newSession(seededRng(1)))).toBe(false);
    expect(hasProgress(sessionWith(nearOver()))).toBe(true);
    expect(
      hasProgress(
        sessionWith(
          boardFromValues(
            [
              [2, 4, 2, 4],
              [4, 2, 4, 2],
              [2, 4, 2, 4],
              [4, 2, 4, 2],
            ],
            { moves: 10 },
          ),
        ),
      ),
    ).toBe(false);
  });
});

describe('determinism', () => {
  it('the same seed and moves give the same game', () => {
    const play = () => {
      const rng = seededRng(1234);
      let s = newSession(rng, 'g');
      let st = emptyStats();
      for (const d of ['left', 'up', 'right', 'down', 'left', 'left', 'up'] as const) {
        const o = playMove(s, st, d, rng);
        s = o.session;
        st = o.stats;
      }
      return { board: s.board, st };
    };
    expect(play()).toEqual(play());
  });
});
