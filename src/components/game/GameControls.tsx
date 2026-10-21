import { StyleSheet, View } from 'react-native';
import type { Direction } from '../../engine';
import { useStrings } from '../../i18n';
import { alpha, colors, keyTones, space } from '../../theme';
import { ControlButton, IconButton } from '../primitives';

/** The dock: Undo is the one power-up (a single charge, shown by its pip), then Restart and Rules. */
export function GameControls({ canUndo, onUndo, onRestart, onHelp }: { canUndo: boolean; onUndo: () => void; onRestart: () => void; onHelp: () => void }) {
  const t = useStrings();
  return (
    <View style={styles.row}>
      <View style={styles.undo}>
        <ControlButton
          icon="undo"
          label={t.game.undo}
          onPress={onUndo}
          disabled={!canUndo}
          tone={keyTones.violet}
          badge={canUndo ? <View style={styles.pip} accessibilityLabel={t.game.undoReady} /> : null}
        />
      </View>
      <ControlButton icon="restart" label={t.game.restart} onPress={onRestart} />
      <ControlButton icon="help" label={t.game.help} onPress={onHelp} />
    </View>
  );
}

/** Optional accessible alternative to swiping: a plus-shaped cluster of arrow keys. */
export function DirectionPad({ onMove }: { onMove: (d: Direction) => void }) {
  const t = useStrings();
  const key = (d: Direction) => <IconButton key={d} icon={d} label={t.game.padLabel(t.game.moveNames[d])} onPress={() => onMove(d)} size={46} />;
  return (
    <View style={styles.pad}>
      {key('left')}
      <View style={styles.padMid}>
        {key('up')}
        {key('down')}
      </View>
      {key('right')}
    </View>
  );
}

export const PAD_HEIGHT = 58;

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space[3] },
  undo: { flex: 1.25, flexDirection: 'row' },
  pip: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.text.celebration, boxShadow: `0 0 6px ${alpha(colors.aurora.champagne, 0.9)}` },
  pad: { height: PAD_HEIGHT, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: space[3] },
  padMid: { flexDirection: 'row', gap: space[3] },
});
