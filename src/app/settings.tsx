import Constants from 'expo-constants';
import { useState, type ReactNode } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { ConfirmDialog, HowToPlaySheet } from '../components/dialogs';
import { Icon } from '../components/Icon';
import { Label, Surface } from '../components/primitives';
import { ScreenShell } from '../components/ScreenShell';
import { useStrings } from '../i18n';
import type { Language } from '../persistence/schema';
import { useAppStore } from '../state/appStore';
import { useEnvironment } from '../state/environment';
import { slab, alpha, colors, fonts, keyTones, radius, space, type } from '../theme';

export default function Settings() {
  const t = useStrings();
  const settings = useAppStore((s) => s.settings);
  const update = useAppStore((s) => s.updateSettings);
  const systemReduce = useEnvironment((s) => s.systemReduceMotion);
  const [confirmReset, setConfirmReset] = useState(false);
  const [howTo, setHowTo] = useState(false);

  return (
    <>
      <ScreenShell title={t.settings.title}>
        <Section label={t.settings.experience}>
          <ToggleRow label={t.settings.sound} value={settings.sound} onChange={(v) => update({ sound: v })} />
          <ToggleRow label={t.settings.haptics} value={settings.haptics} onChange={(v) => update({ haptics: v })} />
          <ToggleRow
            label={t.settings.reduceMotion}
            description={systemReduce ? t.settings.reduceMotionSystem : t.settings.reduceMotionBody}
            // The system request always wins: shown on, and locked.
            value={systemReduce || settings.reduceMotion}
            disabled={systemReduce}
            onChange={(v) => update({ reduceMotion: v })}
          />
          <ToggleRow label={t.settings.directionPad} description={t.settings.directionPadBody} value={settings.directionPad} onChange={(v) => update({ directionPad: v })} last />
        </Section>

        <Section label={t.settings.preferences}>
          <Row label={t.settings.language} last>
            <Segmented
              value={settings.language}
              options={[
                { value: 'en', label: 'English' },
                { value: 'vi', label: 'Tiếng Việt' },
              ]}
              onChange={(v) => update({ language: v })}
            />
          </Row>
        </Section>

        <Section label={t.settings.about}>
          <PressRow label={t.settings.howToPlay} onPress={() => setHowTo(true)} />
          <Row label={t.settings.version} last>
            <Text style={[type.body, styles.value]}>{Constants.expoConfig?.version ?? '1.0.0'}</Text>
          </Row>
        </Section>

        <Section label={t.settings.data}>
          <PressRow label={t.settings.resetStats} description={t.settings.resetBody} onPress={() => setConfirmReset(true)} destructive last />
        </Section>
      </ScreenShell>

      {confirmReset ? (
        <ConfirmDialog
          title={t.settings.resetTitle}
          body={t.settings.resetBody}
          confirm={t.settings.resetConfirm}
          cancel={t.settings.cancel}
          destructive
          onCancel={() => setConfirmReset(false)}
          onConfirm={() => {
            setConfirmReset(false);
            useAppStore.getState().resetStats();
            AccessibilityInfo.announceForAccessibility(t.settings.resetDone);
          }}
        />
      ) : null}
      {howTo ? <HowToPlaySheet onClose={() => setHowTo(false)} /> : null}
    </>
  );
}

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionLabel}>
        <Label>{label}</Label>
      </View>
      <Surface tone="subtle" radius={20}>
        {children}
      </Surface>
    </View>
  );
}

function Row({ label, description, children, last }: { label: string; description?: string; children?: ReactNode; last?: boolean }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Text style={type.bodyStrong}>{label}</Text>
        {description ? <Text style={[type.caption, styles.desc]}>{description}</Text> : null}
      </View>
      {children}
      {!last ? <View style={styles.divider} /> : null}
    </View>
  );
}

function ToggleRow({ label, description, value, onChange, disabled, last }: { label: string; description?: string; value: boolean; onChange: (v: boolean) => void; disabled?: boolean; last?: boolean }) {
  // Native switch keeps platform accessibility; the whole row toggles it too.
  return (
    <Pressable onPress={disabled ? undefined : () => onChange(!value)} accessible={false}>
      <Row label={label} description={description} last={last}>
        <Switch
          value={value}
          onValueChange={onChange}
          disabled={disabled}
          accessibilityLabel={label}
          accessibilityHint={description}
          trackColor={{ false: colors.surface.pressed, true: alpha(keyTones.mint.bottom, disabled ? 0.45 : 1) }}
          thumbColor="#EEF4FF"
          ios_backgroundColor={colors.surface.pressed}
        />
      </Row>
    </Pressable>
  );
}

function PressRow({ label, description, onPress, destructive, last }: { label: string; description?: string; onPress: () => void; destructive?: boolean; last?: boolean }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} accessibilityHint={description} style={({ pressed }) => [pressed && styles.pressed]}>
      <View style={styles.row}>
        <View style={styles.rowText}>
          <Text style={[type.bodyStrong, destructive && { color: colors.state.destructive }]}>{label}</Text>
          {description ? <Text style={[type.caption, styles.desc]}>{description}</Text> : null}
        </View>
        {!destructive ? <Icon name="chevronRight" size={18} color={colors.text.tertiary} /> : null}
        {!last ? <View style={styles.divider} /> : null}
      </View>
    </Pressable>
  );
}

function Segmented({ value, options, onChange }: { value: Language; options: { value: Language; label: string }[]; onChange: (v: Language) => void }) {
  return (
    <View style={styles.segmented} accessibilityRole="radiogroup">
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected, checked: selected }}
            accessibilityLabel={o.label}
            style={({ pressed }) => [styles.segment, selected && styles.segmentOn, pressed && !selected && styles.segmentPressed]}
          >
            <Text style={[styles.segmentText, selected && styles.segmentTextOn]} numberOfLines={1}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: space[2] },
  sectionLabel: { paddingHorizontal: space[1] },
  row: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: space[4], paddingHorizontal: space[4], paddingVertical: space[3] },
  rowText: { flex: 1, gap: 2 },
  desc: { color: colors.text.tertiary },
  value: { color: colors.text.secondary, fontVariant: ['tabular-nums'] },
  divider: { position: 'absolute', left: space[4], right: 0, bottom: 0, height: StyleSheet.hairlineWidth, backgroundColor: colors.border.default },
  pressed: { backgroundColor: alpha(colors.surface.pressed, 0.7) },
  segmented: { flexDirection: 'row', padding: 4, gap: 4, borderRadius: radius.control, backgroundColor: colors.background.base, borderWidth: 1, borderColor: colors.border.subtle },
  segment: { minHeight: 38, paddingHorizontal: space[3], borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  segmentOn: { backgroundColor: keyTones.mint.bottom, boxShadow: slab(3, keyTones.mint.depth) },
  segmentPressed: { backgroundColor: alpha(colors.surface.pressed, 0.5) },
  segmentText: { fontFamily: fonts.displayBold, fontSize: 12, color: colors.text.tertiary },
  segmentTextOn: { color: keyTones.mint.text },
});
