import { ladderSteps } from '../ladder';

describe('tile ladder', () => {
  it('starts at 2 → 16 while the board is small', () => {
    expect(ladderSteps(2)).toEqual([2, 4, 8, 16]);
    expect(ladderSteps(4)).toEqual([2, 4, 8, 16]);
    expect(ladderSteps(8)).toEqual([2, 4, 8, 16]);
  });

  it('centres on the top tile with the next goal last', () => {
    expect(ladderSteps(512)).toEqual([128, 256, 512, 1024]);
    expect(ladderSteps(2048)).toEqual([512, 1024, 2048, 4096]);
  });
});
