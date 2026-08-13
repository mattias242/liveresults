import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from './App';

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), { status: 200 });
}

/** Route the fake fetch by the api method in the URL. */
function fakeFetch(url: string): Promise<Response> {
  if (url.includes('method=getclasses')) {
    return Promise.resolve(jsonResponse({ status: 'OK', classes: [{ className: 'H21' }], hash: 'c1' }));
  }
  if (url.includes('method=getlastpassings')) {
    return Promise.resolve(
      jsonResponse({
        status: 'OK',
        passings: [{ passtime: '12:00:00', runnerName: 'Live Runner', class: 'D45', control: 240, controlName: 'Radio 2', time: '12:34' }],
        hash: 'p1',
      }),
    );
  }
  if (url.includes('method=getclassresults')) {
    return Promise.resolve(
      jsonResponse({
        status: 'OK',
        className: 'H21',
        splitcontrols: [],
        results: [{ place: 1, name: 'Anna A', club: 'OK Nord', result: 6000, status: 0, timeplus: 0, progress: 100, start: 0, splits: {} }],
        hash: 'r1',
      }),
    );
  }
  if (url.includes('method=getclubresults')) {
    return Promise.resolve(
      jsonResponse({
        status: 'OK',
        clubName: 'OK Nord',
        results: [{ place: 1, name: 'Anna A', club: 'OK Nord', class: 'D21', result: 6000, status: 0, timeplus: 0, progress: 100, start: 0, splits: {} }],
        hash: 'k1',
      }),
    );
  }
  return Promise.resolve(jsonResponse({ status: 'OK' }));
}

describe('App vertical slice', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(fakeFetch));
    window.location.hash = '';
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    window.location.hash = '';
  });

  it('renders the header and loads the class list from the API', async () => {
    render(<App apiBaseUrl="api.php" />);
    expect(screen.getByText('Liveresultat')).toBeInTheDocument();
    expect(await screen.findByText('H21')).toBeInTheDocument();
  });

  it('shows the last-passings feed when nothing is selected', async () => {
    render(<App apiBaseUrl="api.php" />);
    expect(await screen.findByText('Live Runner')).toBeInTheDocument();
  });

  it('shows results for the class named in the URL hash', async () => {
    window.location.hash = '#H21';
    render(<App apiBaseUrl="api.php" />);
    expect(await screen.findByText('Anna A')).toBeInTheDocument();
    expect(await screen.findByText('01:00')).toBeInTheDocument();
  });

  it('shows a club view for a #club:: hash', async () => {
    window.location.hash = '#club::OK Nord';
    render(<App apiBaseUrl="api.php" />);
    expect(await screen.findByText('OK Nord')).toBeInTheDocument();
    expect(await screen.findByText('D21')).toBeInTheDocument();
  });
});
