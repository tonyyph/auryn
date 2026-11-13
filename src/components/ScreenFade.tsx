import { useIsFocused, useNavigation, type NativeStackNavigationProp } from 'expo-router';
import { useEffect, useRef, type ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { useReduceMotion } from '../state/environment';
import { duration, easing } from '../theme';

/**
 * Wraps every stack screen. Screens are transparent so the one aurora shows through, which
 * means a pushed screen would otherwise be drawn straight over the one below it. The
 * covered screen fades out as soon as it loses focus and fades back in when it is
 * uncovered. A screen being popped fades itself out as its closing transition starts (the
 * native pop keeps it opaque almost to the end). Arrivals wait until the leaving screen has
 * gone, so the change reads as one screen handing over to the next.
 */
/** Roughly when a popped screen's native exit (260 ms, eased) has faded most of the way. */
const POP_CLEAR = 190;

export function ScreenFade({ children }: { children: ReactNode }) {
  const focused = useIsFocused();
  const reduceMotion = useReduceMotion();
  const navigation = useNavigation<NativeStackNavigationProp<Record<string, object | undefined>>>();
  // Every screen starts hidden and arrives once the previous one has gone: one screen at a
  // time over the shared aurora, never two sets of content on top of each other.
  const opacity = useSharedValue(0);
  const leave = reduceMotion ? duration.instant : duration.fast;

  // Coming back after a pop waits longer: iOS animates the closing screen from a snapshot,
  // so it can't be faded from here, and the uncovered screen has to wait for it to clear.
  const seen = useRef(false);
  useEffect(() => {
    if (!focused) {
      opacity.set(withTiming(0, { duration: leave, easing: easing.exit }));
      return;
    }
    const wait = seen.current ? (reduceMotion ? duration.instant : POP_CLEAR) : leave - 20;
    seen.current = true;
    opacity.set(withDelay(wait, withTiming(1, { duration: duration.standard, easing: easing.enter })));
  }, [focused, leave, reduceMotion, opacity]);

  useEffect(() => {
    const fadeOut = () => opacity.set(withTiming(0, { duration: leave, easing: easing.exit }));
    // A popped route keeps rendering through its closing animation and `useIsFocused` can
    // stay true for it, so listen for `blur` (sent the moment focus moves away) and
    // `transitionStart` (pops that start natively, like a swipe back).
    const offRemove = navigation.addListener('blur', fadeOut);
    const offStart = navigation.addListener('transitionStart', (e) => {
      if (e.data.closing) fadeOut();
    });
    // A cancelled swipe-back leaves the screen in place: bring it back.
    const offCancel = navigation.addListener('gestureCancel', () => {
      opacity.set(withTiming(1, { duration: duration.fast }));
    });
    return () => {
      offRemove();
      offStart();
      offCancel();
    };
  }, [navigation, leave, opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.get() }));
  return (
    <Animated.View style={[styles.fill, style]} pointerEvents={focused ? 'auto' : 'none'}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({ fill: { flex: 1 } });
