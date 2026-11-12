import { useMemo } from "react";
import Particles, { rand, pick } from "../decor/Particles";

const MAPLE =
  "M0 -10 L2 -5 L6 -7 L5 -2 L10 -1 L6 2 L7 6 L2 4 L1 9 L-1 9 L-2 4 L-7 6 L-6 2 L-10 -1 L-5 -2 L-6 -7 L-2 -5 Z";
const BIRCH = "M0 -10 C 7 -5 7 5 0 10 C -7 5 -7 -5 0 -10 Z";
const LEAF_COLORS = [
  "#c2410c",
  "#ea8a1a",
  "#d4a017",
  "#9f1239",
  "#b45309",
  "#7c4a1e",
];

function fallingLeaves() {
  return (ctx) => {
    const shapes = [new Path2D(MAPLE), new Path2D(BIRCH)];
    const make = (initial) => ({
      x: rand(-40, ctx.w),
      y: initial ? rand(-40, ctx.h) : rand(-80, -20),
      vx: 0,
      vy: rand(0.5, 1.1),
      size: rand(0.9, 1.9),
      angle: rand(0, Math.PI * 2),
      spin: rand(-0.03, 0.03),
      flip: rand(0, Math.PI * 2),
      flipSpeed: rand(0.04, 0.09),
      shape: Math.random() < 0.65 ? 0 : 1,
      color: pick(LEAF_COLORS),
      phase: rand(0, Math.PI * 2),
    });
    let leaves = [];
    const fill = () => {
      const n = Math.round(38 * ctx.density);
      while (leaves.length < n) leaves.push(make(true));
      leaves.length = n;
    };
    fill();
    return {
      resize: fill,
      frame(g, dt) {
        const { pointer } = ctx;
        const cycle = ctx.t % 14;
        const gust =
          cycle > 10 ? Math.sin(((cycle - 10) / 4) * Math.PI) * 2.6 : 0;
        for (let i = 0; i < leaves.length; i++) {
          const l = leaves[i];
          if (pointer.active) {
            const d = Math.hypot(l.x - pointer.x, l.y - pointer.y);
            if (d < 170) {
              const k = (1 - d / 170) * 0.08;
              l.vx += pointer.vx * k;
              l.spin += pointer.vx * k * 0.004;
            }
          }
          l.vx =
            l.vx * 0.97 + (gust + Math.sin(ctx.t * 0.7 + l.phase) * 0.6) * 0.03;
          l.x += l.vx * dt;
          l.y += (l.vy + Math.sin(ctx.t * 1.3 + l.phase) * 0.25) * dt;
          l.angle += l.spin * dt;
          l.spin *= 0.995;
          l.flip += l.flipSpeed * dt;
          if (l.y > ctx.h + 30 || l.x > ctx.w + 60) {
            leaves[i] = make(false);
            continue;
          }
          if (l.x < -60) l.x = ctx.w + 40;
          g.save();
          g.translate(l.x, l.y);
          g.rotate(l.angle);
          g.scale(l.size * Math.cos(l.flip), l.size);
          g.fillStyle = l.color;
          g.globalAlpha = 0.85;
          g.fill(shapes[l.shape]);
          g.strokeStyle = "rgba(60,25,5,0.45)";
          g.lineWidth = 0.6;
          g.beginPath();
          g.moveTo(0, -8);
          g.lineTo(0, 11);
          g.stroke();
          g.restore();
        }
        g.globalAlpha = 1;
      },
    };
  };
}

function pile(seed, count) {
  let s = seed;
  const next = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  return Array.from({ length: count }, (_, i) => ({
    x: (i + next()) * (1440 / count),
    y: 112 + next() * 26,
    angle: next() * 360,
    scale: 1.4 + next() * 1.6,
    shape: next() < 0.6 ? MAPLE : BIRCH,
    color: LEAF_COLORS[Math.floor(next() * LEAF_COLORS.length)],
  }));
}

const PILE = pile(13, 70);

function Branch({ className }) {
  return (
    <svg viewBox="0 0 320 180" className={className} aria-hidden="true">
      <g fill="none" stroke="var(--branch)" strokeLinecap="round">
        <path
          d="M-10 20 C 60 30, 120 46, 200 44 C 240 44, 280 54, 318 76"
          strokeWidth="9"
        />
        <path d="M90 36 C 110 60, 120 84, 118 112" strokeWidth="5" />
        <path d="M170 44 C 186 26, 210 18, 236 16" strokeWidth="4" />
        <path d="M230 50 C 240 74, 236 100, 224 118" strokeWidth="3.5" />
        <path d="M118 112 C 124 126, 132 134, 142 140" strokeWidth="2.5" />
      </g>
      <g opacity="0.95">
        <path
          d={MAPLE}
          fill="#c2410c"
          transform="translate(120 122) scale(1.8) rotate(20)"
        />
        <path
          d={MAPLE}
          fill="#d4a017"
          transform="translate(238 18) scale(1.5) rotate(-30)"
        />
        <path
          d={BIRCH}
          fill="#b45309"
          transform="translate(226 126) scale(1.6) rotate(15)"
        />
      </g>
    </svg>
  );
}

function AutomneOverlay() {
  const system = useMemo(() => fallingLeaves(), []);
  return (
    <>
      <Branch className="au-branch" />
      <Branch className="au-branch au-branch--right" />
      <Particles system={system} />
      <svg
        viewBox="0 0 1440 140"
        preserveAspectRatio="xMidYMax slice"
        className="au-pile"
        aria-hidden="true"
      >
        <path
          d="M0 120 C 300 104, 600 118, 900 110 S 1300 104, 1440 116 V140 H0 Z"
          fill="var(--ground)"
        />
        {PILE.map((leaf, i) => (
          <path
            key={i}
            d={leaf.shape}
            fill={leaf.color}
            transform={`translate(${leaf.x.toFixed(1)} ${leaf.y.toFixed(1)}) rotate(${leaf.angle.toFixed(0)}) scale(${leaf.scale.toFixed(2)})`}
          />
        ))}
      </svg>
    </>
  );
}

export default {
  id: "automne",
  label: "Automne",
  logo: "🍂",
  type: "cobra",
  group: "season",
  font: "Caprasimo",
  Overlay: AutomneOverlay,
  colors: {
    dark: {
      bg: "#170f09",
      surface: "#22170e",
      surfaceHover: "#2c1e13",
      border: "#3a2818",
      borderStrong: "#553a22",
      text: "#fbf0e3",
      textMuted: "#dbc1a3",
      textFaint: "#ab9073",
      accent: "#f08a3c",
      accentContrast: "#1f0d02",
      accent2: "#e0b040",
      scrollThumb: "#3f2c1b",
      scrollThumbHover: "#583e26",
    },
    light: {
      bg: "#f7eee3",
      surface: "#fffaf3",
      surfaceHover: "#f1e4d3",
      border: "#e6d3bb",
      borderStrong: "#d4b894",
      text: "#2b1a0e",
      textMuted: "#6b4c33",
      textFaint: "#7c5d45",
      accent: "#b4531a",
      accentContrast: "#ffffff",
      accent2: "#a16207",
      scrollThumb: "#e2cfb6",
      scrollThumbHover: "#cfb38f",
    },
  },
};
