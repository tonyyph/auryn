import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { feedback } from '../feedback/feedback';
import { alpha, colors, duration, fonts, keyTones, MIN_TOUCH, radius, slab, space, spring, type, type KeyTone } from '../theme';
import { Icon, type IconName } from './Icon';

/**
 * The "luminous edge": a short highlight along the top of an object, brightest in the
 * middle-left (toward the light), fading out before the corners.
 */
export function LuminousEdge({ strength = 0.22, inset = 16 }: { strength?: number; inset?: number }) {
  return (
    <LinearGradient
      pointerEvents="none"
      colors={['rgba(240,248,255,0)', `rgba(240,248,255,${strength})`, `rgba(240,248,255,${strength * 0.5})`, 'rgba(240,248,255,0)']}
      locations={[0, 0.35, 0.65, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[styles.edge, { left: inset, right: inset }]}
    />
  );
}

/** A raised, mostly opaque panel: gradient fill, lit top edge, a solid slab underneath. */
export function Surface({ children, style, radius: r = radius.control, tone = 'raised' }: { children?: ReactNode; style?: StyleProp<ViewStyle>; radius?: number; tone?: 'raised' | 'subtle' | 'overlay' }) {
  const fill =
    tone === 'overlay'
      ? ([colors.surface.raised, colors.surface.overlay] as const)
      : tone === 'subtle'
        ? ([alpha(colors.surface.raised, 0.94), alpha(colors.surface.subtle, 0.94)] as const)
        : ([colors.surface.raised, colors.surface.subtle] as const);
  return (
    <View style={[styles.surface, { borderRadius: r }, style]}>
      <LinearGradient colors={fill} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={[StyleSheet.absoluteFill, { borderRadius: r }]} />
      <LuminousEdge strength={tone === 'subtle' ? 0.16 : 0.2} inset={r} />
      {children}
    </View>
  );
}

export interface KeyProps {
  label: string;
  onPress: () => void;
  tone?: KeyTone;
  disabled?: boolean;
  /** Face height; the slab adds `depth` below it. */
  height?: number;
  depth?: number;
  radius?: number;
  hint?: string;
  busy?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  /** Tap feedback (haptic tick). Off for keys that trigger their own cue. */
  tick?: boolean;
  children: ReactNode;
}

/**
 * Arcade keycap: a gradient face sitting on a solid slab. Pressing pushes the face down
 * into the slab on the UI thread (transform only), and it springs back on release.
 */
export function Key({ label, onPress, tone = keyTones.ink, disabled, height = 56, depth = 5, radius: r = radius.button, hint, busy, style, contentStyle, tick = true, children }: KeyProps) {
  const t: KeyTone = disabled ? keyTones.disabled : tone;
  const d = disabled ? 2 : depth;
  const press = useSharedValue(0);
  const faceStyle = useAnimatedStyle(() => ({ transform: [{ translateY: press.get() * (d - 1) }] }));
  const shadeStyle = useAnimatedStyle(() => ({ opacity: press.get() * 0.12 }));
  const inactive = disabled || busy;
  return (
    <Pressable
      onPress={() => {
        if (inactive) return;
        if (tick) feedback.tap();
        onPress();
      }}
      onPressIn={() => {
        if (!inactive) press.set(withTiming(1, { duration: duration.instant }));
      }}
      onPressOut={() => press.set(withSpring(0, spring.press))}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityState={{ disabled: !!disabled, busy: !!busy }}
      hitSlop={4}
      style={style}
    >
      <View style={[{ height: height + d, borderRadius: r }, !inactive && t.glow ? { boxShadow: `0 10px 26px ${alpha(t.glow, 0.22)}` } : null]}>
        <View style={[styles.slab, { top: d, borderRadius: r, backgroundColor: t.depth }]} />
        <Animated.View style={[styles.face, { height, borderRadius: r }, faceStyle]}>
          <LinearGradient colors={[t.top, t.bottom]} style={StyleSheet.absoluteFill} />
          <LinearGradient pointerEvents="none" colors={['rgba(255,255,255,0.22)', 'rgba(255,255,255,0)']} style={styles.gloss} />
          <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.faceRim, { borderRadius: r }]} />
          <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.pressShade, shadeStyle]} />
          <View style={[styles.keyContent, contentStyle]}>{children}</View>
        </Animated.View>
      </View>
    </Pressable>
  );
}

export function PrimaryButton({ label, onPress, disabled, loading, trailingIcon, accessibilityHint, tone = keyTones.mint }: { label: string; onPress: () => void; disabled?: boolean; loading?: boolean; trailingIcon?: IconName; accessibilityHint?: string; tone?: KeyTone }) {
  const color = disabled ? keyTones.disabled.text : tone.text;
  return (
    <Key label={label} onPress={onPress} disabled={disabled} busy={loading} hint={accessibilityHint} tone={tone} height={58} depth={6}>
      {loading ? (
        <ActivityIndicator color={color} />
      ) : (
        <View style={styles.row}>
          <Text style={[type.button, styles.primaryLabel, { color }]} numberOfLines={1} maxFontSizeMultiplier={1.3}>
            {label}
          </Text>
          {trailingIcon ? <Icon name={trailingIcon} size={18} strokeWidth={2.4} color={color} /> : null}
        </View>
      )}
    </Key>
  );
}

