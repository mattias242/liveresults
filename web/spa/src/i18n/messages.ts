/**
 * Lightweight i18n for the SPA. Replaces the legacy PHP $_GLOBALS language
 * files with plain data. Swedish is the default (matching the public site);
 * English is the fallback for unknown languages.
 */
import type { RunnerStatusMap } from '../domain/time';

export type Lang = string;

type Dict = Record<string, string>;

const MESSAGES: Record<string, Dict> = {
  sv: {
    title: 'Liveresultat',
    chooseClass: 'Välj en klass',
    chooseClassHint: 'Välj en klass i listan för att se liveresultat.',
    lastPassings: 'Senaste passeringar',
    loadingClasses: 'Laddar klasser…',
    noResults: 'Inga resultat ännu.',
    noPassings: 'Inga passeringar ännu.',
    massStart: 'Masstart',
    colName: 'Namn',
    colClub: 'Klubb',
    colClass: 'Klass',
    colResult: 'Resultat',
    colTotal: 'Totalt',
  },
  en: {
    title: 'Live results',
    chooseClass: 'Choose a class',
    chooseClassHint: 'Select a class from the list to see live results.',
    lastPassings: 'Last passings',
    loadingClasses: 'Loading classes…',
    noResults: 'No results yet.',
    noPassings: 'No passings yet.',
    massStart: 'Mass start',
    colName: 'Name',
    colClub: 'Club',
    colClass: 'Class',
    colResult: 'Result',
    colTotal: 'Total',
  },
};

const RUNNER_STATUS: Record<string, RunnerStatusMap> = {
  sv: { 0: '', 1: 'Ej start', 2: 'Utgått', 3: 'Felst.', 4: 'Disk', 5: 'Maxtid', 9: '', 10: '', 11: 'u.tävlan', 12: '' },
  en: { 0: '', 1: 'DNS', 2: 'DNF', 3: 'MP', 4: 'DSQ', 5: 'OT', 9: '', 10: '', 11: 'w/o', 12: '' },
};

const SUPPORTED = Object.keys(MESSAGES);

export function resolveLang(lang: string | null | undefined): Lang {
  return lang && SUPPORTED.includes(lang) ? lang : 'sv';
}

export function t(lang: Lang, key: string): string {
  const dict = MESSAGES[lang] ?? MESSAGES.en;
  return dict[key] ?? MESSAGES.en[key] ?? key;
}

export function runnerStatusFor(lang: Lang): RunnerStatusMap {
  return RUNNER_STATUS[lang] ?? RUNNER_STATUS.en;
}
