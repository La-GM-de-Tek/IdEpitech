import { useMemo } from "react";
import Particles, { rand } from "../decor/Particles";

function sakura(mode) {
  const tones =
    mode === "dark"
      ? ["255,183,213", "255,214,230", "255,160,200"]
      : ["244,143,177", "248,187,208", "236,112,160"];
  return (ctx) => {
    const petal = new Path2D(
      "M0 -7 C 5 -6 6 2 0 7 C -6 2 -5 -6 0 -7 Z M0 -7 L-1.6 -4.6 L0 -5.4 L1.6 -4.6 Z",
    );
    const make = (initial) => ({
      x: rand(-40, ctx.w),
      y: initial ? rand(0, ctx.h) : rand(-60, -10),
      vx: rand(0.2, 0.6),
      vy: rand(0.45, 1),
      size: rand(0.8, 1.6),
      angle: rand(0, Math.PI * 2),
      spin: rand(-0.03, 0.03),
      flip: rand(0, Math.PI * 2),
      tone: tones[Math.floor(Math.random() * tones.length)],
      phase: rand(0, Math.PI * 2),
    });
    let petals = [];
    const fill = () => {
      const n = Math.round(48 * ctx.density);
      while (petals.length < n) petals.push(make(true));
      petals.length = n;
    };
    fill();
    return {
      resize: fill,
      frame(g, dt) {
        const { pointer } = ctx;
        for (let i = 0; i < petals.length; i++) {
          const p = petals[i];
          let sx = 0;
          let sy = 0;
          if (pointer.active) {
            const dx = p.x - pointer.x;
            const dy = p.y - pointer.y;
            const d = Math.hypot(dx, dy);
            if (d < 150 && d > 1) {
              const k = (1 - d / 150) * 2.2;
              sx = (-dy / d) * k;
              sy = (dx / d) * k;
            }
          }
          p.x += (p.vx + Math.sin(ctx.t * 1.1 + p.phase) * 0.45 + sx) * dt;
          p.y += (p.vy + sy) * dt;
          p.angle += p.spin * dt;
          p.flip += 0.05 * dt;
          if (p.y > ctx.h + 20 || p.x > ctx.w + 40) {
            petals[i] = make(false);
            continue;
          }
          g.save();
          g.translate(p.x, p.y);
          g.rotate(p.angle);
          g.scale(p.size, p.size * (0.35 + 0.65 * Math.abs(Math.cos(p.flip))));
          g.fillStyle = `rgba(${p.tone},0.85)`;
          g.fill(petal, "evenodd");
          g.restore();
        }
      },
    };
  };
}

