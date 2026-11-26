import { useEffect, useState } from "react";
import Icon from "./Icon";

const COOLDOWN_MS = 60 * 60 * 1000;
const STORAGE_KEY = "manta-hints-";

// { count, last, steps? }: count is the total unlocked on the project (read by
// the stats and achievements), steps the count unlocked in each part.
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

// Saves from before the parts only hold a total. A part's hints are a slice
// of the project's list, in order, so the total maps onto them.
function unlockedPerStep(project, state) {
  if (state.steps) return state.steps;
  let left = state.count;
  return Object.fromEntries(
    project.steps.map((step) => {
      const unlocked = Math.min(left, step.hints?.length ?? 0);
      left -= unlocked;
      return [step.id, unlocked];
    }),
  );
}

// `step` is the part shown in the tracker, for projects split into parts.
export default function Hints({ project, step }) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState(() => loadState(project.id));
  const [now, setNow] = useState(Date.now());
  const perStep = step ? unlockedPerStep(project, state) : null;
  const hints = (step ? step.hints : project.hints) ?? [];
  const count = step ? (perStep[step.id] ?? 0) : state.count;
  const [viewIndex, setViewIndex] = useState(Math.max(count - 1, 0));
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  const hasAny = step
    ? project.steps.some((s) => s.hints?.length)
    : hints.length > 0;
  if (!hasAny) return null;

  const locked = step?.state === "locked";
  const remaining = state.count === 0 ? 0 : COOLDOWN_MS - (now - state.last);
  const canClaim = !locked && count < hints.length && remaining <= 0;
  const claim = () => {
    if (!canClaim) return;
    const next = { count: state.count + 1, last: Date.now() };
    if (step) next.steps = { ...perStep, [step.id]: count + 1 };
    localStorage.setItem(STORAGE_KEY + project.id, JSON.stringify(next));
    setState(next);
    setViewIndex(count);
  };
  const safeIndex = Math.min(viewIndex, Math.max(count - 1, 0));

  const label = locked
    ? "Étape verrouillée"
    : hints.length === 0
      ? "Pas d'indice pour cette étape"
      : count >= hints.length
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
              {step && (
                <span className="font-medium text-[var(--text-faint)]">
                  {` · ${step.name}`}
                </span>
              )}
            </span>
            <span className="text-xs font-semibold tabular-nums text-[var(--text-faint)]">
              {count}/{hints.length}
            </span>
          </div>
          {count === 0 ? (
            <p className="mt-3 rounded-xl border border-dashed border-[var(--border-strong)] px-3 py-4 text-center text-xs text-[var(--text-faint)]">
              {hints.length === 0
                ? "Cette étape n'a pas d'indice."
                : "Aucun indice débloqué pour l'instant."}
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
                onClick={() => setViewIndex((i) => Math.min(i + 1, count - 1))}
                disabled={safeIndex >= count - 1}
                className="btn btn-outline btn-sm btn-icon mt-1"
                aria-label="Indice suivant"
              >
                <Icon name="chevronRight" size={14} />
              </button>
            </div>
          )}
          {count > 0 && (
            <div className="mt-2 text-center text-[0.6875rem] font-medium tabular-nums text-[var(--text-faint)]">
              {safeIndex + 1} / {count}
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
