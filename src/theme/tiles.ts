/**
 * Tile materials. Colour IS progress: each step moves along the aurora, from midnight
 * slate through emerald and ice to champagne, then into designed variants beyond 2048.
 * The number is always the strongest element; contrast is enforced in tiles.test.ts.
 */
export type TileTier = 'satin' | 'clear' | 'lit' | 'radiant';

export interface TileMaterial {
  top: string;
  bottom: string;
  number: string;
  /** Strength of the top-edge highlight (luminous edge). */
  edge: number;
  tier: TileTier;
  /** Colour of the soft light the tile throws at high tiers (and of its merge halo). */
  glow: string;
}

const PALETTE: Record<number, TileMaterial> = {
  2: { top: '#23334D', bottom: '#19263D', number: '#E4ECFA', edge: 0.14, tier: 'satin', glow: '#5A7AA8' },
  4: { top: '#2B4660', bottom: '#20374E', number: '#E6F4FD', edge: 0.15, tier: 'satin', glow: '#6A9CC4' },
  8: { top: '#286364', bottom: '#1C494E', number: '#E1FFF6', edge: 0.16, tier: 'satin', glow: '#4FB3A7' },
  16: { top: '#2B806E', bottom: '#22665B', number: '#F0FFF8', edge: 0.18, tier: 'satin', glow: '#35D8AC' },
  32: { top: '#71D8B9', bottom: '#4BB89D', number: '#102E2A', edge: 0.3, tier: 'clear', glow: '#91F4DA' },
  64: { top: '#93E1EB', bottom: '#63BDCE', number: '#123039', edge: 0.32, tier: 'clear', glow: '#78D9F5' },
  128: { top: '#A2C4F5', bottom: '#7D9DD6', number: '#182942', edge: 0.34, tier: 'clear', glow: '#A5B8FF' },
  256: { top: '#B6AFF0', bottom: '#9387D1', number: '#282440', edge: 0.34, tier: 'lit', glow: '#A5B8FF' },
  512: { top: '#CCB4ED', bottom: '#AC8BD3', number: '#32233F', edge: 0.36, tier: 'lit', glow: '#C2A6F5' },
  1024: { top: '#E1B4D9', bottom: '#C48FBD', number: '#3C2540', edge: 0.38, tier: 'lit', glow: '#D6A0D9' },
  2048: { top: '#F3E3B7', bottom: '#D9BD85', number: '#40351E', edge: 0.5, tier: 'radiant', glow: '#F1DDAF' },
  // Beyond the milestone: pearl, ice, a dawn blend, then deep "night" variants that
  // invert to light numerals so they stay distinct from everything below.
  4096: { top: '#D9F7EC', bottom: '#A6DFCB', number: '#123A31', edge: 0.5, tier: 'radiant', glow: '#91F4DA' },
  8192: { top: '#E6ECF5', bottom: '#B5C3D7', number: '#1C2636', edge: 0.5, tier: 'radiant', glow: '#C9D6EA' },
  16384: { top: '#BFF3E4', bottom: '#AFA9EE', number: '#1E2440', edge: 0.5, tier: 'radiant', glow: '#A5B8FF' },
  32768: { top: '#2E4688', bottom: '#3A2A72', number: '#F1DDAF', edge: 0.42, tier: 'radiant', glow: '#9272E8' },
  65536: { top: '#3E3322', bottom: '#211B12', number: '#F1DDAF', edge: 0.46, tier: 'radiant', glow: '#F1DDAF' },
};

export const TILE_VALUES = Object.keys(PALETTE).map(Number);

export function tileMaterial(value: number): TileMaterial {
  if (PALETTE[value]) return PALETTE[value];
  // Above the designed range, stay on the final designed variant rather than a low tile.
  return PALETTE[65536];
}

/** Font size from tile side and digit count. ≈33 / 31 / 27 / 23 / 19 at a 72pt tile. */
export function tileFontSize(tileSide: number, value: number): number {
  const digits = String(value).length;
  const ratio = digits <= 1 ? 0.46 : digits === 2 ? 0.43 : digits === 3 ? 0.385 : digits === 4 ? 0.335 : digits === 5 ? 0.27 : 0.23;
  return Math.round(tileSide * ratio);
}
