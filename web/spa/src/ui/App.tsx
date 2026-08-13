import { useEffect, useRef, useState } from 'react';
import { LiveResultsApi } from '../api/client';
import { ClassesController } from '../state/classesController';
import { ResultsController } from '../state/resultsController';
import { ClubController } from '../state/clubController';
import { LastPassingsController } from '../state/lastPassingsController';
import type { RankResult } from '../domain/ranking';
import type { RunnerStatusMap } from '../domain/time';
import type { Passing, ResultRow } from '../api/types';
import { ClassList } from './ClassList';
import { ResultsTable } from './ResultsTable';
import { ClubResults } from './ClubResults';
import { LastPassings } from './LastPassings';

const CLASS_POLL_MS = 60000;
const RESULT_POLL_MS = 15000;
const PASSINGS_POLL_MS = 15000;

// Minimal status labels for now; full i18n comes later.
const RUNNER_STATUS_EN: RunnerStatusMap = {
  0: '', 1: 'DNS', 2: 'DNF', 3: 'MP', 4: 'DSQ', 5: 'OT', 9: '', 10: '', 11: 'w/o', 12: '',
};

type Selection = { kind: 'class' | 'club'; name: string } | null;

function readComp(): number {
  const p = new URLSearchParams(window.location.search);
  return parseInt(p.get('comp') ?? '0', 10) || 0;
}

function readSelectionFromHash(): Selection {
  const h = decodeURIComponent(window.location.hash.replace(/^#/, ''));
  if (!h) return null;
  if (h.startsWith('club::')) return { kind: 'club', name: h.slice('club::'.length) };
  return { kind: 'class', name: h };
}

export interface AppProps {
  apiBaseUrl?: string;
  lang?: string;
}

export function App({ apiBaseUrl = '../api.php', lang = 'en' }: AppProps) {
  const comp = readComp();
  const [classes, setClasses] = useState<string[]>([]);
  const [selection, setSelection] = useState<Selection>(readSelectionFromHash());
  const [rows, setRows] = useState<RankResult[]>([]);
  const [clubRows, setClubRows] = useState<ResultRow[]>([]);
  const [clubName, setClubName] = useState('');
  const [passings, setPassings] = useState<Passing[]>([]);
  const [error, setError] = useState<string | null>(null);

  const apiRef = useRef<LiveResultsApi | null>(null);
  const classesCtrlRef = useRef<ClassesController | null>(null);
  const passingsCtrlRef = useRef<LastPassingsController | null>(null);
  if (apiRef.current === null) {
    apiRef.current = new LiveResultsApi(apiBaseUrl);
    classesCtrlRef.current = new ClassesController(apiRef.current, comp);
    passingsCtrlRef.current = new LastPassingsController(apiRef.current, comp, lang);
  }

  // Keep selection in sync with the URL hash (shareable links).
  useEffect(() => {
    const onHash = () => setSelection(readSelectionFromHash());
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
    return () => { stop = true; window.clearInterval(id); };
  }, [comp]);

  // Poll last passings.
  useEffect(() => {
    let stop = false;
    const ctrl = passingsCtrlRef.current!;
    const tick = async () => {
      const u = await ctrl.refresh();
      if (!stop && u.changed) setPassings(u.passings);
    };
    tick();
    const id = window.setInterval(tick, PASSINGS_POLL_MS);
    return () => { stop = true; window.clearInterval(id); };
  }, [comp]);

  // Poll the selected class or club.
  useEffect(() => {
    if (!selection) {
      setRows([]);
      setClubRows([]);
      return;
    }
    let stop = false;
    const api = apiRef.current!;
    let tick: () => Promise<void>;

    if (selection.kind === 'class') {
      const ctrl = new ResultsController(api, comp);
      tick = async () => {
        const u = await ctrl.refreshClass(selection.name);
        if (stop) return;
        setError(u.error ?? null);
        if (u.changed) setRows(u.rows);
      };
    } else {
      const ctrl = new ClubController(api, comp);
      tick = async () => {
        const u = await ctrl.refresh(selection.name);
        if (stop) return;
        setError(u.error ?? null);
        if (u.changed) { setClubRows(u.results); setClubName(u.clubName); }
      };
    }

    tick();
    const id = window.setInterval(tick, RESULT_POLL_MS);
    return () => { stop = true; window.clearInterval(id); };
  }, [selection, comp]);

  const selectClass = (c: string) => {
    window.location.hash = encodeURIComponent(c);
    setSelection({ kind: 'class', name: c });
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Liveresultat</h1>
      </header>
      <div className="app-body">
        <nav className="app-sidebar" aria-label="Classes">
          <ClassList classes={classes} selected={selection?.kind === 'class' ? selection.name : null} onSelect={selectClass} />
        </nav>
        <main className="app-main">
          {error && <p className="app-error" role="alert">{error}</p>}
          {selection?.kind === 'class' && (
            <>
              <h2>{selection.name}</h2>
              <ResultsTable rows={rows} language={lang} runnerStatus={RUNNER_STATUS_EN} />
            </>
          )}
          {selection?.kind === 'club' && (
            <ClubResults clubName={clubName || selection.name} rows={clubRows} language={lang} runnerStatus={RUNNER_STATUS_EN} />
          )}
          {!selection && (
            <>
              <h2>Last passings</h2>
              <LastPassings passings={passings} />
            </>
          )}
        </main>
      </div>
    </div>
  );
}
