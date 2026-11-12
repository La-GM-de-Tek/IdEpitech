import { useMemo } from "react";
import Particles, { rand } from "../decor/Particles";

function marineSnow(mode) {
  const tint = mode === "dark" ? "180,225,255" : "20,90,150";
  return (ctx) => {
    const make = (initial) => {
      const z = Math.random();
      return {
        x: rand(0, ctx.w),
        y: initial ? rand(0, ctx.h) : ctx.h + 10,
        z,
        r: 0.6 + z * 1.8,
        vy: -(0.05 + z * 0.22),
        drift: rand(0, Math.PI * 2),
        vx: 0,
      };
    };
    let specks = [];
    const fill = () => {
      const n = Math.round(110 * ctx.density);
      while (specks.length < n) specks.push(make(true));
      specks.length = n;
    };
    fill();
    return {
      resize: fill,
      frame(g, dt) {
        const { pointer } = ctx;
        for (let i = 0; i < specks.length; i++) {
          const p = specks[i];
          if (pointer.active) {
            const dx = p.x - pointer.x;
            const dy = p.y - pointer.y;
            const d2 = dx * dx + dy * dy;
            if (d2 < 200 * 200) {
              const k = (1 - Math.sqrt(d2) / 200) * 0.06;
              p.vx += pointer.vx * k;
              p.vy += pointer.vy * k * 0.5;
            }
          }
          p.vx *= 0.96;
          p.vy += (-(0.05 + p.z * 0.22) - p.vy) * 0.02;
          p.x += (p.vx + Math.sin(ctx.t * 0.4 + p.drift) * 0.15) * dt;
          p.y += p.vy * dt;
          if (p.y < -10) specks[i] = make(false);
          if (p.x < -10) p.x += ctx.w + 20;
          if (p.x > ctx.w + 10) p.x -= ctx.w + 20;
          const a = 0.18 + p.z * 0.5;
          g.fillStyle = `rgba(${tint},${a})`;
          g.beginPath();
          g.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          g.fill();
        }
      },
    };
  };
}

export function MantaShape({ className, style }) {
  return (
    <svg
      viewBox="0 0 160 200"
      className={className}
      style={style}
      aria-hidden="true"
    >
      <g className="manta-wing manta-wing--top">
        <path d="M126 100 C 121 84, 104 58, 50 6 C 60 42, 58 76, 42 100 Z" />
      </g>
      <g className="manta-wing manta-wing--bottom">
        <path d="M126 100 C 121 116, 104 142, 50 194 C 60 158, 58 124, 42 100 Z" />
      </g>
      <path d="M124 91 C 134 86, 141 89, 139 96 C 134 95, 129 95, 123 97 Z" />
      <path d="M124 109 C 134 114, 141 111, 139 104 C 134 105, 129 105, 123 103 Z" />
      <path d="M46 98.5 L 0 99.6 L 0 100.4 L 46 101.5 Z" />
      <ellipse className="manta-belly" cx="92" cy="100" rx="26" ry="9" />
    </svg>
  );
}

function MantaOverlay({ mode }) {
  const system = useMemo(() => marineSnow(mode), [mode]);
  return (
    <>
      <div className="manta-rays">
        {[8, 26, 47, 66, 84].map((left, i) => (
          <span
            key={left}
            style={{
              left: `${left}%`,
              animationDelay: `${-i * 2.7}s`,
              width: `${110 + (i % 3) * 70}px`,
            }}
          />
        ))}
      </div>
      <div
        className="manta-glide decor-travel"
        style={{ "--dur": "70s", "--delay": "-24s", "--y": "18vh" }}
      >
        <MantaShape className="manta manta--far" />
      </div>
      <div
        className="manta-glide decor-travel"
        style={{ "--dur": "46s", "--delay": "-8s", "--y": "52vh" }}
      >
        <MantaShape className="manta manta--near" />
      </div>
      <Particles system={system} />
    </>
  );
}

export default {
  id: "manta",
  label: "Manta",
  logo: "🐟",
  type: "manta",
  group: "classic",
  font: "Unbounded:wght@500..800",
  Overlay: MantaOverlay,
  colors: {
    dark: {
      bg: "#061325",
      surface: "#0b1d35",
      surfaceHover: "#102641",
      border: "#17304f",
      borderStrong: "#244369",
      text: "#e4f1ff",
      textMuted: "#a2bbd8",
      textFaint: "#7d97b8",
      accent: "#4cc9ff",
      accentContrast: "#04121f",
      accent2: "#8b7bff",
      scrollThumb: "#1a3456",
      scrollThumbHover: "#26476f",
    },
    light: {
      bg: "#eaf5fc",
      surface: "#ffffff",
      surfaceHover: "#e1f0fa",
      border: "#cbe1f0",
      borderStrong: "#aecde4",
      text: "#0b2340",
      textMuted: "#3d5a7a",
      textFaint: "#566f8c",
      accent: "#0a6aae",
      accentContrast: "#ffffff",
      accent2: "#5b4bd6",
      scrollThumb: "#c5dcec",
      scrollThumbHover: "#a5c4dc",
    },
  },
};
