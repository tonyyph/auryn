import { isGameOver, maxTile, move, newBoard, WIN_VALUE } from './board';
import type { Board, Direction, MoveResult, Rng } from './types';

/**
 * One game in progress, plus the bookkeeping that must survive undo.
 *
 * `board` and `undo` are rules state: undo swaps `undo` back into `board`.
 * The flags below are deliberately NOT part of the undo snapshot, so that
 * undoing a move never lets a celebration or a statistic fire twice.
 */
export interface Session {
  gameId: string;
  board: Board;
  /** The board before the last valid move. Null after an undo or on a fresh game. */
  undo: Board | null;
  /** The 2048 celebration has been shown for this game. */
  celebrated: boolean;
  /** This game has been counted in `gamesFinished`. */
  finishCounted: boolean;
  /** This game has been counted in `gamesReached2048`. */
  winCounted: boolean;
  /** Best score when this game began; the game sets a new personal best only above it. */
  bestAtStart: number;
}

/**
 * Lifetime statistics. Definitions:
 * - bestScore: highest score ever shown on a board. Never lowered by undo.
 * - gamesFinished: games that reached game over, or were replaced by a new game after at
 *   least one move. Each game counts once, even across game over → undo → game over.
 * - gamesReached2048: games in which a 2048 tile was made. Each game counts once.
 * - largestTile: biggest tile ever made. Never lowered by undo.
 * - totalMoves: valid moves made. An undo takes its move back off.
 */
export interface Stats {
  bestScore: number;
  gamesFinished: number;
  gamesReached2048: number;
  largestTile: number;
  totalMoves: number;
}

export const emptyStats = (): Stats => ({
  bestScore: 0,
  gamesFinished: 0,
  gamesReached2048: 0,
  largestTile: 0,
  totalMoves: 0,
});

export function newGameId(rng: Rng): string {
  return `${Date.now().toString(36)}-${Math.floor(rng() * 1e9).toString(36)}`;
}

export function newSession(rng: Rng, gameId = newGameId(rng), bestAtStart = 0): Session {
  return {
    gameId,
    board: newBoard(rng),
    undo: null,
    celebrated: false,
    finishCounted: false,
    winCounted: false,
    bestAtStart,
  };
}

export const isNewBest = (session: Session) => session.board.score > session.bestAtStart;

export interface MoveOutcome {
  session: Session;
  stats: Stats;
  result: MoveResult;
  /** True the first time this game reaches 2048: show the celebration. */
  celebrate: boolean;
  gameOver: boolean;
}

export function playMove(session: Session, stats: Stats, direction: Direction, rng: Rng): MoveOutcome {
  const result = move(session.board, direction, rng);
  if (!result.changed) {
    return { session, stats, result, celebrate: false, gameOver: false };
  }
  const board = result.after;
  const top = maxTile(board);
  const reached = top >= WIN_VALUE;
  const gameOver = isGameOver(board);
  const celebrate = reached && !session.celebrated;

  const next: Session = {
    ...session,
    board,
    undo: session.board,
    celebrated: session.celebrated || reached,
    winCounted: session.winCounted || reached,
    finishCounted: session.finishCounted || gameOver,
  };
  const nextStats: Stats = {
    bestScore: Math.max(stats.bestScore, board.score),
    largestTile: Math.max(stats.largestTile, top),
    totalMoves: stats.totalMoves + 1,
    gamesReached2048: stats.gamesReached2048 + (reached && !session.winCounted ? 1 : 0),
    gamesFinished: stats.gamesFinished + (gameOver && !session.finishCounted ? 1 : 0),
  };
  return { session: next, stats: nextStats, result, celebrate, gameOver };
}

export const canUndo = (session: Session) => session.undo !== null;

/** Restores the previous board exactly. No tile is spawned. Undo is single-step. */
export function undoMove(session: Session, stats: Stats): { session: Session; stats: Stats } {
  if (!session.undo) return { session, stats };
  return {
    session: { ...session, board: session.undo, undo: null },
    stats: { ...stats, totalMoves: Math.max(0, stats.totalMoves - 1) },
  };
}

/** Starts a new game, counting the abandoned one as finished if it was played and not yet counted. */
export function startNewGame(session: Session, stats: Stats, rng: Rng): { session: Session; stats: Stats } {
  const abandoned = session.board.moves > 0 && !session.finishCounted;
  return {
    session: newSession(rng, undefined, stats.bestScore),
    stats: abandoned ? { ...stats, gamesFinished: stats.gamesFinished + 1 } : stats,
  };
}

/** A game the player has meaningfully started; restarting it needs confirmation. */
export const hasProgress = (session: Session) => session.board.moves > 0 && !isGameOver(session.board);
