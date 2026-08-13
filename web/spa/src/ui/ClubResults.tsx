import type { ResultRow } from '../api/types';
import { formatTime, type RunnerStatusMap } from '../domain/time';
import { t } from '../i18n/messages';

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
        <p className="results-empty">{t(language, 'noResults')}</p>
      ) : (
        <table className="results-table">
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">{t(language, 'colName')}</th>
              <th scope="col">{t(language, 'colClass')}</th>
              <th scope="col">{t(language, 'colResult')}</th>
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
