import fs from 'fs';
import path from 'path';
import { colors, keyTones } from '../colors';
import { BOARD_MAX, computeGameLayout } from '../layout';
import { TILE_VALUES, tileFontSize, tileMaterial } from '../tiles';

// The test only reads the font files, so it doesn't need the theme's Reanimated import chain.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const opentype = require('opentype.js');

function luminance(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}
const contrast = (a: string, b: string) => {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

describe('tile palette', () => {
  it.each(TILE_VALUES)('tile %i number contrast ≥ 4.5:1 against both gradient stops', (v) => {
    const m = tileMaterial(v);
    expect(contrast(m.number, m.top)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(m.number, m.bottom)).toBeGreaterThanOrEqual(4.5);
  });

  it('every step is a distinct material, and huge tiles never fall back to a low one', () => {
    const tops = TILE_VALUES.map((v) => tileMaterial(v).top);
    expect(new Set(tops).size).toBe(tops.length);
    expect(tileMaterial(131072)).toBe(tileMaterial(65536));
  });

  it('low tiles stay distinguishable from empty cells', () => {
    expect(contrast(tileMaterial(2).top, colors.surface.cellTop)).toBeGreaterThan(1.25);
  });

  it('font size steps down with digits and keeps safe padding', () => {
    const sizes = [2, 16, 128, 2048, 16384].map((v) => tileFontSize(72, v));
    expect(sizes).toEqual([...sizes].sort((a, b) => b - a));
    expect(sizes[0]).toBeGreaterThanOrEqual(32);
    expect(sizes[3]).toBeGreaterThanOrEqual(22);
    // Manrope bold digits are ≈0.62 em wide: 5 digits must fit inside 85% of the tile.
    expect(5 * 0.62 * tileFontSize(72, 16384)).toBeLessThan(72 * 0.85);
    expect(4 * 0.62 * tileFontSize(72, 2048)).toBeLessThan(72 * 0.85);
  });
});

describe('text colours', () => {
  it.each([
    ['primary', colors.text.primary],
    ['secondary', colors.text.secondary],
    ['tertiary', colors.text.tertiary],
  ])('%s text reads on every surface (≥ 4.5:1)', (_n, c) => {
    for (const bg of [colors.background.base, colors.surface.overlay, colors.surface.raised]) {
      expect(contrast(c, bg)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('primary button text', () => {
    expect(contrast(colors.button.primaryText, colors.button.primaryBottom)).toBeGreaterThanOrEqual(7);
  });

  it.each(Object.entries(keyTones).filter(([k]) => k !== 'disabled'))('%s keycap label ≥ 4.5:1 on both face stops', (_n, tone) => {
    expect(contrast(tone.text, tone.top)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(tone.text, tone.bottom)).toBeGreaterThanOrEqual(4.5);
  });

  it('disabled text is still legible', () => {
    expect(contrast(colors.state.disabledText, colors.state.disabledSurface)).toBeGreaterThanOrEqual(3);
  });
});

describe('game layout', () => {
  const insets = { top: 59, bottom: 34, left: 0, right: 0 };

  it.each([
    ['iPhone SE', 375, 667, { top: 20, bottom: 0, left: 0, right: 0 }],
    ['iPhone 16 Pro', 402, 874, insets],
    ['Pro Max', 440, 956, insets],
    ['small Android', 360, 640, { top: 24, bottom: 16, left: 0, right: 0 }],
    ['iPad', 820, 1180, { top: 24, bottom: 20, left: 0, right: 0 }],
  ])('%s: board fits without scrolling and tiles stay ≥ 52pt', (_n, width, height, ins) => {
    const l = computeGameLayout({ width, height, insets: ins });
    expect(l.needsScroll).toBe(false);
    expect(l.boardSide).toBeLessThanOrEqual(BOARD_MAX);
    expect(l.boardSide).toBeLessThanOrEqual(width - l.screenPadding * 2);
    expect(l.tileSide).toBeGreaterThanOrEqual(52);
    expect(l.boardPadding * 2 + l.cellGap * 3 + l.tileSide * 4).toBeCloseTo(l.boardSide, 5);
  });

  it('very large text on a small phone asks for scrolling instead of clipping', () => {
    const l = computeGameLayout({ width: 320, height: 568, insets: { top: 20, bottom: 0, left: 0, right: 0 }, fontScale: 2 });
    expect(l.needsScroll).toBe(true);
  });
});

describe('fonts', () => {
  const root = path.join(__dirname, '../../../node_modules/@expo-google-fonts');
  const files = [
    'manrope/400Regular/Manrope_400Regular.ttf',
    'manrope/500Medium/Manrope_500Medium.ttf',
    'manrope/600SemiBold/Manrope_600SemiBold.ttf',
    'manrope/700Bold/Manrope_700Bold.ttf',
    'manrope/800ExtraBold/Manrope_800ExtraBold.ttf',
    'unbounded/500Medium/Unbounded_500Medium.ttf',
    'unbounded/700Bold/Unbounded_700Bold.ttf',
    'unbounded/900Black/Unbounded_900Black.ttf',
  ];

  it.each(files)('%s covers Vietnamese and has tabular figures', (file) => {
    const buf = fs.readFileSync(path.join(root, file));
    const font = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
    const vi = 'ăâđêôơưàảãáạằẳẵắặầẩẫấậèẻẽéẹềểễếệìỉĩíịòỏõóọồổỗốộờởỡớợùủũúụừửữứựỳỷỹýỵ';
    const all = vi + vi.toUpperCase() + '0123456789';
    const missing = [...all].filter((c) => font.charToGlyphIndex(c) === 0);
    expect(missing).toEqual([]);
    const features = font.tables.gsub.features.map((f: { tag: string }) => f.tag);
    expect(features).toContain('tnum');
  });
});
