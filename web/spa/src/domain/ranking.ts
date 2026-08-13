/**
 * Provisional ("virtual") ranking of runners still out on the course, ported
 * verbatim from the legacy web/js/LiveResults.ts
 * (updateResultVirtualPosition / resultSorter / sortByDist /
 * sortByDistAndSplitPlace / insertIntoResults).
 *
 * This is the undocumented heart of the product: it decides the running order
 * shown live while a race is in progress, including the mass-start variant and
 * split-place tie-breaking. It is ported behaviour-for-behaviour and locked by
 * ranking.test.ts so it can be reused unchanged by the new SPA.
 *
 * Domain of the fields (from the api.php unformatted payload):
 *   place            "" (unfinished) | "-" | "=" | positive int (rank)
 *   status           int status code (0 = OK; 9/10 = not started / blank)
 *   result           centiseconds (int)
 *   progress         0..100
 *   start            "" | start time (int)
 *   splits[code]     "" | centiseconds (int)
 *   splits[code+"_place"]  rank at that split
 * With this domain, the legacy loose `!= ""` comparisons are equivalent to the
 * strict checks used here.
 */

export interface SplitControl {
  code: string;
}

export interface RankResult {
  place: string | number;
  status: number;
  result: number;
  progress: number;
  start: string | number;
  splits: Record<string, string | number>;
  virtual_position?: number;
  /** Present on real result rows (unused by ranking, used for display). */
  name?: string;
  club?: string;
  [key: string]: unknown;
}

export interface ClassContext {
  isMassStart: boolean;
  splits: SplitControl[] | null;
}

const isSet = (v: string | number): boolean => v !== '' && v !== undefined && v !== null;
const num = (v: string | number): number => (typeof v === 'number' ? v : parseFloat(v as string));

/** Sorts results by the one that has run longest on the course. */
export function sortByDist(a: RankResult, b: RankResult): number {
  return b.progress - a.progress;
}

/** Finished-vs-finished / finished-vs-unfinished ordering. */
export function resultSorter(a: RankResult, b: RankResult): number {
  if (a.place !== '' && b.place !== '') {
    if (a.status !== b.status) {
      return a.status - b.status;
    }
    if (a.result === b.result) {
      if (a.place === '=' && b.place !== '=') {
        return 1;
      } else if (b.place === '=' && a.place !== '=') {
        return -1;
      }
      return 0;
    }
    return a.result - b.result;
  } else if (a.place === '-' || a.place !== '') {
    return 1;
  } else if (b.place === '-' || b.place !== '') {
    return -1;
  }
  return 0;
}

/** Mass-start ordering: by progress, and on the same split by place at that split. */
export function sortByDistAndSplitPlace(a: RankResult, b: RankResult, ctx: ClassContext): number {
  let sortStatusA = a.status;
  let sortStatusB = b.status;
  if (sortStatusA === 9 || sortStatusA === 10) sortStatusA = 0;
  if (sortStatusB === 9 || sortStatusB === 10) sortStatusB = 0;
  if (sortStatusA !== sortStatusB) return sortStatusA - sortStatusB;

  if (a.progress === 100 && b.progress === 100) return a.result - b.result;

  if (a.progress === 0 && b.progress === 0) {
    if (isSet(a.start) && !isSet(b.start)) return -1;
    if (!isSet(a.start) && isSet(b.start)) return 1;
    return num(a.start) - num(b.start);
  }

  if (a.progress === b.progress && a.progress > 0 && a.progress < 100) {
    if (ctx.splits != null) {
      for (let s = ctx.splits.length - 1; s >= 0; s--) {
        const splitCode = ctx.splits[s].code;
        if (isSet(a.splits[splitCode])) {
          return num(a.splits[splitCode + '_place']) - num(b.splits[splitCode + '_place']);
        }
      }
    }
  }

  return b.progress - a.progress;
}

/**
 * Insert a result into an already-ordered array. The result is assumed to have
 * the same or worse progress than everything already present.
 */
export function insertIntoResults(result: RankResult, data: RankResult[], ctx: ClassContext): void {
  let d: number;
  if (ctx.splits != null) {
    for (let s = ctx.splits.length - 1; s >= 0; s--) {
      const splitCode = ctx.splits[s].code;
      if (isSet(result.splits[splitCode])) {
        let numOthersAtSplit = 0;
        for (d = 0; d < data.length; d++) {
          if (isSet(data[d].splits[splitCode])) {
            numOthersAtSplit++;
          }
          if (
            data[d].place === '-' ||
            (isSet(data[d].splits[splitCode]) && num(data[d].splits[splitCode]) > num(result.splits[splitCode]))
          ) {
            data.splice(d, 0, result);
            return;
          }
        }
        if (numOthersAtSplit > 0) {
          data.push(result);
          return;
        }
      }
    }
  }

  if (result.start !== '') {
    for (d = 0; d < data.length; d++) {
      if (data[d].place === '-') {
        data.splice(d, 0, result);
        return;
      }
      if (result.place === '' && data[d].place !== '') {
        // keep looking
      } else if (
        data[d].start !== '' &&
        num(data[d].start) > num(result.start) &&
        result.progress === 0 &&
        data[d].progress === 0
      ) {
        data.splice(d, 0, result);
        return;
      }
    }
  }

  data.push(result);
}

/**
 * Reorder `data` in place into provisional running order and stamp each row's
 * virtual_position (0-based).
 */
export function updateResultVirtualPosition(data: RankResult[], ctx: ClassContext): void {
  data.sort(resultSorter);

  let firstFinishedIdx = -1;
  for (let i = 0; i < data.length; i++) {
    if (data[i].place !== '') {
      firstFinishedIdx = i;
      break;
    }
  }
  if (firstFinishedIdx === -1) firstFinishedIdx = data.length;

  if (ctx.isMassStart) {
    data.sort((a, b) => sortByDistAndSplitPlace(a, b, ctx));
  } else {
    const tmp: RankResult[] = [];
    for (let i = 0; i < firstFinishedIdx; i++) {
      tmp.push(data[i]);
    }
    data.splice(0, firstFinishedIdx);

    tmp.sort(sortByDist);
    for (let i = 0; i < tmp.length; i++) {
      if (data.length === 0) {
        data.push(tmp[i]);
      } else {
        insertIntoResults(tmp[i], data, ctx);
      }
    }
  }

  for (let i = 0; i < data.length; i++) {
    data[i].virtual_position = i;
  }
}
