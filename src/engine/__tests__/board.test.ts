import {
  boardFromValues,
  boardValues,
  canMove,
  emptyCells,
  isGameOver,
  maxTile,
  move,
  newBoard,
  scriptedRng,
  seededRng,
  slide,
  spawnTile,
  type Board,
  type Direction,
} from '..';

const left = (row: number[]) => boardValues(slideBoard([row, [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]], 'left'))[0];

function slideBoard(values: number[][], direction: Direction): Board {
  const board = boardFromValues(values);
  const s = slide(board, direction);
  return { ...board, tiles: s.tiles };
}

describe('slide — required examples (left)', () => {
  it.each([
    [[2, 2, 2, 2], [4, 4, 0, 0]],
    [[2, 2, 4, 0], [4, 4, 0, 0]],
    [[4, 4, 4, 0], [8, 4, 0, 0]],
    [[2, 0, 2, 2], [4, 2, 0, 0]],
  ])('%j → %j', (input, expected) => {
    expect(left(input)).toEqual(expected);
  });

  it('slides across gaps without merging different values', () => {
    expect(left([0, 2, 0, 4])).toEqual([2, 4, 0, 0]);
    expect(left([2, 4, 2, 4])).toEqual([2, 4, 2, 4]);
    expect(left([8, 8, 16, 16])).toEqual([16, 32, 0, 0]);
  });
});

describe('slide — four directions', () => {
  const values = [
    [2, 0, 2, 4],
    [0, 4, 0, 4],
    [2, 4, 8, 8],
    [2, 0, 0, 2],
  ];

  it('left', () => {
    expect(boardValues(slideBoard(values, 'left'))).toEqual([
      [4, 4, 0, 0],
      [8, 0, 0, 0],
      [2, 4, 16, 0],
      [4, 0, 0, 0],
    ]);
  });

  it('right', () => {
    expect(boardValues(slideBoard(values, 'right'))).toEqual([
      [0, 0, 4, 4],
      [0, 0, 0, 8],
      [0, 2, 4, 16],
      [0, 0, 0, 4],
    ]);
  });

  it('up', () => {
    expect(boardValues(slideBoard(values, 'up'))).toEqual([
      [4, 8, 2, 8],
      [2, 0, 8, 8],
      [0, 0, 0, 2],
      [0, 0, 0, 0],
    ]);
  });

  it('down', () => {
    expect(boardValues(slideBoard(values, 'down'))).toEqual([
      [0, 0, 0, 0],
      [0, 0, 0, 8],
      [2, 0, 2, 8],
      [4, 8, 8, 2],
    ]);
  });

  it('right on [2,2,2,2] merges from the leading edge', () => {
    const b = slideBoard([[2, 2, 2, 2], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]], 'right');
    expect(boardValues(b)[0]).toEqual([0, 0, 4, 4]);
  });

  it('down on a column of [4,4,8,0] keeps the 8 unmerged', () => {
    const b = slideBoard(
      [
        [4, 0, 0, 0],
        [4, 0, 0, 0],
        [8, 0, 0, 0],
        [0, 0, 0, 0],
      ],
      'down',
    );
    expect(boardValues(b).map((r) => r[0])).toEqual([0, 0, 8, 8]);
  });
});

