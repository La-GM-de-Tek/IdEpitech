import { useEffect, useState } from "react";
import Icon from "./Icon";

const COOLDOWN_MS = 60 * 60 * 1000;
const STORAGE_KEY = "manta-hints-";

function loadState(id) {
  try {
    return (
      JSON.parse(localStorage.getItem(STORAGE_KEY + id)) ?? {
        count: 0,
        last: 0,
      }
    );
  } catch {
    return { count: 0, last: 0 };
  }
}

export default function Hints({ project }) {
  const hints = project.hints ?? [];
  const [open, setOpen] = useState(false);
  const [state, setState] = useState(() => loadState(project.id));
  const [now, setNow] = useState(Date.now());
  const [viewIndex, setViewIndex] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);
  if (hints.length === 0) return null;
  const remaining = state.count === 0 ? 0 : COOLDOWN_MS - (now - state.last);
  const canClaim = state.count < hints.length && remaining <= 0;
  const claim = () => {
    if (!canClaim) return;
    const next = { count: state.count + 1, last: Date.now() };
    localStorage.setItem(STORAGE_KEY + project.id, JSON.stringify(next));
    setState(next);
    setViewIndex(next.count - 1);
  };
  const safeIndex = Math.min(viewIndex, Math.max(state.count - 1, 0));

  const label =
    state.count >= hints.length
      ? "Tous les indices débloqués"
      : canClaim
        ? "Demander un indice"
        : `Prochain indice dans ${Math.ceil(remaining / 60000)} min`;
  return (
    <div className="absolute right-4 bottom-4 z-10 flex w-80 max-w-[80vw] flex-col items-end">
      {open && (
        <div className="dialog mb-2 p-4 [animation-name:pop-in]">
          <div className="flex items-center justify-between">
            <span className="text-[0.8125rem] font-bold text-[var(--text)]">
              Indices
            </span>
            <span className="text-xs font-semibold tabular-nums text-[var(--text-faint)]">
              {state.count}/{hints.length}
            </span>
          </div>
          {state.count === 0 ? (
            <p className="mt-3 rounded-xl border border-dashed border-[var(--border-strong)] px-3 py-4 text-center text-xs text-[var(--text-faint)]">
              Aucun indice débloqué pour l'instant.
            </p>
          ) : (
            <div className="mt-3 flex items-start gap-2">
              <button
                type="button"
                onClick={() => setViewIndex((i) => Math.max(i - 1, 0))}
                disabled={safeIndex === 0}
                className="btn btn-outline btn-sm btn-icon mt-1"
                aria-label="Indice précédent"
              >
                <Icon name="chevronLeft" size={14} />
              </button>
              <p className="callout min-h-[3.5rem] flex-1 px-3 py-2.5 text-[0.8125rem] leading-relaxed [--tone:var(--warning)]">
                {hints[safeIndex]}
              </p>
              <button
                type="button"
                onClick={() =>
                  setViewIndex((i) => Math.min(i + 1, state.count - 1))
                }
                disabled={safeIndex >= state.count - 1}
                className="btn btn-outline btn-sm btn-icon mt-1"
                aria-label="Indice suivant"
              >
                <Icon name="chevronRight" size={14} />
              </button>
            </div>
          )}
          {state.count > 0 && (
            <div className="mt-2 text-center text-[0.6875rem] font-medium tabular-nums text-[var(--text-faint)]">
              {safeIndex + 1} / {state.count}
            </div>
          )}
          <button
            type="button"
            onClick={claim}
            disabled={!canClaim}
            className="btn mt-3 w-full bg-[var(--warning)] text-[var(--bg)] hover:brightness-110"
          >
            {label}
          </button>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="btn btn-outline h-9 rounded-full px-4 shadow-[var(--shadow-md)]"
      >
        <Icon name="lightbulb" size={15} className="text-[var(--warning)]" />
        Indices
      </button>
    </div>
  );
}
