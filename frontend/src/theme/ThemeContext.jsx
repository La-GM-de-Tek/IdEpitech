import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { DEFAULT_MODE, DEFAULT_THEME, THEMES, loadThemeFont } from "./themes";

const THEME_KEY = "manta-theme";
const MODE_KEY = "manta-mode";

const ThemeContext = createContext(null);

function readStored(key, fallback, allowed) {
  const value = localStorage.getItem(key);
  return allowed.includes(value) ? value : fallback;
}

export function ThemeProvider({ children }) {
  const [themeId, setThemeId] = useState(() =>
    readStored(THEME_KEY, DEFAULT_THEME, Object.keys(THEMES)),
  );
  const [mode, setMode] = useState(() =>
    readStored(MODE_KEY, DEFAULT_MODE, ["light", "dark"]),
  );

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", themeId);
    root.setAttribute("data-mode", mode);
    root.classList.toggle("dark", mode === "dark");

    localStorage.setItem(THEME_KEY, themeId);
    localStorage.setItem(MODE_KEY, mode);

    const theme = THEMES[themeId];
    loadThemeFont(theme);
    const svg = theme.pattern?.(theme.colors[mode].accent);
    if (svg) {
      root.style.setProperty(
        "--home-pattern",
        `url("data:image/svg+xml,${encodeURIComponent(svg)}")`,
      );
    } else {
      root.style.removeProperty("--home-pattern");
    }
  }, [themeId, mode]);

  const toggleMode = useCallback(
    () => setMode((prev) => (prev === "dark" ? "light" : "dark")),
    [],
  );

  const value = useMemo(
    () => ({
      themeId,
      setThemeId,
      theme: THEMES[themeId],
      themes: THEMES,
      mode,
      setMode,
      toggleMode,
    }),
    [themeId, mode, toggleMode],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
