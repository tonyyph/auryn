import { useEffect, type ReactNode } from 'react';
import { AccessibilityInfo, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSequence, withTiming } from 'react-native-reanimated';
import { formatNumber, useLanguage, useStrings } from '../i18n';
import { useReduceMotion } from '../state/environment';
import { slab, alpha, colors, fonts, keyTones, space, tabular, type, type KeyTone } from '../theme';
import { Icon } from './Icon';
import { NumberTile } from './NumberTile';
import { Overlay } from './Overlay';
import { PrimaryButton, SecondaryButton, Sticker, TextButton } from './primitives';

function Title({ sticker, stickerTone, title, body, center, big }: { sticker?: string; stickerTone?: KeyTone; title: string; body?: string; center?: boolean; big?: boolean }) {
  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(title);
  }, [title]);
  return (
    <View style={[styles.titleBlock, center && styles.center]}>
      {sticker ? <Sticker text={sticker} tone={stickerTone} rotate={-4} style={center ? styles.selfCenter : undefined} /> : null}
      <Text style={[big ? styles.bigTitle : type.modalTitle, center && styles.centerText]} accessibilityRole="header" maxFontSizeMultiplier={1.25}>
        {title}
      </Text>
      {body ? <Text style={[type.body, center && styles.centerText]}>{body}</Text> : null}
    </View>
  );
}

export function ConfirmDialog({
  title,
  body,
  confirm,
  cancel,
  onConfirm,
  onCancel,
  destructive,
}: {
  title: string;
  body: string;
  confirm: string;
  cancel: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
}) {
  return (
    <Overlay onDismiss={onCancel}>
      <Title title={title} body={body} />
      <View style={styles.actions}>
        {destructive ? <SecondaryButton label={confirm} onPress={onConfirm} tone="destructive" /> : <PrimaryButton label={confirm} onPress={onConfirm} />}
        <SecondaryButton label={cancel} onPress={onCancel} />
      </View>
    </Overlay>
  );
}

/** A small stat plate: caps label over a chunky value. */
function Plate({ label, value, children }: { label: string; value: string; children?: ReactNode }) {
  return (
    <View style={styles.plate} accessible accessibilityLabel={`${label} ${value}`}>
      {children}
      <View style={styles.flex}>
        <Text style={type.hud} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
          {label.toUpperCase()}
        </Text>
        <Text style={styles.plateValue} numberOfLines={1} adjustsFontSizeToFit>
          {value}
        </Text>
      </View>
    </View>
  );
}

export function MilestoneModal({ score, moves, onKeepGoing, onNewGame }: { score: number; moves: number; onKeepGoing: () => void; onNewGame: () => void }) {
  const t = useStrings();
  const lang = useLanguage();
  const reduceMotion = useReduceMotion();
  const halo = useSharedValue(0);
  const pop = useSharedValue(reduceMotion ? 1 : 0.5);
  useEffect(() => {
    halo.set(withDelay(500, withSequence(withTiming(1, { duration: 500 }), withTiming(0.5, { duration: 1200 }))));
    if (!reduceMotion) pop.set(withDelay(650, withSequence(withTiming(1.12, { duration: 220 }), withTiming(1, { duration: 160 }))));
  }, [halo, pop, reduceMotion]);
  const haloStyle = useAnimatedStyle(() => ({ opacity: halo.get() }));
  const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: pop.get() }, { rotate: '-8deg' }] }));

  return (
    <Overlay onDismiss={onKeepGoing} delay={650}>
      <View style={styles.heroTile}>
        <Animated.View style={[styles.heroHalo, haloStyle]} />
        <Animated.View style={popStyle}>
          <NumberTile value={2048} side={92} />
        </Animated.View>
      </View>
      <Title sticker={t.win.eyebrow} stickerTone={keyTones.gold} title={t.win.title} body={t.win.body} center big />
      <View style={styles.plates}>
        <Plate label={t.win.score} value={formatNumber(score, lang)} />
        <Plate label={t.win.moves} value={formatNumber(moves, lang)} />
      </View>
      <View style={styles.actions}>
        <PrimaryButton label={t.win.keepGoing} onPress={onKeepGoing} tone={keyTones.gold} trailingIcon="arrowRight" />
        <SecondaryButton label={t.win.newGame} onPress={onNewGame} />
      </View>
    </Overlay>
  );
}

export function GameOverModal({
  score,
  best,
  largest,
  newBest,
  canUndo,
  onPlayAgain,
  onUndo,
  onHome,
}: {
  score: number;
  best: number;
  largest: number;
  newBest: boolean;
  canUndo: boolean;
  onPlayAgain: () => void;
  onUndo: () => void;
  onHome: () => void;
}) {
  const t = useStrings();
  const lang = useLanguage();
  return (
    <Overlay delay={420}>
      <Title sticker={t.over.eyebrow} stickerTone={keyTones.violet} title={t.over.title} body={t.over.body} />
      <View style={styles.final} accessible accessibilityLabel={`${t.over.finalScore} ${score}${newBest ? `. ${t.over.newBest}` : ''}`}>
        <Text style={type.hud}>{t.over.finalScore.toUpperCase()}</Text>
        <Text style={[type.statHero, newBest && { color: colors.text.celebration }]} numberOfLines={1} adjustsFontSizeToFit>
          {formatNumber(score, lang)}
        </Text>
        {newBest ? <Sticker text={t.over.newBest} tone={keyTones.gold} rotate={7} style={styles.finalSticker} /> : null}
      </View>
      <View style={styles.plates}>
        <Plate label={t.over.largest} value={formatNumber(largest, lang)}>
          <NumberTile value={largest} side={32} />
        </Plate>
        <Plate label={t.over.best} value={formatNumber(best, lang)}>
          <Icon name="trophy" size={18} strokeWidth={2.1} color={colors.text.celebration} />
        </Plate>
      </View>
      <View style={styles.actions}>
        <PrimaryButton label={t.over.playAgain} onPress={onPlayAgain} trailingIcon="restart" />
        {canUndo ? <SecondaryButton label={t.over.undo} onPress={onUndo} icon="undo" /> : null}
        <View style={styles.center}>
          <TextButton label={t.over.home} onPress={onHome} />
        </View>
      </View>
    </Overlay>
  );
}

