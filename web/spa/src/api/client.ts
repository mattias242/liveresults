/**
 * Typed client for the LiveResults JSON API (web/api.php), designed to work
 * against today's server and the future byte-compatible /api/v1 alias.
 *
 * The conditional-GET scheme is preserved: pass the previous `hash` as
 * lastHash and a "NOT MODIFIED" response is surfaced as { status: 'notModified' }.
 * fetch is injected so the client is unit-testable without a network.
 */
import type {
  ApiResult,
  ClassEntry,
  ClassResults,
  ClubResults,
  Competition,
  CompetitionInfo,
  Passing,
  SplitControl,
} from './types';

type FetchFn = (url: string) => Promise<Response>;

export class LiveResultsApi {
  constructor(
    private readonly baseUrl: string = '/api/v1/',
    private readonly fetchFn: FetchFn = (url) => fetch(url),
  ) {}

  private buildUrl(method: string, params: Record<string, string | number | undefined>): string {
    const qs = new URLSearchParams();
    qs.set('method', method);
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== '') {
        qs.set(k, String(v));
      }
    }
    const sep = this.baseUrl.includes('?') ? '&' : '?';
    return `${this.baseUrl}${sep}${qs.toString()}`;
  }

  private async request<T>(
    method: string,
    params: Record<string, string | number | undefined>,
    extract: (body: any) => T,
  ): Promise<ApiResult<T>> {
    let body: any;
    try {
      const resp = await this.fetchFn(this.buildUrl(method, params));
      body = await resp.json();
    } catch (e) {
      return { status: 'error', message: e instanceof Error ? e.message : 'request failed' };
    }

    if (body && body.status === 'NOT MODIFIED') {
      return { status: 'notModified' };
    }
    if (body && (body.status === 'ERR' || body.status === 'Error')) {
      return { status: 'error', message: String(body.message ?? 'API error') };
    }
    return { status: 'ok', data: extract(body), hash: body?.hash };
  }

  getCompetitions(): Promise<ApiResult<Competition[]>> {
    return this.request('getcompetitions', {}, (b) => (b.competitions ?? []) as Competition[]);
  }

  getCompetitionInfo(comp: number): Promise<ApiResult<CompetitionInfo>> {
    return this.request('getcompetitioninfo', { comp }, (b) => b as CompetitionInfo);
  }

  getClasses(comp: number, lastHash?: string): Promise<ApiResult<ClassEntry[]>> {
    return this.request('getclasses', { comp, last_hash: lastHash }, (b) => (b.classes ?? []) as ClassEntry[]);
  }

  getSplitControls(comp: number, lastHash?: string): Promise<ApiResult<SplitControl[]>> {
    return this.request('getsplitcontrols', { comp, last_hash: lastHash }, (b) => (b.splitcontrols ?? []) as SplitControl[]);
  }

  getLastPassings(comp: number, lang?: string, lastHash?: string): Promise<ApiResult<Passing[]>> {
    return this.request('getlastpassings', { comp, lang, last_hash: lastHash }, (b) => (b.passings ?? []) as Passing[]);
  }

  getClassResults(
    comp: number,
    className: string,
    lastHash?: string,
    includeTotal = false,
  ): Promise<ApiResult<ClassResults>> {
    return this.request(
      'getclassresults',
      {
        comp,
        class: className,
        unformattedTimes: 'true',
        includetotal: includeTotal ? 'true' : undefined,
        last_hash: lastHash,
      },
      (b) => ({
        className: b.className,
        splitcontrols: b.splitcontrols ?? [],
        results: b.results ?? [],
        isMassStartRace: b.IsMassStartRace,
      }),
    );
  }

  getClubResults(comp: number, club: string, lastHash?: string): Promise<ApiResult<ClubResults>> {
    return this.request(
      'getclubresults',
      { comp, club, unformattedTimes: 'true', last_hash: lastHash },
      (b) => ({ clubName: b.clubName, results: b.results ?? [] }),
    );
  }
}
