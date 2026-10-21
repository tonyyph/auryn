import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { useAppStore } from '../state/appStore';

/**
 * Sound and haptics. Everything is fire-and-forget: a failure here must never touch
 * gameplay. Players are created once and reused (seek to 0, play), so taps never wait
 * on loading. No background music, no recording, no microphone permission.
 */
const SOURCES = {
  slide: require('../../assets/sounds/slide.wav'),
  merge1: require('../../assets/sounds/merge1.wav'),
  merge2: require('../../assets/sounds/merge2.wav'),
  merge3: require('../../assets/sounds/merge3.wav'),
  merge4: require('../../assets/sounds/merge4.wav'),
  merge5: require('../../assets/sounds/merge5.wav'),
  milestone: require('../../assets/sounds/milestone.wav'),
  gameover: require('../../assets/sounds/gameover.wav'),
  tap: require('../../assets/sounds/tap.wav'),
} as const;

type SoundName = keyof typeof SOURCES;

const VOLUME: Record<SoundName, number> = {
  slide: 0.35,
  merge1: 0.5,
  merge2: 0.5,
  merge3: 0.52,
  merge4: 0.54,
  merge5: 0.56,
  milestone: 0.6,
  gameover: 0.5,
  tap: 0.4,
};

const players = new Map<SoundName, AudioPlayer>();
let ready = false;

export async function initFeedback() {
  if (ready) return;
  ready = true;
  try {
    // Respect the silent switch and let the player's own music keep playing.
    await setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers', shouldPlayInBackground: false });
  } catch {
    // ignore: default audio mode is acceptable
  }
  for (const name of Object.keys(SOURCES) as SoundName[]) {
    try {
      const p = createAudioPlayer(SOURCES[name]);
      p.volume = VOLUME[name];
      players.set(name, p);
    } catch {
      // A missing player just means silence for that sound.
    }
  }
}

function play(name: SoundName) {
  if (!useAppStore.getState().settings.sound) return;
  const p = players.get(name);
  if (!p) return;
  try {
    p.seekTo(0);
    p.play();
  } catch {
    // ignore
  }
}

/** Stops anything still ringing (app going to background). */
export function stopAllSounds() {
  for (const p of players.values()) {
    try {
      p.pause();
    } catch {
      // ignore
    }
  }
}

function haptic(kind: 'light' | 'success' | 'selection') {
  if (!useAppStore.getState().settings.haptics || Platform.OS === 'web') return;
  const run =
    kind === 'light'
      ? Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      : kind === 'success'
        ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        : Haptics.selectionAsync();
  run.catch(() => {});
}

/** Which merge bell to ring: higher tiles ring higher, capped at the top of the scale. */
export function mergeSoundFor(value: number): SoundName {
  const step = Math.log2(value); // 4 → 2, 2048 → 11
  const idx = step <= 3 ? 1 : step <= 5 ? 2 : step <= 7 ? 3 : step <= 9 ? 4 : 5;
  return `merge${idx}` as SoundName;
}

export const feedback = {
  /** One call per valid move, however many merges it had: one sound, at most one haptic. */
  turn(highestMerge: number) {
    if (highestMerge > 0) {
      play(mergeSoundFor(highestMerge));
      haptic('light');
    } else {
      play('slide');
    }
  },
  milestone() {
    play('milestone');
    haptic('success');
  },
  gameOver() {
    play('gameover');
  },
  tap() {
    play('tap');
    haptic('selection');
  },
};
