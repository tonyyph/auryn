import AsyncStorage from '@react-native-async-storage/async-storage';
import { boardFromValues, emptyStats, newSession, seededRng } from '../../engine';
import { parseBoard, parseSession, parseSettings, parseStats, unwrap, wrap } from '../schema';
import { KEYS, loadAll } from '../storage';
import { createWriter } from '../writer';

describe('writer', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('debounces and writes only the latest value', async () => {
    const writes: string[] = [];
    const w = createWriter<number>(async (s) => void writes.push(s), String, 100);
    w.save(1);
    w.save(2);
    w.save(3);
    jest.advanceTimersByTime(100);
    await w.flush();
    expect(writes).toEqual(['3']);
  });

  it('never lets an older snapshot land after a newer one', async () => {
    const writes: string[] = [];
    let release: () => void = () => {};
    const slow = (s: string) =>
      new Promise<void>((res) => {
        release = () => {
          writes.push(s);
          res();
        };
      });
    const w = createWriter<string>(slow, (x) => x, 0);
    w.save('a');
    const first = w.flush(); // 'a' in flight
    w.save('b');
    w.save('c'); // arrives while 'a' is in flight
    release(); // finish 'a'
    await Promise.resolve();
    await Promise.resolve();
    release(); // finish 'c'
    await first;
    await w.flush();
    expect(writes).toEqual(['a', 'c']);
  });

  it('flush writes immediately without waiting for the debounce', async () => {
    const writes: string[] = [];
    const w = createWriter<number>(async (s) => void writes.push(s), String, 10_000);
    w.save(9);
    await w.flush();
    expect(writes).toEqual(['9']);
  });

  it('survives a failing write and retries with newer data', async () => {
    const writes: string[] = [];
    let fail = true;
    const w = createWriter<number>(
      async (s) => {
        if (fail) {
          fail = false;
          throw new Error('disk full');
        }
        writes.push(s);
      },
      String,
      0,
    );
    w.save(1);
    await w.flush();
    w.save(2);
    await w.flush();
    expect(writes).toEqual(['2']);
  });
});

describe('schema', () => {
  const good = newSession(seededRng(1), 'g1');

  it('round-trips a session', () => {
    expect(parseSession(unwrap(wrap(good)))).toEqual(good);
  });

  it('rejects other schema versions and garbage', () => {
    expect(unwrap(JSON.stringify({ v: 999, data: good }))).toBeUndefined();
    expect(unwrap('{not json')).toBeUndefined();
    expect(unwrap(null)).toBeUndefined();
  });

  it.each([
    ['overlapping tiles', { ...good.board, tiles: [{ id: 1, value: 2, row: 0, col: 0 }, { id: 2, value: 2, row: 0, col: 0 }], nextId: 3 }],
    ['duplicate ids', { ...good.board, tiles: [{ id: 1, value: 2, row: 0, col: 0 }, { id: 1, value: 2, row: 0, col: 1 }], nextId: 3 }],
    ['non power of two', { ...good.board, tiles: [{ id: 1, value: 3, row: 0, col: 0 }], nextId: 2 }],
    ['out of range', { ...good.board, tiles: [{ id: 1, value: 2, row: 4, col: 0 }], nextId: 2 }],
    ['id beyond nextId', { ...good.board, tiles: [{ id: 5, value: 2, row: 0, col: 0 }], nextId: 2 }],
    ['negative score', { ...good.board, score: -1 }],
    ['empty board', { ...good.board, tiles: [] }],
    ['wrong size', { ...good.board, size: 5 }],
  ])('rejects a board with %s', (_name, board) => {
    expect(parseBoard(board)).toBeNull();
    expect(parseSession({ ...good, board })).toBeNull();
  });

  it('drops only a corrupt undo snapshot', () => {
    const s = parseSession({ ...good, undo: { broken: true } });
    expect(s?.board).toEqual(good.board);
    expect(s?.undo).toBeNull();
  });

  it('keeps sticky flags as strict booleans', () => {
    const s = parseSession({ ...good, celebrated: 'yes', finishCounted: true });
    expect(s?.celebrated).toBe(false);
    expect(s?.finishCounted).toBe(true);
  });

  it('stats recover field by field', () => {
    expect(parseStats({ bestScore: 500, gamesFinished: -2, largestTile: 'big', totalMoves: 12.5 })).toEqual({
      ...emptyStats(),
      bestScore: 500,
    });
    expect(parseStats(undefined)).toEqual(emptyStats());
  });

  it('settings fall back per field', () => {
    expect(parseSettings({ sound: false, language: 'fr', haptics: 1 }, 'vi')).toEqual({
      sound: false,
      haptics: true,
      reduceMotion: false,
      directionPad: false,
      language: 'vi',
    });
  });
});

describe('loadAll', () => {
  beforeEach(() => AsyncStorage.clear());

  it('first launch: nothing saved', async () => {
    const s = await loadAll('en');
    expect(s.session).toBeNull();
    expect(s.firstLaunch).toBe(true);
    expect(s.stats).toEqual(emptyStats());
  });

  it('restores a saved game, including one that already reached 2048', async () => {
    const won = {
      ...newSession(seededRng(2), 'won'),
      board: boardFromValues([[2048, 4, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]], { score: 21000, moves: 900 }),
      celebrated: true,
      winCounted: true,
    };
    await AsyncStorage.setItem(KEYS.session, wrap(won));
    await AsyncStorage.setItem(KEYS.settings, wrap({ sound: false }));
    const s = await loadAll('en');
    expect(s.session).toEqual(won);
    expect(s.firstLaunch).toBe(false);
    expect(s.settings.sound).toBe(false);
  });

  it('corrupt data falls back safely', async () => {
    await AsyncStorage.setItem(KEYS.session, '{{{');
    await AsyncStorage.setItem(KEYS.stats, wrap('nope'));
    const s = await loadAll('vi');
    expect(s.session).toBeNull();
    expect(s.stats).toEqual(emptyStats());
    expect(s.settings.language).toBe('vi');
  });
});
