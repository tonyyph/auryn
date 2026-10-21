export const space = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 12: 48, 16: 64 } as const;

export const radius = {
  board: 30,
  tile: 16,
  cell: 14,
  button: 19,
  control: 15,
  modal: 30,
  sheet: 32,
  pill: 999,
} as const;

export const MIN_TOUCH = 44;

export interface GameLayoutInput {
  width: number;
  height: number;
  insets: { top: number; bottom: number; left: number; right: number };
  /** Extra vertical space the direction pad needs, if shown. */
  padHeight?: number;
  fontScale?: number;
}

export interface GameLayout {
  compact: boolean;
  screenPadding: number;
  /** Vertical gaps between header/score/board/controls. */
  gap: number;
  boardSide: number;
  boardPadding: number;
  cellGap: number;
  tileSide: number;
  /** True when even the minimum board does not fit; the screen should scroll. */
  needsScroll: boolean;
}

export const BOARD_MAX = 432;
const BOARD_MIN = 248;

/**
 * Board side = the smaller of the width and height budgets. On short screens, the gaps
 * shrink first, then the board. Fixed chrome heights are the real component heights.
 */
export function computeGameLayout({ width, height, insets, padHeight = 0, fontScale = 1 }: GameLayoutInput): GameLayout {
  const compact = height < 700 || width < 360;
  const screenPadding = width < 360 ? 16 : compact ? 20 : 24;
  const text = Math.min(Math.max(fontScale, 1), 1.6);
  const topBar = 52;
  const scoreHeader = Math.round(74 * text);
  const controls = Math.round(64 * text);
  const hint = Math.round(22 * text);
  const chrome = topBar + scoreHeader + controls + hint + padHeight;

  const availW = width - insets.left - insets.right - screenPadding * 2;
  const verticalFree = (gap: number) => height - insets.top - insets.bottom - chrome - gap * 4 - 8;

  let gap = 24;
  while (gap > 12 && verticalFree(gap) < Math.min(availW, BOARD_MAX)) gap -= 4;
  const availH = verticalFree(gap);

  const boardSide = Math.floor(Math.max(BOARD_MIN, Math.min(availW, availH, BOARD_MAX)));
  const boardPadding = boardSide < 320 ? 10 : boardSide < 380 ? 12 : 14;
  const cellGap = boardSide < 320 ? 7 : boardSide < 380 ? 8 : 10;
  const tileSide = (boardSide - boardPadding * 2 - cellGap * 3) / 4;
  return {
    compact,
    screenPadding,
    gap,
    boardSide,
    boardPadding,
    cellGap,
    tileSide,
    needsScroll: availH < BOARD_MIN || availW < BOARD_MIN,
  };
}

/** Top-left offset of a cell inside the board's content box. */
export const cellOffset = (index: number, tileSide: number, cellGap: number) => index * (tileSide + cellGap);
