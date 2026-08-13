import { useEffect, useRef, useState } from 'react';
import { LiveResultsApi } from '../api/client';
import { ClassesController } from '../state/classesController';
import { ResultsController } from '../state/resultsController';
import type { RankResult } from '../domain/ranking';
import type { RunnerStatusMap } from '../domain/time';
import { ClassList } from './ClassList';
import { ResultsTable } from './ResultsTable';

const CLASS_POLL_MS = 60000;
const RESULT_POLL_MS = 15000;

// Minimal status labels for the vertical slice; full i18n comes later.
const RUNNER_STATUS_EN: RunnerStatusMap = {
  0: '',
  1: 'DNS',
  2: 'DNF',
  3: 'MP',
  4: 'DSQ',
  5: 'OT',
  9: '',
  10: '',
  11: 'w/o',
  12: '',
};

function readComp(): number {
  const p = new URLSearchParams(window.location.search);
  return parseInt(p.get('comp') ?? '0', 10) || 0;
}

function readClassFromHash(): string | null {
  const h = decodeURIComponent(window.location.hash.replace(/^#/, ''));
  if (!h || h.includes('::')) return null; // club views handled later
  return h;
}

export interface AppProps {
  apiBaseUrl?: string;
}

export function App({ apiBaseUrl = '../api.php' }: AppProps) {
  const comp = readComp();
  const [classes, setClasses] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(readClassFromHash());
  const [rows, setRows] = useState<RankResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const apiRef = useRef<LiveResultsApi | null>(null);
  const classesCtrlRef = useRef<ClassesController | null>(null);
  if (apiRef.current === null) {
    apiRef.current = new LiveResultsApi(apiBaseUrl);
    classesCtrlRef.current = new ClassesController(apiRef.current, comp);
  }

  // Keep selection in sync with the URL hash (shareable links).
  useEffect(() => {
    const onHash = () => setSelected(readClassFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // Poll the class list.
  useEffect(() => {
    let stop = false;
    const ctrl = classesCtrlRef.current!;
    const tick = async () => {
      const u = await ctrl.refresh();
      if (!stop && u.changed) setClasses(u.classes);
    };
    tick();
    const id = window.setInterval(tick, CLASS_POLL_MS);
    return () => {
      stop = true;
      window.clearInterval(id);
    };
  }, [comp]);

  // Poll the selected class's results.
  useEffect(() => {
    if (!selected) {
      setRows([]);
      return;
    }
    let stop = false;
    const ctrl = new ResultsController(apiRef.current!, comp);
    const tick = async () => {
      const u = await ctrl.refreshClass(selected);
      if (stop) return;
      if (u.error) setError(u.error);
      else setError(null);
      if (u.changed) setRows(u.rows);
    };
    tick();
    const id = window.setInterval(tick, RESULT_POLL_MS);
    return () => {
      stop = true;
      window.clearInterval(id);
    };
  }, [selected, comp]);

  const selectClass = (c: string) => {
    window.location.hash = encodeURIComponent(c);
    setSelected(c);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Liveresultat</h1>
      </header>
      <div className="app-body">
        <nav className="app-sidebar" aria-label="Classes">
          <ClassList classes={classes} selected={selected} onSelect={selectClass} />
        </nav>
        <main className="app-main">
          {error && <p className="app-error" role="alert">{error}</p>}
          <h2>{selected ?? 'Choose a class'}</h2>
          {selected ? (
            <ResultsTable rows={rows} language="en" runnerStatus={RUNNER_STATUS_EN} />
          ) : (
            <p>Select a class from the list to see live results.</p>
          )}
        </main>
      </div>
    </div>
  );
}
