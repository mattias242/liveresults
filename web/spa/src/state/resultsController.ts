/**
 * Framework-agnostic state layer for a single class's live results.
 *
 * Ties the API client to the ported ranking logic and implements the
 * conditional-GET / diff behaviour the plan calls for: on "NOT MODIFIED" the
 * previously ranked rows are reused instead of rebuilding the table. This is
 * the model any UI (React/Svelte/…) renders from.
 */
import { LiveResultsApi } from '../api/client';
import type { ResultRow } from '../api/types';
import { updateResultVirtualPosition, type RankResult, type ClassContext } from '../domain/ranking';

export interface ClassUpdate {
  /** True when the ranked rows changed since the previous refresh. */
  changed: boolean;
  /** Current ranked rows (empty until the first successful load). */
  rows: RankResult[];
  /** Present when the refresh failed; rows then hold the last good state. */
  error?: string;
}

export class ResultsController {
  private lastHash?: string;
  private rows: RankResult[] = [];

  constructor(
    private readonly api: LiveResultsApi,
    private readonly comp: number,
  ) {}

  /** Fetch, rank and cache the results for a class. */
  async refreshClass(className: string): Promise<ClassUpdate> {
    const res = await this.api.getClassResults(this.comp, className, this.lastHash);

    if (res.status === 'notModified') {
      return { changed: false, rows: this.rows };
    }
    if (res.status === 'error') {
      return { changed: false, rows: this.rows, error: res.message };
    }

    const ctx: ClassContext = {
      isMassStart: res.data.isMassStartRace === true,
      splits: res.data.splitcontrols?.length ? res.data.splitcontrols : null,
    };

    const ranked = (res.data.results as ResultRow[]).map((r) => ({ ...r })) as unknown as RankResult[];
    updateResultVirtualPosition(ranked, ctx);

    this.rows = ranked;
    this.lastHash = res.hash;
    return { changed: true, rows: ranked };
  }

  /** The currently cached ranked rows. */
  currentRows(): RankResult[] {
    return this.rows;
  }
}
