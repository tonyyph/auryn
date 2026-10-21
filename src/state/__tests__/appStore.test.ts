import AsyncStorage from '@react-native-async-storage/async-storage';
import { boardFromValues, emptyStats, scriptedRng, seededRng, type Session } from '../../engine';
import { unwrap, wrap } from '../../persistence/schema';
import { flushAll, KEYS } from '../../persistence/storage';
import { setRng, useAppStore } from '../appStore';

const session = (values: number[][], extra: Partial<Session> = {}, board: { score?: number; moves?: number } = {}): Session => ({
  gameId: 'it',
  board: boardFromValues(values, board),
  undo: null,
  celebrated: false,
  finishCounted: false,
  winCounted: false,
  bestAtStart: 0,
  ...extra,
});

async function freshStore() {
  await AsyncStorage.clear();
  await useAppStore.getState().hydrate('en');
}

beforeEach(async () => {
  setRng(seededRng(1));
  await freshStore();
});

it('hydrates a new game on first launch and saves it', async () => {
  const s = useAppStore.getState();
  expect(s.hydrated).toBe(true);
  expect(s.session.board.tiles).toHaveLength(2);
  await flushAll();
  expect(unwrap(await AsyncStorage.getItem(KEYS.session))).toEqual(JSON.parse(JSON.stringify(s.session)));
});

it('game over → undo → play on → game over does not double count; persisted stats match', async () => {
  setRng(scriptedRng([0, 0.5]));
  const nearOver = session(
    [
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [0, 4, 2, 8],
    ],
    {},
    { score: 300, moves: 40 },
  );
  useAppStore.getState().loadSession(nearOver, emptyStats());
  expect(useAppStore.getState().move('left').changed).toBe(true);
  expect(useAppStore.getState().stats.gamesFinished).toBe(1);
  useAppStore.getState().undo();
  useAppStore.getState().move('left');
  expect(useAppStore.getState().stats.gamesFinished).toBe(1);
  useAppStore.getState().newGame();
  expect(useAppStore.getState().stats.gamesFinished).toBe(1);
  await flushAll();
  expect(unwrap(await AsyncStorage.getItem(KEYS.stats))).toMatchObject({ gamesFinished: 1 });
});

it('2048 sets winPending once; a restored celebrated game does not re-celebrate', async () => {
  useAppStore.getState().loadSession(session([[1024, 1024, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]));
  useAppStore.getState().move('left');
  expect(useAppStore.getState().winPending).toBe(true);
  useAppStore.getState().dismissWin();
  useAppStore.getState().move('right');
  expect(useAppStore.getState().winPending).toBe(false);
  await flushAll();

  // relaunch
  await useAppStore.getState().hydrate('en');
  const s = useAppStore.getState();
  expect(s.session.celebrated).toBe(true);
  expect(s.winPending).toBe(false);
  expect(s.stats.gamesReached2048).toBe(1);
});

it('invalid swipe changes nothing: no transition, no save, undo intact', () => {
  useAppStore.getState().loadSession(session([[2, 4, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]));
  const before = useAppStore.getState();
  expect(before.move('left').changed).toBe(false);
  const after = useAppStore.getState();
  expect(after.session).toBe(before.session);
  expect(after.transition).toBe(before.transition);
});

it('swipe hint counts only valid moves and retires', () => {
  useAppStore.getState().loadSession(session([[2, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]));
  for (const d of ['right', 'left', 'right', 'left', 'down'] as const) useAppStore.getState().move(d);
  expect(useAppStore.getState().onboarding.hintMoves).toBe(3);
});

it('corrupt saved game falls back to a fresh one', async () => {
  await AsyncStorage.setItem(KEYS.session, wrap({ gameId: 'x', board: { size: 4, tiles: 'oops' } }));
  await useAppStore.getState().hydrate('en');
  expect(useAppStore.getState().session.board.tiles).toHaveLength(2);
});

it('settings persist', async () => {
  useAppStore.getState().updateSettings({ sound: false, language: 'vi' });
  await flushAll();
  expect(unwrap(await AsyncStorage.getItem(KEYS.settings))).toMatchObject({ sound: false, language: 'vi' });
});
