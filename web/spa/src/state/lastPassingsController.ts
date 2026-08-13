import { LiveResultsApi } from '../api/client';
import type { Passing } from '../api/types';

export interface PassingsUpdate {
  changed: boolean;
  passings: Passing[];
  error?: string;
}

/** Polls the last-passings feed, reusing cached rows on NOT MODIFIED. */
export class LastPassingsController {
  private lastHash?: string;
  private passings: Passing[] = [];

  constructor(
    private readonly api: LiveResultsApi,
    private readonly comp: number,
    private readonly lang: string,
  ) {}

  async refresh(): Promise<PassingsUpdate> {
    const res = await this.api.getLastPassings(this.comp, this.lang, this.lastHash);
    if (res.status === 'notModified') {
      return { changed: false, passings: this.passings };
    }
    if (res.status === 'error') {
      return { changed: false, passings: this.passings, error: res.message };
    }
    this.passings = res.data;
    this.lastHash = res.hash;
    return { changed: true, passings: this.passings };
  }

  currentPassings(): Passing[] {
    return this.passings;
  }
}
