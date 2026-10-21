import { AccessibilityInfo } from 'react-native';
import { strings } from '../i18n';
import { useAppStore } from './appStore';

/** Tracks whether a screen reader is running, so turn announcements cost nothing otherwise. */
let enabled = false;
let started = false;

export function watchScreenReader() {
  if (started) return;
  started = true;
  AccessibilityInfo.isScreenReaderEnabled()
    .then((v) => (enabled = v))
    .catch(() => {});
  AccessibilityInfo.addEventListener('screenReaderChanged', (v) => (enabled = v));
}

/** Speaks a short status line when a screen reader is on. Each call replaces the previous one. */
export function announce(build: (t: ReturnType<typeof strings>) => string) {
  if (!enabled) return;
  AccessibilityInfo.announceForAccessibility(build(strings(useAppStore.getState().settings.language)));
}
