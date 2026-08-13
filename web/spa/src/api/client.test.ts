import { describe, it, expect, vi } from 'vitest';
import { LiveResultsApi } from './client';

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('LiveResultsApi', () => {
  it('requests competitions from the configured base and unwraps the list', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ competitions: [{ id: 1, name: 'Test', organizer: 'Org', date: '2024-01-01' }] }),
    );
    const api = new LiveResultsApi('api.php', fetchMock);

    const res = await api.getCompetitions();

    expect(fetchMock).toHaveBeenCalledOnce();
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain('api.php?method=getcompetitions');
    expect(res.status).toBe('ok');
    if (res.status === 'ok') {
      expect(res.data).toHaveLength(1);
      expect(res.data[0].name).toBe('Test');
    }
  });

  it('sends unformattedTimes and class params for class results', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ status: 'OK', className: 'H21', splitcontrols: [], results: [], hash: 'abc' }),
    );
    const api = new LiveResultsApi('/api/v1/', fetchMock);

    const res = await api.getClassResults(42, 'H21');

    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain('method=getclassresults');
    expect(url).toContain('comp=42');
    expect(url).toContain('class=H21');
    expect(url).toContain('unformattedTimes=true');
    expect(res.status).toBe('ok');
    if (res.status === 'ok') {
      expect(res.data.className).toBe('H21');
      expect(res.hash).toBe('abc');
    }
  });

  it('url-encodes class names', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ status: 'OK', className: 'D21 Elit', splitcontrols: [], results: [], hash: 'x' }),
    );
    const api = new LiveResultsApi('api.php', fetchMock);
    await api.getClassResults(1, 'D21 Elit');
    const url = fetchMock.mock.calls[0][0] as string;
    // URLSearchParams encodes spaces as '+', which PHP decodes back to a space.
    expect(url).toContain('class=D21+Elit');
  });

  it('passes last_hash and maps NOT MODIFIED to notModified', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ status: 'NOT MODIFIED' }));
    const api = new LiveResultsApi('api.php', fetchMock);

    const res = await api.getClasses(7, 'prevhash');

    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain('last_hash=prevhash');
    expect(res.status).toBe('notModified');
  });

  it('reports an error status as an error result', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ status: 'ERR', message: 'No method given' }),
    );
    const api = new LiveResultsApi('api.php', fetchMock);
    const res = await api.getClasses(7);
    expect(res.status).toBe('error');
    if (res.status === 'error') {
      expect(res.message).toContain('No method');
    }
  });

  it('surfaces network failures as an error result', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('offline'));
    const api = new LiveResultsApi('api.php', fetchMock);
    const res = await api.getCompetitions();
    expect(res.status).toBe('error');
  });
});
