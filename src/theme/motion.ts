import { Easing } from 'react-native-reanimated';

/** Motion tokens. Tuned so a full turn (slide + pulse) reads in ≈ 260 ms without blocking input. */
export const duration = {
  instant: 70,
  fast: 110,
  /** Tile slide. */
  move: 120,
  /** Merge pulse (1 → 1.06 → 1). */
  pulse: 150,
  spawn: 130,
  standard: 220,
  overlayIn: 260,
  overlayOut: 180,
  scoreDelta: 620,
  /** Ambient aurora drift: one half-cycle. Each ribbon uses its own so the loop never lines up. */
  aurora: 19000,
} as const;

export const easing = {
  /** Decisive deceleration for tiles: no drift, no overshoot. */
  move: Easing.bezier(0.22, 0.8, 0.3, 1),
  enter: Easing.bezier(0.16, 1, 0.3, 1),
  exit: Easing.bezier(0.4, 0, 1, 1),
  inOut: Easing.bezier(0.45, 0, 0.55, 1),
} as const;

export const spring = {
  /** Button release: short, effectively no overshoot. */
  press: { damping: 22, stiffness: 420, mass: 0.6 },
} as const;

export const PULSE_SCALE = 1.06;
export const PRESS_SCALE = 0.98;
export const SPAWN_FROM = 0.88;
