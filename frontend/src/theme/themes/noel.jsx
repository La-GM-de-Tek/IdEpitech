import { useMemo } from "react";
import Particles, { rand, repel } from "../decor/Particles";

export function snowfall(mode, { count = 150, crystals = 0.18 } = {}) {
  const tint = mode === "dark" ? "255,255,255" : "120,160,196";
  return (ctx) => {
    const make = (initial) => {
      const z = Math.random();
      return {
        x: rand(0, ctx.w),
        y: initial ? rand(-20, ctx.h) : rand(-60, -10),
        z,
        r: 0.8 + z * z * 3.2,
        vy: 0.3 + z * 1.0,
        phase: rand(0, Math.PI * 2),
        angle: rand(0, Math.PI),
        spin: rand(-0.012, 0.012),
        crystal: z > 1 - crystals,
      };
    };
    let flakes = [];
    const fill = () => {
      const n = Math.round(count * ctx.density);
      while (flakes.length < n) flakes.push(make(true));
      flakes.length = n;
    };
    fill();
    return {
      resize: fill,
      frame(g, dt) {
        const wind =
          Math.sin(ctx.t * 0.13) * 0.4 + Math.sin(ctx.t * 0.47) * 0.15;
        g.lineCap = "round";
        for (let i = 0; i < flakes.length; i++) {
          const p = flakes[i];
          p.y += p.vy * dt;
          p.x +=
            (Math.sin(ctx.t * 0.9 + p.phase) * 0.35 + wind) * (0.35 + p.z) * dt;
          p.angle += p.spin * dt;
          repel(p, ctx.pointer, 80 + p.z * 50, 2.4 * dt);
          if (p.y > ctx.h + 12) {
            flakes[i] = make(false);
            continue;
          }
          if (p.x < -12) p.x += ctx.w + 24;
          if (p.x > ctx.w + 12) p.x -= ctx.w + 24;
          const a = 0.3 + p.z * 0.65;
          if (p.crystal) {
            const R = p.r * 2.6;
            g.save();
            g.translate(p.x, p.y);
            g.rotate(p.angle);
            g.strokeStyle = `rgba(${tint},${a})`;
            g.lineWidth = 1.2;
            g.beginPath();
            for (let k = 0; k < 6; k++) {
              const ang = (k * Math.PI) / 3;
              const cx = Math.cos(ang);
              const sy = Math.sin(ang);
              g.moveTo(0, 0);
              g.lineTo(cx * R, sy * R);
              const bx = cx * R * 0.55;
              const by = sy * R * 0.55;
              const b = R * 0.32;
              g.moveTo(bx, by);
              g.lineTo(
                bx + Math.cos(ang + 0.75) * b,
                by + Math.sin(ang + 0.75) * b,
              );
              g.moveTo(bx, by);
              g.lineTo(
                bx + Math.cos(ang - 0.75) * b,
                by + Math.sin(ang - 0.75) * b,
              );
            }
            g.stroke();
            g.restore();
          } else {
            g.fillStyle = `rgba(${tint},${a})`;
            g.beginPath();
            g.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            g.fill();
          }
        }
      },
    };
  };
}

function Fir({ x, h }) {
  const w = h * 0.38;
  return (
    <g transform={`translate(${x} ${120 - h})`}>
      <path
        d={`M0 0 L${w * 0.55} ${h * 0.42} L${w * 0.3} ${h * 0.42} L${w} ${h * 0.86} L${-w} ${h * 0.86} L${-w * 0.3} ${h * 0.42} L${-w * 0.55} ${h * 0.42} Z`}
        fill="var(--fir)"
      />
      <rect
        x="-3"
        y={h * 0.86}
        width="6"
        height={h * 0.14}
        fill="var(--fir-trunk)"
      />
      <path
        d={`M${-w * 0.42} ${h * 0.4} Q0 ${h * 0.5} ${w * 0.45} ${h * 0.4} M${-w * 0.8} ${h * 0.8} Q0 ${h * 0.92} ${w * 0.82} ${h * 0.78}`}
        fill="none"
        stroke="var(--snow)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle
        cx="0"
        cy="-2"
        r="3.2"
        fill="var(--accent2)"
        className="noel-star"
      />
    </g>
  );
}

