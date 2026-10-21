import type { Direction } from '../../engine';

/** Distance at which a drag commits to a direction while the finger is still down. */
export const SWIPE_DISTANCE = 24;
/** On release, a shorter flick still counts if it was fast. */
export const FLICK_DISTANCE = 10;
export const FLICK_VELOCITY = 450;
/** The dominant axis must beat the other by this factor; near-diagonals wait for more travel. */
export const AXIS_RATIO = 1.25;

/**
 * Turns a pan into a direction, or null if it is still too short or too diagonal.
 * `final` = the finger lifted: accept a quick flick and, if the drag is long enough,
 * resolve near-diagonals by the dominant axis instead of dropping them.
 */
export function directionFromPan(dx: number, dy: number, vx: number, vy: number, final: boolean): Direction | null {
  const ax = Math.abs(dx);
  const ay = Math.abs(dy);
  const dist = Math.max(ax, ay);
  const minor = Math.min(ax, ay);
  const clearAxis = dist >= minor * AXIS_RATIO;
  let ok = dist >= SWIPE_DISTANCE && clearAxis;
  if (!ok && final) {
    const speed = Math.max(Math.abs(vx), Math.abs(vy));
    ok = (dist >= FLICK_DISTANCE && speed >= FLICK_VELOCITY) || dist >= SWIPE_DISTANCE * 1.5;
  }
  if (!ok || dist === 0) return null;
  if (ax >= ay) return dx > 0 ? 'right' : 'left';
  return dy > 0 ? 'down' : 'up';
}
