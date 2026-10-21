import type { TextStyle } from 'react-native';
import { colors } from './colors';

/**
 * Two families, both SIL OFL with full Vietnamese coverage:
 * Unbounded (wide, chunky display: titles, score, keycap labels) and Manrope (body, tile numerals).
 */
export const fonts = {
  regular: 'Manrope_400Regular',
  medium: 'Manrope_500Medium',
  semibold: 'Manrope_600SemiBold',
  bold: 'Manrope_700Bold',
  heavy: 'Manrope_800ExtraBold',
  display: 'Unbounded_900Black',
  displayBold: 'Unbounded_700Bold',
  displayMedium: 'Unbounded_500Medium',
} as const;

/** Tabular figures so scores never change width as digits change. */
export const tabular: TextStyle = { fontVariant: ['tabular-nums'] };

/** Unbounded's stacked Vietnamese capitals (Ế, Ổ) rise to 1.11 em: display line heights leave room. */
export const type = {
  wordmark: { fontFamily: fonts.display, fontSize: 15, letterSpacing: 3, color: colors.text.primary },
  logo: { fontFamily: fonts.display, fontSize: 58, lineHeight: 72, letterSpacing: -1, color: colors.text.primary },
  display: { fontFamily: fonts.display, fontSize: 40, lineHeight: 52, letterSpacing: -0.5, color: colors.text.primary },
  hud: { fontFamily: fonts.displayBold, fontSize: 10.5, lineHeight: 15, letterSpacing: 1.6, color: colors.text.tertiary },
  eyebrow: { fontFamily: fonts.displayBold, fontSize: 11, lineHeight: 16, letterSpacing: 1.6, color: colors.text.mint },
  screenTitle: { fontFamily: fonts.display, fontSize: 30, lineHeight: 40, letterSpacing: -0.4, color: colors.text.primary },
  modalTitle: { fontFamily: fonts.display, fontSize: 26, lineHeight: 35, letterSpacing: -0.3, color: colors.text.primary },
  score: { fontFamily: fonts.display, fontSize: 44, lineHeight: 54, letterSpacing: -1, color: colors.text.primary, ...tabular },
  scoreSecondary: { fontFamily: fonts.displayBold, fontSize: 17, lineHeight: 23, color: colors.text.primary, ...tabular },
  statHero: { fontFamily: fonts.display, fontSize: 46, lineHeight: 58, letterSpacing: -1, color: colors.text.primary, ...tabular },
  statValue: { fontFamily: fonts.display, fontSize: 24, lineHeight: 32, color: colors.text.primary, ...tabular },
  body: { fontFamily: fonts.medium, fontSize: 15, lineHeight: 22, color: colors.text.secondary },
  bodyStrong: { fontFamily: fonts.bold, fontSize: 16, lineHeight: 22, color: colors.text.primary },
  button: { fontFamily: fonts.displayBold, fontSize: 14, lineHeight: 20, letterSpacing: 0.6, textTransform: 'uppercase' },
  label: { fontFamily: fonts.displayBold, fontSize: 10.5, lineHeight: 15, letterSpacing: 1.4, color: colors.text.tertiary },
  caption: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 18, color: colors.text.tertiary },
  control: { fontFamily: fonts.displayBold, fontSize: 10.5, lineHeight: 14, letterSpacing: 0.8, color: colors.text.secondary, textTransform: 'uppercase' },
} satisfies Record<string, TextStyle>;
