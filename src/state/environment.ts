import { useEffect } from 'react';
import { AccessibilityInfo, AppState } from 'react-native';
import { create } from 'zustand';
import { useAppStore } from './appStore';

interface Environment {
  /** The OS asks for reduced motion. The app can never switch motion back on over this. */
  systemReduceMotion: boolean;
  /** App is in the foreground. Ambient animation and sound stop when false. */
  active: boolean;
  /** Bumped to play the one-shot aurora flare (2048). */
  flare: number;
}

export const useEnvironment = create<Environment>()(() => ({
  systemReduceMotion: false,
  active: AppState.currentState !== 'background' && AppState.currentState !== 'inactive',
  flare: 0,
}));

export const triggerFlare = () => useEnvironment.setState((s) => ({ flare: s.flare + 1 }));

/** Effective reduce-motion: system OR the player's own preference. */
export function useReduceMotion(): boolean {
  const system = useEnvironment((s) => s.systemReduceMotion);
  const own = useAppStore((s) => s.settings.reduceMotion);
  return system || own;
}

export const reduceMotionNow = () =>
  useEnvironment.getState().systemReduceMotion || useAppStore.getState().settings.reduceMotion;

/** Mount once at the root. */
export function useEnvironmentListeners(onBackground: () => void) {
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => useEnvironment.setState({ systemReduceMotion: v }))
      .catch(() => {});
    const rm = AccessibilityInfo.addEventListener('reduceMotionChanged', (v) =>
      useEnvironment.setState({ systemReduceMotion: v }),
    );
    const app = AppState.addEventListener('change', (state) => {
      const active = state === 'active';
      useEnvironment.setState({ active });
      if (!active) onBackground();
    });
    return () => {
      rm.remove();
      app.remove();
    };
  }, [onBackground]);
}
