import { LANGUAGES } from "../projects";
import Icon from "./Icon";

export const STATUS = {
  loading: {
    label: "Chargement de Pyodide…",
    tone: "var(--warning)",
    pulse: true,
  },
  ready: { label: "Prêt", tone: "var(--success)", pulse: false },
  running: { label: "Exécution…", tone: "var(--accent)", pulse: true },
  error: { label: "Erreur", tone: "var(--danger)", pulse: false },
};

const getIcon = (language) => {
  if (language == "html") return LANGUAGES.html.icon;
  if (language == "python") return LANGUAGES.python.icon;
  if (language == "c") return LANGUAGES.c.icon;
  return "?";
};

const getLabel = (language, version) => {
  if (language == "html") return version ? `HTML ${version}` : "HTML";
  if (language == "python") return version ? `Python ${version}` : "Pyodide";
  if (language == "c") return version ? `C ${version}` : `C`;
  return "?";
};

function extension(lang) {
  if (lang === "python") return "py";
  if (lang === "html") return "html";
  if (lang === "css") return "css";
  if (lang === "js") return "js";
  if (lang === "c") return "c";
  return "txt";
}

export default function Toolbar({
  status,
  version,
  onRun,
  onBack,
  language,
  projectName,
  ok,
  code,
}) {
  const s = STATUS[status] || STATUS.loading;
  const statusLabel =
    status === "loading"
      ? language === "c"
        ? "Chargement du compilateur C…"
        : language === "python"
          ? "Chargement de Pyodide…"
          : "Chargement…"
      : s.label;
  const canRun = status === "ready" || status === "running";
  const icon = getIcon(language);
  const label = getLabel(language, version);

  function exportCode(code) {
    const filename = `${projectName.replaceAll(" ", "_")}.${extension(language)}`;
    var a = document.createElement("a"),
      file = new File([code], filename, {
        type: "text/plain",
      });
    if (window.navigator.msSaveOrOpenBlob)
      window.navigator.msSaveOrOpenBlob(file, filename);
    else {
      var url = URL.createObjectURL(file);
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(function () {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 0);
    }
  }

  return (
    <header className="relative z-20 flex h-14 flex-none items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-3">
      <div className="flex items-center gap-2">
        {onBack && (
          <button onClick={onBack} className="btn btn-ghost group">
            <Icon
              name="arrowLeft"
              size={15}
              className="transition-transform group-hover:-translate-x-0.5"
            />
            Projets
          </button>
        )}
        <span
          className={`hidden h-7 w-7 place-items-center rounded-lg text-base md:grid ${
            /^[A-Za-z]+$/.test(icon) ? "font-mono font-bold" : ""
          }`}
          style={{
            background:
              "color-mix(in oklab, var(--lang-color, var(--accent)) 14%, transparent)",
            "--lang-color": LANGUAGES[language]?.color,
          }}
          title={label}
        >
          {icon}
        </span>
      </div>

      <h1 className="notch notch-title absolute top-0 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-b-2xl border-x border-b border-[var(--border-strong)] px-6 pt-3 pb-3.5 text-[0.8125rem] font-bold text-[var(--text)] shadow-[0_14px_24px_-16px_rgb(0_0_0/0.7)]">
        <span className="font-medium text-[var(--text-faint)]">Projet</span>
        {projectName}
        {ok && (
          <span
            className="check-dot !h-[1.125rem] !w-[1.125rem]"
            style={ok === "gold" ? { "--tone": "var(--gold)" } : undefined}
            title={ok === "gold" ? "Terminé — bonus doré" : "Terminé"}
          >
            <Icon name="check" size={11} strokeWidth={3} />
          </span>
        )}
      </h1>

      <div className="hidden items-center gap-2 md:flex">
        <div
          className="mr-2 flex items-center gap-2"
          role="status"
          aria-live="polite"
        >
          <span
            className={`status-dot ${s.pulse ? "animate-pulse" : ""}`}
            style={{ "--tone": s.tone }}
          />
          <span className="text-xs font-medium text-[var(--text-muted)]">
            {statusLabel}
          </span>
        </div>

        <button
          onClick={() => {
            exportCode(code);
          }}
          title="Télécharger le code"
          className="btn btn-outline"
        >
          <Icon name="download" size={15} />
          Exporter
        </button>

        <button onClick={onRun} disabled={!canRun} className="btn btn-primary">
          <Icon name="play" size={13} />
          Exécuter
          <kbd className="kbd">⌘↵</kbd>
        </button>
      </div>
    </header>
  );
}
