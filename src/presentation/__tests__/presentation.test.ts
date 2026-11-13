import { boardFromValues, move, scriptedRng, type Direction } from '../../engine';
import { motionFrame, resolvedFrame, settledFrame } from '../frames';
import { TurnController } from '../turnController';

describe('frames', () => {
  const board = boardFromValues([
    [2, 2, 4, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ]);
  const result = move(board, 'left', scriptedRng([0, 0.5]));

  it('motion frame keeps old values, consumed tiles under survivors, schedules the resolve', () => {
    const f = motionFrame(result, 7);
    expect(f.tiles.map((t) => t.id).sort()).toEqual([1, 2, 3, result.spawned!.id].sort());
    const consumed = f.tiles.find((t) => t.id === 2)!;
    expect(consumed.under).toBe(true);
    expect(consumed.cell).toEqual({ row: 0, col: 0 });
    expect(f.tiles[0].id).toBe(2); // drawn first
    // Survivor shows its old value now, with the doubled one and the pulse queued.
    expect(f.tiles.find((t) => t.id === 1)).toMatchObject({ value: 2, next: 4, pulse: 7 });
    expect(f.tiles.find((t) => t.id === 3)).toMatchObject({ value: 4, pulse: 0 });
    expect(f.tiles.find((t) => t.id === 3)!.next).toBeUndefined();
    // The spawn is mounted now (it fades in at the resolve moment), drawn on top.
    expect(f.tiles.filter((t) => t.spawn).map((t) => t.id)).toEqual([result.spawned!.id]);
    expect(f.tiles[f.tiles.length - 1].id).toBe(result.spawned!.id);
  });

  it('resolve changes nothing that is already animating: same pulse key, same spawn', () => {
    const m = motionFrame(result, 7);
    const r = resolvedFrame(result, 7);
    for (const t of r.tiles) {
      const before = m.tiles.find((x) => x.id === t.id)!;
      expect(before.pulse).toBe(t.pulse);
      expect(before.spawn).toBe(t.spawn);
      expect(before.next ?? before.value).toBe(t.value);
    }
  });

  it('resolved frame has no ghosts, doubled survivor pulses, spawn flagged', () => {
    const f = resolvedFrame(result, 7);
    const ids = f.tiles.map((t) => t.id);
    expect(ids).not.toContain(2);
    expect(new Set(ids).size).toBe(ids.length);
    expect(f.tiles.find((t) => t.id === 1)).toMatchObject({ value: 4, pulse: 7, cell: { row: 0, col: 0 } });
    expect(f.tiles.find((t) => t.id === 3)).toMatchObject({ value: 4, pulse: 0, cell: { row: 0, col: 1 } });
    expect(f.tiles.filter((t) => t.spawn).map((t) => t.id)).toEqual([result.spawned!.id]);
    // Resolved frame equals the committed board
    expect(f).toEqual(
      settledFrame(result.after, {
        pulseIds: new Set([1]),
        pulseKey: 7,
        spawnIds: new Set([result.spawned!.id]),
      }),
    );
  });

  it('every surviving tile ends the motion phase where it rests in the resolved frame', () => {
    const m = motionFrame(result, 1);
    const r = resolvedFrame(result, 1);
    for (const t of r.tiles.filter((x) => !x.spawn)) {
      expect(m.tiles.find((x) => x.id === t.id)!.cell).toEqual(t.cell);
    }
  });
});

describe('TurnController', () => {
  function setup(valid = true) {
    const commits: { dir: Direction; seq: number }[] = [];
    const c = new TurnController((dir, seq) => {
      commits.push({ dir, seq });
      return valid;
    });
    return { c, commits };
  }

  it('commits immediately when idle', () => {
    const { c, commits } = setup();
    c.input('left');
    expect(commits).toHaveLength(1);
    expect(c.isAnimating).toBe(true);
  });

  it('buffers at most one direction while animating; the newest wins', () => {
    const { c, commits } = setup();
    c.input('left');
    c.input('up');
    c.input('right');
    c.input('down');
    expect(commits).toHaveLength(1);
    expect(c.pending).toBe('down');
    c.motionDone(commits[0].seq);
    expect(commits.map((x) => x.dir)).toEqual(['left', 'down']);
    c.motionDone(commits[1].seq);
    expect(c.isAnimating).toBe(false);
    expect(c.pending).toBeNull();
  });

  it('a rapid burst of swipes never queues more than one extra move', () => {
    const { c, commits } = setup();
    for (let i = 0; i < 50; i++) c.input(i % 2 ? 'left' : 'right');
    expect(commits).toHaveLength(1);
    c.motionDone(commits[0].seq);
    expect(commits).toHaveLength(2);
  });

  it('interrupt drops the buffer and ignores the stale completion', () => {
    const { c, commits } = setup();
    c.input('left');
    c.input('up');
    const stale = commits[0].seq;
    c.interrupt();
    expect(c.pending).toBeNull();
    expect(c.isAnimating).toBe(false);
    c.motionDone(stale);
    expect(commits).toHaveLength(1);
    c.input('right');
    expect(commits).toHaveLength(2);
  });

  it('invalid moves do not start an animation and so do not block input', () => {
    const { c, commits } = setup(false);
    c.input('left');
    c.input('left');
    expect(commits).toHaveLength(2);
    expect(c.isAnimating).toBe(false);
  });
});
