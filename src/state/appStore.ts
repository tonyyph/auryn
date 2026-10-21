import { create } from 'zustand';
import {
  defaultRng,
  emptyStats,
  newSession,
  playMove,
  startNewGame,
  undoMove,
  type Direction,
  type MoveResult,
  type Rng,
  type Session,
  type Stats,
} from '../engine';
import { defaultSettings, type Language, type Onboarding, type Settings } from '../persistence/schema';
import { loadAll, writers } from '../persistence/storage';

/**
 * How the board should get from what it shows to the committed state.
 * - move: animate `result` (slide, then resolve merges and the spawn).
 * - reset: snap to the committed board (undo, new game, restore). `fresh` = fade tiles in.
 */
export type BoardTransition =
  | { seq: number; kind: 'move'; result: MoveResult }
  | { seq: number; kind: 'reset'; fresh: boolean };

/** After this many valid moves the swipe hint retires for good. */
export const HINT_MOVES = 3;

export interface AppState {
  hydrated: boolean;
  session: Session;
  stats: Stats;
  settings: Settings;
  onboarding: Onboarding;
  /** Set when the board reaches 2048 for the first time in this game; cleared when dismissed. */
  winPending: boolean;
  transition: BoardTransition;

  hydrate(fallbackLanguage: Language): Promise<void>;
  /** Returns the move result; `changed` is false for an invalid swipe. */
  move(direction: Direction): MoveResult;
  undo(): void;
  newGame(): void;
  dismissWin(): void;
  updateSettings(patch: Partial<Settings>): void;
  resetStats(): void;
  /** Dev-only: replace the session (preview presets). */
  loadSession(session: Session, stats?: Partial<Stats>): void;
}

let rng: Rng = defaultRng;
/** Tests inject a seeded rng. */
export const setRng = (r: Rng) => {
  rng = r;
};

export const useAppStore = create<AppState>()((set, get) => ({
  hydrated: false,
  session: newSession(defaultRng),
  stats: emptyStats(),
  settings: defaultSettings('en'),
  onboarding: { hintMoves: 0 },
  winPending: false,
  transition: { seq: 0, kind: 'reset', fresh: true },

  async hydrate(fallbackLanguage) {
    const saved = await loadAll(fallbackLanguage);
    const session = saved.session ?? newSession(rng);
    set((s) => ({
      hydrated: true,
      session,
      stats: saved.stats,
      settings: saved.settings,
      onboarding: saved.onboarding,
      // A restored game never replays its celebration: the flag was saved when it fired.
      winPending: false,
      transition: { seq: s.transition.seq + 1, kind: 'reset', fresh: true },
    }));
    if (!saved.session) writers.session.save(session);
    if (saved.firstLaunch) writers.settings.save(saved.settings);
  },

  move(direction) {
    const s = get();
    const out = playMove(s.session, s.stats, direction, rng);
    if (!out.result.changed) return out.result;
    const hintMoves = Math.min(HINT_MOVES, s.onboarding.hintMoves + 1);
    set({
      session: out.session,
      stats: out.stats,
      winPending: s.winPending || out.celebrate,
      onboarding: hintMoves === s.onboarding.hintMoves ? s.onboarding : { hintMoves },
      transition: { seq: s.transition.seq + 1, kind: 'move', result: out.result },
    });
    return out.result;
  },

  undo() {
    const s = get();
    if (!s.session.undo) return;
    const out = undoMove(s.session, s.stats);
    set({
      session: out.session,
      stats: out.stats,
      winPending: false,
      transition: { seq: s.transition.seq + 1, kind: 'reset', fresh: false },
    });
  },

  newGame() {
    const s = get();
    const out = startNewGame(s.session, s.stats, rng);
    set({
      session: out.session,
      stats: out.stats,
      winPending: false,
      transition: { seq: s.transition.seq + 1, kind: 'reset', fresh: true },
    });
  },

  dismissWin() {
    set({ winPending: false });
  },

  updateSettings(patch) {
    set((s) => ({ settings: { ...s.settings, ...patch } }));
  },

  resetStats() {
    // Best score restarts from the game on the board, so it is never below the visible score.
    set((s) => ({ stats: { ...emptyStats(), bestScore: s.session.board.score, largestTile: 0 } }));
  },

  loadSession(session, stats) {
    set((s) => ({
      session,
      stats: { ...s.stats, ...stats },
      winPending: false,
      transition: { seq: s.transition.seq + 1, kind: 'reset', fresh: true },
    }));
  },
}));

// Persistence: every committed change is queued; the writer keeps only the latest snapshot.
useAppStore.subscribe((state, prev) => {
  if (!state.hydrated) return;
  if (state.session !== prev.session) writers.session.save(state.session);
  if (state.stats !== prev.stats) writers.stats.save(state.stats);
  if (state.settings !== prev.settings) writers.settings.save(state.settings);
  if (state.onboarding !== prev.onboarding) writers.onboarding.save(state.onboarding);
});