function NoelOverlay({ mode }) {
  const system = useMemo(() => snowfall(mode), [mode]);
  return (
    <>
      <Particles system={system} />
      <svg
        viewBox="0 0 1440 140"
        preserveAspectRatio="none"
        className="noel-drifts"
        aria-hidden="true"
      >
        <path
          d="M0 70 C 160 34, 320 60, 520 64 S 860 26, 1040 56 S 1300 86, 1440 44 V140 H0 Z"
          fill="var(--snow-shade)"
        />
        <path
          d="M0 104 C 160 78, 300 92, 470 98 S 770 66, 950 92 S 1250 118, 1440 86 V140 H0 Z"
          fill="var(--snow)"
        />
      </svg>
      <svg
        viewBox="0 0 1440 140"
        preserveAspectRatio="xMidYMax slice"
        className="noel-firs"
        aria-hidden="true"
      >
        <Fir x={110} h={86} />
        <Fir x={170} h={58} />
        <Fir x={1290} h={96} />
        <Fir x={1350} h={64} />
      </svg>
    </>
  );
}

const BULBS = 30;
const SWAGS = 5;
const BULB_COLORS = ["#ff4d4d", "#ffd166", "#4ade80", "#60a5fa", "#f472b6"];

function wirePath() {
  let d = "M0 2";
  for (let k = 0; k < SWAGS; k++) {
    const x0 = (k * 1000) / SWAGS;
    const x1 = ((k + 1) * 1000) / SWAGS;
    d += ` Q${(x0 + x1) / 2} 38 ${x1} 2`;
  }
  return d;
}

function NoelLights() {
  return (
    <div className="noel-lights" aria-hidden="true">
      <svg viewBox="0 0 1000 40" preserveAspectRatio="none">
        <path
          d={wirePath()}
          fill="none"
          stroke="var(--wire)"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      {Array.from({ length: BULBS }, (_, i) => {
        const u = (i + 0.5) / BULBS;
        const local = (u * SWAGS) % 1;
        const y = 2 + 72 * local * (1 - local);
        return (
          <span
            key={i}
            className="noel-bulb"
            style={{
              left: `${u * 100}%`,
              top: `${y}px`,
              "--bulb": BULB_COLORS[i % BULB_COLORS.length],
              animationDelay: `${((i * 0.37) % 2.4).toFixed(2)}s`,
            }}
          />
        );
      })}
    </div>
  );
}

export default {
  id: "noel",
  label: "Noël",
  logo: "🎄",
  type: "manta",
  group: "festive",
  font: "Berkshire+Swash",
  Overlay: NoelOverlay,
  HeaderDecor: NoelLights,
  colors: {
    dark: {
      bg: "#0a1b15",
      surface: "#10271f",
      surfaceHover: "#163229",
      border: "#1f3d32",
      borderStrong: "#2e5446",
      text: "#f3f7f2",
      textMuted: "#b7cbbf",
      textFaint: "#8aa396",
      accent: "#e03a45",
      accentContrast: "#ffffff",
      accent2: "#f4c152",
      scrollThumb: "#22443a",
      scrollThumbHover: "#2f5a4c",
    },
    light: {
      bg: "#f3f7f5",
      surface: "#ffffff",
      surfaceHover: "#ebf2ee",
      border: "#d6e2db",
      borderStrong: "#bccdc3",
      text: "#13261d",
      textMuted: "#4a5f54",
      textFaint: "#5d7166",
      accent: "#c1272d",
      accentContrast: "#ffffff",
      accent2: "#b07d12",
      scrollThumb: "#c9d8cf",
      scrollThumbHover: "#adc1b5",
    },
  },
};
