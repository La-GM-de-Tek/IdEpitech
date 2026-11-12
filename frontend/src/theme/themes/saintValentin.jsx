import { useMemo } from "react";
import Particles, { rand, heartPath } from "../decor/Particles";

function hearts(mode) {
  const tones =
    mode === "dark"
      ? ["255,77,109", "255,143,163", "225,29,72"]
      : ["225,29,72", "244,63,94", "190,18,60"];
  return (ctx) => {
    const make = (initial) => ({
      x: rand(0, ctx.w),
      y: initial ? rand(0, ctx.h) : ctx.h + 30,
      s: rand(8, 26),
      vy: rand(-0.6, -0.2),
      tone: tones[Math.floor(Math.random() * tones.length)],
      alpha: rand(0.12, 0.35),
      outline: Math.random() < 0.35,
      phase: rand(0, Math.PI * 2),
    });
    let list = [];
    const trail = [];
    let lastTrail = 0;
    const fill = () => {
      const n = Math.round(26 * ctx.density);
      while (list.length < n) list.push(make(true));
      list.length = n;
    };
    fill();
    const draw = (g, x, y, s, tone, alpha, outline) => {
      heartPath(g, x, y - s / 2, s);
      if (outline) {
        g.strokeStyle = `rgba(${tone},${alpha})`;
        g.lineWidth = 1.6;
        g.stroke();
      } else {
        g.fillStyle = `rgba(${tone},${alpha})`;
        g.fill();
      }
    };
    return {
      resize: fill,
      frame(g, dt) {
        const { pointer } = ctx;
        const speed = Math.abs(pointer.vx) + Math.abs(pointer.vy);
        if (pointer.active && speed > 3 && ctx.t - lastTrail > 0.05) {
          trail.push({
            x: pointer.x + rand(-6, 6),
            y: pointer.y + rand(-6, 6),
            s: rand(7, 13),
            born: ctx.t,
            drift: rand(-0.4, 0.4),
            tone: tones[Math.floor(Math.random() * tones.length)],
          });
          lastTrail = ctx.t;
        }
        for (let i = 0; i < list.length; i++) {
          const h = list[i];
          h.y += h.vy * dt;
          h.x += Math.sin(ctx.t * 0.8 + h.phase) * 0.3 * dt;
          if (h.y < -40) {
            list[i] = make(false);
            continue;
          }
          const beat =
            1 + Math.max(0, Math.sin(ctx.t * 5 + h.phase)) ** 8 * 0.18;
          draw(g, h.x, h.y, h.s * beat, h.tone, h.alpha, h.outline);
        }
        for (let i = trail.length - 1; i >= 0; i--) {
          const h = trail[i];
          const age = ctx.t - h.born;
          if (age > 1.2) {
            trail.splice(i, 1);
            continue;
          }
          const k = age / 1.2;
          draw(
            g,
            h.x + h.drift * age * 30,
            h.y - age * 36,
            h.s * (1 - k * 0.4),
            h.tone,
            0.85 * (1 - k),
            false,
          );
        }
      },
    };
  };
}

function LoveLetter() {
  return (
    <div className="sv-letter" aria-hidden="true">
      <svg viewBox="0 0 120 120">
        <g className="sv-letter-heart">
          <path
            d="M60 64 C 60 58, 52 54, 48 60 C 44 66, 54 74, 60 80 C 66 74, 76 66, 72 60 C 68 54, 60 58, 60 64 Z"
            fill="var(--accent)"
          />
        </g>
        <rect
          x="14"
          y="62"
          width="92"
          height="56"
          rx="5"
          fill="var(--envelope)"
        />
        <path
          d="M14 116 L60 84 L106 116"
          fill="none"
          stroke="var(--envelope-line)"
          strokeWidth="2"
        />
        <path d="M14 66 L60 96 L106 66" fill="var(--envelope-inner)" />
        <g className="sv-flap">
          <path
            d="M14 66 L60 98 L106 66 Z"
            fill="var(--envelope)"
            stroke="var(--envelope-line)"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </g>
        <circle cx="60" cy="96" r="9" fill="var(--seal)" />
        <path
          d="M60 99 C 56 96, 55 93, 57.4 91.6 C 58.8 90.8, 60 92, 60 93 C 60 92, 61.2 90.8, 62.6 91.6 C 65 93, 64 96, 60 99 Z"
          fill="var(--seal-mark)"
        />
      </svg>
    </div>
  );
}

function SaintValentinOverlay({ mode }) {
  const system = useMemo(() => hearts(mode), [mode]);
  return (
    <>
      <Particles system={system} />
      <LoveLetter />
    </>
  );
}

const tinyHearts = (color) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><g fill="${color}"><path d="M20 26 C 20 22, 15 20, 13 24 C 11 28, 17 32, 20 35 C 23 32, 29 28, 27 24 C 25 20, 20 22, 20 26 Z"/><path d="M60 62 C 60 59, 56 57, 54.6 60 C 53 63, 57.6 66, 60 68 C 62.4 66, 67 63, 65.4 60 C 64 57, 60 59, 60 62 Z"/></g></svg>`;

export default {
  id: "saint-valentin",
  label: "Saint-Valentin",
  logo: "💘",
  type: "manta",
  group: "festive",
  font: "Yeseva+One",
  pattern: tinyHearts,
  Overlay: SaintValentinOverlay,
  colors: {
    dark: {
      bg: "#1a060c",
      surface: "#280b15",
      surfaceHover: "#34101c",
      border: "#461626",
      borderStrong: "#64213a",
      text: "#fff0f2",
      textMuted: "#f0b5c1",
      textFaint: "#c68792",
      accent: "#e11d48",
      accentContrast: "#ffffff",
      accent2: "#ff8fa3",
      scrollThumb: "#4b1a2b",
      scrollThumbHover: "#66243c",
    },
    light: {
      bg: "#fff4f5",
      surface: "#ffffff",
      surfaceHover: "#ffe9ec",
      border: "#fbd0d7",
      borderStrong: "#f4a9b6",
      text: "#3b0a16",
      textMuted: "#7d2d3f",
      textFaint: "#8f4456",
      accent: "#be123c",
      accentContrast: "#ffffff",
      accent2: "#f43f5e",
      scrollThumb: "#f7c6cf",
      scrollThumbHover: "#efa2b1",
    },
  },
};
