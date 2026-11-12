import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "../theme/ThemeContext";
import { THEME_GROUPS, loadThemeFont } from "../theme/themes";
import Icon from "./Icon";

function fontFamily(theme) {
  return theme.font
    ? `"${theme.font.split(":")[0].replaceAll("+", " ")}", var(--font-sans)`
    : "var(--font-sans)";
}

function ThemeSwatch({ theme, mode, selected, onSelect }) {
  const palette = theme.colors[mode];
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={`group flex flex-col overflow-hidden rounded-2xl border text-left transition ${
        selected
          ? "border-[var(--accent)] shadow-[0_0_0_3px_color-mix(in_oklab,var(--accent)_25%,transparent)]"
          : "border-[var(--border)] hover:border-[var(--border-strong)]"
      }`}
    >
      <span
        className="relative flex h-16 items-end justify-between px-3 pb-2"
        style={{
          background: `radial-gradient(90% 90% at 85% 0%, ${palette.accent}55, transparent 60%), linear-gradient(160deg, ${palette.surface}, ${palette.bg})`,
        }}
      >
        <span className="text-2xl leading-none transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-110">
          {theme.logo}
        </span>
        <span className="flex gap-1" aria-hidden="true">
          {[palette.accent, palette.accent2 ?? palette.accent, palette.text].map(
            (color, i) => (
              <span
                key={i}
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: color, boxShadow: `0 0 0 1.5px ${palette.bg}` }}
              />
            ),
          )}
        </span>
        {selected && (
          <span className="absolute top-2 right-2 grid h-5 w-5 place-items-center rounded-full bg-[var(--accent)] text-[var(--accent-contrast)]">
            <Icon name="check" size={12} strokeWidth={3} />
          </span>
        )}
      </span>
      <span
        className="truncate bg-[var(--surface)] px-3 py-2 text-[0.9375rem] text-[var(--text)]"
        style={{ fontFamily: fontFamily(theme) }}
      >
        {theme.label}
      </span>
    </button>
  );
}

function SettingsModal({ onClose }) {
  const { themeId, setThemeId, themes, mode, setMode } = useTheme();

  useEffect(() => {
    Object.values(themes).forEach(loadThemeFont);
  }, [themes]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return createPortal(
    <div className="overlay" onPointerDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Paramètres"
        onPointerDown={(event) => event.stopPropagation()}
        className="dialog thin-scroll max-h-[calc(100dvh-2rem)] max-w-2xl overflow-y-auto p-5 sm:p-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-[var(--text)]">
            Paramètres
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="btn btn-ghost btn-sm btn-icon"
          >
            <Icon name="x" size={16} />
          </button>
        </div>

        <div className="mt-5">
          <p className="text-xs font-semibold text-[var(--text-muted)]">
            Apparence
          </p>
          <div className="mt-2 grid max-w-xs grid-cols-2 gap-1 rounded-xl bg-[var(--bg)] p-1 shadow-[inset_0_0_0_1px_var(--border)]">
            {[
              { id: "light", icon: "sun", label: "Clair" },
              { id: "dark", icon: "moon", label: "Sombre" },
            ].map((option) => (
              <button
                key={option.id}
                type="button"
                aria-pressed={option.id === mode}
                onClick={() => setMode(option.id)}
                className={`flex h-8 items-center justify-center gap-2 rounded-[0.6rem] text-[0.8125rem] font-semibold transition ${
                  option.id === mode
                    ? "bg-[var(--surface)] text-[var(--text)] shadow-[var(--shadow-sm),inset_0_0_0_1px_var(--border-strong)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text)]"
                }`}
              >
                <Icon
                  name={option.icon}
                  size={15}
                  className={option.id === mode ? "text-[var(--accent)]" : ""}
                />
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {THEME_GROUPS.map((group) => (
          <div key={group.id} className="mt-6">
            <p className="text-xs font-semibold text-[var(--text-muted)]">
              {group.label}
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {Object.values(themes)
                .filter((theme) => theme.group === group.id)
                .map((theme) => (
                  <ThemeSwatch
                    key={theme.id}
                    theme={theme}
                    mode={mode}
                    selected={theme.id === themeId}
                    onSelect={() => setThemeId(theme.id)}
                  />
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>,
    document.body,
  );
}

export default function SettingsButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Paramètres"
        aria-label="Paramètres"
        className="btn btn-outline btn-icon group"
      >
        <Icon
          name="settings"
          size={17}
          className="transition-transform duration-500 group-hover:rotate-90"
        />
      </button>

      {open && <SettingsModal onClose={() => setOpen(false)} />}
    </>
  );
}
