export interface ClassListProps {
  classes: string[];
  selected: string | null;
  onSelect: (className: string) => void;
}

/** Sidebar list of classes; clicking one selects it. */
export function ClassList({ classes, selected, onSelect }: ClassListProps) {
  if (classes.length === 0) {
    return <p className="classlist-loading">Loading classes…</p>;
  }

  return (
    <ul className="classlist">
      {classes.map((c) => (
        <li key={c}>
          <button
            type="button"
            className={c === selected ? 'classlist-item is-selected' : 'classlist-item'}
            aria-current={c === selected ? 'true' : undefined}
            onClick={() => onSelect(c)}
          >
            {c}
          </button>
        </li>
      ))}
    </ul>
  );
}
