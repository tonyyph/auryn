import { isGameOver, maxTile, playMove, seededRng } from '../../engine';
import { PRESETS } from '../presets';

/** The store-capture presets must replay the simulated game exactly from their rng state. */
describe('store capture presets', () => {
  const load = (name: string) => {
    const p = PRESETS[name];
    if (!p?.stats || p.rng === undefined) throw new Error(`missing ${name}`);
    return { session: p.session, stats: { bestScore: 0, gamesFinished: 0, gamesReached2048: 0, largestTile: 0, totalMoves: 0, ...p.stats }, rng: seededRng(p.rng) };
  };

  it('nearWin: one swipe left merges 1024 + 1024 into 2048', () => {
    const { session, stats, rng } = load('store-nearWin');
    const out = playMove(session, stats, 'left', rng);
    expect(out.celebrate).toBe(true);
    expect(maxTile(out.session.board)).toBe(2048);
  });

  it('nearOver: the planned spawn ends the game and Undo is available', () => {
    const { session, stats, rng } = load('store-nearOver');
    const out = playMove(session, stats, 'left', rng);
    expect(isGameOver(out.session.board)).toBe(true);
    expect(out.session.undo).not.toBeNull();
  });

  it('combo: one swipe up resolves three merges', () => {
    const { session, stats, rng } = load('store-combo');
    expect(playMove(session, stats, 'up', rng).result.merges).toHaveLength(3);
  });

  it('stats stay consistent with the board', () => {
    for (const [name, p] of Object.entries(PRESETS)) {
      if (!name.startsWith('store-') || !p.stats) continue;
      expect(p.stats.bestScore).toBeGreaterThanOrEqual(p.session.board.score);
      expect(p.stats.largestTile).toBeGreaterThanOrEqual(maxTile(p.session.board));
      expect(p.stats.totalMoves).toBeGreaterThanOrEqual(p.session.board.moves);
    }
  });
});
