import { describe, it, expect, vi } from 'vitest';
import { ResultsController } from './resultsController';
import { LiveResultsApi } from '../api/client';

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), { status: 200 });
}

function apiReturning(...bodies: unknown[]): LiveResultsApi {
  const fetchMock = vi.fn();
  for (const b of bodies) {
    fetchMock.mockResolvedValueOnce(jsonResponse(b));
  }
  return new LiveResultsApi('api.php', fetchMock);
}

describe('ResultsController.refreshClass', () => {
  it('ranks results on first load and reports a change', async () => {
    const api = apiReturning({
      status: 'OK',
      className: 'H21',
      splitcontrols: [],
      results: [
        { place: 2, name: 'B', club: '', result: 6100, status: 0, timeplus: 100, progress: 100, start: 0, splits: {} },
        { place: 1, name: 'A', club: '', result: 6000, status: 0, timeplus: 0, progress: 100, start: 0, splits: {} },
      ],
      hash: 'h1',
    });
    const controller = new ResultsController(api, 5);

    const update = await controller.refreshClass('H21');

    expect(update.changed).toBe(true);
    expect(update.rows.map((r) => r.name)).toEqual(['A', 'B']);
    expect(update.rows.map((r) => r.virtual_position)).toEqual([0, 1]);
  });

  it('sends the stored hash and returns cached rows on NOT MODIFIED', async () => {
    const api = apiReturning(
      {
        status: 'OK',
        className: 'H21',
        splitcontrols: [],
        results: [
          { place: 1, name: 'A', club: '', result: 6000, status: 0, timeplus: 0, progress: 100, start: 0, splits: {} },
        ],
        hash: 'h1',
      },
      { status: 'NOT MODIFIED' },
    );
    const controller = new ResultsController(api, 5);

    const first = await controller.refreshClass('H21');
    const second = await controller.refreshClass('H21');

    expect(first.changed).toBe(true);
    expect(second.changed).toBe(false);
    expect(second.rows.map((r) => r.name)).toEqual(['A']);
  });

  it('applies mass-start ordering when the payload says so', async () => {
    const api = apiReturning({
      status: 'OK',
      className: 'Mass',
      splitcontrols: [{ code: '1000', name: 'Finish' }],
      IsMassStartRace: true,
      results: [
        { place: 2, name: 'Slow', club: '', result: 6100, status: 0, timeplus: 100, progress: 100, start: 0, splits: {} },
        { place: 1, name: 'Fast', club: '', result: 6000, status: 0, timeplus: 0, progress: 100, start: 0, splits: {} },
      ],
      hash: 'm1',
    });
    const controller = new ResultsController(api, 5);

    const update = await controller.refreshClass('Mass');
    expect(update.rows.map((r) => r.name)).toEqual(['Fast', 'Slow']);
  });

  it('keeps previous rows and flags an error on failure', async () => {
    const api = apiReturning(
      {
        status: 'OK',
        className: 'H21',
        splitcontrols: [],
        results: [
          { place: 1, name: 'A', club: '', result: 6000, status: 0, timeplus: 0, progress: 100, start: 0, splits: {} },
        ],
        hash: 'h1',
      },
      { status: 'ERR', message: 'boom' },
    );
    const controller = new ResultsController(api, 5);

    await controller.refreshClass('H21');
    const errored = await controller.refreshClass('H21');

    expect(errored.changed).toBe(false);
    expect(errored.error).toBeDefined();
    expect(errored.rows.map((r) => r.name)).toEqual(['A']);
  });
});
