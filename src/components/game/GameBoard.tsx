import { LinearGradient } from 'expo-linear-gradient';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { StyleSheet, View, type AccessibilityActionEvent } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { scheduleOnRN } from 'react-native-worklets';
import { maxTile, tileGrid, type Direction, type MoveResult } from '../../engine';
import { feedback } from '../../feedback/feedback';
import { formatNumber, useStrings } from '../../i18n';
import { motionFrame, resolvedFrame, settledFrame, type Frame } from '../../presentation/frames';
import { TurnController } from '../../presentation/turnController';
import { useAppStore, type BoardTransition } from '../../state/appStore';
import { useReduceMotion } from '../../state/environment';
import { announce, watchScreenReader } from '../../state/screenReader';
import { slab, alpha, cellOffset, colors, duration, radius, tileMaterial, type GameLayout } from '../../theme';
import { AnimatedTile } from './AnimatedTile';
import { directionFromPan } from './swipe';

/** Commits one move to the store; true when it was valid (and so starts an animation). */
function commitMove(direction: Direction): boolean {
  const result = useAppStore.getState().move(direction);
  if (!result.changed) announce((t) => t.game.announceBlocked(t.game.moveNames[direction]));
  return result.changed;
}

export interface GameBoardHandle {
  input(direction: Direction): void;
  /** Snap to committed state and drop any buffered swipe (background, navigation). */
  settle(): void;
}

interface Props {
  layout: GameLayout;
  /** False while an overlay is open: swipes are ignored, not buffered. */
  enabled: boolean;
  /** The board is showing the committed state with no motion pending. */
  onIdle?: (idle: boolean) => void;
}

