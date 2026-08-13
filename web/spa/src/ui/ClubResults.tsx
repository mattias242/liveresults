import type { ResultRow } from '../api/types';
import { formatTime, type RunnerStatusMap } from '../domain/time';

export interface ClubResultsProps {
  clubName: string;
  rows: ResultRow[];
  language: string;
  runnerStatus: RunnerStatusMap;
}

/** All results for one club, across classes. */
export function ClubResults({ clubName, rows, language, runnerStatus }: ClubResultsProps) {
  return (
    <section className="club">
      <h2>{clubName}</h2>
      {rows.length === 0 ? (
        <p className="results-empty">No results yet.</p>
      ) : (
        <table className="results-table">
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">Name</th>
              <th scope="col">Class</th>
              <th scope="col">Result</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={(r.name as string) + '|' + i}>
                <td className="col-place">{r.place === '' ? '' : r.place}</td>
                <td className="col-name">{r.name}</td>
                <td className="col-class">{(r as { class?: string }).class}</td>
                <td className="col-result">{formatTime(r.result, r.status, runnerStatus, { language })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
