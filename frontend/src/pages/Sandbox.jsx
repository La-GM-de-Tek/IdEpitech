import { useCallback, useEffect, useRef, useState } from "react";
import { useHideDecorations } from "../components/ThemeBackground";
import Editor from "../components/Editor";
import Toolbar from "../components/Toolbar";
import Subject from "../components/Subject";
import { usePythonLanguage, SAMPLE_PYTHON } from "../languages/python";
import { useHtmlLanguage, SAMPLE_HTML } from "../languages/html";
import { useCLanguage, SAMPLE_C } from "../languages/c";
import Hints from "../components/Hints";
import Icon from "../components/Icon";
import { completionMark } from "../completion";
import { trackRun, trackTime } from "../activity";

const STORAGE_KEY = "manta-code-";
const TIME_TICK_SECONDS = 30;

function buildHtmlDocument({ html, css, javascript }) {
  const styleTag = css ? `\n<style>\n${css}\n</style>` : "";
  const scriptTag = javascript ? `\n<script>\n${javascript}\n</script>` : "";
  return `${html}${styleTag}${scriptTag}`;
}

export default function Sandbox({ project, onBack, onNext }) {
  useHideDecorations(true);
  const language = project.language;
  const isHtml = language === "html";

  const getSample = (language) => {
    if (language == "html") return SAMPLE_HTML;
    if (language == "python") return SAMPLE_PYTHON;
    if (language == "c") return SAMPLE_C;
    return "";
  };

  const [lang, setLang] = useState(language);

  const [files, setFiles] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY + project.id);

    if (isHtml) {
      if (saved) {
        try {
          return { html: "", css: "", javascript: "", ...JSON.parse(saved) };
        } catch {
          return { html: saved, css: "", javascript: "" };
        }
      }
      return {
        html: project.explanation ?? SAMPLE_HTML,
        css: "",
        javascript: "",
      };
    }

    return { [language]: saved ?? project.explanation ?? getSample(language) };
  });

  const code = files[lang] ?? "";
  const setCode = useCallback(
    (next) => setFiles((prev) => ({ ...prev, [lang]: next })),
    [lang],
  );
  const [editorWidth, setEditorWidth] = useState(50);
  const [rightPanel, setRightPanel] = useState(false);
  const runRef = useRef(null);
  const nextRef = useRef(null);
  const splitRef = useRef(null);
  const dragStateRef = useRef({ startX: 0, startWidth: 50 });

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY + project.id,
      isHtml ? JSON.stringify(files) : files[language],
    );
  }, [files]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!document.hidden) trackTime(project.id, TIME_TICK_SECONDS);
    }, TIME_TICK_SECONDS * 1000);
    return () => clearInterval(timer);
  }, [project.id]);

  const onRequestPanel = useCallback(() => setRightPanel(true), []);

  const goNext = useCallback(() => {
    if (!onNext) return;
    if (!(project.hasEnd && completionMark(project.id))) return;
    onNext();
  }, [onNext, project]);

  nextRef.current = goNext;

  useEffect(() => {
    if (!onNext) return;
    const handleKeyDown = (event) => {
      if (event.ctrlKey && event.metaKey && event.key === "Enter") {
        event.preventDefault();
        goNext();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onNext, goNext]);

  const getActive = (language) => {
    if (language == "html") return useHtmlLanguage({ onRequestPanel, project });
    if (language == "python")
      return usePythonLanguage({ onRequestPanel, project, onNext });
    if (language == "c")
      return useCLanguage({ onRequestPanel, project, onNext });
    return "";
  };

  const active = getActive(language);

  const { status, version, execute, renderPanel } = active;

  const handleRun = useCallback(() => {
    if (status === "ready" || status === "running") trackRun(project.id);
    return execute(isHtml ? buildHtmlDocument(files) : files[language]);
  }, [execute, files, isHtml, language, project.id, status]);

  runRef.current = handleRun;

  const handleDragMove = useCallback((event) => {
    const container = splitRef.current;

    if (!container) return;

    const { startX, startWidth } = dragStateRef.current;
    const delta = event.clientX - startX;
    const nextWidth = startWidth + (delta / container.clientWidth) * 100;
    setEditorWidth(Math.min(80, Math.max(20, nextWidth)));
  }, []);

  const stopDragging = useCallback(
    (event) => {
      const target = event.currentTarget;
      if (target.hasPointerCapture?.(event.pointerId)) {
        target.releasePointerCapture(event.pointerId);
      }
      target.removeEventListener("pointermove", handleDragMove);
      target.removeEventListener("pointerup", stopDragging);
      target.removeEventListener("pointercancel", stopDragging);

      document.body.style.userSelect = "";
      document.body.style.cursor = "";
      dragStateRef.current = null;
    },
    [handleDragMove],
  );

  const handleDividerPointerDown = useCallback(
    (event) => {
      if (event.button !== 0) return;
      event.preventDefault();

      const target = event.currentTarget;
      target.setPointerCapture(event.pointerId);

      dragStateRef.current = {
        startX: event.clientX,
        startWidth: editorWidth,
        pointerId: event.pointerId,
      };

      document.body.style.userSelect = "none";
      document.body.style.cursor = "col-resize";

      target.addEventListener("pointermove", handleDragMove);
      target.addEventListener("pointerup", stopDragging);
      target.addEventListener("pointercancel", stopDragging);
    },
    [editorWidth, handleDragMove, stopDragging],
  );
  return (
    <div className="relative hidden h-full flex-col bg-[var(--bg)] md:flex">
      <Toolbar
        status={status}
        version={version}
        onRun={handleRun}
        onBack={onBack}
        language={language}
        projectName={project.name}
        ok={project.hasEnd && completionMark(project.id)}
        code={isHtml ? buildHtmlDocument(files) : files[language]}
      />

      <main
        ref={splitRef}
        className="grid flex-1 grid-cols-1 overflow-hidden md:flex md:flex-row"
      >
        <section
          className="min-h-0 min-w-0"
          style={{
            flex: `0 0 ${editorWidth}%`,
          }}
        >
          <Editor
            value={code}
            onChange={setCode}
            onRunRef={runRef}
            onNextRef={nextRef}
            language={language}
            lang={lang}
            onLangChange={setLang}
          />
        </section>
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize editor and console"
          onPointerDown={handleDividerPointerDown}
          className="split-handle hidden md:block"
        />
        <section className="flex min-h-0 min-w-0 flex-col md:flex-1">
          {project.subject && (
            <div className="tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={!rightPanel}
                onClick={() => setRightPanel(false)}
                className="tab"
              >
                <Icon name="file" size={14} />
                SUJET
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={rightPanel}
                onClick={() => setRightPanel(true)}
                className="tab"
              >
                <Icon name="terminal" size={14} />
                {project.id === "fil-ariane" ? "LABYRINTHE" : "CONSOLE"}
              </button>
            </div>
          )}
          {rightPanel || !project.subject ? (
            renderPanel()
          ) : (
            <Subject subject={project.subject} />
          )}
        </section>
      </main>
      <Hints project={project} />
    </div>
  );
}
