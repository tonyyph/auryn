import { router } from 'expo-router';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { cancelAnimation, Easing, FadeIn, FadeInDown, useAnimatedStyle, useSharedValue, withRepeat, withTiming, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ConfirmDialog, HowToPlaySheet } from '../components/dialogs';
import { Icon, type IconName } from '../components/Icon';
import { NumberTile } from '../components/NumberTile';
import { Key, Sticker } from '../components/primitives';
import { isGameOver, maxTile } from '../engine';
import { formatNumber, useLanguage, useStrings } from '../i18n';
import { useAppStore } from '../state/appStore';
import { useEnvironment, useReduceMotion } from '../state/environment';
import { slab, alpha, colors, easing, fonts, keyTones, radius, shade, space, tabular, tileMaterial, type, type KeyTone } from '../theme';

let launchedIntoGame = false;

/** A menu key wearing a tile's material, so the menu reads as a board you can press. */
function tileTone(value: number): KeyTone {
  const m = tileMaterial(value);
  return { top: m.top, bottom: m.bottom, depth: shade(m.bottom, 0.6), text: m.number, glow: m.tier === 'satin' ? undefined : m.glow };
}

const LOGO_TILT = [-7, 4, -3, 6, -5];

export default function Home() {
  const t = useStrings();
  const lang = useLanguage();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const reduceMotion = useReduceMotion();
  const board = useAppStore((s) => s.session.board);
  const best = useAppStore((s) => s.stats.bestScore);
  const [confirmNew, setConfirmNew] = useState(false);
  const [howTo, setHowTo] = useState(false);
  const inProgress = board.moves > 0 && !isGameOver(board);
  const first = useRef(true);

  // Returning players go straight back to their run on cold launch; Home stays underneath.
  useEffect(() => {
    if (first.current && !launchedIntoGame && inProgress) {
      launchedIntoGame = true;
      router.push('/game');
    }
    first.current = false;
    launchedIntoGame = true;
  }, [inProgress]);

  const pad = width < 360 ? space[4] : space[5];
  const compact = height < 720;
  const boardW = Math.min(width - pad * 2, 440);
  const logoSize = Math.min(compact ? 50 : 62, (boardW - 24) / 4.6);
  const enter = (i: number) => (reduceMotion ? FadeIn.duration(220) : FadeInDown.duration(420).delay(i * 60).easing(easing.enter).withInitialValues({ transform: [{ translateY: 14 }] }));

  return (
    <View style={[styles.root, { paddingTop: insets.top + space[2], paddingBottom: insets.bottom + space[3], paddingHorizontal: pad }]}>
      <Animated.View entering={enter(0)} style={styles.hud} accessible accessibilityLabel={best > 0 ? `${t.home.best} ${best}` : t.home.noBest}>
        <View style={styles.trophy}>
          <Icon name="trophy" size={16} strokeWidth={2.1} color={colors.text.celebration} />
        </View>
        <View>
          <Text style={type.hud}>{t.home.best}</Text>
          <Text style={[styles.bestValue, best === 0 && styles.bestEmpty]} numberOfLines={1}>
            {best > 0 ? formatNumber(best, lang) : t.home.noBest}
          </Text>
        </View>
      </Animated.View>

      <View style={[styles.hero, compact && { marginTop: space[3] }]}>
        <Animated.View entering={enter(1)} style={styles.logo} accessible accessibilityRole="header" accessibilityLabel={t.brand}>
          {t.brand.split('').map((ch, i) => (
            <Text
              key={i}
              allowFontScaling={false}
              style={[
                type.logo,
                styles.logoLetter,
                { fontSize: logoSize, lineHeight: Math.round(logoSize * 1.25), transform: [{ rotate: `${LOGO_TILT[i]}deg` }, { translateY: i % 2 ? 4 : -2 }] },
                i === 2 && { color: colors.aurora.mint },
              ]}
            >
              {ch}
            </Text>
          ))}
        </Animated.View>
        <Animated.View entering={enter(2)} style={styles.stickerRow}>
          <Sticker text={t.home.sticker} tone={keyTones.violet} rotate={-5} />
        </Animated.View>
        <Animated.Text entering={enter(3)} style={styles.tagline} maxFontSizeMultiplier={1.3}>
          {t.home.tagline}
        </Animated.Text>
      </View>

      <View style={styles.spacer}>
        <FallingTiles />
      </View>

      <MenuBoard width={boardW}>
        {(cell) => (
          <>
            <Slot cell={cell} col={0} row={0} w={3} h={2} index={0} reduceMotion={reduceMotion}>
              <PlayKey
                cell={cell}
                label={inProgress ? t.home.resume : t.home.play}
                meta={inProgress ? t.home.resumeMeta(formatNumber(board.score, lang), formatNumber(maxTile(board), lang)) : t.home.freshMeta}
                onPress={() => {
                  // The label promises a fresh board, so a finished run is cleared first
                  // (it already counted as finished) instead of reopening on "Board locked".
                  if (isGameOver(useAppStore.getState().session.board)) useAppStore.getState().newGame();
                  router.push('/game');
                }}
              />
            </Slot>
            <Slot cell={cell} col={3} row={0} index={1} reduceMotion={reduceMotion}>
              <MenuKey cell={cell} icon="trophy" label={t.home.statistics} tone={tileTone(256)} onPress={() => router.push('/stats')} />
            </Slot>
            <Slot cell={cell} col={3} row={1} index={2} reduceMotion={reduceMotion}>
              <MenuKey cell={cell} icon="settings" label={t.home.settings} tone={tileTone(64)} onPress={() => router.push('/settings')} />
            </Slot>
            <Slot cell={cell} col={0} row={2} w={2} index={3} reduceMotion={reduceMotion}>
              <MenuKey cell={cell} icon="help" label={t.home.howToPlay} tone={tileTone(16)} onPress={() => setHowTo(true)} wide />
            </Slot>
            {inProgress ? (
              <Slot cell={cell} col={2} row={2} w={2} index={4} reduceMotion={reduceMotion}>
                <MenuKey cell={cell} icon="plus" label={t.home.newGame} tone={tileTone(512)} onPress={() => setConfirmNew(true)} wide />
              </Slot>
            ) : (
              <>
                <Slot cell={cell} col={2} row={2} index={4} reduceMotion={reduceMotion} decorative>
                  <NumberTile value={2} side={cell.side} />
                </Slot>
                <Slot cell={cell} col={3} row={2} index={5} reduceMotion={reduceMotion} decorative>
                  <NumberTile value={4} side={cell.side} />
                </Slot>
              </>
            )}
          </>
        )}
      </MenuBoard>

      {confirmNew ? (
        <ConfirmDialog
          title={t.restart.title}
          body={t.restart.body}
          confirm={t.restart.confirm}
          cancel={t.restart.cancel}
          onCancel={() => setConfirmNew(false)}
          onConfirm={() => {
            setConfirmNew(false);
            useAppStore.getState().newGame();
            router.push('/game');
          }}
        />
      ) : null}
      {howTo ? <HowToPlaySheet onClose={() => setHowTo(false)} /> : null}
    </View>
  );
}

