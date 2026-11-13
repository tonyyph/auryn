import { Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold, useFonts } from '@expo-google-fonts/manrope';
import { Unbounded_500Medium, Unbounded_700Bold, Unbounded_900Black } from '@expo-google-fonts/unbounded';
import { DarkTheme, Stack, ThemeProvider, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuroraBackground } from '../components/AuroraBackground';
import { ScreenFade } from '../components/ScreenFade';
import { initFeedback, stopAllSounds } from '../feedback/feedback';
import { deviceLanguage } from '../i18n';
import { flushAll } from '../persistence/storage';
import { useAppStore } from '../state/appStore';
import { useEnvironmentListeners, useReduceMotion } from '../state/environment';
import { colors } from '../theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

// Navigation surfaces stay transparent so the one shared aurora shows through every screen.
const theme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: 'transparent', card: colors.background.base, primary: colors.aurora.mint, text: colors.text.primary, border: colors.border.subtle },
};

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
    Unbounded_500Medium,
    Unbounded_700Bold,
    Unbounded_900Black,
  });
  const hydrated = useAppStore((s) => s.hydrated);
  const [hydrateFailed, setHydrateFailed] = useState(false);
  const reduceMotion = useReduceMotion();
  const pathname = usePathname();

  useEffect(() => {
    useAppStore
      .getState()
      .hydrate(deviceLanguage())
      .catch(() => setHydrateFailed(true));
    initFeedback().catch(() => {});
  }, []);

  // Saves are written continuously; backgrounding only forces the queue out early.
  const onBackground = useCallback(() => {
    stopAllSounds();
    flushAll().catch(() => {});
  }, []);
  useEnvironmentListeners(onBackground);

  // Local data loads in a few ms; keep the native splash up instead of flashing a spinner.
  const ready = (fontsLoaded || !!fontError) && (hydrated || hydrateFailed);
  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ThemeProvider value={theme}>
        <StatusBar style="light" />
        <AuroraBackground calm={pathname === '/game'} />
        {ready ? (
          <Stack
            screenLayout={({ children }) => <ScreenFade>{children}</ScreenFade>}
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: 'transparent' },
              animation: reduceMotion ? 'fade' : 'fade_from_bottom',
              animationDuration: 260,
              gestureEnabled: true,
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="game" options={{ gestureEnabled: false }} />
            <Stack.Screen name="stats" />
            <Stack.Screen name="settings" />
            <Stack.Screen name="dev" options={{ animation: 'none' }} />
            <Stack.Screen name="preview" />
          </Stack>
        ) : (
          <View style={styles.root} />
        )}
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background.base },
});
