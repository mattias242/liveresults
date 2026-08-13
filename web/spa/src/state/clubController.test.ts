import { describe, it, expect, vi } from 'vitest';
import { ClubController } from './clubController';
import { LiveResultsApi } from '../api/client';

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), { status: 200 });
}

const sample = {
  status: 'OK',
  clubName: 'OK Nord',
  results: [
    { place: 1, name: 'Anna A', club: 'OK Nord', class: 'D21', result: 6000, status: 0, timeplus: 0, progress: 100, start: 0, splits: {} },
  ],
  hash: 'k1',
};

describe('ClubController', () => {
  it('returns club results on first load', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(sample));
    const controller = new ClubController(new LiveResultsApi('api.php', fetchMock), 5);

    const update = await controller.refresh('OK Nord');

    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain('method=getclubresults');
    expect(url).toContain('club=OK+Nord');
    expect(update.changed).toBe(true);
    expect(update.clubName).toBe('OK Nord');
    expect(update.results).toHaveLength(1);
  });

  it('reuses cached results on NOT MODIFIED', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(sample))
      .mockResolvedValueOnce(jsonResponse({ status: 'NOT MODIFIED' }));
    const controller = new ClubController(new LiveResultsApi('api.php', fetchMock), 5);

    await controller.refresh('OK Nord');
    const second = await controller.refresh('OK Nord');

    expect(second.changed).toBe(false);
    expect(second.results).toHaveLength(1);
  });
});