/** Tiles tumbling down into the menu board. Purely decorative, drift on the UI thread. */
const FALLING = [
  { value: 8, x: 0.66, y: 0.08, s: 0.26, rot: 14, period: 5200 },
  { value: 2, x: 0.08, y: 0.42, s: 0.2, rot: -12, period: 6100 },
  { value: 32, x: 0.4, y: 0.5, s: 0.3, rot: -7, period: 4700 },
  { value: 4, x: 0.82, y: 0.7, s: 0.18, rot: 22, period: 5600 },
] as const;

function FallingTiles() {
  const [box, setBox] = useState({ w: 0, h: 0 });
  const unit = Math.min(box.w * 0.62, box.h * 1.05);
  return (
    <View style={StyleSheet.absoluteFill} onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })} pointerEvents="none" importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      {box.h >= 110
        ? FALLING.map((p, i) => {
            const side = Math.round(Math.max(30, Math.min(76, p.s * unit)));
            return (
              <Drift key={p.value} index={i} period={p.period} rot={p.rot} left={p.x * (box.w - side)} top={p.y * (box.h - side)}>
                <NumberTile value={p.value} side={side} dim={i % 2 === 1} />
              </Drift>
            );
          })
        : null}
    </View>
  );
}

function Drift({ children, index, period, rot, left, top }: { children: ReactNode; index: number; period: number; rot: number; left: number; top: number }) {
  const reduceMotion = useReduceMotion();
  const active = useEnvironment((s) => s.active);
  const y = useSharedValue(0);
  useEffect(() => {
    if (reduceMotion || !active) {
      cancelAnimation(y);
      return;
    }
    y.set(withRepeat(withTiming(1, { duration: period, easing: Easing.inOut(Easing.sin) }), -1, true));
  }, [reduceMotion, active, period, y]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: -5 + y.get() * 10 }, { rotate: `${rot + (y.get() - 0.5) * 4}deg` }] }));
  return (
    <Animated.View entering={reduceMotion ? FadeIn.duration(200) : FadeInDown.duration(520).delay(200 + index * 90).easing(easing.enter).withInitialValues({ transform: [{ translateY: -40 }] })} style={[styles.drift, { left, top }]}>
      <Animated.View style={style}>{children}</Animated.View>
    </Animated.View>
  );
}

