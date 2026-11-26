import Icon from "./Icon";
import Progress from "./Progress";

const agree = (step, word) => (step.bonus ? word : `${word}e`);

function stateLabel(step) {
  if (step.state === "passed") return agree(step, "validé");
  if (step.state === "locked") return agree(step, "verrouillé");
  return "en cours";
}

export default function StepTracker({ progress, selected, onSelect }) {
  return (
    <div className="flex flex-none items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--surface)] px-3 py-2">
      <ol
        className="flex min-w-0 items-center gap-1.5"
        aria-label="Étapes du sujet"
      >
        {progress.steps.map((step) => {
          const open = step.id === selected.id;
          const label = `${step.name} · ${step.title} (${stateLabel(step)})`;
          return (
            <li key={step.id} className={open ? "min-w-0" : "flex-none"}>
              <button
                type="button"
                onClick={() => onSelect(step.id)}
                aria-pressed={open}
                aria-current={step === progress.current ? "step" : undefined}
                aria-label={label}
                title={`${label} — ${step.goal}`}
                data-state={step.state}
                data-bonus={step.bonus || undefined}
                className="step-pill"
              >
                <span className="step-pill-mark">
                  {step.state === "passed" ? (
                    <Icon name="check" size={11} strokeWidth={3} />
                  ) : (
                    step.number
                  )}
                </span>
                <span className="step-pill-title" aria-hidden={!open}>
                  {step.title}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      <span className="flex-none">
        <Progress
          done={progress.passedCount}
          total={progress.steps.length}
          tone={progress.gold ? "var(--gold)" : "var(--success)"}
        />
      </span>
    </div>
  );
}

export function StepLocked({ step, blocker }) {
  return (
    <div
      className="callout m-auto flex w-full max-w-md flex-col items-center gap-2 p-5 text-center"
      style={{ "--tone": "var(--warning)" }}
      role="status"
    >
      <Icon name="lock" size={20} />
      <p className="text-sm font-bold">
        {step.name} {agree(step, "verrouillé")} : {step.title}
      </p>
      <p className="text-[0.8125rem] leading-relaxed text-[var(--text-muted)]">
        Les étapes se valident dans l'ordre. Termine d'abord l'
        {blocker.name.toLowerCase()} ({blocker.title}), puis reviens ici.
      </p>
    </div>
  );
}
