import type { RankResult } from '../domain/ranking';
import type { SplitControl } from '../api/types';
import { formatTime, type RunnerStatusMap } from '../domain/time';

export interface ResultsTableProps {
  rows: RankResult[];
  language: string;
  runnerStatus: RunnerStatusMap;
  splitcontrols?: SplitControl[];
  isMassStart?: boolean;
}

function splitCell(row: RankResult, code: string, language: string): string {
  const raw = row.splits?.[code];
  if (raw === undefined || raw === '') {
    return '';
  }
  const time = formatTime(Number(raw), 0, {}, { language });
  const place = row.splits?.[code + '_place'];
  return place !== undefined && place !== '' ? `${time} (${place})` : time;
}

/**
 * Results table for a single class. Rows arrive already ranked (with
 * virtual_position) from ResultsController; times use the ported formatTime so
 * output matches the legacy site. Optionally renders a column per split control
 * and a mass-start indicator.
 */
export function ResultsTable({ rows, language, runnerStatus, splitcontrols = [], isMassStart = false }: ResultsTableProps) {
  if (rows.length === 0) {
    return <p className="results-empty">No results yet.</p>;
  }

  return (
    <div className="results">
      {isMassStart && <p className="results-badge">Mass start</p>}
      <div className="results-scroll">
        <table className="results-table">
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">Name</th>
              <th scope="col">Club</th>
              {splitcontrols.map((sc) => (
                <th scope="col" key={sc.code}>{sc.name}</th>
              ))}
              <th scope="col">Result</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={(r.name as string) + '|' + (r.club as string) + '|' + i}>
                <td className="col-place">{r.place === '' ? '' : r.place}</td>
                <td className="col-name">{r.name}</td>
                <td className="col-club">{r.club}</td>
                {splitcontrols.map((sc) => (
                  <td className="col-split" key={sc.code}>{splitCell(r, sc.code, language)}</td>
                ))}
                <td className="col-result">{formatTime(r.result, r.status, runnerStatus, { language })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