interface CellGeometry {
  side: number;
  gap: number;
}

/** A 4 × 3 board shell with empty sockets; menu keys sit in its cells. */
function MenuBoard({ width, children }: { width: number; children: (cell: CellGeometry) => ReactNode }) {
  const boardPad = width < 340 ? 9 : 12;
  const gap = width < 340 ? 7 : 9;
  const side = (width - boardPad * 2 - gap * 3) / 4;
  const height = boardPad * 2 + side * 3 + gap * 2;
  return (
    <View style={[styles.board, { width, height }]}>
      <View style={{ position: 'absolute', left: boardPad, top: boardPad }} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        {Array.from({ length: 12 }, (_, i) => (
          <View key={i} style={[styles.socket, { left: (i % 4) * (side + gap), top: Math.floor(i / 4) * (side + gap), width: side, height: side }]} />
        ))}
      </View>
      <View style={{ position: 'absolute', left: boardPad, top: boardPad, right: boardPad, bottom: boardPad }}>{children({ side, gap })}</View>
    </View>
  );
}

function Slot({ cell, col, row, w = 1, h = 1, index, reduceMotion, decorative, children }: { cell: CellGeometry; col: number; row: number; w?: number; h?: number; index: number; reduceMotion: boolean; decorative?: boolean; children: ReactNode }) {
  const span = (n: number) => cell.side * n + cell.gap * (n - 1);
  return (
    <Animated.View
      entering={reduceMotion ? FadeIn.duration(200) : ZoomIn.duration(240).delay(260 + index * 70).easing(easing.enter)}
      style={{ position: 'absolute', left: col * (cell.side + cell.gap), top: row * (cell.side + cell.gap), width: span(w), height: span(h) }}
      importantForAccessibility={decorative ? 'no-hide-descendants' : 'auto'}
      accessibilityElementsHidden={decorative}
      pointerEvents={decorative ? 'none' : 'auto'}
    >
      {children}
    </Animated.View>
  );
}

const MENU_DEPTH = 6;

