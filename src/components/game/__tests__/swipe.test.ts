import { directionFromPan } from '../swipe';

describe('directionFromPan', () => {
  it('ignores small touches', () => {
    expect(directionFromPan(8, 2, 0, 0, false)).toBeNull();
    expect(directionFromPan(8, 2, 100, 0, true)).toBeNull();
  });

  it('commits along the dominant axis once far enough', () => {
    expect(directionFromPan(30, 4, 0, 0, false)).toBe('right');
    expect(directionFromPan(-30, 4, 0, 0, false)).toBe('left');
    expect(directionFromPan(3, 30, 0, 0, false)).toBe('down');
    expect(directionFromPan(3, -30, 0, 0, false)).toBe('up');
  });

  it('waits on near-diagonals while dragging', () => {
    expect(directionFromPan(28, 26, 0, 0, false)).toBeNull();
  });

  it('accepts a fast short flick on release', () => {
    expect(directionFromPan(-12, 3, -900, 50, true)).toBe('left');
  });

  it('resolves a long diagonal on release by the dominant axis', () => {
    expect(directionFromPan(40, 36, 0, 0, true)).toBe('right');
  });
});
