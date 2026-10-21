import { Redirect } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { NumberTile } from '../components/NumberTile';
import { ControlButton, IconButton, Label, PrimaryButton, SecondaryButton, Sticker, TextButton } from '../components/primitives';
import { ScreenShell } from '../components/ScreenShell';
import { keyTones, space, TILE_VALUES, type } from '../theme';

/** Dev-only design preview: every tile step and every button state. Not linked in production. */
export default function Preview() {
  if (!__DEV__) return <Redirect href="/" />;
  const noop = () => {};
  return (
    <ScreenShell title="Preview">
      <Label>TILES</Label>
      <View style={styles.tiles}>
        {TILE_VALUES.map((v) => (
          <View key={v} style={styles.tileCell}>
            <NumberTile value={v} side={72} />
          </View>
        ))}
        <View style={styles.tileCell}>
          <NumberTile value={131072} side={72} />
        </View>
      </View>
      <Label>BUTTONS</Label>
      <View style={styles.stack}>
        <PrimaryButton label="Continue" trailingIcon="arrowRight" onPress={noop} />
        <PrimaryButton label="Disabled" onPress={noop} disabled />
        <PrimaryButton label="Loading" onPress={noop} loading />
        <SecondaryButton label="Keep playing" onPress={noop} />
        <SecondaryButton label="Reset" tone="destructive" onPress={noop} />
        <View style={styles.row}>
          <TextButton label="New game" onPress={noop} />
          <IconButton icon="settings" label="Settings" onPress={noop} />
          <IconButton icon="back" label="Back" onPress={noop} disabled />
        </View>
        <View style={styles.row}>
          <ControlButton icon="undo" label="Undo" onPress={noop} tone={keyTones.violet} />
          <ControlButton icon="undo" label="Undo" onPress={noop} disabled />
          <ControlButton icon="restart" label="Restart" onPress={noop} />
        </View>
      </View>
      <Label>TYPE</Label>
      <Text style={type.score}>9,876,543</Text>
      <Text style={type.display}>KẸT CỨNG RỒI! Ế Ổ Ữ</Text>
      <View style={styles.row}>
        <Sticker text="KỶ LỤC MỚI!" />
        <Sticker text="COMBO ×3" tone={keyTones.mint} rotate={3} />
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: space[3] },
  tileCell: { padding: 2 },
  stack: { gap: space[3] },
  row: { flexDirection: 'row', alignItems: 'center', gap: space[3] },
});
