import { useMemo } from "react";
import Particles, { rand } from "../decor/Particles";

function watchers(mode) {
  const iris = mode === "dark" ? "190,242,100" : "234,88,12";
  return (ctx) => {
    const make = (initial) => ({
      x: rand(0.04, 0.96) * ctx.w,
      y: rand(0.25, 0.95) * ctx.h,
      size: rand(5, 11),
      born: ctx.t - (initial ? rand(0, 6) : 0),
      life: rand(5, 9),
      blinkAt: rand(1.5, 4),
    });
    let eyes = [];
    const fill = () => {
      const n = Math.round(8 * ctx.density);
      while (eyes.length < n) eyes.push(make(true));
      eyes.length = n;
    };
    fill();
    return {
      resize: fill,
      frame(g) {
        const { pointer } = ctx;
        for (let i = 0; i < eyes.length; i++) {
          const e = eyes[i];
          const age = ctx.t - e.born;
          if (age > e.life + 1.5) {
            eyes[i] = make(false);
            continue;
          }
          const fade = Math.min(1, age / 0.8, (e.life - age) / 0.8);
          if (fade <= 0) continue;
          const sinceBlink = (age - e.blinkAt) % 3.4;
          const blink = sinceBlink > 0 && sinceBlink < 0.16 ? 0.1 : 1;
          const lx = pointer.active ? pointer.x - e.x : 0;
          const ly = pointer.active ? pointer.y - e.y : 0;
          const ld = Math.hypot(lx, ly) || 1;
          const look = Math.min(1, ld / 300) * e.size * 0.35;
          for (const side of [-1, 1]) {
            const cx = e.x + side * e.size * 1.5;
            g.save();
            g.translate(cx, e.y);
            g.scale(1, blink);
            g.shadowColor = `rgba(${iris},${0.9 * fade})`;
            g.shadowBlur = 14;
            g.fillStyle = `rgba(${iris},${0.85 * fade})`;
            g.beginPath();
            g.moveTo(-e.size, 0);
            g.quadraticCurveTo(0, -e.size * 0.9, e.size, 0);
            g.quadraticCurveTo(0, e.size * 0.9, -e.size, 0);
            g.fill();
            g.shadowBlur = 0;
            g.fillStyle = `rgba(10,4,16,${fade})`;
            g.beginPath();
            g.ellipse(
              (lx / ld) * look,
              (ly / ld) * look * 0.6,
              e.size * 0.18,
              e.size * 0.55,
              0,
              0,
              Math.PI * 2,
            );
            g.fill();
            g.restore();
          }
        }
      },
    };
  };
}

function Bat({ top, size, dur, delay, reverse }) {
  return (
    <div
      className={`hw-bat decor-travel ${reverse ? "hw-bat--reverse" : ""}`}
      style={{ top, "--dur": `${dur}s`, animationDelay: `${delay}s` }}
    >
      <svg viewBox="0 0 64 32" width={size} aria-hidden="true">
        <g className="hw-wing">
          <path d="M32 14 C 26 6, 16 3, 3 8 C 9 10, 11 14, 9 19 C 13 16, 18 17, 20 21 C 22 17, 27 16, 32 18 Z" />
        </g>
        <g className="hw-wing hw-wing--right">
          <path d="M32 14 C 38 6, 48 3, 61 8 C 55 10, 53 14, 55 19 C 51 16, 46 17, 44 21 C 42 17, 37 16, 32 18 Z" />
        </g>
        <ellipse cx="32" cy="16" rx="4.2" ry="6" />
        <path d="M28.6 11.5 L27.6 6.5 L31 10 Z M35.4 11.5 L36.4 6.5 L33 10 Z" />
      </svg>
    </div>
  );
}

function Pumpkin({ className }) {
  return (
    <svg
      viewBox="0 0 120 100"
      className={`hw-pumpkin ${className}`}
      aria-hidden="true"
    >
      <path
        d="M60 22 C 59 12, 63 6, 70 3"
        stroke="#4d7c0f"
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
      />
      <g fill="var(--pumpkin)">
        <ellipse cx="36" cy="60" rx="28" ry="34" />
        <ellipse cx="84" cy="60" rx="28" ry="34" />
        <ellipse cx="60" cy="60" rx="30" ry="37" />
      </g>
      <g fill="var(--pumpkin-shade)">
        <ellipse cx="48" cy="60" rx="5" ry="34" opacity="0.5" />
        <ellipse cx="72" cy="60" rx="5" ry="34" opacity="0.5" />
      </g>
      <g className="hw-face">
        <path d="M38 48 L48 38 L54 52 Z M82 48 L72 38 L66 52 Z" />
        <path d="M34 66 C 44 82, 76 82, 86 66 L 78 70 L 72 64 L 66 72 L 60 64 L 54 72 L 48 64 L 42 70 Z" />
      </g>
    </svg>
  );
}