/** Dark keycap. `tone="destructive"` uses muted coral text, never alarm red. */
export function SecondaryButton({ label, onPress, tone = 'default', disabled, icon }: { label: string; onPress: () => void; tone?: 'default' | 'destructive'; disabled?: boolean; icon?: IconName }) {
  const color = disabled ? keyTones.disabled.text : tone === 'destructive' ? colors.state.destructive : keyTones.ink.text;
  return (
    <Key label={label} onPress={onPress} disabled={disabled} height={52} depth={5}>
      <View style={styles.row}>
        {icon ? <Icon name={icon} size={18} strokeWidth={2.2} color={color} /> : null}
        <Text style={[type.button, { color }]} numberOfLines={2} maxFontSizeMultiplier={1.3}>
          {label}
        </Text>
      </View>
    </Key>
  );
}

/** Text-only action (e.g. "Main menu" under the main keys). */
export function TextButton({ label, onPress, color = colors.text.secondary, icon }: { label: string; onPress: () => void; color?: string; icon?: IconName }) {
  const pressed = useSharedValue(0);
  const style = useAnimatedStyle(() => ({ opacity: 1 - pressed.get() * 0.4 }));
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => pressed.set(withTiming(1, { duration: duration.instant }))}
      onPressOut={() => pressed.set(withTiming(0, { duration: duration.fast }))}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
    >
      <Animated.View style={[styles.textButton, style]}>
        {icon ? <Icon name={icon} size={16} strokeWidth={2} color={color} /> : null}
        <Text style={[styles.textButtonLabel, { color }]} maxFontSizeMultiplier={1.4}>
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

/** Square dark keycap holding one icon (top bars, direction pad). */
export function IconButton({ icon, label, onPress, disabled, size = 44, tone }: { icon: IconName; label: string; onPress: () => void; disabled?: boolean; size?: number; tone?: KeyTone }) {
  const t = tone ?? keyTones.ink;
  return (
    <Key label={label} onPress={onPress} disabled={disabled} tone={t} height={size} depth={4} radius={14} style={{ width: size }}>
      <Icon name={icon} size={20} strokeWidth={2.1} color={disabled ? keyTones.disabled.text : t.text} />
    </Key>
  );
}

/** Game dock key: icon above a short label. */
export function ControlButton({ icon, label, onPress, disabled, tone, badge }: { icon: IconName; label: string; onPress: () => void; disabled?: boolean; tone?: KeyTone; badge?: ReactNode }) {
  const t = tone ?? keyTones.ink;
  const color = disabled ? keyTones.disabled.text : t.text;
  return (
    <Key label={label} onPress={onPress} disabled={disabled} tone={t} height={58} depth={6} style={styles.controlHit} contentStyle={styles.control}>
      <Icon name={icon} size={21} strokeWidth={2.2} color={color} />
      <Text style={[type.control, { color }]} numberOfLines={1} maxFontSizeMultiplier={1.25}>
        {label}
      </Text>
      {badge ? <View style={styles.badge}>{badge}</View> : null}
    </Key>
  );
}

/** A tilted label slapped on top of something: "NEW BEST!", "MILESTONE". */
const STICKER_DEPTH = 2.5;

export function Sticker({ text, tone = keyTones.gold, rotate = -4, style }: { text: string; tone?: KeyTone; rotate?: number; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.sticker, { backgroundColor: tone.bottom, boxShadow: slab(STICKER_DEPTH, tone.depth), transform: [{ rotate: `${rotate}deg` }] }, style]}>
      <Text style={[styles.stickerText, { color: tone.text }]} numberOfLines={1} maxFontSizeMultiplier={1.2}>
        {text}
      </Text>
    </View>
  );
}

export function Label({ children, color }: { children: ReactNode; color?: string }) {
  return (
    <Text style={[type.label, color ? { color } : null]} maxFontSizeMultiplier={1.4}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  edge: { position: 'absolute', top: 0, height: StyleSheet.hairlineWidth * 2 },
  surface: {
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.subtle,
    borderTopColor: colors.border.default,
    boxShadow: slab(3, 'rgba(3, 6, 14, 0.75)'),
    marginBottom: 3,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
  slab: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  face: { overflow: 'hidden' },
  gloss: { position: 'absolute', top: 0, left: 0, right: 0, height: '48%' },
  faceRim: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', borderTopColor: 'rgba(255,255,255,0.32)', borderBottomColor: 'rgba(0,0,0,0.10)' },
  pressShade: { backgroundColor: '#000' },
  keyContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space[4] },
  primaryLabel: { fontFamily: fonts.display, fontSize: 15, letterSpacing: 1 },
  textButton: { minHeight: MIN_TOUCH, flexDirection: 'row', gap: space[2], paddingHorizontal: space[3], alignItems: 'center', justifyContent: 'center' },
  textButtonLabel: { fontFamily: fonts.displayBold, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase' },
  controlHit: { flex: 1 },
  control: { gap: 5, paddingHorizontal: space[2] },
  badge: { position: 'absolute', top: 6, right: 8 },
  sticker: {
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingTop: 4,
    paddingBottom: 3,
    borderRadius: 7,
    marginBottom: STICKER_DEPTH,
  },
  stickerText: { fontFamily: fonts.display, fontSize: 10.5, lineHeight: 15, letterSpacing: 1 },
});
