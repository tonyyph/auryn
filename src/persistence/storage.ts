import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session, Stats } from '../engine';
import {
  parseOnboarding,
  parseSession,
  parseSettings,
  parseStats,
  unwrap,
  wrap,
  type Language,
  type Onboarding,
  type Settings,
} from './schema';
import { createWriter, type Writer } from './writer';

export const KEYS = {
  session: 'auryn.session',
  stats: 'auryn.stats',
  settings: 'auryn.settings',
  onboarding: 'auryn.onboarding',
} as const;

export interface Saved {
  session: Session | null;
  stats: Stats;
  settings: Settings;
  onboarding: Onboarding;
  /** True when no settings had been saved yet (first launch). */
  firstLaunch: boolean;
}

export async function loadAll(fallbackLanguage: Language): Promise<Saved> {
  let raw: readonly (readonly [string, string | null])[] = [];
  try {
    raw = await AsyncStorage.multiGet(Object.values(KEYS));
  } catch {
    raw = [];
  }
  const get = (k: string) => raw.find(([key]) => key === k)?.[1] ?? null;
  const settingsRaw = get(KEYS.settings);
  return {
    session: parseSession(unwrap(get(KEYS.session))),
    stats: parseStats(unwrap(get(KEYS.stats))),
    settings: parseSettings(unwrap(settingsRaw), fallbackLanguage),
    onboarding: parseOnboarding(unwrap(get(KEYS.onboarding))),
    firstLaunch: settingsRaw === null,
  };
}

const writerFor = <T>(key: string): Writer<T> =>
  createWriter<T>((s) => AsyncStorage.setItem(key, s), wrap);

export const writers = {
  session: writerFor<Session>(KEYS.session),
  stats: writerFor<Stats>(KEYS.stats),
  settings: writerFor<Settings>(KEYS.settings),
  onboarding: writerFor<Onboarding>(KEYS.onboarding),
};

export const flushAll = () => Promise.all(Object.values(writers).map((w) => w.flush())).then(() => undefined);
