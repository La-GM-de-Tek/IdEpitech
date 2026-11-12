import { useMemo } from "react";
import Particles, { rand, repel } from "../decor/Particles";

function bubbles(mode) {
  const rim = mode === "dark" ? "200,245,255" : "40,140,170";
  return (ctx) => {
    const make = (initial) => ({
      x: rand(0, ctx.w),
      y: initial ? rand(0, ctx.h) : ctx.h + 20,
      r: rand(1.5, 9),
      vy: rand(-0.9, -0.35),
      phase: rand(0, Math.PI * 2),
    });
    let list = [];
    const fill = () => {
      const n = Math.round(46 * ctx.density);
      while (list.length < n) list.push(make(true));
      list.length = n;
    };
    fill();
    return {
      resize: fill,
      frame(g, dt) {
        for (let i = 0; i < list.length; i++) {
          const b = list[i];
          b.x += Math.sin(ctx.t * 2 + b.phase) * 0.35 * dt;
          b.y += b.vy * dt;
          repel(b, ctx.pointer, 70, 1.4 * dt);
          if (b.y < -20) {
            list[i] = make(false);
            continue;
          }
          g.strokeStyle = `rgba(${rim},0.55)`;
          g.lineWidth = 1;
          g.fillStyle = `rgba(${rim},0.08)`;
          g.beginPath();
          g.arc(b.x, b.y, b.r, 0, Math.PI * 2);
          g.fill();
          g.stroke();
          g.fillStyle = `rgba(255,255,255,0.7)`;
          g.beginPath();
          g.arc(b.x - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.22, 0, Math.PI * 2);
          g.fill();
        }
      },
    };
  };
}

const FISH = {
  clown: (
    <>
      <path d="M50 17 L60 6 L58 17 L60 28 Z" fill="#f97316" />
      <path
        d="M4 17 C 10 5, 34 3, 50 17 C 34 31, 10 29, 4 17 Z"
        fill="#fb923c"
      />
      <path
        d="M17 6.5 C 21 12, 21 22, 17 27.6 L 23 28.6 C 26 22, 26 12, 23 5.6 Z M34 6 C 37 12, 37 22, 34 28.4 L 39 27 C 41 21, 41 13, 39 7.4 Z"
        fill="#fff7ed"
      />
      <circle cx="11" cy="15" r="2" fill="#1c1917" />
    </>
  ),
  tang: (
    <>
      <path d="M48 17 L60 7 L58 17 L60 27 Z" fill="#facc15" />
      <path
        d="M4 17 C 10 3, 36 2, 48 17 C 36 32, 10 31, 4 17 Z"
        fill="#2563eb"
      />
      <path
        d="M14 11 C 22 7, 34 9, 40 15 C 32 13, 22 14, 16 19 Z"
        fill="#0f172a"
        opacity="0.75"
      />
      <circle cx="11" cy="15" r="2" fill="#0f172a" />
    </>
  ),
  yellow: (
    <>
      <path d="M44 17 L56 8 L54 17 L56 26 Z" fill="#eab308" />
      <path
        d="M4 17 C 8 1, 32 -1, 44 17 C 32 35, 8 33, 4 17 Z"
        fill="#fde047"
      />
      <circle cx="12" cy="14" r="2" fill="#422006" />
    </>
  ),
};

function Fish({ kind, size, top, dur, delay, reverse, depth }) {
  return (
    <div
      className={`aq-swim decor-travel ${reverse ? "aq-swim--reverse" : ""}`}
      style={{
        top,
        "--dur": `${dur}s`,
        animationDelay: `${delay}s`,
        opacity: depth,
        filter: depth < 0.7 ? "blur(1px)" : undefined,
      }}
    >
      <svg
        viewBox="0 0 62 34"
        width={size}
        className="aq-fish"
        aria-hidden="true"
      >
        {FISH[kind]}
      </svg>
    </div>
  );
}

function Kelp({ left, height, delay, tone }) {
  return (
    <svg
      viewBox="0 0 40 200"
      className="aq-kelp"
      style={{ left, height, animationDelay: `${delay}s`, color: tone }}
      preserveAspectRatio="xMidYMax meet"
      aria-hidden="true"
    >
      <path
        d="M20 200 C 10 160, 30 130, 18 96 C 8 66, 28 40, 20 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M19 150 C 4 140, 2 126, 8 118 C 12 132, 16 138, 21 140 Z M20 110 C 36 102, 38 88, 32 80 C 28 94, 24 100, 18 102 Z M19 64 C 6 56, 4 42, 10 34 C 14 48, 18 54, 21 56 Z"
        fill="currentColor"
      />
    </svg>
  );
}

