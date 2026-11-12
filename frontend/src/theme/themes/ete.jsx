import { useMemo } from "react";
import Particles, { rand } from "../decor/Particles";

function seaGlints(mode) {
  const glint = mode === "dark" ? "255,214,150" : "255,255,255";
  const ring = mode === "dark" ? "255,180,140" : "255,255,255";
  return (ctx) => {
    const sea = () => ctx.h * 0.78;
    const make = () => ({
      x: rand(0, ctx.w),
      y: rand(sea(), ctx.h),
      phase: rand(0, Math.PI * 2),
      speed: rand(1.2, 2.6),
      size: rand(2, 6),
    });
    let glints = [];
    const ripples = [];
    let lastRipple = 0;
    const fill = () => {
      const n = Math.round(40 * ctx.density);
      while (glints.length < n) glints.push(make());
      glints.length = n;
    };
    fill();
    return {
      resize() {
        glints = [];
        fill();
      },
      frame(g) {
        const { pointer } = ctx;
        const moving = Math.abs(pointer.vx) + Math.abs(pointer.vy) > 2;
        if (
          pointer.active &&
          moving &&
          pointer.y > sea() &&
          ctx.t - lastRipple > 0.12
        ) {
          ripples.push({ x: pointer.x, y: pointer.y, born: ctx.t });
          lastRipple = ctx.t;
        }
        for (let i = ripples.length - 1; i >= 0; i--) {
          const r = ripples[i];
          const age = ctx.t - r.born;
          if (age > 1.6) {
            ripples.splice(i, 1);
            continue;
          }
          const k = age / 1.6;
          g.strokeStyle = `rgba(${ring},${0.6 * (1 - k)})`;
          g.lineWidth = 1.5;
          g.beginPath();
          g.ellipse(r.x, r.y, 6 + k * 46, 2 + k * 12, 0, 0, Math.PI * 2);
          g.stroke();
        }
        for (const s of glints) {
          const tw = Math.sin(ctx.t * s.speed + s.phase);
          if (tw < 0.2) continue;
          const a = (tw - 0.2) / 0.8;
          const len = s.size * a;
          g.strokeStyle = `rgba(${glint},${a * 0.9})`;
          g.lineWidth = 1.4;
          g.beginPath();
          g.moveTo(s.x - len, s.y);
          g.lineTo(s.x + len, s.y);
          g.moveTo(s.x, s.y - len * 0.6);
          g.lineTo(s.x, s.y + len * 0.6);
          g.stroke();
        }
      },
    };
  };
}

function Sun() {
  return (
    <div className="ete-sun" aria-hidden="true">
      <svg viewBox="0 0 200 200" className="ete-rays">
        {Array.from({ length: 16 }, (_, i) => (
          <path
            key={i}
            d="M100 6 L106 34 L94 34 Z"
            transform={`rotate(${i * 22.5} 100 100)`}
          />
        ))}
      </svg>
      <span className="ete-disk" />
    </div>
  );
}

function Sunset() {
  return (
    <div className="ete-sunset" aria-hidden="true">
      <span />
    </div>
  );
}

function Gull({ top, size, dur, delay }) {
  return (
    <div
      className="ete-gull decor-travel"
      style={{ top, "--dur": `${dur}s`, animationDelay: `${delay}s` }}
    >
      <svg viewBox="0 0 40 16" width={size} aria-hidden="true">
        <path
          className="ete-gull-wings"
          d="M2 10 C 8 2, 14 2, 20 10 C 26 2, 32 2, 38 10"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function EteOverlay({ mode }) {
  const system = useMemo(() => seaGlints(mode), [mode]);
  return (
    <>
      {mode === "dark" ? <Sunset /> : <Sun />}
      <Gull top="18%" size={34} dur={38} delay={-6} />
      <Gull top="26%" size={24} dur={46} delay={-20} />
      <Gull top="14%" size={18} dur={54} delay={-34} />
      <div className="ete-sea">
        <span className="ete-wave ete-wave--back" />
        <span className="ete-wave ete-wave--mid" />
        <span className="ete-wave ete-wave--front" />
      </div>
      <Particles system={system} />
    </>
  );
}

export default {
  id: "ete",
  label: "Été",
  logo: "☀️",
  type: "manta",
  group: "season",
  font: "Shrikhand",
  Overlay: EteOverlay,
  colors: {
    dark: {
      bg: "#14112b",
      surface: "#1e1a3d",
      surfaceHover: "#27224d",
      border: "#332c5c",
      borderStrong: "#4a3f7d",
      text: "#fff4ec",
      textMuted: "#d8c2d2",
      textFaint: "#ab95b0",
      accent: "#ff8c5a",
      accentContrast: "#2a0e02",
      accent2: "#ffd166",
      scrollThumb: "#3a3268",
      scrollThumbHover: "#4f4589",
    },
    light: {
      bg: "#eaf7ff",
      surface: "#ffffff",
      surfaceHover: "#e0f2fd",
      border: "#cbe6f5",
      borderStrong: "#a7d3ec",
      text: "#0d2b3e",
      textMuted: "#3d5f75",
      textFaint: "#557388",
      accent: "#c93f28",
      accentContrast: "#ffffff",
      accent2: "#f2a900",
      scrollThumb: "#c3e1f2",
      scrollThumbHover: "#9fcbe6",
    },
  },
};
