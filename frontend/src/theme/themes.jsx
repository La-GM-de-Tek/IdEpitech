import manta from "./themes/manta";
import cobra from "./themes/cobra";
import aquarium from "./themes/aquarium";
import forest from "./themes/forest";
import printemps from "./themes/printemps";
import ete from "./themes/ete";
import automne from "./themes/automne";
import hiver from "./themes/hiver";
import nouvelAn from "./themes/nouvelAn";
import saintValentin from "./themes/saintValentin";
import paques from "./themes/paques";
import octobreRose from "./themes/octobreRose";
import halloween from "./themes/halloween";
import noel from "./themes/noel";
import { DefaultOverlay } from "./themes/defaultTheme";

const defaultTheme = {
  id: "default",
  label: "Default",
  logo: "🐟",
  type: "manta",
  group: "classic",
  Overlay: DefaultOverlay,
  colors: {
    dark: {
      bg: "#0d1117",
      surface: "#151b23",
      surfaceHover: "#1b222c",
      border: "#252c36",
      borderStrong: "#353d49",
      text: "#e6edf3",
      textMuted: "#9ea7b3",
      textFaint: "#7d8590",
      accent: "#58a6ff",
      accentContrast: "#0d1117",
      accent2: "#a78bfa",
      scrollThumb: "#2a313b",
      scrollThumbHover: "#3d4652",
    },
    light: {
      bg: "#f6f8fa",
      surface: "#ffffff",
      surfaceHover: "#f0f3f6",
      border: "#d8dee4",
      borderStrong: "#c2cad3",
      text: "#1f2328",
      textMuted: "#535c66",
      textFaint: "#636e79",
      accent: "#0969da",
      accentContrast: "#ffffff",
      accent2: "#8250df",
      scrollThumb: "#c4ccd4",
      scrollThumbHover: "#a6b0ba",
    },
  },
};

const ORDER = [
  defaultTheme,
  manta,
  cobra,
  aquarium,
  forest,
  printemps,
  ete,
  automne,
  hiver,
  nouvelAn,
  saintValentin,
  paques,
  octobreRose,
  halloween,
  noel,
];

export const THEMES = Object.fromEntries(
  ORDER.map((theme) => [theme.id, theme]),
);

export const THEME_GROUPS = [
  { id: "classic", label: "Classiques" },
  { id: "season", label: "Saisons" },
  { id: "festive", label: "Fêtes" },
];

export const DEFAULT_THEME = "hiver";
export const DEFAULT_MODE = "dark";

export function themeFontHref(theme) {
  return theme.font
    ? `https://fonts.googleapis.com/css2?family=${theme.font}&display=swap`
    : null;
}

export function loadThemeFont(theme) {
  const href = themeFontHref(theme);
  if (!href) return;
  const id = `theme-font-${theme.id}`;
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
}

function paletteToVars(palette) {
  return Object.entries(palette)
    .map(
      ([key, value]) =>
        `--${key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}: ${value};`,
    )
    .join("");
}

export function buildThemeCss() {
  let css = `:root{${paletteToVars(THEMES[DEFAULT_THEME].colors[DEFAULT_MODE])}}`;
  for (const theme of Object.values(THEMES)) {
    for (const mode of ["dark", "light"]) {
      css += `[data-theme="${theme.id}"][data-mode="${mode}"]{${paletteToVars(
        theme.colors[mode],
      )}}`;
    }
  }

  return css;
}

export function applyThemeStyles() {
  const id = "theme-vars";
  let element = document.getElementById(id);
  if (!element) {
    element = document.createElement("style");
    element.id = id;
    document.head.appendChild(element);
  }
  element.textContent = buildThemeCss();
}
