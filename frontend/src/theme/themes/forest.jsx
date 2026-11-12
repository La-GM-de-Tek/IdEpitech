import { useMemo } from "react";
import Particles, { rand } from "../decor/Particles";

function fireflies(mode) {
  const glow = mode === "dark" ? "253,230,138" : "202,138,4";
  return (ctx) => {
    const make = () => ({
      x: rand(0, ctx.w),
      y: rand(ctx.h * 0.2, ctx.h),
      vx: 0,
      vy: 0,
      heading: rand(0, Math.PI * 2),
      phase: rand(0, Math.PI * 2),
      speed: rand(0.25, 0.6),
    });
    let flies = [];
    const fill = () => {
      const n = Math.round(42 * ctx.density);
      while (flies.length < n) flies.push(make());
      flies.length = n;
    };
    fill();
    return {
      resize: fill,
      frame(g, dt) {
        const { pointer } = ctx;
        g.globalCompositeOperation =
          mode === "dark" ? "lighter" : "source-over";
        for (const f of flies) {
          f.heading += rand(-0.12, 0.12) * dt;
          let ax = Math.cos(f.heading) * f.speed * 0.04;
          let ay = Math.sin(f.heading) * f.speed * 0.04;
          if (pointer.active) {
            const dx = pointer.x - f.x;
            const dy = pointer.y - f.y;
            const d = Math.hypot(dx, dy);
            if (d < 320 && d > 30) {
              ax += (dx / d) * 0.025;
              ay += (dy / d) * 0.025;
            }
          }
          f.vx = (f.vx + ax * dt) * 0.97;
          f.vy = (f.vy + ay * dt) * 0.97;
          f.x += f.vx * dt * 3;
          f.y += f.vy * dt * 3;
          if (f.x < -20) f.x = ctx.w + 20;
          if (f.x > ctx.w + 20) f.x = -20;
          if (f.y < -20) f.y = ctx.h + 20;
          if (f.y > ctx.h + 20) f.y = -20;
          const blink = Math.max(0, Math.sin(ctx.t * 1.6 + f.phase));
          const a = 0.15 + blink * 0.85;
          const r = 14 * a;
          const halo = g.createRadialGradient(f.x, f.y, 0, f.x, f.y, r + 2);
          halo.addColorStop(0, `rgba(${glow},${0.55 * a})`);
          halo.addColorStop(1, `rgba(${glow},0)`);
          g.fillStyle = halo;
          g.beginPath();
          g.arc(f.x, f.y, r + 2, 0, Math.PI * 2);
          g.fill();
          g.fillStyle = `rgba(${glow},${a})`;
          g.beginPath();
          g.arc(f.x, f.y, 1.6, 0, Math.PI * 2);
          g.fill();
        }
        g.globalCompositeOperation = "source-over";
      },
    };
  };
}

function pines(count, seed, minH, maxH) {
  let s = seed;
  const next = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  let d = "";
  for (let i = 0; i < count; i++) {
    const x = (i + next() * 0.6) * (1440 / count);
    const h = minH + next() * (maxH - minH);
    const w = h * 0.42;
    const base = 200;
    for (let tier = 0; tier < 3; tier++) {
      const top = base - h + tier * h * 0.22;
      const bottom = base - h * 0.18 - (2 - tier) * h * 0.2;
      const half = w * (0.5 + tier * 0.22);
      d += `M${x.toFixed(1)} ${top.toFixed(1)} L${(x + half).toFixed(1)} ${bottom.toFixed(1)} L${(x - half).toFixed(1)} ${bottom.toFixed(1)} Z `;
    }
    d += `M${(x - 3).toFixed(1)} ${base - h * 0.2} h6 V${base} h-6 Z `;
  }
  return d;
}

const FAR = pines(26, 7, 70, 120);
const MID = pines(18, 21, 100, 160);
const NEAR = pines(9, 44, 140, 200);

