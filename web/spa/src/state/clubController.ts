import { LiveResultsApi } from '../api/client';
import type { ResultRow } from '../api/types';

export interface ClubUpdate {
  changed: boolean;
  clubName: string;
  results: ResultRow[];
  error?: string;
}

/** Polls a single club's results across classes, diffing on NOT MODIFIED. */
export class ClubController {
  private lastHash?: string;
  private clubName = '';
  private results: ResultRow[] = [];

  constructor(
    private readonly api: LiveResultsApi,
    private readonly comp: number,
  ) {}

  async refresh(club: string): Promise<ClubUpdate> {
    const res = await this.api.getClubResults(this.comp, club, this.lastHash);
    if (res.status === 'notModified') {
      return { changed: false, clubName: this.clubName, results: this.results };
    }
    if (res.status === 'error') {
      return { changed: false, clubName: this.clubName, results: this.results, error: res.message };
    }
    this.clubName = res.data.clubName;
    this.results = res.data.results;
    this.lastHash = res.hash;
    return { changed: true, clubName: this.clubName, results: this.results };
  }
}
