import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withDelay, withSequence, withTiming, ZoomIn } from 'react-native-reanimated';
import { isNewBest } from '../../engine';
import { formatNumber, useLanguage, useStrings } from '../../i18n';
import { useAppStore } from '../../state/appStore';
import { useReduceMotion } from '../../state/environment';
import { slab, alpha, colors, duration, easing, fonts, keyTones, space, tabular, type } from '../../theme';
import { Icon } from '../Icon';
import { Sticker } from '../primitives';

/**
 * HUD: the run's score huge on the left, the record on a tilted plate on the right.
 * Values use tabular figures in fixed-height rows, so changing digits never shifts layout.
 */
export function ScoreHeader() {
  const t = useStrings();
  const lang = useLanguage();
  const reduceMotion = useReduceMotion();
  const score = useShownScore();
  const committed = useAppStore((s) => s.session.board.score);
  const bestAtStart = useAppStore((s) => s.session.bestAtStart);
  const storedBest = useAppStore((s) => s.stats.bestScore);
  // While this run holds the record, the plate follows the shown score, not the committed one.
  const best = storedBest === committed ? Math.max(bestAtStart, score) : storedBest;
  // The very first run beats a record of 0 on its first merge; that isn't news.
  const beating = useAppStore((s) => isNewBest(s.session)) && score > bestAtStart && bestAtStart > 0;
  return (
    <View style={styles.row}>
      <View style={styles.current} accessible accessibilityLabel={`${t.game.score} ${score}`}>
        <Text style={type.hud}>{t.game.score}</Text>
        <View style={styles.valueRow}>
          <Text style={type.score} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6} maxFontSizeMultiplier={1.15}>
            {formatNumber(score, lang)}
          </Text>
          <ScoreDelta />
        </View>
      </View>
      <View style={styles.bestWrap} accessible accessibilityLabel={`${beating ? t.game.newBest : t.game.best} ${best}`}>
        <View style={[styles.plate, beating && styles.plateHot]}>
          <View style={styles.plateLabel}>
            <Icon name="trophy" size={12} strokeWidth={2.2} color={beating ? colors.text.celebration : colors.text.tertiary} />
            <Text style={type.hud}>{t.game.best}</Text>
          </View>
          <Text style={[type.scoreSecondary, styles.bestValue, beating && { color: colors.text.celebration }]} numberOfLines={1} adjustsFontSizeToFit maxFontSizeMultiplier={1.2}>
            {formatNumber(best, lang)}
          </Text>
        </View>
        {beating ? (
          <Animated.View entering={reduceMotion ? FadeIn.duration(200) : ZoomIn.duration(260).easing(easing.enter)} style={styles.stickerPos}>
            <Sticker text={t.game.newBest} tone={keyTones.gold} rotate={6} />
          </Animated.View>
        ) : null}
      </View>
    </View>
  );
}

/**
 * The score as the board shows it: a move's points land when its tiles merge (the resolve
 * moment), not when the swipe commits. Undo, new game and restore show immediately.
 */
function useShownScore() {
  const [shown, setShown] = useState(() => useAppStore.getState().session.board.score);
  const reduceMotion = useReduceMotion();
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsub = useAppStore.subscribe((st, prev) => {
      if (st.transition === prev.transition && st.session.board.score === prev.session.board.score) return;
      clearTimeout(timer);
      const value = st.session.board.score;
      if (st.transition !== prev.transition && st.transition.kind === 'move') {
        timer = setTimeout(() => setShown(value), reduceMotion ? duration.instant : duration.resolve);
      } else {
        setShown(value);
      }
    });
    return () => {
      clearTimeout(timer);
      unsub();
    };
  }, [reduceMotion]);
  return shown;
}

/**
 * "+32" popping beside the score. One label per move (the move's total); a new move
 * replaces the label rather than stacking. Positioned absolutely: nothing reflows.
 */
function ScoreDelta() {
  const reduceMotion = useReduceMotion();
  const [amount, setAmount] = useState(0);
  const o = useSharedValue(0);
  const y = useSharedValue(0);
  const s = useSharedValue(1);

  useEffect(
    () =>
      useAppStore.subscribe((st, prev) => {
        const tr = st.transition;
        if (tr === prev.transition) return;
        if (tr.kind === 'reset') {
          o.set(0);
          return;
        }
        if (tr.result.scoreGained <= 0) return;
        setAmount(tr.result.scoreGained);
        // Pops when the tiles merge, together with the score itself.
        const lag = reduceMotion ? duration.instant : duration.resolve;
        o.set(withDelay(lag, withSequence(withTiming(1, { duration: 80 }), withTiming(1, { duration: 260 }), withTiming(0, { duration: duration.scoreDelta - 260, easing: easing.exit }))));
        y.set(0);
        if (!reduceMotion) {
          y.set(withDelay(lag, withTiming(-14, { duration: duration.scoreDelta + 80, easing: easing.enter })));
          s.set(1);
          s.set(withDelay(lag, withSequence(withTiming(1.25, { duration: 90 }), withTiming(1, { duration: 160 }))));
        }
      }),
    [o, y, s, reduceMotion],
  );

  const style = useAnimatedStyle(() => ({ opacity: o.get(), transform: [{ translateY: y.get() }, { scale: s.get() }] }));
  return (
    <Animated.View style={[styles.delta, style]} pointerEvents="none" importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      <Text style={styles.deltaText} allowFontScaling={false}>
        +{amount}
      </Text>
    </Animated.View>
  );
}

export const SCORE_HEADER_HEIGHT = 74;

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', minHeight: SCORE_HEADER_HEIGHT, gap: space[3] },
  current: { flexShrink: 1 },
  valueRow: { flexDirection: 'row', alignItems: 'center', marginTop: -2 },
  bestWrap: { marginBottom: 8 },
  plate: {
    minWidth: 96,
    paddingHorizontal: space[3],
    paddingTop: 7,
    paddingBottom: 6,
    borderRadius: 13,
    backgroundColor: alpha(colors.surface.raised, 0.92),
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderTopColor: colors.border.default,
    boxShadow: slab(3, 'rgba(3,6,14,0.8)'),
    transform: [{ rotate: '-3deg' }],
    alignItems: 'flex-end',
  },
  plateHot: { borderColor: alpha(colors.aurora.champagne, 0.45), borderTopColor: alpha(colors.aurora.champagne, 0.6), boxShadow: `${slab(3, 'rgba(3,6,14,0.8)')}, 0 0 22px ${alpha(colors.aurora.champagne, 0.25)}` },
  plateLabel: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  bestValue: { textAlign: 'right' },
  stickerPos: { position: 'absolute', top: -20, right: -6, left: -80, alignItems: 'flex-end' },
  delta: { position: 'absolute', left: '100%', marginLeft: space[2], top: 4 },
  deltaText: { fontFamily: fonts.display, fontSize: 18, color: colors.text.mint, textShadowColor: alpha(colors.aurora.emerald, 0.6), textShadowRadius: 10, ...tabular },
});
