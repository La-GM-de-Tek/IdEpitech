import { useMemo } from "react";
import Particles from "../decor/Particles";

function dotGrid(mode) {
  const base =
    mode === "dark" ? "rgba(125,133,144,0.16)" : "rgba(99,110,121,0.18)";
  const hot = mode === "dark" ? "88,166,255" : "9,105,218";
  const GAP = 26;
  const RADIUS = 200;
  return (ctx) => {
    let dots = new Path2D();
    const glow = { x: -9999, y: -9999 };
    const build = () => {
      dots = new Path2D();
      for (let y = GAP / 2; y < ctx.h; y += GAP) {
        for (let x = GAP / 2; x < ctx.w; x += GAP)
          dots.rect(x - 0.75, y - 0.75, 1.5, 1.5);
      }
    };
    build();
    return {
      resize: build,
      frame(g) {
        g.fillStyle = base;
        g.fill(dots);
        const { pointer } = ctx;
        if (!pointer.active) return;
        if (glow.x < -9000) {
          glow.x = pointer.x;
          glow.y = pointer.y;
        }
        glow.x += (pointer.x - glow.x) * 0.14;
        glow.y += (pointer.y - glow.y) * 0.14;
        const x0 = Math.max(
          GAP / 2,
          Math.floor((glow.x - RADIUS) / GAP) * GAP + GAP / 2,
        );
        const y0 = Math.max(
          GAP / 2,
          Math.floor((glow.y - RADIUS) / GAP) * GAP + GAP / 2,
        );
        for (let y = y0; y < glow.y + RADIUS; y += GAP) {
          for (let x = x0; x < glow.x + RADIUS; x += GAP) {
            const k = 1 - Math.hypot(x - glow.x, y - glow.y) / RADIUS;
            if (k <= 0) continue;
            const size = 1.5 + k * 1.8;
            g.fillStyle = `rgba(${hot},${0.15 + k * 0.7})`;
            g.fillRect(x - size / 2, y - size / 2, size, size);
          }
        }
      },
    };
  };
}

export function DefaultOverlay({ mode }) {
  const system = useMemo(() => dotGrid(mode), [mode]);
  return <Particles system={system} />;
}