export const GameBoard = forwardRef<GameBoardHandle, Props>(function GameBoard({ layout, enabled, onIdle }, ref) {
  const t = useStrings();
  const reduceMotion = useReduceMotion();
  const language = useAppStore((s) => s.settings.language);
  const board = useAppStore((s) => s.session.board);
  const [frame, setFrame] = useState<Frame>(() => settledFrame(useAppStore.getState().session.board));
  const [snap, setSnap] = useState(true);
  const clock = useSharedValue(0);
  const layer = useSharedValue(1);
  const pendingResult = useRef<MoveResult | null>(null);
  const shownIds = useRef(new Set<number>(frame.tiles.map((x) => x.id)));
  const idleRef = useRef(onIdle);
  useEffect(() => {
    idleRef.current = onIdle;
  }, [onIdle]);
  const setIdle = useCallback((v: boolean) => idleRef.current?.(v), []);

  const [controller] = useState(() => new TurnController(commitMove));

  const show = useCallback((f: Frame, snapTiles: boolean) => {
    for (const x of f.tiles) shownIds.current.add(x.id);
    setSnap(snapTiles);
    setFrame(f);
  }, []);

  const finishMotion = useCallback(
    (seq: number) => {
      const result = pendingResult.current;
      if (!result || seq !== controller.currentSeq) return;
      pendingResult.current = null;
      show(resolvedFrame(result, seq), false);
      const highest = result.merges.reduce((m, x) => Math.max(m, x.value), 0);
      feedback.turn(highest);
      const s = useAppStore.getState();
      announce((t) => t.game.announceMove(t.game.moveNames[result.direction], result.merges.length, formatNumber(s.session.board.score, s.settings.language)));
      controller.motionDone(seq);
      if (!controller.isAnimating) setIdle(true);
    },
    [controller, show, setIdle],
  );

  const apply = useCallback(
    (tr: BoardTransition) => {
      if (tr.kind === 'move') {
        const seq = controller.currentSeq;
        pendingResult.current = tr.result;
        const f = motionFrame(tr.result, seq);
        // A tile spawned by a turn whose resolve was skipped (very fast play) still fades in.
        for (const x of f.tiles) if (!shownIds.current.has(x.id)) x.spawn = true;
        show(f, false);
        setIdle(false);
        cancelAnimation(clock);
        clock.set(0);
        // Tiles keep gliding on their own timing; this clock only decides when the turn resolves.
        const ms = reduceMotion ? duration.instant : duration.resolve;
        clock.set(
          withTiming(1, { duration: ms }, (finished) => {
            if (finished) scheduleOnRN(finishMotion, seq);
          }),
        );
        return;
      }
      // Reset: undo / new game / restore. Never animate a fake reverse; snap with a short fade.
      controller.interrupt();
      cancelAnimation(clock);
      pendingResult.current = null;
      const b = useAppStore.getState().session.board;
      shownIds.current = new Set();
      show(settledFrame(b, tr.fresh ? { spawnIds: new Set(b.tiles.map((x) => x.id)) } : {}), true);
      if (!tr.fresh && !reduceMotion) layer.set(withSequence(withTiming(0.55, { duration: duration.instant }), withTiming(1, { duration: duration.standard })));
      setIdle(true);
    },
    [controller, clock, layer, show, finishMotion, setIdle, reduceMotion],
  );

  useEffect(() => {
    let last = useAppStore.getState().transition;
    return useAppStore.subscribe((s) => {
      if (s.transition !== last) {
        last = s.transition;
        apply(s.transition);
      }
    });
  }, [apply]);

  useEffect(() => watchScreenReader(), []);

  const settle = useCallback(() => {
    if (!controller.isAnimating && !pendingResult.current) return;
    controller.interrupt();
    cancelAnimation(clock);
    pendingResult.current = null;
    show(settledFrame(useAppStore.getState().session.board), true);
    setIdle(true);
  }, [controller, clock, show, setIdle]);

  useEffect(() => () => settle(), [settle]);

  const input = useCallback(
    (d: Direction) => {
      if (enabled) controller.input(d);
    },
    [controller, enabled],
  );
  useImperativeHandle(ref, () => ({ input, settle }), [input, settle]);

  // One gesture → at most one move. Fires as soon as the swipe is unambiguous.
  const fired = useRef(false);
  const pan = usePanGesture({
    runOnJS: true,
    minDistance: 6,
    onBegin: () => {
      fired.current = false;
    },
    onUpdate: (e) => {
      if (fired.current) return;
      const d = directionFromPan(e.translationX, e.translationY, 0, 0, false);
      if (d) {
        fired.current = true;
        input(d);
      }
    },
    onDeactivate: (e) => {
      if (fired.current) return;
      const d = directionFromPan(e.translationX, e.translationY, e.velocityX, e.velocityY, true);
      fired.current = true;
      if (d) input(d);
    },
  });

  const layerStyle = useAnimatedStyle(() => ({ opacity: layer.get() }));

  // Screen reader view of the board, row by row.
  const description = useMemo(() => {
    const grid = tileGrid(board);
    return grid.map((row, i) => `${t.game.row(i + 1)}: ${row.map((x) => (x ? x.value : t.game.empty)).join(', ')}`).join('. ');
  }, [board, t]);
  const onAction = useCallback((e: AccessibilityActionEvent) => input(e.nativeEvent.actionName as Direction), [input]);
  const actions = useMemo(() => (['up', 'down', 'left', 'right'] as const).map((d) => ({ name: d, label: t.game.moveAction(t.game.moveNames[d]) })), [t]);

  const { boardSide, boardPadding, tileSide, cellGap } = layout;
  const top = maxTile(board);

  return (
    <View style={{ width: boardSide, height: boardSide }}>
      <AmbientGlow side={boardSide} value={top} reduceMotion={reduceMotion} />
      <GestureDetector gesture={pan}>
        <View
          style={[styles.shell, { width: boardSide, height: boardSide }]}
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel={`${t.game.boardLabel}. ${description}`}
          accessibilityHint={t.game.boardHint}
          accessibilityActions={actions}
          onAccessibilityAction={onAction}
          accessibilityLanguage={language}
        >
          <LinearGradient colors={[colors.surface.boardTop, colors.surface.boardBottom]} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={[StyleSheet.absoluteFill, { borderRadius: radius.board }]} />
          <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.shellBorder]} />
          <LinearGradient
            pointerEvents="none"
            colors={['rgba(240,248,255,0)', 'rgba(240,248,255,0.26)', 'rgba(240,248,255,0.08)', 'rgba(240,248,255,0)']}
            locations={[0, 0.3, 0.7, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.shellEdge}
          />
          <View style={{ position: 'absolute', left: boardPadding, top: boardPadding }} pointerEvents="none">
            {Array.from({ length: 16 }, (_, i) => (
              <EmptyCell key={i} x={cellOffset(i % 4, tileSide, cellGap)} y={cellOffset(Math.floor(i / 4), tileSide, cellGap)} side={tileSide} />
            ))}
          </View>
          <Animated.View style={[{ position: 'absolute', left: boardPadding, top: boardPadding, width: boardSide - boardPadding * 2, height: boardSide - boardPadding * 2 }, layerStyle]} pointerEvents="none">
            {frame.tiles.map((tile) => (
              <AnimatedTile key={tile.id} tile={tile} tileSide={tileSide} cellGap={cellGap} snap={snap} reduceMotion={reduceMotion} />
            ))}
          </Animated.View>
        </View>
      </GestureDetector>
      <Brackets />
    </View>
  );
});

