import { describe, it, expect, vi } from 'vitest';
import { LastPassingsController } from './lastPassingsController';
import { LiveResultsApi } from '../api/client';

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), { status: 200 });
}

const sample = {
  status: 'OK',
  passings: [
    { passtime: '12:01:02', runnerName: 'Anna A', class: 'H21', control: 100, controlName: 'Start', time: 0 },
  ],
  hash: 'p1',
};

describe('LastPassingsController', () => {
  it('returns passings on first load and passes lang', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(sample));
    const controller = new LastPassingsController(new LiveResultsApi('api.php', fetchMock), 5, 'sv');

    const update = await controller.refresh();

    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain('method=getlastpassings');
    expect(url).toContain('lang=sv');
    expect(update.changed).toBe(true);
    expect(update.passings).toHaveLength(1);
    expect(update.passings[0].runnerName).toBe('Anna A');
  });

  it('reuses cached passings on NOT MODIFIED', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(sample))
      .mockResolvedValueOnce(jsonResponse({ status: 'NOT MODIFIED' }));
    const controller = new LastPassingsController(new LiveResultsApi('api.php', fetchMock), 5, 'sv');

    await controller.refresh();
    const second = await controller.refresh();

    expect(second.changed).toBe(false);
    expect(second.passings).toHaveLength(1);
  });
});
