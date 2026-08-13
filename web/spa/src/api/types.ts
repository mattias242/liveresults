/**
 * Types for the existing LiveResults JSON API (web/api.php).
 *
 * These mirror the current wire contract exactly (centisecond times, string
 * status codes, the `hash`/"NOT MODIFIED" conditional-GET scheme) so the SPA
 * can consume today's server and, later, the byte-compatible /api/v1 alias.
 */

export interface Competition {
  id: number;
  name: string;
  organizer: string;
  date: string;
  timediff?: number;
  multidaystage?: number;
  multidayfirstday?: number;
}

export interface CompetitionInfo {
  id: number;
  name?: string;
  organizer?: string;
  date?: string;
  timediff?: number;
  timezone?: string;
  isPublic?: boolean;
  multidaystage?: number;
  multidayfirstday?: number;
}

export interface ClassEntry {
  className: string;
}

export interface SplitControl {
  class?: string;
  code: string;
  name: string;
  order?: number;
}

export interface Passing {
  passtime: string;
  runnerName: string;
  class: string;
  control: string | number;
  controlName: string;
  time: number | string;
}

export interface ResultRow {
  place: string | number;
  name: string;
  club: string;
  result: number;
  status: number;
  timeplus: number;
  progress: number;
  start: string | number;
  splits: Record<string, string | number>;
  totalresult?: number;
  totalstatus?: number;
  totalplace?: string | number;
  totalplus?: number;
  [key: string]: unknown;
}

/** Discriminated outcome of a conditional API read. */
export type ApiResult<T> =
  | { status: 'ok'; data: T; hash?: string }
  | { status: 'notModified' }
  | { status: 'error'; message: string };

export interface ClassResults {
  className: string;
  splitcontrols: SplitControl[];
  results: ResultRow[];
  isMassStartRace?: boolean;
}

export interface ClubResults {
  clubName: string;
  results: ResultRow[];
}
