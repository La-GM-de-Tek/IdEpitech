import Icon from "./Icon";
import { getStepProgress, stepName } from "../steps";

function CheckReport({ project, report }) {
  if (report.running) {
    return (
      <div className="flex items-center gap-2 text-[var(--text-muted)]">
        <span
          className="status-dot animate-pulse"
          style={{ "--tone": "var(--accent)" }}
        />
        Vérification en cours…
      </div>
    );
  }

  const { passed, failed, criteria } = report;
  const progress = getStepProgress(project);

  return (
    <div className="flex flex-col gap-1.5">
      {passed.map((step) => (
        <p
          key={step.id}
          className="flex items-center gap-2 font-semibold text-[var(--success)]"
        >
          <Icon name="check" size={14} strokeWidth={2.5} />
          {stepName(project, step)} validée : {step.title}
        </p>
      ))}
      {failed ? (
        <>
          <p className="font-semibold text-[var(--text)]">
            {stepName(project, failed)} · {failed.title} : pas encore
          </p>
          <ul className="flex flex-col gap-1">
            {(criteria[failed.id] ?? []).map(({ label, ok, detail }) => (
              <li key={label} className="flex items-start gap-2">
                <Icon
                  name={ok ? "check" : "x"}
                  size={14}
                  strokeWidth={2.5}
                  className={`mt-0.5 ${ok ? "text-[var(--success)]" : "text-[var(--danger)]"}`}
                />
                <span className={ok ? "text-[var(--text-muted)]" : ""}>
                  {label}
                  {!ok && detail && (
                    <span className="text-[var(--text-faint)]">
                      {` — ${detail}`}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="flex items-center gap-2 font-semibold text-[var(--success)]">
          <Icon name="trophy" size={14} />
          {progress.completed && passed.length
            ? "Sujet validé, bravo !"
            : "Toutes les étapes sont validées."}
        </p>
      )}
    </div>
  );
}

export default function HtmlView({ html, onClear, project, report }) {
  return (
    <div className="flex h-full flex-col bg-[var(--bg)]">
      <div className="panel-head">
        <span className="panel-title">
          <Icon name="terminal" size={14} />
          CONSOLE
        </span>
        <button onClick={onClear} className="btn btn-ghost btn-sm">
          <Icon name="eraser" size={14} />
          Effacer
        </button>
      </div>

      {html ? (
        <iframe
          title="Aperçu HTML"
          sandbox="allow-scripts"
          srcDoc={html}
          className="h-full w-full flex-1 border-0 bg-white"
        />
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center text-sm text-[var(--text-faint)]">
          <Icon name="play" size={20} />
          <p>
            Lancez votre code avec <span className="kbd">⌘↵</span> pour voir
            l'aperçu ici.
          </p>
        </div>
      )}

      {report && (
        <div
          role="status"
          aria-live="polite"
          className="thin-scroll max-h-[40%] flex-none overflow-auto border-t border-[var(--border)] bg-[var(--surface)] px-4 py-3 pr-28 text-[0.8125rem] leading-relaxed"
        >
          <CheckReport project={project} report={report} />
        </div>
      )}
    </div>
  );
}
