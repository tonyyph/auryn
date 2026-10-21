import type { Direction } from '../engine';

/**
 * Input policy while tiles are moving.
 *
 * - When idle, a swipe is committed at once (rules state changes immediately).
 * - While the motion phase of a turn plays, at most ONE further direction is buffered;
 *   a newer swipe replaces it. Nothing is ever computed against stale state, because a
 *   buffered direction is only committed after the board shows the latest state.
 * - `interrupt()` (undo, restart, navigation, app background) drops the buffer and
 *   makes the caller snap the board to committed state.
 */
export class TurnController {
  private animating = false;
  private buffered: Direction | null = null;
  private seq = 0;

  constructor(
    /** Commits a move. Returns true when the move was valid and an animation started. */
    private readonly commit: (direction: Direction, seq: number) => boolean,
  ) {}

  get isAnimating() {
    return this.animating;
  }

  get pending() {
    return this.buffered;
  }

  get currentSeq() {
    return this.seq;
  }

  input(direction: Direction) {
    if (this.animating) {
      this.buffered = direction;
      return;
    }
    this.run(direction);
  }

  /** The motion phase of turn `seq` finished. Stale callbacks are ignored. */
  motionDone(seq: number) {
    if (seq !== this.seq || !this.animating) return;
    this.animating = false;
    const next = this.buffered;
    this.buffered = null;
    if (next) this.run(next);
  }

  interrupt() {
    this.seq += 1;
    this.animating = false;
    this.buffered = null;
  }

  private run(direction: Direction) {
    this.seq += 1;
    const seq = this.seq;
    this.animating = this.commit(direction, seq);
  }
}
