import { useMemo } from "react";
import Particles, { rand } from "../decor/Particles";

const LOOP =
  "M58 272 L100 162 C 126 112, 134 60, 100 40 C 66 60, 74 112, 100 162";
const TAIL = "M100 162 L142 272";

function bokeh(mode) {
  const tones =
    mode === "dark"
      ? ["255,111,174", "255,194,220", "255,150,190"]
      : ["214,51,108", "247,131,172", "240,101,149"];
  return (ctx) => {
    const make = (initial) => ({
      x: rand(0, ctx.w),
      y: initial ? rand(0, ctx.h) : ctx.h + 60,
      r: rand(6, 34),
      vy: rand(-0.45, -0.15),
      tone: tones[Math.floor(Math.random() * tones.length)],
      alpha: rand(0.06, 0.2),
      phase: rand(0, Math.PI * 2),
    });
    const ribbonPath = new Path2D(`${LOOP} ${TAIL}`);
    const makeRibbon = (initial) => ({
      x: rand(0, ctx.w),
      y: initial ? rand(0, ctx.h) : ctx.h + 40,
      vy: rand(-0.55, -0.25),
      scale: rand(0.09, 0.16),
      angle: rand(-0.4, 0.4),
      spin: rand(-0.006, 0.006),
      tone: tones[Math.floor(Math.random() * tones.length)],
      phase: rand(0, Math.PI * 2),
    });
    let list = [];
    let ribbons = [];
    const fill = () => {
      const n = Math.round(34 * ctx.density);
      while (list.length < n) list.push(make(true));
      list.length = n;
      const r = Math.round(10 * ctx.density);
      while (ribbons.length < r) ribbons.push(makeRibbon(true));
      ribbons.length = r;
    };
    fill();
    return {
      resize: fill,
      frame(g, dt) {
        const { pointer } = ctx;
        g.lineJoin = "round";
        for (let i = 0; i < ribbons.length; i++) {
          const r = ribbons[i];
          r.y += r.vy * dt;
          r.x += Math.sin(ctx.t * 0.6 + r.phase) * 0.3 * dt;
          r.angle += r.spin * dt;
          if (r.y < -60) {
            ribbons[i] = makeRibbon(false);
            continue;
          }
          g.save();
          g.translate(r.x, r.y);
          g.rotate(r.angle + Math.sin(ctx.t * 0.8 + r.phase) * 0.25);
          g.scale(r.scale, r.scale);
          g.translate(-100, -160);
          g.strokeStyle = `rgba(${r.tone},0.55)`;
          g.lineWidth = 20;
          g.stroke(ribbonPath);
          g.restore();
        }
        for (let i = 0; i < list.length; i++) {
          const b = list[i];
          b.y += b.vy * dt;
          b.x += Math.sin(ctx.t * 0.5 + b.phase) * 0.25 * dt;
          let glow = 1;
          if (pointer.active) {
            const d = Math.hypot(b.x - pointer.x, b.y - pointer.y);
            if (d < 160) glow = 1 + (1 - d / 160) * 1.6;
          }
          if (b.y < -60) {
            list[i] = make(false);
            continue;
          }
          const grad = g.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
          grad.addColorStop(
            0,
            `rgba(${b.tone},${Math.min(0.5, b.alpha * glow)})`,
          );
          grad.addColorStop(
            0.7,
            `rgba(${b.tone},${Math.min(0.35, b.alpha * 0.6 * glow)})`,
          );
          grad.addColorStop(1, `rgba(${b.tone},0)`);
          g.fillStyle = grad;
          g.beginPath();
          g.arc(b.x, b.y, b.r, 0, Math.PI * 2);
          g.fill();
        }
      },
    };
  };
}

function Ribbon() {
  return (
    <svg viewBox="0 0 200 300" className="or-ribbon" aria-hidden="true">
      <defs>
        <linearGradient id="or-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--ribbon-a)" />
          <stop offset="1" stopColor="var(--ribbon-b)" />
        </linearGradient>
      </defs>
      <path
        d={LOOP}
        pathLength="1"
        className="or-stroke"
        stroke="url(#or-grad)"
      />
      <path
        d={TAIL}
        pathLength="1"
        className="or-stroke or-stroke--tail"
        stroke="url(#or-grad)"
      />
      <path d={LOOP} pathLength="1" className="or-shine" />
      <path d={TAIL} pathLength="1" className="or-shine or-shine--tail" />
    </svg>
  );
}

function OctobreRoseOverlay({ mode }) {
  const system = useMemo(() => bokeh(mode), [mode]);
  return (
    <>
      <Particles system={system} />
      <Ribbon />
    </>
  );
}

export default {
  id: "octobre-rose",
  label: "Octobre Rose",
  logo: "🎀",
  type: "manta",
  group: "festive",
  font: "Gloock",
  Overlay: OctobreRoseOverlay,
  colors: {
    dark: {
      bg: "#1a0c14",
      surface: "#25121d",
      surfaceHover: "#301827",
      border: "#3d1f32",
      borderStrong: "#5a2d49",
      text: "#fff0f6",
      textMuted: "#e3b2cb",
      textFaint: "#b98aa3",
      accent: "#ff6fae",
      accentContrast: "#2b0716",
      accent2: "#ffc2dc",
      scrollThumb: "#45213a",
      scrollThumbHover: "#5e2d4f",
    },
    light: {
      bg: "#fff5f8",
      surface: "#ffffff",
      surfaceHover: "#ffeaf2",
      border: "#f8d3e2",
      borderStrong: "#efb4cc",
      text: "#3a0f24",
      textMuted: "#7a3a59",
      textFaint: "#8c5470",
      accent: "#d6336c",
      accentContrast: "#ffffff",
      accent2: "#f783ac",
      scrollThumb: "#f6cddd",
      scrollThumbHover: "#eeadc6",
    },
  },
};
