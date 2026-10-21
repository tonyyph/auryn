import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { Image, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useEnvironment, useReduceMotion } from '../state/environment';
import { colors } from '../theme';

const PRIMARY = require('../../assets/aurora/primary.png');
const SECONDARY = require('../../assets/aurora/secondary.png');
const FLARE = require('../../assets/aurora/flare.png');
const VIGNETTE = require('../../assets/aurora/vignette.png');
const GRAIN = require('../../assets/aurora/grain.png');

const breathe = Easing.inOut(Easing.sin);

/**
 * Layered sky: base gradient → primary ribbon → secondary ribbon → flare (2048 only)
 * → vignette → grain. Ribbons are pre-blurred images moved only by transform/opacity on
 * the UI thread, so the board never competes with the sky for frame time.
 * `calm` (gameplay) lowers the ribbons so the numbers stay first.
 */
export function AuroraBackground({ calm = false }: { calm?: boolean }) {
  const { width, height } = useWindowDimensions();
  const reduceMotion = useReduceMotion();
  const active = useEnvironment((s) => s.active);
  const flare = useEnvironment((s) => s.flare);

  const drift1 = useSharedValue(0);
  const drift2 = useSharedValue(0);
  const glow = useSharedValue(0);
  const flareO = useSharedValue(0);
  const dim = useSharedValue(calm ? 1 : 0);

  useEffect(() => {
    const animate = active && !reduceMotion;
    if (!animate) {
      cancelAnimation(drift1);
      cancelAnimation(drift2);
      cancelAnimation(glow);
      return;
    }
    // Three independent, non-multiple periods so the combined loop never visibly repeats.
    drift1.set(withRepeat(withTiming(1, { duration: 19000, easing: breathe }), -1, true));
    drift2.set(withRepeat(withTiming(1, { duration: 23000, easing: breathe }), -1, true));
    glow.set(withRepeat(withTiming(1, { duration: 13000, easing: breathe }), -1, true));
  }, [active, reduceMotion, drift1, drift2, glow]);

  useEffect(() => {
    dim.set(withTiming(calm ? 1 : 0, { duration: 900 }));
  }, [calm, dim]);

  useEffect(() => {
    if (!flare) return;
    flareO.set(
      reduceMotion
        ? withSequence(withTiming(0.5, { duration: 400 }), withDelay(900, withTiming(0, { duration: 900 })))
        : withSequence(withTiming(1, { duration: 700, easing: Easing.out(Easing.quad) }), withDelay(500, withTiming(0, { duration: 1600, easing: breathe }))),
    );
  }, [flare, flareO, reduceMotion]);

  const primary = useAnimatedStyle(() => ({
    opacity: (0.88 + glow.get() * 0.12) * (1 - dim.get() * 0.32),
    transform: [{ translateX: -14 + drift1.get() * 28 }, { translateY: -6 + drift1.get() * 12 }, { scale: 1.02 + drift2.get() * 0.04 }],
  }));
  const secondary = useAnimatedStyle(() => ({
    opacity: (0.95 - glow.get() * 0.15) * (1 - dim.get() * 0.25),
    transform: [{ translateX: 12 - drift2.get() * 24 }, { translateY: 8 - drift1.get() * 10 }, { scale: 1.03 + drift1.get() * 0.03 }],
  }));
  const flareStyle = useAnimatedStyle(() => ({ opacity: flareO.get() }));

  // Overscan so drift never reveals an edge.
  const w = width * 1.12;
  const h = Math.max(height * 1.08, w * 2);
  const frame = { width: w, height: h, left: (width - w) / 2, top: (height - h) / 2 };

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.root]}>
      <LinearGradient colors={['#0C1630', colors.background.deep, colors.background.base]} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />
      <Animated.View style={[styles.layer, frame, primary]}>
        <Image source={PRIMARY} style={styles.fill} resizeMode="stretch" />
      </Animated.View>
      <Animated.View style={[styles.layer, frame, secondary]}>
        <Image source={SECONDARY} style={styles.fill} resizeMode="stretch" />
      </Animated.View>
      <Animated.View style={[styles.layer, frame, flareStyle]}>
        <Image source={FLARE} style={styles.fill} resizeMode="stretch" />
      </Animated.View>
      <Image source={VIGNETTE} style={StyleSheet.absoluteFill} resizeMode="stretch" />
      <Image source={GRAIN} style={[StyleSheet.absoluteFill, styles.grain]} resizeMode="repeat" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: colors.background.base },
  layer: { position: 'absolute' },
  fill: { width: '100%', height: '100%' },
  grain: { opacity: 0.05 },
});
