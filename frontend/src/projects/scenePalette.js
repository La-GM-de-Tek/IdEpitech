export const BLACK = [0, 0, 0];
export const WHITE = [255, 255, 255];

let probe = null;

export function toRgb(value, fallback) {
  probe ??= document.createElement("canvas").getContext("2d");
  probe.fillStyle = fallback;
  if (value) probe.fillStyle = value;
  const color = probe.fillStyle;
  if (color[0] === "#") {
    return [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16));
  }
  return color
    .match(/[\d.]+/g)
    .slice(0, 3)
    .map(Number);
}

export const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
export const shade = (c, f) =>
  c.map((v) => Math.max(0, Math.min(255, Math.round(v * f))));
export const rgba = ([r, g, b], a = 1) => `rgba(${r}, ${g}, ${b}, ${a})`;

export function noise(x, y) {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (((h ^ (h >>> 16)) >>> 0) / 4294967295) * 2 - 1;
}

export function readPalette(element) {
  const style = getComputedStyle(element);
  const dark = document.documentElement.dataset.mode !== "light";
  const token = (name, fallback) =>
    toRgb(style.getPropertyValue(name).trim(), fallback);

  const bg = token("--bg", dark ? "#0d1117" : "#f6f8fa");
  const surface = token("--surface", dark ? "#151b23" : "#ffffff");
  const border = token("--border", dark ? "#252c36" : "#d8dee4");
  const strong = token("--border-strong", dark ? "#353d49" : "#c2cad3");
  const text = token("--text", dark ? "#e6edf3" : "#1f2328");
  const faint = token("--text-faint", dark ? "#7d8590" : "#636e79");
  const accent = token("--accent", dark ? "#58a6ff" : "#0969da");
  const success = token("--success", dark ? "#3fb950" : "#1a7f37");
  const gold = token("--gold", dark ? "#e3b341" : "#b7791f");
  const danger = token("--danger", dark ? "#f85149" : "#cf222e");

  const floor = dark ? bg : surface;
  const stone = mix(mix(strong, faint, dark ? 0.3 : 0.22), accent, 0.08);
  const thread = dark ? [240, 84, 88] : [204, 36, 54];

  return {
    dark,
    floor,
    floorAlt: mix(floor, dark ? surface : bg, 0.4),
    grout: mix(floor, dark ? BLACK : strong, 0.35),
    stone,
    stoneLit: mix(stone, dark ? text : WHITE, dark ? 0.22 : 0.55),
    stoneEdge: mix(stone, dark ? bg : text, dark ? 0.35 : 0.2),
    front: dark ? mix(border, bg, 0.2) : mix(strong, text, 0.26),
    frontDeep: dark ? mix(bg, BLACK, 0.3) : mix(strong, text, 0.44),
    ink: dark ? BLACK : text,
    shadowAlpha: dark ? 0.6 : 0.2,
    fog: dark ? mix(bg, BLACK, 0.5) : bg,
    fogAlpha: dark ? 0.76 : 0.72,
    thread,
    threadDeep: shade(thread, 0.6),
    threadSheen: mix(thread, WHITE, 0.5),
    threadFaded: mix(thread, floor, dark ? 0.42 : 0.45),
    accent,
    success,
    gold,
    danger,
  };
}
