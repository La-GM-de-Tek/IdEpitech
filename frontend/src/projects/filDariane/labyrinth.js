import { WHITE, mix, noise, readPalette, rgba, shade } from "../scenePalette";

export const MOVES = {
  North: [-1, 0],
  South: [1, 0],
  East: [0, 1],
  West: [0, -1],
};

const WALL_RATIO = 0.34;
const MAX_CELL = 40;
const EXPLORED = 0.55;
const REVEAL_MS = 220;
const LIFT_MS = 650;
const SWEEP_DELAY = 180;
const SWEEP_MS = 1500;
const BURST_MS = 1200;

export const TORCH = [255, 178, 96];
export const FLAME = [255, 246, 226];

const ease = (t) => 1 - Math.pow(1 - t, 3);
const clamp01 = (t) => Math.max(0, Math.min(1, t));

export function createLabyrinth({ canvas, host, run, onStep, onFinish }) {
  const ctx = canvas.getContext("2d");
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const { grid, start, moves } = run;
  const rows = grid.length;
  const cols = Math.max(...grid.map((row) => row.length));
  const total = moves.length;
  const isWall = (x, y) => grid[y]?.[x] === "x";
  const key = (cell) => cell.y * cols + cell.x;

  const path = [start];
  for (const move of moves) {
    const [dy, dx] = MOVES[move];
    const prev = path[path.length - 1];
    path.push({ y: prev.y + dy, x: prev.x + dx });
  }
  const exits = [];
  grid.forEach((row, y) =>
    row.forEach((cell, x) => cell === "o" && exits.push({ x, y })),
  );
  const end = path[total];
  const escaped = grid[end.y]?.[end.x] === "o";

  const floorLayer = document.createElement("canvas");
  const wallLayer = document.createElement("canvas");
  const fogFull = document.createElement("canvas");
  const fogCtx = fogFull.getContext("2d");
  const fogLow = document.createElement("canvas");
  fogLow.width = cols;
  fogLow.height = rows;
  const fogLowCtx = fogLow.getContext("2d");
  const fogImage = fogLowCtx.createImageData(cols, rows);
  const reveal = new Float32Array(cols * rows);
  const target = new Float32Array(cols * rows);
  const points = new Float32Array((total + 2) * 2);

  const stack = [start];
  const onStack = new Map([[key(start), 0]]);

  let palette = null;
  let box = { width: 0, height: 0 };
  let dpr = 1;
  let unit = 0;
  let wallH = 0;
  let delay = 90;
  let progress = 0;
  let reached = 0;
  let finishedAt = null;
  let fogDirty = true;
  let fogMoving = true;
  let clock = 0;
  let last = 0;
  let raf = 0;
  let alive = true;

  const cx = (x) => x * unit + unit / 2;
  const cy = (y) => y * unit + (unit + wallH) / 2;

  function light(cell, strength) {
    for (let dy = -2; dy <= 2; dy += 1) {
      for (let dx = -2; dx <= 2; dx += 1) {
        const x = cell.x + dx;
        const y = cell.y + dy;
        if (x < 0 || y < 0 || x >= cols || y >= rows) continue;
        const d = Math.hypot(dx, dy);
        const value = d <= 1.5 ? strength : d <= 2.3 ? strength * 0.6 : 0;
        const i = y * cols + x;
        if (value > target[i]) target[i] = value;
      }
    }
  }

  function advance(to) {
    while (reached < to) {
      reached += 1;
      const cell = path[reached];
      const seen = onStack.get(key(cell));
      if (seen === undefined) {
        onStack.set(key(cell), stack.length);
        stack.push(cell);
      } else {
        for (let i = seen + 1; i < stack.length; i += 1) {
          onStack.delete(key(stack[i]));
        }
        stack.length = seen + 1;
      }
      light(cell, EXPLORED);
    }
    onStep?.(reached, total);
  }

  function finish() {
    finishedAt = clock;
    target.fill(1);
    onFinish?.();
  }

  function applyPalette() {
    palette = readPalette(canvas);
    host?.style.setProperty("--maze-stone", rgba(palette.stone));
    host?.style.setProperty("--maze-front", rgba(palette.front));
    host?.style.setProperty("--maze-thread", rgba(palette.thread));
    host?.style.setProperty("--maze-faded", rgba(palette.threadFaded));
    host?.style.setProperty("--maze-torch", rgba(TORCH));
    host?.style.setProperty("--maze-flame", rgba(FLAME));
  }

  function paintFloor() {
    const g = floorLayer.getContext("2d");
    const p = palette;
    g.fillStyle = rgba(p.floor);
    g.fillRect(0, 0, floorLayer.width, floorLayer.height);

    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        if (isWall(x, y)) continue;
        const left = x * unit;
        const top = wallH + y * unit;
        if (unit >= 10 && (x + y) % 2) {
          g.fillStyle = rgba(p.floorAlt);
          g.fillRect(left, top, unit, unit);
        }
        if (unit >= 18) {
          g.fillStyle = rgba(p.grout, 0.5);
          g.fillRect(left, top, unit, 1);
          g.fillRect(left, top, 1, unit);
        }
      }
    }

    for (const exit of exits) {
      g.fillStyle = rgba(p.success, 0.2);
      g.fillRect(exit.x * unit, wallH + exit.y * unit, unit, unit);
    }

    const away = floorLayer.width + unit * 4;
    const shape = new Path2D();
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        if (isWall(x, y))
          shape.rect(x * unit - away, wallH + y * unit, unit, unit);
      }
    }
    g.save();
    g.shadowColor = rgba(p.ink, p.shadowAlpha);
    g.shadowBlur = unit * 0.55;
    g.shadowOffsetX = away + unit * 0.14;
    g.shadowOffsetY = unit * 0.22;
    g.fillStyle = "#000";
    g.fill(shape);
    g.restore();
  }

  function paintWalls() {
    const g = wallLayer.getContext("2d");
    const p = palette;
    const edge = Math.max(1, Math.round(unit * 0.07));
    g.clearRect(0, 0, wallLayer.width, wallLayer.height);

    for (let y = 0; y < rows; y += 1) {
      const top = y * unit;
      const face = top + unit;
      const front = g.createLinearGradient(0, face, 0, face + wallH);
      front.addColorStop(0, rgba(p.front));
      front.addColorStop(1, rgba(p.frontDeep));

      for (let x = 0; x < cols; x += 1) {
        if (!isWall(x, y)) continue;
        const left = x * unit;

        g.fillStyle = front;
        g.fillRect(left, face, unit, wallH);
        if (unit >= 16) {
          g.fillStyle = rgba(p.ink, 0.18);
          g.fillRect(left, face, 1, wallH);
        }

        g.fillStyle = rgba(shade(p.stone, 1 + 0.022 * noise(x, y)));
        g.fillRect(left, top, unit, unit);
        if (!isWall(x, y - 1)) {
          g.fillStyle = rgba(p.stoneLit);
          g.fillRect(left, top, unit, edge);
        }
        if (!isWall(x - 1, y)) {
          g.fillStyle = rgba(p.stoneLit, 0.5);
          g.fillRect(left, top, edge, unit);
        }
        if (!isWall(x + 1, y)) {
          g.fillStyle = rgba(p.stoneEdge, 0.7);
          g.fillRect(left + unit - edge, top, edge, unit);
        }
      }
    }
  }

  function layout() {
    if (!box.width || !box.height) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const fit = Math.min(
      box.width / cols,
      box.height / (rows + WALL_RATIO),
      MAX_CELL,
    );
    unit = Math.max(2, Math.floor(fit * dpr));
    wallH = Math.round(unit * WALL_RATIO);
    const width = unit * cols;
    const height = unit * rows + wallH;
    for (const layer of [canvas, floorLayer, wallLayer, fogFull]) {
      layer.width = width;
      layer.height = height;
    }
    canvas.style.width = `${width / dpr}px`;
    canvas.style.height = `${height / dpr}px`;
    paintFloor();
    paintWalls();
    fogDirty = true;
  }

  function updateFog(dt) {
    const k = motion.matches
      ? 1
      : 1 - Math.exp(-dt / (finishedAt === null ? REVEAL_MS : LIFT_MS));
    fogMoving = false;
    for (let i = 0; i < reveal.length; i += 1) {
      const diff = target[i] - reveal[i];
      if (diff <= 0) continue;
      reveal[i] = diff > 0.002 ? reveal[i] + diff * k : target[i];
      fogMoving = true;
    }
    if (!fogMoving && !fogDirty) return;

    const [r, g, b] = palette.fog;
    const data = fogImage.data;
    for (let i = 0; i < reveal.length; i += 1) {
      const o = i * 4;
      data[o] = r;
      data[o + 1] = g;
      data[o + 2] = b;
      data[o + 3] = Math.round((1 - reveal[i]) * palette.fogAlpha * 255);
    }
    fogLowCtx.putImageData(fogImage, 0, 0);
    fogDirty = false;
  }

  function drawFog(x, y, radius) {
    fogCtx.globalCompositeOperation = "copy";
    fogCtx.imageSmoothingEnabled = true;
    fogCtx.imageSmoothingQuality = "high";
    fogCtx.drawImage(fogLow, 0, 0, fogFull.width, fogFull.height);
    fogCtx.globalCompositeOperation = "destination-out";
    const hole = fogCtx.createRadialGradient(x, y, radius * 0.15, x, y, radius);
    hole.addColorStop(0, "rgba(0, 0, 0, 1)");
    hole.addColorStop(0.55, "rgba(0, 0, 0, 0.75)");
    hole.addColorStop(1, "rgba(0, 0, 0, 0)");
    fogCtx.fillStyle = hole;
    fogCtx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    fogCtx.globalCompositeOperation = "source-over";
    ctx.drawImage(fogFull, 0, 0);
  }

  function drawTorch(x, y, radius) {
    const p = palette;
    ctx.globalCompositeOperation = p.dark ? "lighter" : "source-over";
    const glow = ctx.createRadialGradient(x, y, 0, x, y, radius);
    glow.addColorStop(0, rgba(TORCH, p.dark ? 0.34 : 0.14));
    glow.addColorStop(0.45, rgba(TORCH, p.dark ? 0.12 : 0.05));
    glow.addColorStop(1, rgba(TORCH, 0));
    ctx.fillStyle = glow;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    ctx.globalCompositeOperation = "source-over";
  }

  function trace(count, smooth) {
    const line = new Path2D();
    line.moveTo(points[0], points[1]);
    for (let i = 1; i < count - 1; i += 1) {
      if (!smooth) {
        line.lineTo(points[i * 2], points[i * 2 + 1]);
        continue;
      }
      const x = points[i * 2];
      const y = points[i * 2 + 1];
      line.quadraticCurveTo(
        x,
        y,
        (x + points[i * 2 + 2]) / 2,
        (y + points[i * 2 + 3]) / 2,
      );
    }
    line.lineTo(points[count * 2 - 2], points[count * 2 - 1]);
    return line;
  }

  function drawThread(head, moving, sweep) {
    const p = palette;
    const width = Math.max(1.5 * dpr, unit * 0.24);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    let count = 0;
    const push = (x, y) => {
      points[count * 2] = x;
      points[count * 2 + 1] = y;
      count += 1;
    };

    for (let i = 0; i <= reached; i += 1) push(cx(path[i].x), cy(path[i].y));
    if (moving) push(head.x, head.y);
    if (count > 1) {
      ctx.strokeStyle = rgba(p.threadFaded, 0.9);
      ctx.lineWidth = Math.max(dpr, unit * 0.12);
      ctx.stroke(trace(count, false));
    }

    const next = moving ? path[reached + 1] : null;
    const rewinding =
      next && stack.length > 1 && key(stack[stack.length - 2]) === key(next);
    const kept = rewinding ? stack.length - 1 : stack.length;
    count = 0;
    let length = 0;
    for (let i = 0; i < kept; i += 1) {
      push(cx(stack[i].x), cy(stack[i].y));
      if (i) length += unit;
    }
    if (moving) {
      const lx = points[count * 2 - 2];
      const ly = points[count * 2 - 1];
      push(head.x, head.y);
      length += Math.hypot(head.x - lx, head.y - ly);
    }
    if (count < 2) return;

    const live = trace(count, true);
    ctx.save();
    ctx.translate(0, unit * 0.1);
    ctx.strokeStyle = rgba(p.ink, p.dark ? 0.5 : 0.18);
    ctx.lineWidth = width;
    ctx.stroke(live);
    ctx.restore();

    ctx.strokeStyle = rgba(p.thread);
    ctx.lineWidth = width;
    ctx.stroke(live);

    if (unit >= 14) {
      ctx.setLineDash([unit * 0.09, unit * 0.15]);
      ctx.strokeStyle = rgba(p.threadDeep, 0.55);
      ctx.lineWidth = width * 0.5;
      ctx.stroke(live);
      ctx.setLineDash([]);
    }

    ctx.save();
    ctx.translate(-unit * 0.025, -unit * 0.04);
    ctx.strokeStyle = rgba(p.threadSheen, 0.5);
    ctx.lineWidth = Math.max(0.75 * dpr, width * 0.28);
    ctx.stroke(live);
    ctx.restore();

    if (sweep > 0) {
      ctx.save();
      ctx.setLineDash([length * sweep, length + unit]);
      ctx.shadowColor = rgba(p.gold, 0.9);
      ctx.shadowBlur = Math.max(6 * dpr, unit * 0.7);
      ctx.strokeStyle = rgba(p.gold);
      ctx.lineWidth = width * 1.1;
      ctx.stroke(live);
      ctx.restore();
    }
  }

  function drawSpool() {
    const p = palette;
    const x = cx(start.x);
    const y = cy(start.y);
    const r = Math.max(2.5 * dpr, unit * 0.27);
    ctx.fillStyle = rgba(p.threadDeep);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = rgba(p.thread);
    ctx.lineWidth = Math.max(dpr * 0.75, r * 0.3);
    ctx.beginPath();
    ctx.arc(x, y, r * 0.55, Math.PI * 0.15, Math.PI * 1.65);
    ctx.stroke();
  }

  function drawExits(t, burst) {
    const p = palette;
    const still = motion.matches;
    const pulse = still ? 1 : 0.88 + 0.12 * Math.sin(t * 2.4);
    for (const exit of exits) {
      const x = cx(exit.x);
      const y = cy(exit.y);
      const radius = Math.max(22 * dpr, unit * 2) * pulse;

      ctx.globalCompositeOperation = p.dark ? "lighter" : "source-over";
      const glow = ctx.createRadialGradient(x, y, 0, x, y, radius);
      glow.addColorStop(0, rgba(p.success, p.dark ? 0.55 : 0.35));
      glow.addColorStop(1, rgba(p.success, 0));
      ctx.fillStyle = glow;
      ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
      ctx.globalCompositeOperation = "source-over";

      const size = Math.max(7 * dpr, unit * 0.62);
      ctx.fillStyle = rgba(p.success);
      ctx.beginPath();
      ctx.roundRect(x - size / 2, y - size / 2, size, size, size * 0.25);
      ctx.fill();
      ctx.fillStyle = rgba(mix(p.success, WHITE, 0.55), 0.85);
      ctx.beginPath();
      ctx.roundRect(
        x - size / 4,
        y - size / 4,
        size / 2,
        size / 2,
        size * 0.12,
      );
      ctx.fill();

      if (burst > 0 && burst < 1 && escaped && !still) {
        const eased = ease(burst);
        ctx.strokeStyle = rgba(p.success, 1 - eased);
        ctx.lineWidth = Math.max(dpr, unit * 0.14) * (1 - eased * 0.6);
        ctx.beginPath();
        ctx.arc(x, y, size + unit * 4 * eased, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  function drawTheseus(head, moving) {
    const p = palette;
    const r = Math.max(4.5 * dpr, unit * 0.36);
    const bob =
      moving && !motion.matches
        ? Math.abs(Math.sin(progress * Math.PI)) * unit * 0.06
        : 0;

    ctx.fillStyle = rgba(p.ink, p.dark ? 0.5 : 0.22);
    ctx.beginPath();
    ctx.ellipse(
      head.x,
      head.y + r * 0.35,
      r * 0.95,
      r * 0.4,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();

    const x = head.x;
    const y = head.y - r * 0.45 - bob;
    const body = ctx.createRadialGradient(
      x - r * 0.3,
      y - r * 0.35,
      0,
      x,
      y,
      r * 1.1,
    );
    body.addColorStop(0, rgba(FLAME));
    body.addColorStop(1, rgba(TORCH));
    ctx.save();
    ctx.shadowColor = rgba(TORCH, p.dark ? 0.9 : 0.45);
    ctx.shadowBlur = r * 2.4;
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = rgba(p.thread);
    ctx.lineWidth = Math.max(dpr, r * 0.28);
    ctx.stroke();
  }

  function headAt(moving) {
    const here = path[reached];
    if (!moving) return { x: cx(here.x), y: cy(here.y) };
    const next = path[reached + 1];
    const f = progress - reached;
    return {
      x: cx(here.x) + (cx(next.x) - cx(here.x)) * f,
      y: cy(here.y) + (cy(next.y) - cy(here.y)) * f,
    };
  }

  function draw() {
    if (!unit) return;
    const still = motion.matches;
    const t = clock / 1000;
    const moving = reached < total && !still;
    const head = headAt(moving);
    const since = finishedAt === null ? -1 : clock - finishedAt;
    const sweep =
      !escaped || since < 0
        ? 0
        : still
          ? 1
          : ease(clamp01((since - SWEEP_DELAY) / SWEEP_MS));
    const burst = since < 0 ? 0 : clamp01(since / BURST_MS);
    const flicker = still
      ? 1
      : 1 +
        0.035 * Math.sin(t * 7.1) +
        0.025 * Math.sin(t * 12.7 + 1.3) +
        0.015 * Math.sin(t * 23.3 + 0.4);
    const radius = Math.max(unit * 4, 52 * dpr) * flicker;

    ctx.globalCompositeOperation = "source-over";
    ctx.drawImage(floorLayer, 0, 0);
    ctx.drawImage(wallLayer, 0, 0);
    drawFog(head.x, head.y, radius);
    drawTorch(head.x, head.y, radius);
    drawThread(head, moving, sweep);
    drawSpool();
    drawExits(t, burst);
    drawTheseus(head, moving);
  }

  function frame(now) {
    raf = 0;
    if (!alive) return;
    const dt = last ? Math.min(now - last, 64) : 16;
    last = now;
    clock += dt;

    if (unit && progress < total) {
      progress = Math.min(total, progress + dt / delay);
      const step = Math.floor(progress);
      if (step > reached) advance(step);
    }
    if (finishedAt === null && progress >= total) finish();

    updateFog(dt);
    draw();

    const settled =
      finishedAt !== null && !fogMoving && clock - finishedAt > BURST_MS;
    if (!(motion.matches && settled)) schedule();
  }

  function schedule() {
    if (alive && !raf) raf = requestAnimationFrame(frame);
  }

  applyPalette();
  light(start, EXPLORED);
  onStep?.(0, total);

  return {
    resize(width, height) {
      box = { width, height };
      layout();
      updateFog(0);
      draw();
      schedule();
    },
    setDelay(ms) {
      delay = Math.max(1, ms);
    },
    refresh() {
      applyPalette();
      if (unit) {
        paintFloor();
        paintWalls();
      }
      fogDirty = true;
      updateFog(0);
      draw();
      schedule();
    },
    destroy() {
      alive = false;
      cancelAnimationFrame(raf);
    },
  };
}
