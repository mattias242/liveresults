import { describe, it, expect } from 'vitest';
import {
  resultSorter,
  sortByDist,
  sortByDistAndSplitPlace,
  updateResultVirtualPosition,
  type RankResult,
  type ClassContext,
} from './ranking';

/**
 * Characterization tests locking the provisional-ranking behaviour ported from
 * the legacy LiveResults.ts. Hand-verified against the ported algorithm.
 */

function r(id: string, over: Partial<RankResult>): RankResult {
  return {
    id,
    place: '',
    status: 0,
    result: 0,
    progress: 0,
    start: '',
    splits: {},
    ...over,
  } as RankResult;
}

const order = (data: RankResult[]) => data.map((x) => x.id as string);

describe('resultSorter', () => {
  it('orders finished runners by status then result', () => {
    const a = r('A', { place: 1, status: 0, result: 6000 });
    const b = r('B', { place: 2, status: 0, result: 6100 });
    expect(resultSorter(a, b)).toBeLessThan(0);
    const c = r('C', { place: 1, status: 0, result: 6000 });
    const d = r('D', { place: 2, status: 2, result: 5000 });
    // lower status wins regardless of result
    expect(resultSorter(c, d)).toBeLessThan(0);
  });

  it('places shared-time "=" after a non-"=" on a tie', () => {
    const a = r('A', { place: '=', status: 0, result: 6000 });
    const b = r('B', { place: 1, status: 0, result: 6000 });
    expect(resultSorter(a, b)).toBe(1);
    expect(resultSorter(b, a)).toBe(-1);
  });

  it('sorts unfinished before finished (they are re-inserted afterwards)', () => {
    const finished = r('A', { place: 1, status: 0, result: 6000 });
    const unfinished = r('C', { place: '', progress: 50 });
    expect(resultSorter(finished, unfinished)).toBe(1);
    expect(resultSorter(unfinished, finished)).toBe(-1);
  });
});

describe('sortByDist', () => {
  it('orders by progress descending', () => {
    const data = [r('A', { progress: 10 }), r('B', { progress: 90 }), r('C', { progress: 50 })];
    data.sort(sortByDist);
    expect(order(data)).toEqual(['B', 'C', 'A']);
  });
});

describe('updateResultVirtualPosition (individual race)', () => {
  const ctx: ClassContext = { isMassStart: false, splits: null };

  it('orders finished runners by result and stamps virtual_position', () => {
    const data = [
      r('B', { place: 2, status: 0, result: 6100, progress: 100 }),
      r('A', { place: 1, status: 0, result: 6000, progress: 100 }),
    ];
    updateResultVirtualPosition(data, ctx);
    expect(order(data)).toEqual(['A', 'B']);
    expect(data.map((x) => x.virtual_position)).toEqual([0, 1]);
  });

  it('appends an unfinished runner after the finished ones (no splits)', () => {
    const data = [
      r('A', { place: 1, status: 0, result: 6000, progress: 100, start: 100 }),
      r('C', { place: '', status: 0, result: 0, progress: 50, start: 200 }),
    ];
    updateResultVirtualPosition(data, ctx);
    expect(order(data)).toEqual(['A', 'C']);
    expect(data.map((x) => x.virtual_position)).toEqual([0, 1]);
  });
});

describe('sortByDistAndSplitPlace (mass start)', () => {
  const ctx: ClassContext = { isMassStart: true, splits: [{ code: '1000' }] };

  it('orders finishers by result', () => {
    const a = r('X', { progress: 100, result: 6100, status: 0 });
    const b = r('Y', { progress: 100, result: 6000, status: 0 });
    expect(sortByDistAndSplitPlace(a, b, ctx)).toBeGreaterThan(0);
  });

  it('breaks ties on the same split by place at that split', () => {
    const a = r('A', { progress: 50, status: 0, splits: { '1000': 1234, '1000_place': 2 } });
    const b = r('B', { progress: 50, status: 0, splits: { '1000': 1200, '1000_place': 1 } });
    const data = [a, b];
    data.sort((x, y) => sortByDistAndSplitPlace(x, y, ctx));
    expect(order(data)).toEqual(['B', 'A']);
  });

  it('treats not-started (status 9/10) like OK for ordering', () => {
    const a = r('A', { progress: 100, result: 6000, status: 9 });
    const b = r('B', { progress: 100, result: 6001, status: 0 });
    // both normalised to status 0, so ordered by result
    expect(sortByDistAndSplitPlace(a, b, ctx)).toBeLessThan(0);
  });
});

describe('updateResultVirtualPosition (mass start)', () => {
  it('sorts by the mass-start comparator and stamps positions', () => {
    const ctx: ClassContext = { isMassStart: true, splits: [{ code: '1000' }] };
    const data = [
      r('X', { progress: 100, result: 6100, status: 0, place: 2 }),
      r('Y', { progress: 100, result: 6000, status: 0, place: 1 }),
    ];
    updateResultVirtualPosition(data, ctx);
    expect(order(data)).toEqual(['Y', 'X']);
    expect(data.map((x) => x.virtual_position)).toEqual([0, 1]);
  });
});
