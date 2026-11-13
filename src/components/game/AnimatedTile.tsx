import { memo, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSequence, withTiming } from 'react-native-reanimated';
import type { RenderTile } from '../../presentation/frames';
import { alpha, cellOffset, duration, easing, PULSE_SCALE, SPAWN_FROM, tileMaterial } from '../../theme';
import { NumberTile } from '../NumberTile';

interface Props {
  tile: RenderTile;
  tileSide: number;
  cellGap: number;
  /** Snap instead of sliding (undo, new game, restore). */
  snap: boolean;
  reduceMotion: boolean;
}

/**
 * One tile on the board, keyed by its stable id. Position, pulse, halo and spawn are
 * all UI-thread animations; React only re-renders a tile when its target or value changes.
 *
 * Everything that happens when a turn resolves (face swap to the doubled value, pulse, a
 * consumed tile vanishing, the new tile appearing) is started with the motion frame and
 * delayed on the UI thread to the resolve moment, so it lands exactly when the slide
 * arrives however busy the JS thread is. The resolved frame that follows is identical.
 */
export const AnimatedTile = memo(function AnimatedTile({ tile, tileSide, cellGap, snap, reduceMotion }: Props) {
  const targetX = cellOffset(tile.cell.col, tileSide, cellGap);
  const targetY = cellOffset(tile.cell.row, tileSide, cellGap);
  const x = useSharedValue(targetX);
  const y = useSharedValue(targetY);
  const scale = useSharedValue(tile.spawn ? (reduceMotion ? 1 : SPAWN_FROM) : 1);
  const opacity = useSharedValue(tile.spawn ? 0 : 1);
  const halo = useSharedValue(0);
  const nextFace = useSharedValue(0);
  // Resolve moment, relative to the start of the motion frame (see duration.resolve).
  const lag = reduceMotion ? duration.instant : duration.resolve;
  const peak = tile.next ?? tile.value;

  useEffect(() => {
    if (snap || reduceMotion) {
      // Reduce Motion: tiles take a very short glide so direction is still readable.
      if (reduceMotion && !snap) {
        x.set(withTiming(targetX, { duration: duration.instant }));
        y.set(withTiming(targetY, { duration: duration.instant }));
      } else {
        x.set(targetX);
        y.set(targetY);
      }
      return;
    }
    x.set(withTiming(targetX, { duration: duration.move, easing: easing.move }));
    y.set(withTiming(targetY, { duration: duration.move, easing: easing.move }));
  }, [targetX, targetY, snap, reduceMotion, x, y]);

  useEffect(() => {
    if (!tile.spawn) return;
    // A spawn mounts with its turn's motion frame and appears when the turn resolves.
    opacity.set(withDelay(lag, withTiming(1, { duration: duration.spawn, easing: easing.enter })));
    if (!reduceMotion) scale.set(withDelay(lag, withTiming(1, { duration: duration.spawn, easing: easing.enter })));
    // Only on mount: a tile spawns once in its life.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A survivor turns into its doubled value at the resolve moment.
  useEffect(() => {
    if (tile.next === undefined) return;
    nextFace.set(0);
    nextFace.set(withDelay(lag, withTiming(1, { duration: 0 })));
  }, [tile.next, lag, nextFace]);

  // A consumed tile disappears under its survivor at the same moment.
  useEffect(() => {
    if (tile.under) opacity.set(withDelay(lag, withTiming(0, { duration: 0 })));
  }, [tile.under, lag, opacity]);

  useEffect(() => {
    if (!tile.pulse) return;
    // Light converges on the merge point, then settles. Pulse keys are introduced by motion
    // frames only, so the pulse always starts at the resolve moment.
    halo.set(withDelay(lag, withSequence(withTiming(1, { duration: duration.pulse * 0.45 }), withTiming(0, { duration: duration.pulse * (peak >= 2048 ? 4.5 : 2) }))));
    if (!reduceMotion) {
      scale.set(
        withDelay(
          lag,
          withSequence(
            withTiming(PULSE_SCALE, { duration: duration.pulse * 0.45, easing: easing.enter }),
            withTiming(1, { duration: duration.pulse * 0.55, easing: easing.inOut }),
          ),
        ),
      );
    }
  }, [tile.pulse, peak, lag, reduceMotion, halo, scale]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.get(),
    transform: [{ translateX: x.get() }, { translateY: y.get() }, { scale: scale.get() }],
  }));
  const haloStyle = useAnimatedStyle(() => ({ opacity: halo.get() }));
  const nextStyle = useAnimatedStyle(() => ({ opacity: nextFace.get() }));

  const m = tileMaterial(peak);
  const big = peak >= 2048;
  const r = Math.min(16, tileSide * 0.22);
  return (
    <Animated.View
      style={[styles.tile, { width: tileSide, height: tileSide, zIndex: tile.under ? 0 : 1 }, style]}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
    >
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { borderRadius: r, boxShadow: `0 0 ${Math.round(tileSide * (big ? 0.5 : 0.28))}px ${Math.round(tileSide * (big ? 0.12 : 0.04))}px ${alpha(m.glow, big ? 0.85 : 0.6)}` },
          haloStyle,
        ]}
      />
      <NumberTile value={tile.value} side={tileSide} />
      {tile.next !== undefined ? (
        <Animated.View style={[StyleSheet.absoluteFill, nextStyle]}>
          <NumberTile value={tile.next} side={tileSide} />
        </Animated.View>
      ) : null}
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  tile: { position: 'absolute', left: 0, top: 0 },
});
