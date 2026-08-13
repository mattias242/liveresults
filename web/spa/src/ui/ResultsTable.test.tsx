import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ResultsTable } from './ResultsTable';
import type { RankResult } from '../domain/ranking';
import type { RunnerStatusMap } from '../domain/time';

const runnerStatus: RunnerStatusMap = { 0: '', 1: 'DNS', 2: 'DNF', 4: 'DSQ' };

function row(over: Partial<RankResult>): RankResult {
  return {
    place: '',
    name: '',
    club: '',
    result: 0,
    status: 0,
    progress: 0,
    start: '',
    splits: {},
    ...over,
  } as RankResult;
}

describe('ResultsTable', () => {
  it('renders each runner with place, name, club and formatted result', () => {
    const rows = [
      row({ place: 1, name: 'Anna A', club: 'OK Nord', result: 6000, status: 0, progress: 100 }),
      row({ place: 2, name: 'Bo B', club: 'OK Syd', result: 6153, status: 0, progress: 100 }),
    ];
    render(<ResultsTable rows={rows} language="en" runnerStatus={runnerStatus} />);

    expect(screen.getByText('Anna A')).toBeInTheDocument();
    expect(screen.getByText('OK Nord')).toBeInTheDocument();
    expect(screen.getByText('01:00')).toBeInTheDocument();
    expect(screen.getByText('01:01')).toBeInTheDocument();
  });

  it('shows the status label instead of a time for non-OK runners', () => {
    const rows = [row({ place: '', name: 'Cee C', club: 'OK Väst', result: 0, status: 1 })];
    render(<ResultsTable rows={rows} language="en" runnerStatus={runnerStatus} />);
    expect(screen.getByText('DNS')).toBeInTheDocument();
  });

  it('renders an empty-state message when there are no rows', () => {
    render(<ResultsTable rows={[]} language="en" runnerStatus={runnerStatus} />);
    expect(screen.getByText(/no results/i)).toBeInTheDocument();
  });
});
