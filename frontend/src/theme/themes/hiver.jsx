import { useMemo } from "react";
import Particles, { rand } from "../decor/Particles";
import { snowfall } from "./noel";

function polarSky(mode) {
  const snow = snowfall(mode, {
    count: mode === "dark" ? 60 : 110,
    crystals: mode === "dark" ? 0.1 : 0.25,
  });
  return (ctx) => {
    const flakes = snow(ctx);
    const night = mode === "dark";
    const makeStar = () => ({
      x: rand(0, ctx.w),
      y: rand(0, ctx.h * 0.65),
      r: rand(0.4, 1.5),
      phase: rand(0, Math.PI * 2),
      speed: rand(0.6, 2),
    });
    let stars = [];
    let shooting = null;
    let nextShot = ctx.t + 3;
    const fill = () => {
      const n = night ? Math.round(140 * ctx.density) : 0;
      while (stars.length < n) stars.push(makeStar());
      stars.length = n;
    };
    fill();
    return {
      resize() {
        stars = [];
        fill();
        flakes.resize();
      },
      frame(g, dt) {
        const { pointer } = ctx;
        for (const s of stars) {
          let a =
            0.35 + 0.5 * (0.5 + 0.5 * Math.sin(ctx.t * s.speed + s.phase));
          if (pointer.active) {
            const d = Math.hypot(s.x - pointer.x, s.y - pointer.y);
            if (d < 140) a = Math.min(1, a + (1 - d / 140) * 0.8);
          }
          g.fillStyle = `rgba(235,244,255,${a})`;
          g.beginPath();
          g.arc(s.x, s.y, s.r, 0, Math.PI * 2);
          g.fill();
        }
        if (night && dt > 0) {
          if (!shooting && ctx.t > nextShot) {
            shooting = {
              x: rand(ctx.w * 0.2, ctx.w),
              y: rand(0, ctx.h * 0.3),
              born: ctx.t,
            };
          }
          if (shooting) {
            const age = ctx.t - shooting.born;
            if (age > 1.1) {
              shooting = null;
              nextShot = ctx.t + rand(5, 10);
            } else {
              const k = age / 1.1;
              const hx = shooting.x - k * 420;
              const hy = shooting.y + k * 180;
              const trail = g.createLinearGradient(hx, hy, hx + 120, hy - 52);
              trail.addColorStop(0, `rgba(255,255,255,${0.9 * (1 - k)})`);
              trail.addColorStop(1, "rgba(255,255,255,0)");
              g.strokeStyle = trail;
              g.lineWidth = 1.6;
              g.beginPath();
              g.moveTo(hx, hy);
              g.lineTo(hx + 120, hy - 52);
              g.stroke();
            }
          }
        }
        flakes.frame(g, dt);
      },
    };
  };
}

function Frost({ className }) {
  const arms = [
    [0, 0, 150, 24],
    [0, 0, 120, 70],
    [0, 0, 70, 116],
    [0, 0, 22, 150],
  ];
  return (
    <svg
      viewBox="0 0 160 160"
      className={`hv-frost ${className}`}
      aria-hidden="true"
    >
      <g fill="none" stroke="currentColor" strokeLinecap="round">
        {arms.map(([x0, y0, x1, y1], i) => {
          const dx = x1 - x0;
          const dy = y1 - y0;
          const twigs = [0.3, 0.5, 0.7, 0.85].map((t) => {
            const bx = x0 + dx * t;
            const by = y0 + dy * t;
            const len = (1 - t) * 26 + 6;
            const a = Math.atan2(dy, dx);
            return `M${bx.toFixed(1)} ${by.toFixed(1)} l${(Math.cos(a + 0.7) * len).toFixed(1)} ${(Math.sin(a + 0.7) * len).toFixed(1)} M${bx.toFixed(1)} ${by.toFixed(1)} l${(Math.cos(a - 0.7) * len).toFixed(1)} ${(Math.sin(a - 0.7) * len).toFixed(1)}`;
          });
          return (
            <g key={i}>
              <path d={`M${x0} ${y0} L${x1} ${y1}`} strokeWidth="1.6" />
              <path d={twigs.join(" ")} strokeWidth="1" />
            </g>
          );
        })}
      </g>
    </svg>
  );
}

function HiverOverlay({ mode }) {
  const system = useMemo(() => polarSky(mode), [mode]);
  return (
    <>
      <div className="hv-aurora">
        <span />
        <span />
        <span />
      </div>
      <Frost className="hv-frost--left" />
      <Frost className="hv-frost--right" />
      <Particles system={system} />
      <svg
        viewBox="0 0 1440 220"
        preserveAspectRatio="xMidYMax slice"
        className="hv-mountains"
        aria-hidden="true"
      >
        <path
          d="M0 220 V150 L120 90 L210 140 L330 60 L450 150 L560 100 L690 160 L820 70 L950 150 L1060 96 L1190 156 L1310 80 L1440 140 V220 Z"
          fill="var(--peak-far)"
        />
        <path
          d="M330 60 L302 82 L318 80 L330 92 L344 78 L358 82 Z M820 70 L790 94 L808 90 L822 102 L836 88 L852 92 Z M1310 80 L1282 102 L1300 98 L1312 110 L1326 96 L1340 100 Z"
          fill="var(--peak-snow)"
          opacity="0.8"
        />
        <path
          d="M0 220 V180 L150 120 L260 176 L400 104 L540 190 L700 130 L860 196 L1000 118 L1150 186 L1290 126 L1440 178 V220 Z"
          fill="var(--peak-near)"
        />
        <path
          d="M400 104 L370 128 L388 124 L402 138 L418 122 L436 128 Z M1000 118 L972 140 L990 136 L1002 150 L1016 134 L1032 140 Z M150 120 L126 140 L142 136 L152 148 L164 136 L178 140 Z"
          fill="var(--peak-snow)"
        />
      </svg>
    </>
  );
}

export default {
  id: "hiver",
  label: "Hiver",
  logo: "❄️",
  type: "manta",
  group: "season",
  font: "Josefin+Sans:wght@500..700",
  Overlay: HiverOverlay,
  colors: {
    dark: {
      bg: "#050a1b",
      surface: "#0c142d",
      surfaceHover: "#121c3b",
      border: "#1c2850",
      borderStrong: "#2a3a6c",
      text: "#eef4ff",
      textMuted: "#b0bde2",
      textFaint: "#8494c0",
      accent: "#5eead4",
      accentContrast: "#03201b",
      accent2: "#a78bfa",
      scrollThumb: "#1f2c56",
      scrollThumbHover: "#2c3d72",
    },
    light: {
      bg: "#eef4fb",
      surface: "#ffffff",
      surfaceHover: "#e6edf8",
      border: "#d3deef",
      borderStrong: "#b8c8e3",
      text: "#0f1a33",
      textMuted: "#43507a",
      textFaint: "#59668d",
      accent: "#2563c9",
      accentContrast: "#ffffff",
      accent2: "#0f8f82",
      scrollThumb: "#cbd8ec",
      scrollThumbHover: "#a9bddd",
    },
  },
};