/** HUD corner brackets just outside the shell: the play field, framed like a viewfinder. */
function Brackets() {
  return (
    <View pointerEvents="none" style={styles.brackets}>
      <View style={[styles.bracket, styles.tl]} />
      <View style={[styles.bracket, styles.tr]} />
      <View style={[styles.bracket, styles.bl]} />
      <View style={[styles.bracket, styles.br]} />
    </View>
  );
}

function EmptyCell({ x, y, side }: { x: number; y: number; side: number }) {
  const r = Math.min(radius.cell, side * 0.2);
  return (
    <View style={[styles.cell, { left: x, top: y, width: side, height: side, borderRadius: r }]}>
      <LinearGradient colors={[colors.surface.cellTop, colors.surface.cellBottom]} style={[StyleSheet.absoluteFill, { borderRadius: r }]} />
    </View>
  );
}

/**
 * Soft light behind the board, coloured by the highest tile. It only changes when the
 * highest tile's colour changes, and crossfades slowly.
 */
function AmbientGlow({ side, value, reduceMotion }: { side: number; value: number; reduceMotion: boolean }) {
  const color = tileMaterial(Math.max(value, 8)).glow;
  const [layers, setLayers] = useState<{ color: string; key: number }[]>([{ color, key: 0 }]);
  const top = layers[layers.length - 1];
  // Adjusting state while rendering when a prop changes (React's "previous value" pattern).
  if (top.color !== color) setLayers([top, { color, key: top.key + 1 }]);
  const size = side * 1.5;
  return (
    <View pointerEvents="none" style={[styles.glow, { width: size, height: size, left: (side - size) / 2, top: (side - size) / 2 }]}>
      {layers.map((l, i) => (
        <GlowLayer key={l.key} color={l.color} fadeIn={i > 0 && !reduceMotion} />
      ))}
    </View>
  );
}

function GlowLayer({ color, fadeIn }: { color: string; fadeIn: boolean }) {
  const o = useSharedValue(fadeIn ? 0 : 1);
  useEffect(() => {
    if (fadeIn) o.set(withTiming(1, { duration: 1400 }));
  }, [fadeIn, o]);
  const style = useAnimatedStyle(() => ({ opacity: o.get() }));
  const id = `g${color.slice(1)}`;
  return (
    <Animated.View style={[StyleSheet.absoluteFill, style]}>
      <Svg width="100%" height="100%">
        <Defs>
          <RadialGradient id={id} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={color} stopOpacity={0.2} />
            <Stop offset="0.55" stopColor={color} stopOpacity={0.07} />
            <Stop offset="1" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  glow: { position: 'absolute' },
  shell: {
    borderRadius: radius.board,
    boxShadow: `${slab(4, 'rgba(3, 6, 14, 0.85)')}, 0 24px 60px ${alpha(colors.shadow, 0.6)}, 0 8px 12px ${alpha(colors.shadow, 0.4)}`,
  },
  shellBorder: {
    borderRadius: radius.board,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderTopColor: colors.border.default,
  },
  brackets: { position: 'absolute', left: -9, top: -9, right: -9, bottom: -9 },
  bracket: { position: 'absolute', width: 26, height: 26, borderColor: alpha(colors.aurora.mint, 0.55) },
  tl: { left: 0, top: 0, borderLeftWidth: 2.5, borderTopWidth: 2.5, borderTopLeftRadius: radius.board + 8 },
  tr: { right: 0, top: 0, borderRightWidth: 2.5, borderTopWidth: 2.5, borderTopRightRadius: radius.board + 8 },
  bl: { left: 0, bottom: 0, borderLeftWidth: 2.5, borderBottomWidth: 2.5, borderBottomLeftRadius: radius.board + 8 },
  br: { right: 0, bottom: 0, borderRightWidth: 2.5, borderBottomWidth: 2.5, borderBottomRightRadius: radius.board + 8 },
  shellEdge: { position: 'absolute', top: 0, left: radius.board, right: radius.board, height: 1 },
  // Sockets: recessed, so the shadowed lip is on top and the light catches the bottom.
  cell: {
    position: 'absolute',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.25)',
    borderTopWidth: 2.5,
    borderTopColor: 'rgba(0,0,0,0.38)',
    borderBottomColor: 'rgba(196,220,255,0.07)',
    overflow: 'hidden',
  },
});
