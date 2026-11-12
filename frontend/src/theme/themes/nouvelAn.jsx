import { useMemo } from "react";
import Particles, { rand, pick } from "../decor/Particles";

const PALETTES = [
  ["255,214,102", "255,243,196"],
  ["192,132,252", "233,213,255"],
  ["94,234,212", "204,251,241"],
  ["251,113,133", "255,228,230"],
  ["255,255,255", "255,236,179"],
];

function fireworks(mode) {
  const night = mode === "dark";
  return (ctx) => {
    const rockets = [];
    const sparks = [];
    let nextLaunch = ctx.t + 0.4;

    const burst = (x, y) => {
      const [core, glint] = pick(PALETTES);
      const n = Math.round(rand(56, 84));
      const power = rand(2.6, 4.2);
      for (let i = 0; i < n; i++) {
        const angle = (i / n) * Math.PI * 2 + rand(-0.05, 0.05);
        const v = power * rand(0.55, 1);
        sparks.push({
          x,
          y,
          vx: Math.cos(angle) * v,
          vy: Math.sin(angle) * v,
          life: rand(1.1, 1.8),
          born: ctx.t,
          color: Math.random() < 0.25 ? glint : core,
          glitter: Math.random() < 0.4,
        });
      }
    };
    const launch = (tx) => {
      rockets.push({
        x: tx ?? rand(ctx.w * 0.1, ctx.w * 0.9),
        y: ctx.h + 10,
        vy: -rand(7.5, 10.5),
        vx: rand(-0.6, 0.6),
        apex: rand(ctx.h * 0.12, ctx.h * 0.45),
      });
    };

    return {
      pointerdown(x, y) {
        burst(x, y);
      },
      frame(g, dt) {
        if (dt > 0 && ctx.t > nextLaunch) {
          launch();
          nextLaunch = ctx.t + rand(0.9, 2.2);
        }
        g.globalCompositeOperation = night ? "lighter" : "source-over";
        for (let i = rockets.length - 1; i >= 0; i--) {
          const r = rockets[i];
          r.x += r.vx * dt;
          r.y += r.vy * dt;
          r.vy += 0.09 * dt;
          g.strokeStyle = night
            ? "rgba(255,226,150,0.8)"
            : "rgba(138,106,18,0.6)";
          g.lineWidth = 2;
          g.beginPath();
          g.moveTo(r.x, r.y);
          g.lineTo(r.x - r.vx * 3, r.y - r.vy * 3);
          g.stroke();
          if (r.y <= r.apex || r.vy >= -1) {
            burst(r.x, r.y);
            rockets.splice(i, 1);
          }
        }
        for (let i = sparks.length - 1; i >= 0; i--) {
          const s = sparks[i];
          const age = ctx.t - s.born;
          if (age > s.life) {
            sparks.splice(i, 1);
            continue;
          }
          s.vx *= 0.975;
          s.vy = s.vy * 0.975 + 0.035 * dt;
          s.x += s.vx * dt;
          s.y += s.vy * dt;
          let a = 1 - age / s.life;
          if (s.glitter) a *= 0.5 + 0.5 * Math.sin(age * 40);
          g.fillStyle = `rgba(${s.color},${a})`;
          g.beginPath();
          g.arc(s.x, s.y, 1.7, 0, Math.PI * 2);
          g.fill();
        }
        g.globalCompositeOperation = "source-over";
      },
    };
  };
}

function skyline(seed) {
  let s = seed;
  const next = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  const buildings = [];
  const windows = [];
  let x = 0;
  while (x < 1440) {
    const w = 40 + next() * 70;
    const h = 50 + next() * 130;
    buildings.push(
      `M${x.toFixed(0)} 200 V${(200 - h).toFixed(0)} H${(x + w).toFixed(0)} V200 Z`,
    );
    if (next() < 0.35) {
      buildings.push(
        `M${(x + w / 2 - 2).toFixed(0)} ${(200 - h).toFixed(0)} v-${(10 + next() * 24).toFixed(0)} h4 V${(200 - h).toFixed(0)} Z`,
      );
    }
    for (let wy = 200 - h + 10; wy < 190; wy += 14) {
      for (let wx = x + 8; wx < x + w - 10; wx += 12) {
        if (next() < 0.32)
          windows.push({
            x: wx,
            y: wy,
            blink: next() < 0.3,
            delay: next() * 6,
          });
      }
    }
    x += w + 2 + next() * 8;
  }
  return { path: buildings.join(" "), windows };
}

const CITY = skyline(31);

function NouvelAnOverlay({ mode }) {
  const system = useMemo(() => fireworks(mode), [mode]);
  return (
    <>
      <Particles system={system} />
      <svg
        viewBox="0 0 1440 200"
        preserveAspectRatio="xMidYMax slice"
        className="na-city"
        aria-hidden="true"
      >
        <path d={CITY.path} fill="var(--city)" />
        <g fill="var(--window)">
          {CITY.windows.map((w, i) => (
            <rect
              key={i}
              x={w.x}
              y={w.y}
              width="5"
              height="7"
              className={w.blink ? "na-window" : undefined}
              style={
                w.blink
                  ? { animationDelay: `${w.delay.toFixed(2)}s` }
                  : undefined
              }
            />
          ))}
        </g>
      </svg>
    </>
  );
}

function GoldLine() {
  return <div className="na-gold-line" aria-hidden="true" />;
}

export default {
  id: "nouvel-an",
  label: "Nouvel An",
  logo: "🥂",
  type: "manta",
  group: "festive",
  font: "Limelight",
  Overlay: NouvelAnOverlay,
  HeaderDecor: GoldLine,
  colors: {
    dark: {
      bg: "#07060a",
      surface: "#121017",
      surfaceHover: "#19161f",
      border: "#27222f",
      borderStrong: "#3b3346",
      text: "#f7f3ea",
      textMuted: "#cbc1ab",
      textFaint: "#9c927e",
      accent: "#f2c14e",
      accentContrast: "#1a1205",
      accent2: "#c084fc",
      scrollThumb: "#2a2532",
      scrollThumbHover: "#3e3649",
    },
    light: {
      bg: "#faf8f3",
      surface: "#ffffff",
      surfaceHover: "#f2eee4",
      border: "#e5dfd0",
      borderStrong: "#d2c8b0",
      text: "#1a1712",
      textMuted: "#5c5446",
      textFaint: "#6f6655",
      accent: "#8a6a12",
      accentContrast: "#ffffff",
      accent2: "#7c3aed",
      scrollThumb: "#e2dccd",
      scrollThumbHover: "#cbc0a5",
    },
  },
};