/** How to play: three steps, each illustrated with the real tile component. */
export function HowToPlaySheet({ onClose }: { onClose: () => void }) {
  const t = useStrings();
  const s = 34;
  const arrow = <Icon name="arrowRight" size={18} strokeWidth={2.4} color={colors.text.mint} />;
  const illustrations = [
    // Before → after: the tile travels to the far end of its row.
    <View key="a" style={styles.illo}>
      <NumberTile value={2} side={s} />
      <View style={[styles.ghostCell, { width: s, height: s }]} />
      <View style={[styles.ghostCell, { width: s, height: s }]} />
      {arrow}
      <View style={[styles.ghostCell, { width: s, height: s }]} />
      <View style={[styles.ghostCell, { width: s, height: s }]} />
      <NumberTile value={2} side={s} />
    </View>,
    <View key="b" style={styles.illo}>
      <NumberTile value={2} side={s} />
      <NumberTile value={2} side={s} />
      {arrow}
      <NumberTile value={4} side={s} />
    </View>,
    <View key="c" style={styles.illo}>
      <NumberTile value={1024} side={s} />
      <NumberTile value={1024} side={s} />
      {arrow}
      <NumberTile value={2048} side={s} />
    </View>,
  ];
  return (
    <Overlay onDismiss={onClose} variant="sheet">
      <View style={styles.grabber} />
      <Text style={type.modalTitle} accessibilityRole="header">
        {t.howTo.title}
      </Text>
      <View style={styles.steps}>
        {t.howTo.steps.map((step, i) => (
          <View key={i} style={styles.step} accessible accessibilityLabel={`${i + 1}. ${step.title}. ${step.body}`}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>{i + 1}</Text>
            </View>
            <View style={styles.flex}>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={[type.body, styles.stepBody]}>{step.body}</Text>
              {illustrations[i]}
            </View>
          </View>
        ))}
      </View>
      <PrimaryButton label={t.howTo.gotIt} onPress={onClose} trailingIcon="arrowRight" />
    </Overlay>
  );
}

const styles = StyleSheet.create({
  titleBlock: { gap: space[2], alignItems: 'flex-start' },
  center: { alignItems: 'center' },
  selfCenter: { alignSelf: 'center' },
  centerText: { textAlign: 'center' },
  flex: { flex: 1 },
  bigTitle: { fontFamily: fonts.display, fontSize: 56, lineHeight: 70, letterSpacing: -1.5, color: colors.text.celebration },
  actions: { gap: space[3], marginTop: space[1] },
  heroTile: { alignSelf: 'center', marginTop: space[3], marginBottom: -space[2], alignItems: 'center', justifyContent: 'center' },
  heroHalo: { position: 'absolute', width: 92, height: 92, borderRadius: 24, boxShadow: `0 0 56px 18px ${alpha(colors.aurora.champagne, 0.5)}` },
  plates: { flexDirection: 'row', gap: space[3] },
  plate: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    paddingHorizontal: space[3],
    paddingVertical: space[3],
    borderRadius: 16,
    backgroundColor: colors.surface.raised,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderTopColor: colors.border.default,
    boxShadow: slab(4, '#070C17'),
    marginBottom: 4,
  },
  plateValue: { fontFamily: fonts.display, fontSize: 19, lineHeight: 26, color: colors.text.primary, ...tabular },
  final: { alignItems: 'flex-start' },
  finalSticker: { position: 'absolute', right: 0, top: 4 },
  grabber: { alignSelf: 'center', width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border.default, marginTop: -space[2] },
  steps: { gap: space[5] },
  step: { flexDirection: 'row', gap: space[4] },
  stepNumber: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: keyTones.mint.bottom,
    boxShadow: slab(3, keyTones.mint.depth),
    transform: [{ rotate: '-6deg' }],
  },
  stepNumberText: { fontFamily: fonts.display, fontSize: 15, color: keyTones.mint.text },
  stepTitle: { fontFamily: fonts.display, fontSize: 17, lineHeight: 24, color: colors.text.primary },
  stepBody: { marginTop: 2 },
  illo: { flexDirection: 'row', alignItems: 'center', gap: space[2], marginTop: space[3] },
  // Recessed socket, darker than the sheet so it reads as an empty cell.
  ghostCell: {
    borderRadius: 9,
    backgroundColor: '#0A1222',
    borderWidth: 1,
    borderColor: 'rgba(196,220,255,0.07)',
    borderTopWidth: 2,
    borderTopColor: 'rgba(0,0,0,0.45)',
  },
});
