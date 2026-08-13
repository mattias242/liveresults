import { describe, it, expect } from 'vitest';
import { t, runnerStatusFor, resolveLang } from './messages';

describe('i18n', () => {
  it('translates known keys for Swedish and English', () => {
    expect(t('sv', 'lastPassings')).toBe('Senaste passeringar');
    expect(t('en', 'lastPassings')).toBe('Last passings');
  });

  it('falls back to English for an unknown language', () => {
    expect(t('xx', 'lastPassings')).toBe('Last passings');
  });

  it('returns the key itself for an unknown key (never crashes)', () => {
    expect(t('sv', 'nope')).toBe('nope');
  });

  it('provides runner-status labels per language', () => {
    expect(runnerStatusFor('sv')[1]).toBe('Ej start');
    expect(runnerStatusFor('en')[1]).toBe('DNS');
    // OK status renders empty in every language
    expect(runnerStatusFor('en')[0]).toBe('');
  });

  it('resolves a supported language, defaulting to Swedish', () => {
    expect(resolveLang('en')).toBe('en');
    expect(resolveLang('sv')).toBe('sv');
    expect(resolveLang(null)).toBe('sv');
    expect(resolveLang('zz')).toBe('sv');
  });
});
