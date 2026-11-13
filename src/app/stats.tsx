import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Icon } from '../components/Icon';
import { NumberTile } from '../components/NumberTile';
import { PrimaryButton, Sticker } from '../components/primitives';
import { ScreenShell } from '../components/ScreenShell';
import { formatNumber, useLanguage, useStrings } from '../i18n';
import { useAppStore } from '../state/appStore';
import { alpha, colors, fonts, keyTones, shade, slab, space, tabular, tileMaterial, type } from '../theme';

export default function Stats() {
  const t = useStrings();
  const lang = useLanguage();
  const stats = useAppStore((s) => s.stats);
  const empty = stats.totalMoves === 0 && stats.gamesFinished === 0 && stats.bestScore === 0;

  if (empty) {
    return (
      <ScreenShell title={t.stats.title}>
        <View style={styles.empty}>
          <View style={styles.emptyTiles} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
            <View style={{ transform: [{ rotate: '-10deg' }], marginTop: 26 }}>
              <NumberTile value={2} side={56} />
            </View>
            <View style={{ transform: [{ rotate: '8deg' }] }}>
              <NumberTile value={4} side={70} />
            </View>
          </View>
          <Text style={[type.modalTitle, styles.centerText]}>{t.stats.emptyTitle}</Text>
          <Text style={[type.body, styles.centerText]}>{t.stats.emptyBody}</Text>
          <View style={styles.emptyCta}>
            <PrimaryButton label={t.stats.start} trailingIcon="play" onPress={() => router.replace('/game')} />
          </View>
        </View>
      </ScreenShell>
    );
  }

  const n = (v: number) => formatNumber(v, lang);
  return (
    <ScreenShell title={t.stats.title}>
      <View style={styles.trophy} accessible accessibilityLabel={`${t.stats.best} ${stats.bestScore}`}>
        <LinearGradient colors={[keyTones.gold.top, keyTones.gold.bottom]} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={[StyleSheet.absoluteFill, styles.trophyFace]} />
        <View style={styles.trophyIcon}>
          <Icon name="trophy" size={64} strokeWidth={1.6} color={alpha(keyTones.gold.text, 0.16)} />
        </View>
        <Sticker text={t.stats.best} tone={keyTones.violet} rotate={-4} />
        <Text style={[type.statHero, styles.trophyValue]} numberOfLines={1} adjustsFontSizeToFit>
          {n(stats.bestScore)}
        </Text>
      </View>

      <View style={styles.grid}>
        <Card value={64} label={t.stats.finished} stat={n(stats.gamesFinished)} note={t.stats.finishedNote} />
        <Card value={2048} label={t.stats.reached} stat={n(stats.gamesReached2048)} />
        <Card value={Math.max(8, stats.largestTile)} label={t.stats.largest} stat={n(stats.largestTile)} tile={stats.largestTile} />
        <Card value={256} label={t.stats.moves} stat={n(stats.totalMoves)} />
      </View>
    </ScreenShell>
  );
}

/** One record, printed on a tile-coloured card. */
function Card({ value, label, stat, note, tile }: { value: number; label: string; stat: string; note?: string; tile?: number }) {
  const m = tileMaterial(value);
  return (
    <View style={[styles.card, { backgroundColor: shade(m.bottom, 0.6) }]} accessible accessibilityLabel={`${label}: ${stat}${note ? `. ${note}` : ''}`}>
      <View style={styles.cardFace}>
        <LinearGradient colors={[m.top, m.bottom]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={StyleSheet.absoluteFill} />
        <LinearGradient colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0)']} style={styles.gloss} />
        <Text style={[styles.cardLabel, { color: alpha(m.number, 0.85) }]} numberOfLines={2}>
          {label}
        </Text>
        {note ? <Text style={[styles.cardNote, { color: alpha(m.number, 0.7) }]}>{note}</Text> : null}
        <View style={styles.cardValueRow}>
          {tile ? <NumberTile value={tile} side={30} /> : null}
          <Text style={[styles.cardValue, { color: m.number }]} numberOfLines={1} adjustsFontSizeToFit>
            {stat}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  trophy: {
    padding: space[5],
    paddingTop: space[4],
    gap: space[2],
    borderRadius: 24,
    overflow: 'hidden',
    // Under the face's anti-aliased edge: the slab colour, not the sky.
    backgroundColor: keyTones.gold.depth,
    marginBottom: 6,
    boxShadow: `${slab(6, keyTones.gold.depth)}, 0 18px 30px ${alpha(colors.aurora.champagne, 0.2)}`,
  },
  trophyFace: { borderRadius: 24 },
  trophyIcon: { position: 'absolute', right: 14, top: 14, transform: [{ rotate: '12deg' }] },
  trophyValue: { color: keyTones.gold.text },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space[3] },
  card: { flexBasis: '47%', flexGrow: 1, borderRadius: 20, paddingBottom: 5 },
  cardFace: { flex: 1, minHeight: 124, padding: space[4], gap: 4, borderRadius: 20, overflow: 'hidden' },
  gloss: { position: 'absolute', top: 0, left: 0, right: 0, height: '45%' },
  cardLabel: { fontFamily: fonts.displayBold, fontSize: 11, lineHeight: 15, letterSpacing: 0.4, textTransform: 'uppercase' },
  cardNote: { fontFamily: fonts.medium, fontSize: 11, lineHeight: 14 },
  cardValueRow: { flexDirection: 'row', alignItems: 'center', gap: space[2], marginTop: 'auto', paddingTop: space[2] },
  cardValue: { flexShrink: 1, fontFamily: fonts.display, fontSize: 26, lineHeight: 34, ...tabular },
  empty: { alignItems: 'center', gap: space[3], paddingTop: space[8] },
  emptyTiles: { flexDirection: 'row', gap: space[3], marginBottom: space[4] },
  centerText: { textAlign: 'center' },
  emptyCta: { alignSelf: 'stretch', marginTop: space[5] },
});
