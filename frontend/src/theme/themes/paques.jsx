import { useMemo } from "react";
import Particles, { rand, pick, repel } from "../decor/Particles";

const PASTELS = [
  "#f9a8d4",
  "#fde68a",
  "#a7f3d0",
  "#bfdbfe",
  "#ddd6fe",
  "#fdba74",
];

function sprinkles() {
  return (ctx) => {
    const make = (initial) => ({
      x: rand(0, ctx.w),
      y: initial ? rand(0, ctx.h) : -10,
      vy: rand(0.35, 0.9),
      angle: rand(0, Math.PI),
      spin: rand(-0.04, 0.04),
      len: rand(6, 11),
      color: pick(PASTELS),
      phase: rand(0, Math.PI * 2),
    });
    let list = [];
    const fill = () => {
      const n = Math.round(55 * ctx.density);
      while (list.length < n) list.push(make(true));
      list.length = n;
    };
    fill();
    return {
      resize: fill,
      frame(g, dt) {
        g.lineCap = "round";
        g.lineWidth = 3.4;
        for (let i = 0; i < list.length; i++) {
          const s = list[i];
          s.y += s.vy * dt;
          s.x += Math.sin(ctx.t + s.phase) * 0.3 * dt;
          s.angle += s.spin * dt;
          repel(s, ctx.pointer, 90, 3 * dt);
          if (s.y > ctx.h + 12) {
            list[i] = make(false);
            continue;
          }
          const dx = (Math.cos(s.angle) * s.len) / 2;
          const dy = (Math.sin(s.angle) * s.len) / 2;
          g.strokeStyle = s.color;
          g.beginPath();
          g.moveTo(s.x - dx, s.y - dy);
          g.lineTo(s.x + dx, s.y + dy);
          g.stroke();
        }
      },
    };
  };
}

function blades(seed, count, minH, maxH) {
  let s = seed;
  const next = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  let d = "";
  for (let i = 0; i < count; i++) {
    const x = (i + next()) * (1440 / count);
    const h = minH + next() * (maxH - minH);
    const lean = (next() - 0.5) * 22;
    d += `M${(x - 4).toFixed(1)} 160 Q${(x + lean * 0.3).toFixed(1)} ${(160 - h * 0.6).toFixed(1)} ${(x + lean).toFixed(1)} ${(160 - h).toFixed(1)} Q${(x + lean * 0.3 + 3).toFixed(1)} ${(160 - h * 0.55).toFixed(1)} ${(x + 4).toFixed(1)} 160 Z `;
  }
  return d;
}

const BACK = blades(5, 110, 30, 60);
const FRONT = blades(17, 90, 18, 46);

const EGG =
  "M0 -26 C 14 -26 20 -6 20 6 C 20 18 11 26 0 26 C -11 26 -20 18 -20 6 C -20 -6 -14 -26 0 -26 Z";

function Egg({ x, y, scale = 1, rotate = 0, base, deco, kind }) {
  const id = `egg-${x}`;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}>
      <clipPath id={id}>
        <path d={EGG} />
      </clipPath>
      <path d={EGG} fill={base} />
      <g
        clipPath={`url(#${id})`}
        fill="none"
        stroke={deco}
        strokeWidth="3.4"
        strokeLinejoin="round"
      >
        {kind === "zigzag" && (
          <>
            <path d="M-22 -2 L-14 -9 L-6 -2 L2 -9 L10 -2 L18 -9 L26 -2" />
            <path d="M-22 12 L-14 5 L-6 12 L2 5 L10 12 L18 5 L26 12" />
          </>
        )}
        {kind === "dots" && (
          <g fill={deco} stroke="none">
            <circle cx="-8" cy="-10" r="3" />
            <circle cx="6" cy="-4" r="3" />
            <circle cx="-6" cy="8" r="3" />
            <circle cx="9" cy="14" r="3" />
            <circle cx="0" cy="-20" r="2.4" />
          </g>
        )}
        {kind === "stripes" && (
          <>
            <path d="M-22 -8 H22" strokeWidth="5" />
            <path d="M-22 4 H22" strokeWidth="2.4" />
            <path d="M-22 14 H22" strokeWidth="5" />
          </>
        )}
        {kind === "waves" && (
          <path d="M-22 2 C -16 -6, -8 10, 0 2 S 16 -6, 22 2" strokeWidth="4" />
        )}
      </g>
      <path
        d="M-8 -18 C -6 -22, -2 -24, 2 -24"
        stroke="#fff"
        strokeOpacity="0.6"
        strokeWidth="2.4"
        fill="none"
        strokeLinecap="round"
      />
    </g>
  );
}

