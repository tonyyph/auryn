/** Semantic colour tokens. Components read these; raw hex values live only here and in tiles.ts. */
export const colors = {
  background: {
    base: '#070B16',
    deep: '#090F20',
    elevated: '#0D1629',
  },
  surface: {
    subtle: '#111D31',
    raised: '#17243A',
    overlay: '#101A2D',
    pressed: '#1C2D43',
    /** Board shell gradient, top-left → bottom-right. */
    boardTop: '#121E35',
    boardBottom: '#0A1222',
    /** Empty cell, a touch lighter than the shell so it reads as a shallow well. */
    cellTop: '#111C31',
    cellBottom: '#17253D',
  },
  aurora: {
    emerald: '#35D8AC',
    mint: '#91F4DA',
    cyan: '#78D9F5',
    periwinkle: '#A5B8FF',
    lavender: '#C2A6F5',
    violet: '#9272E8',
    orchid: '#D6A0D9',
    champagne: '#F1DDAF',
  },
  text: {
    primary: '#F1F5FF',
    secondary: '#AAB8D0',
    tertiary: '#7F91AC',
    onLight: '#122B35',
    mint: '#B6F8E6',
    celebration: '#F1DDAF',
  },
  border: {
    subtle: 'rgba(196, 220, 255, 0.07)',
    default: 'rgba(196, 220, 255, 0.12)',
    focus: 'rgba(145, 244, 218, 0.7)',
    /** Bottom edges are darker than top edges: light comes from above. */
    bottomEdge: 'rgba(0, 0, 0, 0.28)',
  },
  highlight: {
    topEdge: 'rgba(232, 242, 255, 0.22)',
    topEdgeStrong: 'rgba(240, 248, 255, 0.34)',
  },
  state: {
    destructive: '#EF9A9A',
    destructiveSurface: '#2A1C26',
    success: '#91F4DA',
    disabledSurface: '#111A2B',
    disabledText: '#5E6F8A',
  },
  button: {
    primaryTop: '#A3F6DF',
    primaryBottom: '#7FE6C9',
    primaryPressedTop: '#8DE9CF',
    primaryPressedBottom: '#6CD5B8',
    primaryText: '#0A2028',
  },
  scrim: 'rgba(5, 8, 17, 0.68)',
  shadow: '#02040A',
} as const;

/** Keycap tones: face gradient, the solid "depth" slab under it, and the label colour. */
export interface KeyTone {
  top: string;
  bottom: string;
  depth: string;
  text: string;
  glow?: string;
}

export const keyTones = {
  mint: { top: '#B4FAE7', bottom: '#78E3C5', depth: '#2E9C80', text: '#06241E', glow: '#35D8AC' },
  gold: { top: '#F8EAC4', bottom: '#DDBF83', depth: '#9C7B3F', text: '#3A2D12', glow: '#F1DDAF' },
  violet: { top: '#C9B8FF', bottom: '#9A86F0', depth: '#5B47B0', text: '#1D1440', glow: '#9272E8' },
  ink: { top: '#22324D', bottom: '#18253B', depth: '#0A111F', text: '#EAF1FF' },
  disabled: { top: '#141E31', bottom: '#111A2B', depth: '#0A101C', text: '#5E6F8A' },
} satisfies Record<string, KeyTone>;

/** Multiplies a #RRGGBB colour's channels (0..1 darkens). */
export function shade(hex: string, f: number): string {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.max(0, Math.min(255, Math.round(v * f))));
  return `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

/** Adds alpha to a #RRGGBB colour. */
export function alpha(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

/**
 * The solid "slab" under a raised surface, as a box-shadow layer: a copy of the surface's
 * own rounded shape pushed down by `depth`, with no blur. A thick bottom border would taper
 * into the corners and leave a dark notch between the face's rounded corner and the slab.
 * Shadows take no layout space, so give the element `marginBottom: depth` where it matters.
 */
export function slab(depth: number, color: string): string {
  return `0 ${depth}px 0 0 ${color}`;
}
