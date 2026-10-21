import { memo, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
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
 */
export const AnimatedTile = memo(function AnimatedTile({ tile, tileSide, cellGap, snap, reduceMotion }: Props) {
  const targetX = cellOffset(tile.cell.col, tileSide, cellGap);
  const targetY = cellOffset(tile.cell.row, tileSide, cellGap);
  const x = useSharedValue(targetX);
  const y = useSharedValue(targetY);
  const scale = useSharedValue(tile.spawn ? (reduceMotion ? 1 : SPAWN_FROM) : 1);
  const opacity = useSharedValue(tile.spawn ? 0 : 1);
  const halo = useSharedValue(0);

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
    opacity.set(withTiming(1, { duration: duration.spawn, easing: easing.enter }));
    if (!reduceMotion) scale.set(withTiming(1, { duration: duration.spawn, easing: easing.enter }));
    // Only on mount: a tile spawns once in its life.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!tile.pulse) return;
    // Light converges on the merge point, then settles.
    halo.set(withSequence(withTiming(1, { duration: duration.pulse * 0.45 }), withTiming(0, { duration: duration.pulse * (tile.value >= 2048 ? 4.5 : 2) })));
    if (!reduceMotion) {
      scale.set(
        withSequence(
          withTiming(PULSE_SCALE, { duration: duration.pulse * 0.45, easing: easing.enter }),
          withTiming(1, { duration: duration.pulse * 0.55, easing: easing.inOut }),
        ),
      );
    }
  }, [tile.pulse, tile.value, reduceMotion, halo, scale]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.get(),
    transform: [{ translateX: x.get() }, { translateY: y.get() }, { scale: scale.get() }],
  }));
  const haloStyle = useAnimatedStyle(() => ({ opacity: halo.get() }));

  const m = tileMaterial(tile.value);
  const big = tile.value >= 2048;
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
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  tile: { position: 'absolute', left: 0, top: 0 },
});
