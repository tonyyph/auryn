import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { BackHandler, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useReduceMotion } from '../state/environment';
import { colors, duration, easing, radius, space } from '../theme';
import { LuminousEdge } from './primitives';

interface Props {
  children: ReactNode;
  /** Called by scrim tap / Android back. Omit to make the overlay require an explicit choice. */
  onDismiss?: () => void;
  variant?: 'modal' | 'sheet';
  /** Delay before appearing (lets a 2048 tile be seen before the celebration). */
  delay?: number;
}

/**
 * Shared modal language: an opaque-enough midnight scrim, a navy surface with a lit top
 * edge, 30 radius, 24 padding. Enter 260 ms (rise + fade), exit 180 ms.
 */
export function Overlay({ children, onDismiss, variant = 'modal', delay = 0 }: Props) {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onDismiss?.();
      return true; // never fall through to navigation while an overlay is open
    });
    return () => sub.remove();
  }, [onDismiss]);

  const scrimIn = FadeIn.duration(duration.overlayIn).delay(delay);
  const cardIn = reduceMotion
    ? FadeIn.duration(duration.standard).delay(delay)
    : FadeInDown.duration(duration.overlayIn).delay(delay).easing(easing.enter).withInitialValues({ transform: [{ translateY: 16 }] });
  const cardOut = reduceMotion ? FadeOut.duration(duration.overlayOut) : FadeOutDown.duration(duration.overlayOut).withInitialValues({ transform: [{ translateY: 0 }] });

  const sheet = variant === 'sheet';
  return (
    <View style={[StyleSheet.absoluteFill, styles.root, sheet && styles.rootSheet]}>
      <Animated.View entering={scrimIn} exiting={FadeOut.duration(duration.overlayOut)} style={[StyleSheet.absoluteFill, styles.scrim]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} accessible={false} importantForAccessibility="no" />
      </Animated.View>
      <Animated.View
        entering={cardIn}
        exiting={cardOut}
        accessibilityViewIsModal
        style={[
          styles.card,
          sheet
            ? [styles.sheet, { paddingBottom: Math.max(insets.bottom, space[4]) + space[4] }]
            : { marginTop: insets.top, marginBottom: insets.bottom },
        ]}
      >
        <LuminousEdge strength={0.22} inset={sheet ? radius.sheet : radius.modal} />
        <ScrollView bounces={false} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { zIndex: 50, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space[5] },
  rootSheet: { justifyContent: 'flex-end', paddingHorizontal: 0 },
  scrim: { backgroundColor: colors.scrim },
  card: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '92%',
    backgroundColor: colors.surface.overlay,
    borderRadius: radius.modal,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderTopColor: 'rgba(196, 220, 255, 0.2)',
    borderBottomWidth: 6,
    borderBottomColor: '#050912',
    boxShadow: `0 30px 70px rgba(2,4,10,0.6)`,
    overflow: 'hidden',
  },
  sheet: {
    maxWidth: 560,
    borderRadius: 0,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    borderBottomWidth: 0,
    borderBottomColor: 'transparent',
  },
  content: { padding: space[6], gap: space[5] },
});
