import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withDelay, withSequence, withTiming, ZoomIn } from 'react-native-reanimated';
import { maxTile } from '../../engine';
import { formatNumber, useLanguage, useStrings } from '../../i18n';
import { useAppStore } from '../../state/appStore';
import { useReduceMotion } from '../../state/environment';
import { slab, alpha, colors, duration, easing, fonts, keyTones, shade, tileMaterial, type KeyTone } from '../../theme';
import { NumberTile } from '../NumberTile';
import { ladderSteps } from './ladder';

function tileTone(value: number): KeyTone {
  const m = tileMaterial(value);
  return { top: m.top, bottom: m.bottom, depth: shade(m.bottom, 0.6), text: m.number, glow: m.glow };
}

/** Progress ladder for the top bar: what you've built, and what's next. */
export function TileLadder() {
  const t = useStrings();
  const lang = useLanguage();
  const reduceMotion = useReduceMotion();
  const top = useAppStore((s) => maxTile(s.session.board));
  const steps = ladderSteps(top);
  const next = steps.find((v) => v > top) ?? top * 2;
  return (
    <View style={styles.ladder} accessible accessibilityLabel={t.game.ladder(formatNumber(top, lang), formatNumber(next, lang))}>
      {steps.map((v, i) => {
        const reached = v <= top;
        const current = v === top;
        return (
          <View key={v} style={styles.rung}>
            {i > 0 ? <View style={[styles.link, reached && styles.linkOn]} /> : null}
            <Animated.View entering={reduceMotion ? FadeIn.duration(200) : ZoomIn.duration(260).easing(easing.enter)} style={current ? styles.current : null}>
              {reached ? (
                <NumberTile value={v} side={current ? 30 : 22} />
              ) : (
                <View style={[styles.locked, v === next && styles.next]}>
                  <Text style={[styles.lockedText, v === next && { color: tileMaterial(v).glow }]} numberOfLines={1} adjustsFontSizeToFit allowFontScaling={false}>
                    {v}
                  </Text>
                </View>
              )}
            </Animated.View>
          </View>
        );
      })}
    </View>
  );
}

type Callout = { key: number; text: string; tone: KeyTone };

/**
 * Pops over the board after a slide lands: a new top tile ("512!") beats a combo
 * ("COMBO ×3"). Plain single merges stay quiet so the callout keeps meaning something.
 */
export function ComboCallout() {
  const t = useStrings();
  const lang = useLanguage();
  const reduceMotion = useReduceMotion();
  const [callout, setCallout] = useState<Callout | null>(null);
  const o = useSharedValue(0);
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
        const merges = tr.result.merges;
        if (merges.length === 0) return;
        const made = merges.reduce((m, x) => Math.max(m, x.value), 0);
        const record = made > maxTile(tr.result.before) && made >= 128;
        if (!record && merges.length < 2) return;
        setCallout((c) => ({
          key: (c?.key ?? 0) + 1,
          text: record ? t.game.newTile(formatNumber(made, lang)) : t.game.combo(merges.length),
          tone: record ? tileTone(made) : keyTones.mint,
        }));
        const land = reduceMotion ? duration.instant : duration.resolve;
        o.set(withDelay(land, withSequence(withTiming(1, { duration: 90 }), withTiming(1, { duration: 520 }), withTiming(0, { duration: 260, easing: easing.exit }))));
        if (!reduceMotion) {
          s.set(0.6);
          s.set(withDelay(land, withSequence(withTiming(1.12, { duration: 140, easing: easing.enter }), withTiming(1, { duration: 120 }))));
        }
      }),
    [o, s, reduceMotion, t, lang],
  );

  const style = useAnimatedStyle(() => ({ opacity: o.get(), transform: [{ scale: s.get() }, { rotate: '-4deg' }] }));
  return (
    <View pointerEvents="none" style={styles.calloutLayer} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      <Animated.View style={style}>
        {callout ? (
          <View key={callout.key} style={[styles.callout, { backgroundColor: callout.tone.bottom, boxShadow: `${slab(4, callout.tone.depth)}, 0 12px 28px ${alpha(callout.tone.glow ?? colors.shadow, 0.45)}` }]}>
            <Text style={[styles.calloutText, { color: callout.tone.text }]} allowFontScaling={false}>
              {callout.text}
            </Text>
          </View>
        ) : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  ladder: { flexDirection: 'row', alignItems: 'center', height: 44 },
  rung: { flexDirection: 'row', alignItems: 'center' },
  link: { width: 8, height: 2, borderRadius: 1, marginHorizontal: 3, backgroundColor: colors.border.default },
  linkOn: { backgroundColor: alpha(colors.aurora.mint, 0.55) },
  current: { boxShadow: `0 0 14px ${alpha(colors.aurora.mint, 0.35)}`, borderRadius: 8 },
  locked: {
    width: 26,
    height: 22,
    paddingHorizontal: 2,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border.default,
  },
  next: { width: 34, borderColor: alpha(colors.aurora.mint, 0.5) },
  lockedText: { fontFamily: fonts.displayBold, fontSize: 9.5, color: colors.text.tertiary },
  // Straddles the board's top rim (the gap above the board), never the tiles themselves.
  calloutLayer: { position: 'absolute', left: 0, right: 0, top: -36, alignItems: 'center', zIndex: 5 },
  callout: { paddingHorizontal: 14, paddingTop: 5, paddingBottom: 3, borderRadius: 12 },
  calloutText: { fontFamily: fonts.display, fontSize: 21, lineHeight: 28, letterSpacing: -0.3 },
});
