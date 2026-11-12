import Console from "./Console";
import { isCompleted } from "../completion";
import Icon from "./Icon";

export default function LearningConsole({ project, onNext, ...consoleProps }) {
  const completed = project?.hasEnd && isCompleted(project.id);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Console {...consoleProps} />
      {completed && (
        <div className="flex flex-none items-center justify-between gap-3 border-t border-[color-mix(in_oklab,var(--success)_30%,var(--border))] bg-[color-mix(in_oklab,var(--success)_8%,var(--surface))] px-4 py-2.5">
          <span className="flex items-center gap-2 text-[0.8125rem] font-semibold text-[var(--success)]">
            <span className="check-dot">
              <Icon name="check" size={12} strokeWidth={3} />
            </span>
            Exercice validé
          </span>
          <button
            type="button"
            onClick={onNext}
            disabled={!onNext}
            title={onNext ? "Ctrl/Cmd + Shift + Entrée" : undefined}
            className="btn btn-primary"
          >
            {onNext ? "Exercice suivant" : "Dernier exercice"}
            {onNext && <Icon name="arrowRight" size={15} />}
          </button>
        </div>
      )}
    </div>
  );
}
