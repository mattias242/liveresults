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

  it('renders a column per split control with the split time', () => {
    const rows = [
      row({
        place: 1,
        name: 'Anna A',
        club: 'OK Nord',
        result: 6000,
        status: 0,
        progress: 100,
        splits: { '240': 3000, '240_place': 1, '1000': 6000, '1000_place': 1 },
      }),
    ];
    const splitcontrols = [
      { code: '240', name: 'Radio 2' },
      { code: '1000', name: 'Finish' },
    ];
    render(
      <ResultsTable rows={rows} splitcontrols={splitcontrols} language="en" runnerStatus={runnerStatus} />,
    );
    expect(screen.getByText('Radio 2')).toBeInTheDocument();
    expect(screen.getByText('Finish')).toBeInTheDocument();
    // 3000 cs = 00:30 at the radio control, shown with the split place
    expect(screen.getByText('00:30 (1)')).toBeInTheDocument();
  });

  it('leaves split cells blank for controls a runner has not reached', () => {
    const rows = [
      row({ place: '', name: 'Bo B', club: 'OK Syd', result: 0, status: 0, progress: 20, splits: { '240': '', '1000': '' } }),
    ];
    const splitcontrols = [{ code: '240', name: 'Radio 2' }];
    const { container } = render(
      <ResultsTable rows={rows} splitcontrols={splitcontrols} language="en" runnerStatus={runnerStatus} />,
    );
    const splitCells = container.querySelectorAll('td.col-split');
    expect(splitCells).toHaveLength(1);
    expect(splitCells[0].textContent).toBe('');
  });

  it('renders a total column for multi-day events', () => {
    const rows = [
      row({
        place: 1,
        name: 'Anna A',
        club: 'OK Nord',
        result: 6000,
        status: 0,
        progress: 100,
        totalresult: 12000,
        totalstatus: 0,
        totalplace: 2,
      }),
    ];
    render(<ResultsTable rows={rows} language="en" runnerStatus={runnerStatus} showTotal />);
    expect(screen.getByText('Total')).toBeInTheDocument();
    // 12000 cs = 02:00 total, shown with total place
    expect(screen.getByText('02:00 (2)')).toBeInTheDocument();
  });

  it('shows a mass-start indicator when the class is a mass start', () => {
    const rows = [row({ place: 1, name: 'A', club: '', result: 6000, status: 0, progress: 100 })];
    render(<ResultsTable rows={rows} language="en" runnerStatus={runnerStatus} isMassStart />);
    expect(screen.getByText(/mass start/i)).toBeInTheDocument();
  });
});