function HalloweenOverlay({ mode }) {
  const system = useMemo(() => watchers(mode), [mode]);
  return (
    <>
      <div className="hw-moon">
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <circle cx="50" cy="50" r="46" fill="var(--moon)" />
          <g fill="var(--moon-crater)">
            <circle cx="34" cy="38" r="8" />
            <circle cx="62" cy="62" r="11" />
            <circle cx="65" cy="30" r="5" />
            <circle cx="38" cy="70" r="4.5" />
          </g>
        </svg>
        <span className="hw-cloud" />
      </div>
      <Particles system={system} />
      <Bat top="16%" size={46} dur={22} delay={-4} />
      <Bat top="30%" size={30} dur={28} delay={-17} reverse />
      <Bat top="22%" size={36} dur={19} delay={-11} />
      <Bat top="44%" size={24} dur={33} delay={-25} reverse />
      <div className="hw-fog" />
      <div className="hw-fog hw-fog--late" />
      <Pumpkin className="hw-pumpkin--left" />
      <Pumpkin className="hw-pumpkin--right" />
    </>
  );
}

function SlimeAndSpider() {
  return (
    <div className="hw-header-decor" aria-hidden="true">
      <svg
        viewBox="0 0 1440 26"
        preserveAspectRatio="none"
        className="hw-slime"
      >
        <path d="M0 0 H1440 V6 C 1410 6, 1404 10, 1398 18 C 1392 24, 1384 20, 1384 12 C 1384 7, 1360 6, 1300 6 C 1250 6, 1246 9, 1242 14 C 1238 19, 1230 17, 1230 11 C 1230 7, 1180 6, 1110 6 C 1060 6, 1054 12, 1050 22 C 1046 30, 1036 26, 1036 16 C 1036 8, 1000 6, 930 6 C 880 6, 876 9, 872 13 C 868 17, 862 15, 862 10 C 862 7, 800 6, 720 6 C 660 6, 655 12, 650 19 C 645 25, 636 22, 636 14 C 636 8, 590 6, 520 6 C 470 6, 466 9, 462 13 C 458 18, 450 16, 450 11 C 450 7, 400 6, 330 6 C 280 6, 274 12, 270 21 C 266 28, 256 25, 256 15 C 256 8, 220 6, 160 6 C 110 6, 106 9, 102 14 C 98 19, 90 17, 90 11 C 90 7, 50 6, 0 6 Z" />
      </svg>
      <span className="hw-drop" style={{ left: "18.4%" }} />
      <span
        className="hw-drop"
        style={{ left: "72.6%", animationDelay: "-2.2s" }}
      />
      <div className="hw-spider">
        <span className="hw-thread" />
        <svg viewBox="0 0 40 34" width="26" aria-hidden="true">
          <g
            stroke="currentColor"
            strokeWidth="1.8"
            fill="none"
            strokeLinecap="round"
          >
            <path d="M16 16 C 10 10, 6 10, 2 14 M16 19 C 9 16, 5 18, 2 22 M24 16 C 30 10, 34 10, 38 14 M24 19 C 31 16, 35 18, 38 22 M16 21 C 11 23, 8 27, 6 31 M24 21 C 29 23, 32 27, 34 31 M17 14 C 13 7, 10 5, 7 4 M23 14 C 27 7, 30 5, 33 4" />
          </g>
          <ellipse cx="20" cy="20" rx="6" ry="7" fill="currentColor" />
          <circle cx="20" cy="12" r="4" fill="currentColor" />
          <circle cx="18.4" cy="11.6" r="1" fill="#ff5f1f" />
          <circle cx="21.6" cy="11.6" r="1" fill="#ff5f1f" />
        </svg>
      </div>
    </div>
  );
}

export default {
  id: "halloween",
  label: "Halloween",
  logo: "🎃",
  type: "cobra",
  group: "festive",
  font: "Creepster",
  Overlay: HalloweenOverlay,
  HeaderDecor: SlimeAndSpider,
  colors: {
    dark: {
      bg: "#100a17",
      surface: "#1a1123",
      surfaceHover: "#23172e",
      border: "#30203d",
      borderStrong: "#472f58",
      text: "#f5edff",
      textMuted: "#bdabd1",
      textFaint: "#9483a9",
      accent: "#ff7a1a",
      accentContrast: "#1a0b00",
      accent2: "#9be15d",
      scrollThumb: "#34224a",
      scrollThumbHover: "#4a3266",
    },
    light: {
      bg: "#f3eef8",
      surface: "#ffffff",
      surfaceHover: "#ece5f3",
      border: "#ddd2e8",
      borderStrong: "#c6b5d6",
      text: "#1e1428",
      textMuted: "#54456a",
      textFaint: "#6a5c7f",
      accent: "#c2410c",
      accentContrast: "#ffffff",
      accent2: "#3f8f1f",
      scrollThumb: "#d5c8e3",
      scrollThumbHover: "#bba8d0",
    },
  },
};
