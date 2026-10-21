import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStrings } from '../i18n';
import { colors, space, type } from '../theme';
import { IconButton } from './primitives';

/** Secondary screens: back, a title, scrolling content, safe areas respected. */
export function ScreenShell({ title, children }: { title: string; children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const t = useStrings();
  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.bar}>
        <IconButton icon="back" label={t.a11y.back} onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
      </View>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + space[10] }]} showsVerticalScrollIndicator={false}>
        <Text style={[type.screenTitle, styles.title]} accessibilityRole="header">
          {title}
        </Text>
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  bar: { height: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: space[5] },
  content: { paddingHorizontal: space[5], gap: space[5], maxWidth: 560, width: '100%', alignSelf: 'center' },
  title: { marginTop: space[2], color: colors.text.primary },
});
