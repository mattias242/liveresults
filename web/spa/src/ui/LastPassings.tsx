import type { Passing } from '../api/types';

export interface LastPassingsProps {
  passings: Passing[];
}

/** Compact live feed of the most recent control passings. */
export function LastPassings({ passings }: LastPassingsProps) {
  if (passings.length === 0) {
    return <p className="passings-empty">No passings yet.</p>;
  }

  return (
    <ul className="passings">
      {passings.map((p, i) => (
        <li key={i} className="passing">
          <span className="passing-time">{p.passtime}</span>
          <span className="passing-runner">{p.runnerName}</span>
          <span className="passing-class">{p.class}</span>
          <span className="passing-control">{p.controlName}</span>
          <span className="passing-split">{p.time}</span>
        </li>
      ))}
    </ul>
  );
}
