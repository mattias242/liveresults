import type { RankResult } from '../domain/ranking';
import type { SplitControl } from '../api/types';
import { formatTime, type RunnerStatusMap } from '../domain/time';
import { t } from '../i18n/messages';

export interface ResultsTableProps {
  rows: RankResult[];
  language: string;
  runnerStatus: RunnerStatusMap;
  splitcontrols?: SplitControl[];
  isMassStart?: boolean;
  showTotal?: boolean;
}

function totalCell(row: RankResult, runnerStatus: RunnerStatusMap, language: string): string {
  const total = row.totalresult;
  if (total === undefined) {
    return '';
  }
  const time = formatTime(Number(total), Number(row.totalstatus ?? 0), runnerStatus, { language });
  const place = row.totalplace;
  return place !== undefined && place !== '' ? `${time} (${place})` : time;
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
export function ResultsTable({ rows, language, runnerStatus, splitcontrols = [], isMassStart = false, showTotal = false }: ResultsTableProps) {
  if (rows.length === 0) {
    return <p className="results-empty">{t(language, 'noResults')}</p>;
  }

  return (
    <div className="results">
      {isMassStart && <p className="results-badge">{t(language, 'massStart')}</p>}
      <div className="results-scroll">
        <table className="results-table">
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">{t(language, 'colName')}</th>
              <th scope="col">{t(language, 'colClub')}</th>
              {splitcontrols.map((sc) => (
                <th scope="col" key={sc.code}>{sc.name}</th>
              ))}
              <th scope="col">{t(language, 'colResult')}</th>
              {showTotal && <th scope="col">{t(language, 'colTotal')}</th>}
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
                {showTotal && <td className="col-total">{totalCell(r, runnerStatus, language)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
