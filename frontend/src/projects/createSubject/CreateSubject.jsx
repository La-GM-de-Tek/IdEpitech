import { useCallback, useEffect, useRef, useState } from "react";
import { useHideDecorations } from "../../components/ThemeBackground";
import Editor from "../../components/Editor";
import { usePyodide } from "../../usePyodide";
import builderRaw from "./sujetCobra.py?raw";
import Icon from "../../components/Icon";

const STORAGE_KEY = "manta-create-subject-md";

const SAMPLE_MD = `# Mon super sujet

Bienvenue ! Écrivez votre sujet en **Markdown** à gauche, puis cliquez sur
**Exécuter** pour générer le PDF stylisé à droite.

## Objectif

Décrivez ici ce que l'étudiant doit accomplir.

- Un premier point
- Un deuxième point
- Un \`troisième\` point

## Exemple de code

\`\`\`python
def hello():
    print("Hello Manta!")
\`\`\`

> Astuce : les citations deviennent des encadrés d'information.

| Fonction | Rôle |
| --- | --- |
| \`charger()\` | Prépare les données |
| \`resoudre()\` | Calcule la solution |
`;

function toBase64(text) {
  return btoa(unescape(encodeURIComponent(text)));
}

export default function CreateSubject({ onBack }) {
  useHideDecorations(true);
  const [markdown, setMarkdown] = useState(
    () => localStorage.getItem(STORAGE_KEY) ?? SAMPLE_MD,
  );
  const [pdfUrl, setPdfUrl] = useState(null);
  const [error, setError] = useState(null);
  const [building, setBuilding] = useState(false);
  const runRef = useRef(null);
  const pdfUrlRef = useRef(null);

  const { status, run } = usePyodide({});

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, markdown);
  }, [markdown]);

  useEffect(
    () => () => {
      if (pdfUrlRef.current) URL.revokeObjectURL(pdfUrlRef.current);
    },
    [],
  );

  const handleRun = useCallback(async () => {
    if (status !== "ready" && status !== "running") return;
    setError(null);
    setBuilding(true);

    const source = `${builderRaw}

import base64
_md = base64.b64decode("${toBase64(markdown)}").decode("utf-8")
build_from_markdown(_md)
`;

    const res = await run(source);
    setBuilding(false);

    if (!res?.ok) {
      setError(
        res?.timedOut
          ? "Génération interrompue (trop longue). Réessayez : reportlab est plus rapide au 2ᵉ essai."
          : (res?.error ?? "La génération du PDF a échoué."),
      );
      return;
    }
    if (!res.pdf) {
      setError("Aucun PDF n'a été produit. Vérifiez votre Markdown.");
      return;
    }

    const url = URL.createObjectURL(
      new Blob([res.pdf], { type: "application/pdf" }),
    );
    if (pdfUrlRef.current) URL.revokeObjectURL(pdfUrlRef.current);
    pdfUrlRef.current = url;
    setPdfUrl(url);
  }, [status, run, markdown]);

  runRef.current = handleRun;

  const canRun = status === "ready" || status === "running";
  const busy = building || status === "loading";

  const statusTone = busy
    ? "var(--accent)"
    : status === "ready"
      ? "var(--success)"
      : "var(--warning)";

  return (
    <div className="relative hidden h-full flex-col bg-[var(--bg)] md:flex">
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
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-[color-mix(in_oklab,var(--learn)_14%,transparent)] text-base">
            📝
          </span>
        </div>

        <h1 className="notch notch-title absolute top-0 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-b-2xl border-x border-b border-[var(--border-strong)] px-6 pt-3 pb-3.5 text-[0.8125rem] font-bold text-[var(--text)] shadow-[0_14px_24px_-16px_rgb(0_0_0/0.7)]">
          <span className="font-medium text-[var(--text-faint)]">Projet</span>
          Crée ton propre sujet IDEpitech
        </h1>

        <div className="flex items-center gap-2">
          <div
            className="mr-2 flex items-center gap-2"
            role="status"
            aria-live="polite"
          >
            <span
              className={`status-dot ${busy ? "animate-pulse" : ""}`}
              style={{ "--tone": statusTone }}
            />
            <span className="text-xs font-medium text-[var(--text-muted)]">
              {status === "loading"
                ? "Chargement de Pyodide…"
                : building
                  ? "Génération…"
                  : "Prêt"}
            </span>
          </div>

          {pdfUrl && (
            <a href={pdfUrl} download="sujet.pdf" className="btn btn-outline">
              <Icon name="download" size={15} />
              PDF
            </a>
          )}

          <button
            onClick={handleRun}
            disabled={!canRun || building}
            className="btn btn-primary"
          >
            <Icon name="play" size={13} />
            Exécuter
            <kbd className="kbd">⌘↵</kbd>
          </button>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden">
        <section className="min-h-0 min-w-0 flex-1 border-r border-[var(--border)]">
          <Editor
            value={markdown}
            onChange={setMarkdown}
            onRunRef={runRef}
            language="markdown"
            lang="markdown"
            onLangChange={() => {}}
          />
        </section>

        <section className="flex min-h-0 min-w-0 flex-1 flex-col bg-[var(--bg)]">
          {error ? (
            <div
              className="callout m-auto w-full max-w-lg p-4"
              style={{ "--tone": "var(--danger)" }}
            >
              <div className="mb-2 flex items-center gap-2 text-xs font-bold tracking-[0.08em]">
                <Icon name="alert" size={15} />
                ERREUR
              </div>
              <pre className="thin-scroll overflow-auto font-mono text-[13px] leading-relaxed whitespace-pre-wrap">
                {error}
              </pre>
            </div>
          ) : pdfUrl ? (
            <object
              width="100%"
              height="100%"
              data={pdfUrl}
              type="application/pdf"
            >
              {" "}
            </object>
          ) : building ? (
            <div className="m-auto flex items-center gap-2.5 text-sm text-[var(--text-muted)]">
              <span
                className="status-dot animate-pulse"
                style={{ "--tone": "var(--accent)" }}
              />
              Génération…
            </div>
          ) : (
            <div className="m-auto flex max-w-sm flex-col items-center gap-4 px-6 text-center">
              <span
                className="tile h-14 w-14 rounded-2xl"
                style={{ "--tone": "var(--learn)" }}
              >
                <Icon name="file" size={24} />
              </span>
              <p className="text-sm leading-relaxed text-[var(--text-muted)]">
                Écrivez votre sujet en Markdown, puis cliquez sur{" "}
                <span className="font-semibold text-[var(--text)]">
                  Exécuter
                </span>{" "}
                pour générer le PDF ici.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
