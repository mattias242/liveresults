import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ClubResults } from './ClubResults';
import type { ResultRow } from '../api/types';
import type { RunnerStatusMap } from '../domain/time';

const runnerStatus: RunnerStatusMap = { 0: '', 1: 'DNS' };

const rows: ResultRow[] = [
  { place: 1, name: 'Anna A', club: 'OK Nord', class: 'D21', result: 6000, status: 0, timeplus: 0, progress: 100, start: 0, splits: {} } as ResultRow,
  { place: '', name: 'Bo B', club: 'OK Nord', class: 'H21', result: 0, status: 1, timeplus: 0, progress: 0, start: 0, splits: {} } as ResultRow,
];

describe('ClubResults', () => {
  it('renders runner, class and formatted result grouped for the club', () => {
    render(<ClubResults clubName="OK Nord" rows={rows} language="en" runnerStatus={runnerStatus} />);
    expect(screen.getByText('OK Nord')).toBeInTheDocument();
    expect(screen.getByText('Anna A')).toBeInTheDocument();
    expect(screen.getByText('D21')).toBeInTheDocument();
    expect(screen.getByText('01:00')).toBeInTheDocument();
    expect(screen.getByText('DNS')).toBeInTheDocument();
  });

  it('renders an empty state when the club has no results', () => {
    render(<ClubResults clubName="OK Nord" rows={[]} language="en" runnerStatus={runnerStatus} />);
    expect(screen.getByText(/no results/i)).toBeInTheDocument();
  });
});
