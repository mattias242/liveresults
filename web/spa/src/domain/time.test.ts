import { describe, it, expect } from 'vitest';
import { formatTime, strPad, type RunnerStatusMap } from './time';

/**
 * Characterization tests for the time formatting ported verbatim from the
 * legacy web/js/LiveResults.ts formatTime()/strPad(). These lock the existing
 * behaviour before it is reused by the new SPA (Fas 1/Fas 3).
 *
 * Times are centiseconds. Status 0 = OK; anything else renders a status label.
 */
const status: RunnerStatusMap = {
  0: '',
  1: 'DNS',
  2: 'DNF',
  3: 'MP',
  4: 'DSQ',
  5: 'OT',
};

describe('strPad', () => {
  it('left-pads numbers with zeros to the given width', () => {
    expect(strPad(1, 2)).toBe('01');
    expect(strPad(12, 2)).toBe('12');
    expect(strPad(123, 2)).toBe('123');
    expect(strPad(0, 2)).toBe('00');
  });
});

describe('formatTime (non-fi, padded)', () => {
  const lang = 'en';

  it('formats whole minutes as mm:ss', () => {
    expect(formatTime(6000, 0, status, { language: lang })).toBe('01:00');
  });

  it('truncates centiseconds to whole seconds by default', () => {
    // 6153 cs = 1:01.53 -> "01:01"
    expect(formatTime(6153, 0, status, { language: lang })).toBe('01:01');
  });

  it('shows tenths when requested', () => {
    expect(formatTime(6153, 0, status, { language: lang, showTenth: true })).toBe('01:01.5');
  });

  it('formats large times without hours by default (minutes overflow)', () => {
    // 366153 cs -> minutes = 61, seconds = 1 -> "61:01"
    expect(formatTime(366153, 0, status, { language: lang })).toBe('61:01');
  });
});

describe('formatTime (fi, hours, unpadded)', () => {
  const lang = 'fi';

  it('formats with hours and no leading zero on the leading unit', () => {
    // 366153 cs -> 1:01:01
    expect(formatTime(366153, 0, status, { language: lang })).toBe('1:01:01');
  });

  it('drops the hours component when under an hour', () => {
    // 6153 cs -> under an hour -> "1:01" (unpadded minutes)
    expect(formatTime(6153, 0, status, { language: lang })).toBe('1:01');
  });
});

describe('formatTime status handling', () => {
  it('returns the status label for any non-OK status', () => {
    expect(formatTime(12345, 1, status, { language: 'en' })).toBe('DNS');
    expect(formatTime(0, 4, status, { language: 'en' })).toBe('DSQ');
  });
});

describe('formatTime explicit options override language defaults', () => {
  it('can force hours for a non-fi language', () => {
    expect(formatTime(366153, 0, status, { language: 'en', showHours: true })).toBe('01:01:01');
  });

  it('can force unpadded output', () => {
    expect(formatTime(6000, 0, status, { language: 'en', padZeros: false })).toBe('1:00');
  });
});
