/**
 * Time formatting for results, ported verbatim from the legacy
 * web/js/LiveResults.ts formatTime()/strPad().
 *
 * All times are centiseconds. Behaviour is locked by time.test.ts so the SPA
 * renders exactly as the current site does.
 *
 * Defaulting rule (matching the legacy arguments.length branching):
 *   showHours defaults to (language === 'fi')
 *   padZeros  defaults to (language !== 'fi')
 */

export type RunnerStatusMap = Record<number, string>;

export interface FormatOptions {
  language: string;
  /** Show a tenths-of-a-second component. */
  showTenth?: boolean;
  /** Render an h:mm:ss component. Defaults to true for 'fi'. */
  showHours?: boolean;
  /** Left-pad the leading unit to two digits. Defaults to true except 'fi'. */
  padZeros?: boolean;
}

export function strPad(num: number | string, length: number): string {
  let str = '' + num;
  while (str.length < length) {
    str = '0' + str;
  }
  return str;
}

export function formatTime(
  time: number,
  status: number,
  runnerStatus: RunnerStatusMap,
  opts: FormatOptions,
): string {
  const showTenth = opts.showTenth ?? false;
  const showHours = opts.showHours ?? (opts.language === 'fi');
  const padZeros = opts.padZeros ?? (opts.language !== 'fi');

  if (status !== 0) {
    return runnerStatus[status] ?? '';
  }

  if (showHours) {
    const hours = Math.floor(time / 360000);
    const minutes = Math.floor((time - hours * 360000) / 6000);
    const seconds = Math.floor((time - minutes * 6000 - hours * 360000) / 100);
    const tenth = Math.floor((time - minutes * 6000 - hours * 360000 - seconds * 100) / 10);
    if (hours > 0) {
      const h = padZeros ? strPad(hours, 2) : '' + hours;
      return h + ':' + strPad(minutes, 2) + ':' + strPad(seconds, 2) + (showTenth ? '.' + tenth : '');
    }
    const m = padZeros ? strPad(minutes, 2) : '' + minutes;
    return m + ':' + strPad(seconds, 2) + (showTenth ? '.' + tenth : '');
  }

  const minutes = Math.floor(time / 6000);
  const seconds = Math.floor((time - minutes * 6000) / 100);
  const tenth = Math.floor((time - minutes * 6000 - seconds * 100) / 10);
  const m = padZeros ? strPad(minutes, 2) : '' + minutes;
  return m + ':' + strPad(seconds, 2) + (showTenth ? '.' + tenth : '');
}
