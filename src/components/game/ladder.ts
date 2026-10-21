/** The four rungs around the run's top tile: two cleared, the current one, the next goal. */
export function ladderSteps(top: number): number[] {
  const cur = Math.max(top, 8);
  return [cur / 4, cur / 2, cur, cur * 2];
}
