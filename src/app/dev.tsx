import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';
import { emptyStats, scriptedRng } from '../engine';
import { PRESETS } from '../dev/presets';
import { setRng, useAppStore } from '../state/appStore';

/**
 * Development deep links for simulator checks, e.g.
 *   auryn://dev?preset=nearWin&moves=left
 *   auryn://dev?screen=settings&lang=vi
 *   auryn://dev?reset=stats&screen=stats
 * Production builds redirect home without reading any parameter.
 */
export default function Dev() {
  if (!__DEV__) return <Redirect href="/" />;
  return <DevLink />;
}

function DevLink() {
  const p = useLocalSearchParams<{ preset?: string; screen?: string; lang?: string; moves?: string; reset?: string; pad?: string; rm?: string; seed?: string; burst?: string; undo?: string }>();
  useEffect(() => {
    const s = useAppStore.getState();
    if (p.lang === 'en' || p.lang === 'vi') s.updateSettings({ language: p.lang });
    if (p.pad) s.updateSettings({ directionPad: p.pad === '1' });
    if (p.rm) s.updateSettings({ reduceMotion: p.rm === '1' });
    if (p.reset === 'stats') useAppStore.setState({ stats: emptyStats(), onboarding: { hintMoves: 0 } });
    if (p.seed) setRng(scriptedRng([0, 0.5]));
    const preset = p.preset ? PRESETS[p.preset] : undefined;
    if (preset) s.loadSession(preset.session, preset.stats);
    if (p.preset === 'new') s.newGame();
    const screen = p.screen ?? (preset || p.preset === 'new' ? 'game' : undefined);
    const target = screen === 'help' ? '/game?help=1' : screen === 'game' ? '/game' : screen === 'stats' ? '/stats' : screen === 'settings' ? '/settings' : screen === 'preview' ? '/preview' : '/';
    router.replace(target);
    if (p.moves && target.startsWith('/game')) {
      // Moves are fed through the store after the board mounts, spaced like quick swipes.
      const list = p.moves.split(',') as ('up' | 'down' | 'left' | 'right')[];
      list.forEach((d, i) => setTimeout(() => useAppStore.getState().move(d), 700 + i * (p.burst ? 40 : 260)));
      // undo=1: undo 50 ms after the last move, i.e. in the middle of its slide.
      if (p.undo) setTimeout(() => useAppStore.getState().undo(), 700 + (list.length - 1) * (p.burst ? 40 : 260) + 50);
    }
  }, [p.preset, p.screen, p.lang, p.moves, p.reset, p.pad, p.rm, p.seed, p.burst, p.undo]);
  return <View />;
}