describe('merge rules', () => {
  it('a tile merges at most once per move', () => {
    // 4,4,8 must not become 16 in one move
    expect(left([4, 4, 8, 0])).toEqual([8, 8, 0, 0]);
    expect(left([2, 2, 4, 8])).toEqual([4, 4, 8, 0]);
  });

  it('reports merges with stable survivor ids and score gained', () => {
    const board = boardFromValues([
      [2, 2, 2, 2],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    const s = slide(board, 'left');
    expect(s.merges).toEqual([
      { survivorId: 1, consumedId: 2, value: 4, at: { row: 0, col: 0 } },
      { survivorId: 3, consumedId: 4, value: 4, at: { row: 0, col: 1 } },
    ]);
    expect(s.scoreGained).toBe(8);
    // Survivor ids are kept; consumed ids disappear
    expect(s.tiles.map((t) => t.id).sort()).toEqual([1, 3]);
    // Every source tile has a motion, including consumed ones
    expect(s.motions.map((m) => m.id).sort()).toEqual([1, 2, 3, 4]);
    expect(s.motions.find((m) => m.id === 4)?.to).toEqual({ row: 0, col: 1 });
  });

  it('score equals the sum of the tiles created by merges', () => {
    const board = boardFromValues([
      [8, 8, 16, 16],
      [2, 2, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    const r = move(board, 'left', seededRng(1));
    expect(r.scoreGained).toBe(16 + 32 + 4);
    expect(r.after.score).toBe(52);
  });
});

describe('move', () => {
  it('invalid move: no spawn, no score, no move counted, same board object', () => {
    const board = boardFromValues([
      [2, 4, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    const r = move(board, 'left', seededRng(3));
    expect(r.changed).toBe(false);
    expect(r.after).toBe(board);
    expect(r.spawned).toBeNull();
    expect(r.after.moves).toBe(0);
    expect(r.scoreGained).toBe(0);
  });

  it('valid move spawns exactly one tile in an empty cell with a fresh id', () => {
    const board = boardFromValues([
      [2, 0, 0, 2],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    const r = move(board, 'left', seededRng(7));
    expect(r.changed).toBe(true);
    expect(r.after.tiles).toHaveLength(2);
    expect(r.spawned).not.toBeNull();
    const spawned = r.spawned!;
    expect(spawned.id).toBe(board.nextId);
    expect(r.after.nextId).toBe(board.nextId + 1);
    expect(spawned.row === 0 && spawned.col === 0).toBe(false);
    expect(r.after.moves).toBe(1);
  });

  it('spawns only into empty cells, across many random games', () => {
    const rng = seededRng(42);
    let board = newBoard(rng);
    const dirs: Direction[] = ['left', 'up', 'right', 'down'];
    for (let i = 0; i < 2000 && canMove(board); i++) {
      const r = move(board, dirs[Math.floor(rng() * 4)], rng);
      if (r.spawned) {
        const occupied = r.after.tiles.filter(
          (t) => t.row === r.spawned!.row && t.col === r.spawned!.col,
        );
        expect(occupied).toHaveLength(1);
        expect([2, 4]).toContain(r.spawned.value);
      }
      const ids = r.after.tiles.map((t) => t.id);
      expect(new Set(ids).size).toBe(ids.length);
      const cells = r.after.tiles.map((t) => t.row * 4 + t.col);
      expect(new Set(cells).size).toBe(cells.length);
      board = r.after;
    }
  });
});

describe('spawn', () => {
  it('uses 2 below the 10% threshold and 4 at or above it', () => {
    const board = boardFromValues([[0, 0], [0, 0]]);
    expect(spawnTile(board, scriptedRng([0, 0.5]))!.tile.value).toBe(2);
    expect(spawnTile(board, scriptedRng([0, 0.05]))!.tile.value).toBe(4);
  });

  it('picks the empty cell indexed by the rng', () => {
    const board = boardFromValues([
      [2, 0],
      [0, 0],
    ]);
    // empties in order: (0,1) (1,0) (1,1); 0.99 → last
    const s = spawnTile(board, scriptedRng([0.99, 0.5]))!;
    expect([s.tile.row, s.tile.col]).toEqual([1, 1]);
  });

  it('returns null on a full board', () => {
    expect(spawnTile(boardFromValues([[2, 4], [8, 16]]), seededRng(1))).toBeNull();
  });

  it('roughly 10% of spawns are 4s', () => {
    const rng = seededRng(99);
    let fours = 0;
    const n = 20000;
    for (let i = 0; i < n; i++) if (spawnTile(boardFromValues([[0]]), rng)!.tile.value === 4) fours++;
    expect(fours / n).toBeGreaterThan(0.09);
    expect(fours / n).toBeLessThan(0.11);
  });
});

describe('newBoard', () => {
  it('starts with two tiles in different cells', () => {
    for (let seed = 0; seed < 200; seed++) {
      const b = newBoard(seededRng(seed));
      expect(b.tiles).toHaveLength(2);
      expect([b.tiles[0].row, b.tiles[0].col]).not.toEqual([b.tiles[1].row, b.tiles[1].col]);
      expect(b.score).toBe(0);
      expect(b.moves).toBe(0);
      expect(emptyCells(b)).toHaveLength(14);
    }
  });

  it('is deterministic with a seeded rng', () => {
    expect(newBoard(seededRng(5))).toEqual(newBoard(seededRng(5)));
  });
});

describe('game over', () => {
  it('full board with an adjacent pair is not game over', () => {
    const horizontalPair = boardFromValues([
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [4, 2, 8, 8],
    ]);
    expect(isGameOver(horizontalPair)).toBe(false);
    const verticalPair = boardFromValues([
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 16],
      [4, 2, 8, 16],
    ]);
    expect(isGameOver(verticalPair)).toBe(false);
  });

  it('full board with no adjacent pair is game over', () => {
    const b = boardFromValues([
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [4, 2, 4, 2],
    ]);
    expect(isGameOver(b)).toBe(true);
    for (const d of ['up', 'down', 'left', 'right'] as const) expect(move(b, d, seededRng(1)).changed).toBe(false);
  });

  it('board with an empty cell is never game over', () => {
    expect(
      isGameOver(
        boardFromValues([
          [2, 4, 2, 4],
          [4, 2, 4, 2],
          [2, 4, 2, 4],
          [4, 2, 4, 0],
        ]),
      ),
    ).toBe(false);
  });

  it('maxTile', () => {
    expect(maxTile(boardFromValues([[2, 2048], [16, 0]]))).toBe(2048);
  });
});
