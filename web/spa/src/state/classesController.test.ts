import { describe, it, expect, vi } from 'vitest';
import { ClassesController } from './classesController';
import { LiveResultsApi } from '../api/client';

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), { status: 200 });
}

describe('ClassesController', () => {
  it('returns class names on first load', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ status: 'OK', classes: [{ className: 'H21' }, { className: 'D21' }], hash: 'h1' }));
    const controller = new ClassesController(new LiveResultsApi('api.php', fetchMock), 3);

    const update = await controller.refresh();

    expect(update.changed).toBe(true);
    expect(update.classes).toEqual(['H21', 'D21']);
  });

  it('reuses cached classes on NOT MODIFIED', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ status: 'OK', classes: [{ className: 'H21' }], hash: 'h1' }))
      .mockResolvedValueOnce(jsonResponse({ status: 'NOT MODIFIED' }));
    const controller = new ClassesController(new LiveResultsApi('api.php', fetchMock), 3);

    await controller.refresh();
    const second = await controller.refresh();

    expect(second.changed).toBe(false);
    expect(second.classes).toEqual(['H21']);
  });
});
