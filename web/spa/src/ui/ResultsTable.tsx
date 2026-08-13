import type { RankResult } from '../domain/ranking';
import { formatTime, type RunnerStatusMap } from '../domain/time';

export interface ResultsTableProps {
  rows: RankResult[];
  language: string;
  runnerStatus: RunnerStatusMap;
}

/**
 * Results table for a single class. Renders provisional order as produced by
 * ResultsController (rows already ranked with virtual_position). Times come
 * from the ported formatTime so output matches the legacy site.
 */
export function ResultsTable({ rows, language, runnerStatus }: ResultsTableProps) {
  if (rows.length === 0) {
    return <p className="results-empty">No results yet.</p>;
  }

  return (
    <table className="results-table">
      <thead>
        <tr>
          <th scope="col">#</th>
          <th scope="col">Name</th>
          <th scope="col">Club</th>
          <th scope="col">Result</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={(r.name as string) + '|' + (r.club as string) + '|' + i}>
            <td className="col-place">{r.place === '' ? '' : r.place}</td>
            <td className="col-name">{r.name}</td>
            <td className="col-club">{r.club}</td>
            <td className="col-result">{formatTime(r.result, r.status, runnerStatus, { language })}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
