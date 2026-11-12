import { useTheme } from "../theme/ThemeContext";

export default function ThemeDecorations() {
  const { theme, themeId, mode } = useTheme();
  const Overlay = theme.Overlay;

  return (
    <div className="theme-decorations" aria-hidden="true">
      <div className="decor-sky" />
      {Overlay && (
        <Overlay
          key={`${themeId}-${mode}`}
          mode={mode}
          palette={theme.colors[mode]}
        />
      )}
    </div>
  );
}
