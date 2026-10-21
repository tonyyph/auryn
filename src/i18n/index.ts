import { getLocales } from 'expo-localization';
import type { Language } from '../persistence/schema';
import { useAppStore } from '../state/appStore';
import { en, type Strings } from './en';
import { vi } from './vi';

export type { Strings };

const TABLES: Record<Language, Strings> = { en, vi };

export const strings = (lang: Language) => TABLES[lang];

export function deviceLanguage(): Language {
  try {
    return getLocales().some((l) => l.languageCode === 'vi') ? 'vi' : 'en';
  } catch {
    return 'en';
  }
}

export function useStrings(): Strings {
  return TABLES[useAppStore((s) => s.settings.language)];
}

export function useLanguage(): Language {
  return useAppStore((s) => s.settings.language);
}

/** Grouped number formatting that does not depend on the device's Intl support. */
export function formatNumber(n: number, lang: Language): string {
  const sep = lang === 'vi' ? '.' : ',';
  return String(Math.trunc(n)).replace(/\B(?=(\d{3})+(?!\d))/g, sep);
}