function Blossom({ x, y, r = 1, delay }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${r})`}>
      <g className="pr-blossom" style={{ animationDelay: `${delay}s` }}>
        {[0, 72, 144, 216, 288].map((a) => (
          <ellipse
            key={a}
            cx="0"
            cy="-6"
            rx="4.6"
            ry="6.4"
            fill="var(--petal)"
            transform={`rotate(${a})`}
          />
        ))}
        <circle r="2.6" fill="var(--petal-heart)" />
        <g fill="var(--stamen)">
          <circle cx="2.6" cy="-2.2" r="0.9" />
          <circle cx="-2.4" cy="-2.4" r="0.9" />
          <circle cx="0" cy="3" r="0.9" />
        </g>
      </g>
    </g>
  );
}

const FLOWERS = [
  [96, 40, 1.2],
  [128, 58, 0.9],
  [164, 44, 1.3],
  [210, 60, 1],
  [238, 40, 0.8],
  [270, 70, 1.15],
  [306, 58, 0.9],
  [118, 92, 1],
  [150, 112, 0.8],
  [338, 84, 1.05],
  [58, 30, 0.85],
  [196, 90, 0.9],
];

function Branch({ className }) {
  return (
    <svg viewBox="0 0 380 160" className={className} aria-hidden="true">
      <g fill="none" stroke="var(--bark)" strokeLinecap="round">
        <path
          d="M-10 18 C 60 26, 120 44, 200 56 C 260 64, 320 70, 372 86"
          strokeWidth="8"
        />
        <path d="M110 40 C 124 66, 134 90, 150 116" strokeWidth="4" />
        <path d="M200 56 C 222 38, 240 32, 262 30" strokeWidth="3.5" />
        <path d="M270 66 C 286 52, 300 50, 316 54" strokeWidth="2.5" />
      </g>
      {FLOWERS.map(([x, y, r], i) => (
        <Blossom key={i} x={x} y={y} r={r} delay={0.15 + i * 0.12} />
      ))}
    </svg>
  );
}

function canopy(seed) {
  let s = seed;
  const next = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  const clusters = [
    [60, 200, 70],
    [150, 90, 80],
    [250, 160, 70],
    [110, 290, 56],
    [230, 290, 50],
  ];
  const puffs = [];
  clusters.forEach(([cx, cy, spread], c) => {
    for (let i = 0; i < 26; i++) {
      const a = next() * Math.PI * 2;
      const d = Math.sqrt(next()) * spread;
      puffs.push({
        x: cx + Math.cos(a) * d,
        y: cy + Math.sin(a) * d * 0.7,
        r: 9 + next() * 16,
        tone: Math.floor(next() * 3),
        delay: 0.2 + c * 0.15 + next() * 0.6,
      });
    }
  });
  return puffs;
}

const PUFFS = canopy(9);
const PUFF_TONES = ["var(--petal)", "var(--petal-heart)", "var(--petal-light)"];

function CherryTree() {
  return (
    <svg viewBox="0 0 320 640" className="pr-tree" aria-hidden="true">
      <g fill="none" stroke="var(--bark)" strokeLinecap="round">
        <path
          d="M214 640 C 200 560, 222 470, 196 390 C 180 340, 176 300, 170 250"
          strokeWidth="26"
        />
        <path d="M184 330 C 140 300, 100 260, 66 206" strokeWidth="12" />
        <path d="M172 268 C 166 200, 160 150, 150 96" strokeWidth="11" />
        <path d="M190 360 C 220 300, 240 230, 252 166" strokeWidth="10" />
        <path d="M200 420 C 220 380, 232 330, 232 292" strokeWidth="7" />
        <path d="M150 300 C 128 296, 114 292, 104 286" strokeWidth="6" />
      </g>
      <g className="pr-canopy">
        {PUFFS.map((p, i) => (
          <circle
            key={i}
            cx={p.x.toFixed(1)}
            cy={p.y.toFixed(1)}
            r={p.r.toFixed(1)}
            fill={PUFF_TONES[p.tone]}
            opacity="0.82"
            style={{ animationDelay: `${p.delay.toFixed(2)}s` }}
          />
        ))}
      </g>
    </svg>
  );
}

function Butterfly({ top, color, dur, delay, size }) {
  return (
    <div
      className="pr-butterfly decor-travel"
      style={{ top, "--dur": `${dur}s`, animationDelay: `${delay}s` }}
    >
      <svg viewBox="0 0 40 32" width={size} aria-hidden="true">
        <g className="pr-wings" fill={color}>
          <path d="M19 15 C 10 0, 0 4, 3 14 C 5 19, 13 19, 19 16 Z" />
          <path d="M19 17 C 10 20, 5 30, 12 30 C 16 30, 18 24, 19 18 Z" />
          <path d="M21 15 C 30 0, 40 4, 37 14 C 35 19, 27 19, 21 16 Z" />
          <path d="M21 17 C 30 20, 35 30, 28 30 C 24 30, 22 24, 21 18 Z" />
        </g>
        <ellipse cx="20" cy="17" rx="1.6" ry="7" fill="#3f2a1d" />
        <path
          d="M19.5 10 C 18 6, 16 4, 14 3 M20.5 10 C 22 6, 24 4, 26 3"
          stroke="#3f2a1d"
          strokeWidth="0.9"
          fill="none"
        />
      </svg>
    </div>
  );
}

function PrintempsOverlay({ mode }) {
  const system = useMemo(() => sakura(mode), [mode]);
  return (
    <>
      <Branch className="pr-branch" />
      <CherryTree />
      <Butterfly top="34%" color="#fcd34d" dur={30} delay={-4} size={50} />
      <Butterfly top="60%" color="#93c5fd" dur={38} delay={-19} size={42} />
      <Butterfly top="20%" color="#f9a8d4" dur={44} delay={-31} size={36} />
      <Particles system={system} />
    </>
  );
}

export default {
  id: "printemps",
  label: "Printemps",
  logo: "🌸",
  type: "cobra",
  group: "season",
  font: "Gluten:wght@500..800",
  Overlay: PrintempsOverlay,
  colors: {
    dark: {
      bg: "#0b1a17",
      surface: "#12261f",
      surfaceHover: "#183028",
      border: "#213d33",
      borderStrong: "#305848",
      text: "#effaf4",
      textMuted: "#b4d2c3",
      textFaint: "#88a99a",
      accent: "#6fdc8c",
      accentContrast: "#05210f",
      accent2: "#ff9cc2",
      scrollThumb: "#24453a",
      scrollThumbHover: "#33604f",
    },
    light: {
      bg: "#f2faf5",
      surface: "#ffffff",
      surfaceHover: "#e7f5ec",
      border: "#d2ebdc",
      borderStrong: "#b0d9c0",
      text: "#12291f",
      textMuted: "#46655a",
      textFaint: "#5a776c",
      accent: "#277a4a",
      accentContrast: "#ffffff",
      accent2: "#d6457d",
      scrollThumb: "#c6e5d2",
      scrollThumbHover: "#a2d3b6",
    },
  },
};
