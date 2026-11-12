import { useMemo } from "react";
import Particles, { rand } from "../decor/Particles";

function goldDust(mode) {
  const tint = mode === "dark" ? "236,196,96" : "150,104,10";
  return (ctx) => {
    const make = () => ({
      x: rand(0, ctx.w),
      y: rand(0, ctx.h),
      vx: rand(-0.15, 0.15),
      vy: rand(-0.15, 0.15),
      r: rand(0.6, 2.2),
      phase: rand(0, Math.PI * 2),
    });
    let motes = [];
    const fill = () => {
      const n = Math.round(90 * ctx.density);
      while (motes.length < n) motes.push(make());
      motes.length = n;
    };
    fill();
    return {
      resize: fill,
      frame(g, dt) {
        const { pointer } = ctx;
        for (const p of motes) {
          if (pointer.active) {
            const dx = pointer.x - p.x;
            const dy = pointer.y - p.y;
            const d = Math.hypot(dx, dy);
            if (d < 220 && d > 4) {
              const k = (1 - d / 220) * 0.05;
              p.vx += (-dy / d) * k * 2.4 + (dx / d) * k * 0.6;
              p.vy += (dx / d) * k * 2.4 + (dy / d) * k * 0.6;
            }
          }
          p.vx += rand(-0.01, 0.01);
          p.vy += rand(-0.01, 0.01) - 0.002;
          p.vx *= 0.97;
          p.vy *= 0.97;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          if (p.x < -10) p.x = ctx.w + 10;
          if (p.x > ctx.w + 10) p.x = -10;
          if (p.y < -10) p.y = ctx.h + 10;
          if (p.y > ctx.h + 10) p.y = -10;
          const twinkle = 0.5 + 0.5 * Math.sin(ctx.t * 2 + p.phase);
          g.fillStyle = `rgba(${tint},${0.15 + twinkle * 0.55})`;
          g.beginPath();
          g.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          g.fill();
        }
      },
    };
  };
}

function Cobra() {
  return (
    <svg viewBox="0 0 220 320" className="cobra-figure" aria-hidden="true">
      <defs>
        <linearGradient id="cobra-rim" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--accent2)" stopOpacity="0.7" />
          <stop offset="1" stopColor="var(--accent)" stopOpacity="0.15" />
        </linearGradient>
      </defs>
      <ellipse cx="110" cy="296" rx="92" ry="20" className="cobra-body" />
      <ellipse
        cx="112"
        cy="282"
        rx="70"
        ry="17"
        className="cobra-body cobra-rim"
      />
      <g className="cobra-sway">
        <path
          d="M112 282 C 156 252, 156 210, 122 182 C 94 158, 96 132, 110 112"
          className="cobra-neck"
        />
        <g className="cobra-hood">
          <path
            d="M110 40 C 141 44, 158 72, 153 106 C 149 132, 128 148, 110 152 C 92 148, 71 132, 67 106 C 62 72, 79 44, 110 40 Z"
            className="cobra-body cobra-rim"
          />
          <path
            d="M99 108 Q110 113 121 108 M97 119 Q110 124 123 119 M98 130 Q110 135 122 130 M101 140 Q110 144 119 140"
            className="cobra-mark"
          />
        </g>
        <path
          d="M110 70 L110 84 M110 84 L105 91 M110 84 L115 91"
          className="cobra-tongue"
        />
        <ellipse
          cx="110"
          cy="54"
          rx="15"
          ry="19"
          className="cobra-body cobra-rim"
        />
        <circle cx="104" cy="49" r="2.4" className="cobra-eye" />
        <circle cx="116" cy="49" r="2.4" className="cobra-eye" />
      </g>
    </svg>
  );
}

function CobraOverlay({ mode }) {
  const system = useMemo(() => goldDust(mode), [mode]);
  return (
    <>
      <div className="cobra-shafts">
        <span />
        <span />
        <span />
      </div>
      <Cobra />
      <Particles system={system} />
    </>
  );
}

const scales = (color) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="28" viewBox="0 0 48 28"><g fill="none" stroke="${color}" stroke-width="1.6"><path d="M0 14 A12 12 0 0 1 24 14 A12 12 0 0 1 48 14"/><path d="M-12 28 A12 12 0 0 1 12 28 A12 12 0 0 1 36 28 A12 12 0 0 1 60 28"/><path d="M-12 0 A12 12 0 0 1 12 0 A12 12 0 0 1 36 0 A12 12 0 0 1 60 0"/></g></svg>`;

export default {
  id: "cobra",
  label: "Cobra",
  logo: "🐍",
  type: "cobra",
  group: "classic",
  font: "Cinzel:wght@600..800",
  pattern: scales,
  Overlay: CobraOverlay,
  colors: {
    dark: {
      bg: "#07110c",
      surface: "#0d1b13",
      surfaceHover: "#12241a",
      border: "#1d3425",
      borderStrong: "#2b4b36",
      text: "#ecf6ea",
      textMuted: "#a8c4ab",
      textFaint: "#809d84",
      accent: "#3ddc84",
      accentContrast: "#04120a",
      accent2: "#e0b84a",
      scrollThumb: "#1e3627",
      scrollThumbHover: "#2d4f39",
    },
    light: {
      bg: "#f5f0e2",
      surface: "#fffcf3",
      surfaceHover: "#efe7d2",
      border: "#e0d4b8",
      borderStrong: "#cdbd98",
      text: "#1b2a1e",
      textMuted: "#4c5a45",
      textFaint: "#636e58",
      accent: "#127a43",
      accentContrast: "#ffffff",
      accent2: "#a87b12",
      scrollThumb: "#d9cba8",
      scrollThumbHover: "#c4b286",
    },
  },
};
