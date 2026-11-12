import Monaco from "@monaco-editor/react";
import { useRef } from "react";
import { useTheme } from "../theme/ThemeContext";
import { THEMES } from "../theme/themes";

const HTML_TABS = [
  { id: "html", label: "HTML" },
  { id: "css", label: "CSS" },
  { id: "javascript", label: "JAVASCRIPT" },
];

const FONT_FAMILY = "'Atkinson Hyperlegible Mono', ui-monospace, monospace";

function alpha(hex, amount) {
  return (
    hex +
    Math.round(amount * 255)
      .toString(16)
      .padStart(2, "0")
  );
}

function defineEditorTheme(monaco, themeId, mode, palette) {
  monaco.editor.defineTheme(`idepitech-${themeId}-${mode}`, {
    base: mode === "light" ? "vs" : "vs-dark",
    inherit: true,
    rules: [],
    colors: {
      "editor.background": palette.bg,
      "editor.foreground": palette.text,
      "editorGutter.background": palette.bg,
      "editorLineNumber.foreground": alpha(palette.textFaint, 0.7),
      "editorLineNumber.activeForeground": palette.textMuted,
      "editor.lineHighlightBackground": alpha(palette.surface, 0.9),
      "editor.lineHighlightBorder": alpha(palette.surface, 0),
      "editorCursor.foreground": palette.accent,
      "editor.selectionBackground": alpha(palette.accent, 0.28),
      "editor.inactiveSelectionBackground": alpha(palette.accent, 0.14),
      "editor.selectionHighlightBackground": alpha(palette.accent, 0.12),
      "editor.wordHighlightBackground": alpha(palette.accent, 0.12),
      "editorBracketMatch.background": alpha(palette.accent, 0.16),
      "editorBracketMatch.border": alpha(palette.accent, 0.5),
      "editorIndentGuide.background1": alpha(palette.border, 0.9),
      "editorIndentGuide.activeBackground1": palette.borderStrong,
      "editorWhitespace.foreground": alpha(palette.textFaint, 0.4),
      "editorWidget.background": palette.surface,
      "editorWidget.border": palette.borderStrong,
      "editorSuggestWidget.background": palette.surface,
      "editorSuggestWidget.border": palette.borderStrong,
      "editorSuggestWidget.selectedBackground": palette.surfaceHover,
      "editorHoverWidget.background": palette.surface,
      "editorHoverWidget.border": palette.borderStrong,
      "minimap.background": palette.bg,
      "scrollbar.shadow": alpha(palette.bg, 0),
      "scrollbarSlider.background": alpha(palette.scrollThumb, 0.6),
      "scrollbarSlider.hoverBackground": palette.scrollThumb,
      "scrollbarSlider.activeBackground": palette.scrollThumbHover,
      focusBorder: alpha(palette.accent, 0),
    },
  });
}

export default function Editor({
  value,
  onChange,
  onRunRef,
  onNextRef,
  language,
  lang,
  onLangChange,
}) {
  const monacoRef = useRef(null);
  const { mode, themeId } = useTheme();

  function handleBeforeMount(monaco) {
    for (const theme of Object.values(THEMES)) {
      for (const themeMode of ["dark", "light"]) {
        defineEditorTheme(monaco, theme.id, themeMode, theme.colors[themeMode]);
      }
    }
  }

  function handleMount(editor, monaco) {
    monacoRef.current = monaco;
    editor.focus();
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      onRunRef.current?.();
    });
    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyMod.WinCtrl | monaco.KeyCode.Enter,
      () => {
        onNextRef?.current?.();
      },
    );
    document.fonts
      ?.load(`14px ${FONT_FAMILY}`)
      .then(() => monaco.editor.remeasureFonts())
      .catch(() => {});
  }

  return (
    <div className="flex h-full flex-col bg-[var(--bg)]">
      {language === "html" && (
        <div className="tabs" role="tablist">
          {HTML_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={lang === tab.id}
              onClick={() => onLangChange(tab.id)}
              className="tab"
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}
      <div className="min-h-0 flex-1">
        <Monaco
          height="100%"
          language={lang}
          theme={`idepitech-${themeId}-${mode}`}
          value={value}
          onChange={(v) => onChange(v ?? "")}
          beforeMount={handleBeforeMount}
          onMount={handleMount}
          loading={
            <span className="text-xs text-[var(--text-faint)]">
              Chargement de l'éditeur…
            </span>
          }
          options={{
            fontSize: 14,
            lineHeight: 22,
            fontFamily: FONT_FAMILY,
            fontLigatures: true,
            minimap: { enabled: true },
            scrollBeyondLastLine: true,
            smoothScrolling: true,
            tabSize: 4,
            automaticLayout: true,
            padding: { top: 16 },
            wordWrap: "on",
            renderWhitespace: "selection",
            cursorSmoothCaretAnimation: "on",
            cursorWidth: 3,
            cursorBlinking: "expand",
            roundedSelection: true,
            guides: { indentation: true },
            scrollbar: {
              verticalScrollbarSize: 10,
              horizontalScrollbarSize: 10,
            },
          }}
        />
      </div>
    </div>
  );
}