function AquariumOverlay({ mode }) {
  const system = useMemo(() => bubbles(mode), [mode]);
  return (
    <>
      <div className="aq-caustics" />
      <Fish kind="clown" size={70} top="22%" dur={34} delay={-6} depth={0.95} />
      <Fish
        kind="tang"
        size={88}
        top="58%"
        dur={44}
        delay={-30}
        reverse
        depth={0.85}
      />
      <Fish
        kind="yellow"
        size={52}
        top="38%"
        dur={28}
        delay={-18}
        depth={0.6}
      />
      <Fish
        kind="clown"
        size={44}
        top="74%"
        dur={38}
        delay={-2}
        reverse
        depth={0.55}
      />
      <Fish kind="tang" size={40} top="12%" dur={52} delay={-40} depth={0.45} />
      <div className="aq-reef">
        <Kelp left="3%" height="34vh" delay={0} tone="var(--kelp-a)" />
        <Kelp left="7%" height="24vh" delay={-1.3} tone="var(--kelp-b)" />
        <Kelp left="18%" height="16vh" delay={-0.6} tone="var(--kelp-a)" />
        <Kelp left="81%" height="20vh" delay={-2} tone="var(--kelp-b)" />
        <Kelp left="89%" height="38vh" delay={-0.9} tone="var(--kelp-a)" />
        <Kelp left="94%" height="26vh" delay={-1.7} tone="var(--kelp-b)" />
        <svg
          viewBox="0 0 1440 90"
          preserveAspectRatio="none"
          className="aq-coral"
          aria-hidden="true"
        >
          <path
            d="M0 90 V62 C 40 50, 70 70, 110 58 C 150 40, 190 66, 240 60 C 300 52, 340 74, 420 70 C 520 64, 600 80, 720 76 C 860 72, 940 80, 1040 70 C 1120 62, 1180 46, 1240 56 C 1300 64, 1360 44, 1440 52 V90 Z"
            fill="var(--sand)"
          />
          <g fill="var(--coral-a)">
            <path d="M120 62 C 116 40, 104 34, 108 20 C 114 30, 118 36, 122 44 C 124 30, 130 22, 136 18 C 134 32, 130 44, 128 62 Z" />
            <path d="M1290 58 C 1286 38, 1276 30, 1280 16 C 1286 26, 1290 32, 1294 42 C 1296 28, 1302 20, 1308 16 C 1306 30, 1302 42, 1300 58 Z" />
          </g>
          <g fill="var(--coral-b)">
            <circle cx="210" cy="56" r="12" />
            <circle cx="226" cy="58" r="9" />
            <circle cx="1196" cy="54" r="13" />
            <circle cx="1214" cy="58" r="8" />
          </g>
        </svg>
      </div>
      <Particles system={system} />
    </>
  );
}

export default {
  id: "aquarium",
  label: "Manta Aquarium",
  logo: "🐠",
  type: "manta",
  group: "classic",
  font: "Baloo+2:wght@500..800",
  Overlay: AquariumOverlay,
  colors: {
    dark: {
      bg: "#032536",
      surface: "#073a52",
      surfaceHover: "#0a4a68",
      border: "#0f5774",
      borderStrong: "#1a7194",
      text: "#e6f9ff",
      textMuted: "#a3d6e8",
      textFaint: "#7bb4ca",
      accent: "#34e0d0",
      accentContrast: "#022230",
      accent2: "#ff9f43",
      scrollThumb: "#12607f",
      scrollThumbHover: "#1c7fa6",
    },
    light: {
      bg: "#e3f7fb",
      surface: "#ffffff",
      surfaceHover: "#d6f0f6",
      border: "#b6e0ec",
      borderStrong: "#8fcbdd",
      text: "#06344a",
      textMuted: "#2f6a82",
      textFaint: "#3f7386",
      accent: "#0b7285",
      accentContrast: "#ffffff",
      accent2: "#e8590c",
      scrollThumb: "#a9d5e6",
      scrollThumbHover: "#7fbdd6",
    },
  },
};
