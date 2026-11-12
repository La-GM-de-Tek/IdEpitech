import { useEffect, useRef } from "react";

const REFERENCE_AREA = 1440 * 900;

export default function Particles({ system, className = "" }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const g = canvas.getContext("2d");
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const ctx = {
      w: 0,
      h: 0,
      t: 0,
      density: 1,
      reduce,
      pointer: { x: -9999, y: -9999, vx: 0, vy: 0, active: false },
    };

    const measure = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      ctx.w = canvas.clientWidth;
      ctx.h = canvas.clientHeight;
      ctx.density = Math.min(
        1.4,
        Math.max(0.35, (ctx.w * ctx.h) / REFERENCE_AREA),
      );
      canvas.width = Math.round(ctx.w * dpr);
      canvas.height = Math.round(ctx.h * dpr);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    measure();
    const instance = system(ctx);

    let raf = 0;
    let last = performance.now();
    const frame = (now) => {
      const dt = Math.min(now - last, 64) / 16.667;
      last = now;
      ctx.t = now / 1000;
      g.clearRect(0, 0, ctx.w, ctx.h);
      instance.frame(g, dt);
      ctx.pointer.vx *= 0.85;
      ctx.pointer.vy *= 0.85;
      raf = requestAnimationFrame(frame);
    };
    const start = () => {
      if (raf) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };
    const still = () => {
      g.clearRect(0, 0, ctx.w, ctx.h);
      instance.frame(g, 0);
    };

    const onResize = () => {
      measure();
      instance.resize?.();
      if (reduce) still();
    };
    const onMove = (event) => {
      const p = ctx.pointer;
      if (p.active) {
        p.vx = event.clientX - p.x;
        p.vy = event.clientY - p.y;
      }
      p.x = event.clientX;
      p.y = event.clientY;
      p.active = true;
    };
    const onLeave = () => {
      ctx.pointer.active = false;
    };
    const onDown = (event) => {
      if (!reduce) instance.pointerdown?.(event.clientX, event.clientY);
    };
    const onVisibility = () => (document.hidden ? stop() : start());

    window.addEventListener("resize", onResize);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);

    if (reduce) {
      still();
    } else {
      document.addEventListener("visibilitychange", onVisibility);
      start();
    }

    return () => {
      stop();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [system]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    />
  );
}

export const rand = (min, max) => min + Math.random() * (max - min);
export const pick = (list) => list[Math.floor(Math.random() * list.length)];

export function repel(p, pointer, radius, strength) {
  if (!pointer.active) return;
  const dx = p.x - pointer.x;
  const dy = p.y - pointer.y;
  const d2 = dx * dx + dy * dy;
  if (d2 > radius * radius || d2 < 1) return;
  const d = Math.sqrt(d2);
  const force = (1 - d / radius) * strength;
  p.x += (dx / d) * force;
  p.y += (dy / d) * force;
}

export function heartPath(g, x, y, s) {
  g.beginPath();
  g.moveTo(x, y + s * 0.3);
  g.bezierCurveTo(x, y, x - s * 0.5, y - s * 0.1, x - s * 0.5, y + s * 0.25);
  g.bezierCurveTo(x - s * 0.5, y + s * 0.6, x, y + s * 0.75, x, y + s);
  g.bezierCurveTo(
    x,
    y + s * 0.75,
    x + s * 0.5,
    y + s * 0.6,
    x + s * 0.5,
    y + s * 0.25,
  );
  g.bezierCurveTo(x + s * 0.5, y - s * 0.1, x, y, x, y + s * 0.3);
  g.closePath();
}