function ChickEgg({ x, y }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className="pq-chick">
        <circle cx="0" cy="-6" r="13" fill="#fde047" />
        <circle cx="-4" cy="-9" r="1.8" fill="#422006" />
        <circle cx="5" cy="-9" r="1.8" fill="#422006" />
        <path d="M-1 -5 L4 -3 L-1 -1 Z" fill="#f97316" />
      </g>
      <path
        d="M-20 4 C -20 18 -11 26 0 26 C 11 26 20 18 20 4 L 13 -2 L 7 5 L 0 -3 L -7 5 L -13 -2 Z"
        fill="#fef3c7"
      />
      <path
        className="pq-shell"
        d="M-20 2 C -20 -10 -12 -26 0 -26 C 12 -26 20 -10 20 2 L 13 -4 L 7 3 L 0 -5 L -7 3 L -13 -4 Z"
        fill="#fef3c7"
      />
    </g>
  );
}

function PaquesOverlay() {
  const system = useMemo(() => sprinkles(), []);
  return (
    <>
      <Particles system={system} />
      <div className="pq-bunny decor-travel" aria-hidden="true">
        <svg viewBox="0 0 60 80" width="58">
          <g className="pq-ear">
            <ellipse cx="20" cy="40" rx="9" ry="34" fill="var(--bunny)" />
            <ellipse cx="20" cy="42" rx="4.5" ry="26" fill="#f9a8d4" />
          </g>
          <g className="pq-ear pq-ear--right">
            <ellipse cx="40" cy="40" rx="9" ry="34" fill="var(--bunny)" />
            <ellipse cx="40" cy="42" rx="4.5" ry="26" fill="#f9a8d4" />
          </g>
        </svg>
      </div>
      <svg
        viewBox="0 0 1440 160"
        preserveAspectRatio="xMidYMax slice"
        className="pq-meadow"
        aria-hidden="true"
      >
        <path
          d="M0 120 C 240 96, 480 112, 720 106 S 1200 92, 1440 112 V160 H0 Z"
          fill="var(--hill)"
        />
        <path d={BACK} fill="var(--grass-back)" className="pq-grass" />
        <Egg
          x={170}
          y={124}
          rotate={-14}
          base="#fbcfe8"
          deco="#db2777"
          kind="zigzag"
        />
        <Egg
          x={232}
          y={132}
          scale={0.8}
          rotate={10}
          base="#bfdbfe"
          deco="#2563eb"
          kind="dots"
        />
        <ChickEgg x={330} y={128} />
        <Egg
          x={1080}
          y={130}
          scale={0.85}
          rotate={-8}
          base="#a7f3d0"
          deco="#059669"
          kind="stripes"
        />
        <Egg
          x={1150}
          y={122}
          rotate={12}
          base="#ddd6fe"
          deco="#7c3aed"
          kind="waves"
        />
        <Egg
          x={1290}
          y={132}
          scale={0.7}
          rotate={-20}
          base="#fde68a"
          deco="#ea580c"
          kind="dots"
        />
        <path
          d={FRONT}
          fill="var(--grass-front)"
          className="pq-grass pq-grass--front"
        />
      </svg>
    </>
  );
}

const FLAGS = 22;

function Bunting() {
  return (
    <div className="pq-bunting" aria-hidden="true">
      <svg viewBox="0 0 1000 30" preserveAspectRatio="none">
        <path
          d="M0 2 Q250 26 500 2 Q750 26 1000 2"
          fill="none"
          stroke="var(--wire)"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      {Array.from({ length: FLAGS }, (_, i) => {
        const u = (i + 0.5) / FLAGS;
        const local = (u * 2) % 1;
        const y = 2 + 48 * local * (1 - local);
        return (
          <span
            key={i}
            className="pq-flag"
            style={{
              left: `${u * 100}%`,
              top: `${y}px`,
              "--flag": PASTELS[i % PASTELS.length],
              animationDelay: `${(-i * 0.23).toFixed(2)}s`,
            }}
          />
        );
      })}
    </div>
  );
}

const dots = (color) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60"><g fill="${color}"><circle cx="10" cy="10" r="3"/><circle cx="40" cy="25" r="2"/><circle cx="20" cy="45" r="2.5"/></g></svg>`;

export default {
  id: "paques",
  label: "Pâques",
  logo: "🐣",
  type: "manta",
  group: "festive",
  font: "Fredoka:wght@500..700",
  pattern: dots,
  Overlay: PaquesOverlay,
  HeaderDecor: Bunting,
  colors: {
    dark: {
      bg: "#171329",
      surface: "#211b38",
      surfaceHover: "#2a2346",
      border: "#352c55",
      borderStrong: "#4a3f73",
      text: "#f7f2ff",
      textMuted: "#c5bae2",
      textFaint: "#9b8fbb",
      accent: "#f9a8d4",
      accentContrast: "#2a0b1c",
      accent2: "#fde68a",
      scrollThumb: "#3a3060",
      scrollThumbHover: "#4f437f",
    },
    light: {
      bg: "#fbf7ff",
      surface: "#ffffff",
      surfaceHover: "#f3ecfd",
      border: "#e7dcf7",
      borderStrong: "#d4c3ee",
      text: "#2a1f3d",
      textMuted: "#5e5078",
      textFaint: "#73658b",
      accent: "#b3337a",
      accentContrast: "#ffffff",
      accent2: "#c08a00",
      scrollThumb: "#e2d6f4",
      scrollThumbHover: "#cdbbea",
    },
  },
};