function Roots({ className, flip }) {
  return (
    <svg
      className={className}
      viewBox="0 0 160 160"
      fill="none"
      stroke="var(--accent)"
      strokeWidth="4"
      strokeLinecap="round"
      style={{ opacity: 0.3, transform: flip ? "scaleX(-1)" : undefined }}
      aria-hidden="true"
    >
      <path d="M2 8c26 6 40 24 44 48s18 40 44 46" />
      <path d="M2 40c20 4 30 18 34 36" />
      <path d="M2 70c16 2 26 12 30 28" />
      <path d="M46 56c10-6 22-6 32 2" />
    </svg>
  );
}

function Mushroom({ left, size, delay }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className="fo-mushroom"
      style={{ left, width: size, animationDelay: `${delay}s` }}
      aria-hidden="true"
    >
      <path d="M17 22 h6 l1.5 16 h-9 Z" fill="var(--mush-stem)" />
      <path d="M2 24 C 2 10, 38 10, 38 24 Z" fill="var(--mush-cap)" />
      <g fill="var(--mush-dot)">
        <circle cx="13" cy="18" r="2.2" />
        <circle cx="24" cy="15" r="1.8" />
        <circle cx="30" cy="20" r="1.4" />
      </g>
    </svg>
  );
}

function ForestOverlay({ mode }) {
  const system = useMemo(() => fireflies(mode), [mode]);
  return (
    <>
      <Roots className="absolute top-14 -left-2 h-40 w-40" />
      <Roots className="absolute top-14 -right-2 h-40 w-40" flip />
      <svg
        viewBox="0 0 1440 200"
        preserveAspectRatio="xMidYMax slice"
        className="fo-trees"
        aria-hidden="true"
      >
        <path d={FAR} className="fo-tree fo-tree--far" />
        <path d={MID} className="fo-tree fo-tree--mid" />
      </svg>
      <div className="fo-fog" />
      <div className="fo-fog fo-fog--late" />
      <svg
        viewBox="0 0 1440 200"
        preserveAspectRatio="xMidYMax slice"
        className="fo-trees fo-trees--near"
        aria-hidden="true"
      >
        <path d={NEAR} className="fo-tree fo-tree--near" />
      </svg>
      <Mushroom left="6%" size={34} delay={0} />
      <Mushroom left="9%" size={22} delay={-1.4} />
      <Mushroom left="90%" size={28} delay={-0.7} />
      <div className="fo-snake decor-travel" aria-hidden="true">
        <svg viewBox="0 0 120 30" width="96">
          <path
            d="M4 18 C 16 6, 28 6, 40 18 S 64 30, 76 18 S 96 8, 104 14"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="7"
            strokeLinecap="round"
          />
          <ellipse cx="108" cy="14" rx="8" ry="6" fill="var(--accent)" />
          <circle cx="111" cy="12" r="1.4" fill="var(--bg)" />
        </svg>
      </div>
      <Particles system={system} />
    </>
  );
}

const leaves = (color) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><g fill="${color}"><path d="M60 40c-22 6-36 28-32 52 22-4 40-22 44-46 1-4-8-8-12-6z"/><path d="M140 120c-18 4-30 22-27 42 18-3 33-18 36-38 1-3-6-5-9-4z"/></g></svg>`;

export default {
  id: "forest",
  label: "Cobra Deep Forest",
  logo: "🌲",
  type: "cobra",
  group: "classic",
  font: "Amatic+SC:wght@700",
  pattern: leaves,
  Overlay: ForestOverlay,
  colors: {
    dark: {
      bg: "#07120b",
      surface: "#0f1f13",
      surfaceHover: "#162b1a",
      border: "#203925",
      borderStrong: "#335536",
      text: "#e8f3df",
      textMuted: "#abc49b",
      textFaint: "#7f9a6c",
      accent: "#a3e635",
      accentContrast: "#0a1a0d",
      accent2: "#fde68a",
      scrollThumb: "#24402a",
      scrollThumbHover: "#36583b",
    },
    light: {
      bg: "#edf4e4",
      surface: "#fbfdf7",
      surfaceHover: "#e2eed4",
      border: "#cbdcb4",
      borderStrong: "#a9c489",
      text: "#1c2e14",
      textMuted: "#4c6138",
      textFaint: "#5a6f44",
      accent: "#4d7c1f",
      accentContrast: "#ffffff",
      accent2: "#a16207",
      scrollThumb: "#c3d6a8",
      scrollThumbHover: "#a6bf85",
    },
  },
};
