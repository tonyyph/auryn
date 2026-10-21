import { LinearGradient } from 'expo-linear-gradient';
import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { alpha, fonts, radius, shade, tabular, tileFontSize, tileMaterial } from '../theme';
import { Icon } from './Icon';

/** Height of the solid slab under a tile face, as a share of the tile side. */
export const tileDepth = (side: number) => Math.max(2, Math.round(side * 0.055));

/**
 * The tile material, shared by the board, Home, How to play, Records and the dev preview.
 * A tile is a little keycap: a gradient face on a darker slab, gloss on top, number centred
 * on the face. Everything is static styling; only the wrapper animates.
 */
export const NumberTile = memo(function NumberTile({ value, side, dim = false }: { value: number; side: number; dim?: boolean }) {
  const m = tileMaterial(value);
  const r = Math.max(9, Math.min(radius.tile, side * 0.22));
  const fontSize = tileFontSize(side, value);
  const depth = tileDepth(side);
  const lit = m.tier !== 'satin';
  const shadow =
    m.tier === 'radiant'
      ? `0 6px 20px ${alpha(m.glow, 0.4)}`
      : m.tier === 'lit'
        ? `0 5px 14px ${alpha(m.glow, 0.24)}`
        : `0 3px 8px rgba(2,4,10,0.4)`;

  return (
    <View style={[styles.tile, { width: side, height: side, borderRadius: r, backgroundColor: shade(m.bottom, lit ? 0.68 : 0.62), boxShadow: dim ? undefined : shadow, opacity: dim ? 0.5 : 1 }]}>
      <View style={[styles.face, { bottom: depth, borderRadius: r }]}>
        <LinearGradient colors={[m.top, m.bottom]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={StyleSheet.absoluteFill} />
        <LinearGradient pointerEvents="none" colors={[`rgba(255,255,255,${lit ? 0.24 : 0.1})`, 'rgba(255,255,255,0)']} style={styles.gloss} />
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.rim, { borderRadius: r, borderTopColor: `rgba(255,255,255,${Math.min(0.55, m.edge + 0.1)})` }]} />
        {value === 2048 ? (
          <View style={[styles.star, { top: side * 0.08, right: side * 0.09 }]} pointerEvents="none">
            <Icon name="spark" size={Math.max(7, side * 0.13)} color={alpha(m.number, 0.5)} />
          </View>
        ) : null}
        <Text allowFontScaling={false} numberOfLines={1} style={[styles.number, tabular, { color: m.number, fontSize, lineHeight: Math.round(fontSize * 1.2) }]}>
          {value}
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  tile: {},
  face: { position: 'absolute', top: 0, left: 0, right: 0, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  gloss: { position: 'absolute', top: 0, left: 0, right: 0, height: '50%' },
  rim: { borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.06)' },
  star: { position: 'absolute' },
  number: {
    fontFamily: fonts.heavy,
    letterSpacing: -0.6,
    textAlign: 'center',
    includeFontPadding: false,
  },
});
