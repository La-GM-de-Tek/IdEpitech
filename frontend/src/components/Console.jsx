import { useEffect, useLayoutEffect, useRef } from "react";
import Icon from "./Icon";

const STREAM_STYLE = {
  stdout: "text-[var(--text)]",
  stderr: "text-[var(--danger)]",
  system: "text-[var(--text-faint)] italic",
  result: "text-[var(--success)]",
  prompt: "text-[var(--accent)]",
  input: "text-[var(--warning)]",
};

export default function Console({
  lines,
  awaitingInput,
  onSubmitInput,
  onClear,
}) {
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useLayoutEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
  }, [lines, awaitingInput]);

  useEffect(() => {
    if (awaitingInput) inputRef.current?.focus();
  }, [awaitingInput]);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[var(--bg)]">
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

      <div
        ref={scrollRef}
        className="thin-scroll flex-1 overflow-auto px-4 py-3 font-mono text-[13px] leading-relaxed"
      >
        {lines.length === 0 && !awaitingInput && (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center font-sans text-sm text-[var(--text-faint)]">
            <Icon name="terminal" size={22} />
            <p>
              Lancez votre code avec <span className="kbd">⌘↵</span> pour voir
              le résultat ici.
            </p>
          </div>
        )}

        {lines.map((line, index) => (
          <span
            key={index}
            className={`whitespace-pre-wrap ${STREAM_STYLE[line.stream] || ""}`}
          >
            {line.text}
          </span>
        ))}

        {awaitingInput && (
          <form
            className="mt-1 flex items-center rounded-md bg-[color-mix(in_oklab,var(--warning)_8%,transparent)] px-2 py-1 shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--warning)_30%,transparent)]"
            onSubmit={(event) => {
              event.preventDefault();
              onSubmitInput(inputRef.current.value);
              inputRef.current.value = "";
            }}
          >
            <span className="text-[var(--accent)]">❯&nbsp;</span>
            <input
              ref={inputRef}
              className="flex-1 bg-transparent font-mono text-[13px] text-[var(--warning)] outline-none"
              autoComplete="off"
              spellCheck={false}
            />
          </form>
        )}
      </div>
    </div>
  );
}