function PlayKey({ cell, label, meta, onPress }: { cell: CellGeometry; label: string; meta: string; onPress: () => void }) {
  const tone = tileTone(2048);
  const reduceMotion = useReduceMotion();
  const active = useEnvironment((s) => s.active);
  const breathe = useSharedValue(0);
  useEffect(() => {
    if (reduceMotion || !active) {
      cancelAnimation(breathe);
      breathe.set(withTiming(0.5, { duration: 200 }));
      return;
    }
    breathe.set(withRepeat(withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.sin) }), -1, true));
  }, [reduceMotion, active, breathe]);
  const glow = useAnimatedStyle(() => ({ opacity: 0.35 + breathe.get() * 0.65 }));
  const h = cell.side * 2 + cell.gap;
  const big = Math.min(40, cell.side * 0.5);
  return (
    <View>
      <Animated.View pointerEvents="none" style={[styles.playGlow, { height: h }, glow]} />
      <Key label={`${label}. ${meta}`} onPress={onPress} tone={tone} height={h - MENU_DEPTH} depth={MENU_DEPTH} radius={radius.tile + 4} contentStyle={styles.playContent}>
        <View style={styles.playTop}>
          <View style={[styles.playIcon, { backgroundColor: alpha(tone.text, 0.9) }]}>
            <Icon name="play" size={18} color={tone.top} />
          </View>
          <Text style={[styles.playTile, { color: alpha(tone.text, 0.55) }]}>2048</Text>
        </View>
        <View>
          <Text style={[styles.playLabel, { color: tone.text, fontSize: big, lineHeight: Math.round(big * 1.3) }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} maxFontSizeMultiplier={1.2}>
            {label}
          </Text>
          <Text style={[styles.playMeta, { color: alpha(tone.text, 0.75) }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} maxFontSizeMultiplier={1.2}>
            {meta}
          </Text>
        </View>
      </Key>
    </View>
  );
}

function MenuKey({ cell, icon, label, tone, onPress, wide }: { cell: CellGeometry; icon: IconName; label: string; tone: KeyTone; onPress: () => void; wide?: boolean }) {
  return (
    <Key label={label} onPress={onPress} tone={tone} height={cell.side - MENU_DEPTH} depth={MENU_DEPTH} radius={radius.tile} contentStyle={[styles.menuContent, wide && styles.menuWide]}>
      <Icon name={icon} size={wide ? 20 : 22} strokeWidth={2.3} color={tone.text} />
      <Text style={[type.control, styles.menuLabel, { color: tone.text }, wide && styles.menuLabelWide]} numberOfLines={wide || !label.includes(' ') ? 1 : 2} adjustsFontSizeToFit minimumFontScale={0.75} maxFontSizeMultiplier={1.2}>
        {label}
      </Text>
    </Key>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, maxWidth: 560, width: '100%', alignSelf: 'center' },
  hud: { flexDirection: 'row', alignItems: 'center', gap: space[3], alignSelf: 'flex-start' },
  trophy: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: alpha(colors.aurora.champagne, 0.12),
    borderWidth: 1,
    borderColor: alpha(colors.aurora.champagne, 0.3),
  },
  bestValue: { fontFamily: fonts.displayBold, fontSize: 16, lineHeight: 21, color: colors.text.primary, ...tabular },
  bestEmpty: { fontFamily: fonts.medium, fontSize: 14, color: colors.text.secondary },
  hero: { marginTop: space[8], alignItems: 'flex-start' },
  logo: { flexDirection: 'row', alignItems: 'center', marginLeft: -2 },
  logoLetter: { textShadowColor: alpha(colors.aurora.emerald, 0.55), textShadowRadius: 22, textShadowOffset: { width: 0, height: 0 }, marginRight: 1 },
  stickerRow: { marginTop: -6, marginLeft: space[8] },
  tagline: { marginTop: space[4], fontFamily: fonts.displayMedium, fontSize: 15, lineHeight: 22, color: colors.text.secondary, letterSpacing: 0.2 },
  spacer: { flex: 1, minHeight: space[5] },
  drift: { position: 'absolute' },
  board: {
    alignSelf: 'center',
    borderRadius: radius.board,
    backgroundColor: alpha(colors.surface.boardBottom, 0.92),
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderTopColor: colors.border.default,
    marginBottom: 4,
    boxShadow: `${slab(4, 'rgba(3, 6, 14, 0.85)')}, 0 24px 60px ${alpha(colors.shadow, 0.6)}`,
  },
  socket: { position: 'absolute', borderRadius: radius.cell, backgroundColor: colors.surface.cellTop, borderTopWidth: 2, borderTopColor: 'rgba(0,0,0,0.35)' },
  playGlow: { position: 'absolute', left: 0, right: 0, top: 0, borderRadius: radius.tile + 4, boxShadow: `0 0 34px 6px ${alpha(colors.aurora.champagne, 0.45)}` },
  playContent: { alignItems: 'stretch', justifyContent: 'space-between', paddingHorizontal: space[4], paddingVertical: space[4] },
  playTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  playIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingLeft: 2 },
  playTile: { fontFamily: fonts.display, fontSize: 13, letterSpacing: 1 },
  playLabel: { fontFamily: fonts.display, letterSpacing: -0.5, textTransform: 'uppercase' },
  playMeta: { fontFamily: fonts.bold, fontSize: 12.5, lineHeight: 17, marginTop: 2, ...tabular },
  menuContent: { gap: 6, paddingHorizontal: 6 },
  menuWide: { flexDirection: 'row', gap: space[2] },
  menuLabel: { textAlign: 'center', fontSize: 10, letterSpacing: 0.4 },
  menuLabelWide: { fontSize: 11.5 },
});
