import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { mix, noise, readPalette, rgba } from "../scenePalette";
import { FLAME, MOVES, TORCH } from "./labyrinth";

const WALL_H = 0.62;
const THREAD_Y = 0.08;
const THREAD_R = 0.06;
const TRAIL_R = 0.028;
const GOLD_R = 0.075;
const RADIAL = 8;
const EXPLORED = 0.6;
const INTRO_MS = 1400;
const RISE_MS = 620;
const REVEAL_MS = 260;
const LIFT_MS = 1200;
const CAMERA_MS = 420;
const SWEEP_DELAY = 700;
const SWEEP_MS = 2200;
const BURST_MS = 1600;
const OVERVIEW_PHI = 0.6;
const FOLLOW_PHI = 0.7;
const FOLLOW_DISTANCE = 20;
const FOLLOW_MS = 120;
const WHITE = [255, 255, 255];

const LIGHTS = {
  dark: { hemi: [2.4, 3.6], moon: [2.6, 4.2], torch: 14, exit: 4 },
  light: { hemi: [1.5, 2.1], moon: [1.9, 2.6], torch: 3, exit: 1.5 },
};

const ease = (t) => 1 - Math.pow(1 - t, 3);
const easeBack = (t) => 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2);
const clamp01 = (t) => Math.max(0, Math.min(1, t));
const lerp = (a, b, t) => a + (b - a) * t;
const toColor = ([r, g, b]) =>
  new THREE.Color().setRGB(r / 255, g / 255, b / 255, THREE.SRGBColorSpace);

function canvasTexture(width, height, paint) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  paint(canvas.getContext("2d"));
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeTube(capacity, radius, material) {
  const positions = new Float32Array(capacity * RADIAL * 3);
  const normals = new Float32Array(capacity * RADIAL * 3);
  const indices = new Uint32Array(Math.max(1, capacity - 1) * RADIAL * 6);
  for (let i = 0; i < capacity - 1; i += 1) {
    for (let j = 0; j < RADIAL; j += 1) {
      const a = i * RADIAL + j;
      const b = i * RADIAL + ((j + 1) % RADIAL);
      indices.set([a, a + RADIAL, b, b, a + RADIAL, b + RADIAL], a * 6);
    }
  }
  const geometry = new THREE.BufferGeometry();
  const position = new THREE.BufferAttribute(positions, 3);
  const normal = new THREE.BufferAttribute(normals, 3);
  position.setUsage(THREE.DynamicDrawUsage);
  normal.setUsage(THREE.DynamicDrawUsage);
  geometry.setAttribute("position", position);
  geometry.setAttribute("normal", normal);
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  geometry.setDrawRange(0, 0);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  mesh.receiveShadow = true;

  return {
    mesh,
    set(xs, zs, count) {
      for (let i = 0; i < count; i += 1) {
        let tx = xs[Math.min(i + 1, count - 1)] - xs[Math.max(i - 1, 0)];
        let tz = zs[Math.min(i + 1, count - 1)] - zs[Math.max(i - 1, 0)];
        const length = Math.hypot(tx, tz) || 1;
        tx /= length;
        tz /= length;
        for (let j = 0; j < RADIAL; j += 1) {
          const angle = (j / RADIAL) * Math.PI * 2;
          const c = Math.cos(angle);
          const s = Math.sin(angle);
          const nx = -tz * c;
          const nz = tx * c;
          const o = (i * RADIAL + j) * 3;
          positions[o] = xs[i] + nx * radius;
          positions[o + 1] = THREAD_Y + s * radius;
          positions[o + 2] = zs[i] + nz * radius;
          normals[o] = nx;
          normals[o + 1] = s;
          normals[o + 2] = nz;
        }
      }
      for (const attribute of [position, normal]) {
        attribute.clearUpdateRanges();
        attribute.addUpdateRange(0, count * RADIAL * 3);
        attribute.needsUpdate = true;
      }
      geometry.setDrawRange(0, Math.max(0, count - 1) * RADIAL * 6);
    },
    reveal(segments) {
      geometry.setDrawRange(0, Math.max(0, segments) * RADIAL * 6);
    },
  };
}

export function createLabyrinth3D({
  canvas,
  host,
  run,
  onStep,
  onFinish,
  onCamera,
}) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.NeutralToneMapping;

  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const { grid, start, moves } = run;
  const rows = grid.length;
  const cols = Math.max(...grid.map((row) => row.length));
  const total = moves.length;
  const isWall = (x, y) => grid[y]?.[x] === "x";
  const key = (cell) => cell.y * cols + cell.x;
  const wx = (x) => x - cols / 2 + 0.5;
  const wz = (y) => y - rows / 2 + 0.5;

  const path = [start];
  for (const move of moves) {
    const [dy, dx] = MOVES[move];
    const prev = path[path.length - 1];
    path.push({ y: prev.y + dy, x: prev.x + dx });
  }
  const exits = [];
  const wallCells = [];
  grid.forEach((row, y) =>
    row.forEach((cell, x) => {
      if (cell === "o") exits.push({ x, y });
      if (cell === "x") wallCells.push({ x, y });
    }),
  );
  const end = path[total];
  const escaped = grid[end.y]?.[end.x] === "o";

  const scene = new THREE.Scene();
  const disposables = [];
  const keep = (thing) => {
    disposables.push(thing);
    return thing;
  };

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 600);
  const probe = new THREE.PerspectiveCamera(32, 1, 0.1, 600);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.rotateSpeed = 0.6;
  controls.zoomSpeed = 0.8;
  controls.minDistance = 2.5;
  controls.minPolarAngle = 0.12;
  controls.maxPolarAngle = 1.3;

  const hemi = new THREE.HemisphereLight(0xffffff, 0x000000, 1);
  const moon = new THREE.DirectionalLight(0xffffff, 1);
  const span = Math.max(cols, rows) / 2 + 2;
  moon.position.set(-span * 0.55, span * 1.6, -span * 0.9);
  moon.castShadow = true;
  moon.shadow.mapSize.set(2048, 2048);
  Object.assign(moon.shadow.camera, {
    left: -span,
    right: span,
    top: span,
    bottom: -span,
    near: 0.5,
    far: span * 6,
  });
  moon.shadow.camera.updateProjectionMatrix();
  moon.shadow.bias = -0.0004;
  moon.shadow.normalBias = 0.03;
  moon.shadow.radius = 3;
  scene.add(hemi, moon, moon.target);

  const floorTile = Math.max(
    8,
    Math.min(32, Math.floor(4096 / Math.max(cols, rows))),
  );
  const floorCanvas = document.createElement("canvas");
  floorCanvas.width = cols * floorTile;
  floorCanvas.height = rows * floorTile;
  const floorTexture = keep(new THREE.CanvasTexture(floorCanvas));
  floorTexture.colorSpace = THREE.SRGBColorSpace;
  floorTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const floorMaterial = keep(
    new THREE.MeshStandardMaterial({ map: floorTexture, roughness: 0.92 }),
  );
  const floor = new THREE.Mesh(
    keep(new THREE.PlaneGeometry(cols, rows)),
    floorMaterial,
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;

  const plinthMaterial = keep(
    new THREE.MeshStandardMaterial({ roughness: 0.9 }),
  );
  const plinth = new THREE.Mesh(
    keep(new THREE.BoxGeometry(cols + 0.8, 0.5, rows + 0.8)),
    plinthMaterial,
  );
  plinth.position.y = -0.252;
  plinth.receiveShadow = true;

  const reveal = new Float32Array(cols * rows);
  const target = new Float32Array(cols * rows);
  const fogData = new Uint8Array(cols * rows * 4);
  const fogTexture = keep(
    new THREE.DataTexture(fogData, cols, rows, THREE.RGBAFormat),
  );
  fogTexture.magFilter = THREE.LinearFilter;
  fogTexture.minFilter = THREE.LinearFilter;
  fogTexture.colorSpace = THREE.SRGBColorSpace;
  const fog = new THREE.Mesh(
    keep(new THREE.PlaneGeometry(cols, rows)),
    keep(
      new THREE.MeshBasicMaterial({
        map: fogTexture,
        transparent: true,
        depthWrite: false,
        toneMapped: false,
      }),
    ),
  );
  fog.rotation.x = -Math.PI / 2;
  fog.position.y = 0.004;
  scene.add(floor, plinth, fog);

  const wallGeometry = keep(new THREE.BoxGeometry(1, WALL_H, 1));
  wallGeometry.translate(0, WALL_H / 2, 0);
  const wallNormals = wallGeometry.attributes.normal;
  const wallShade = new Float32Array(wallNormals.count * 3);
  for (let i = 0; i < wallNormals.count; i += 1) {
    wallShade.fill(wallNormals.getY(i) > 0.5 ? 1 : 0.8, i * 3, i * 3 + 3);
  }
  wallGeometry.setAttribute("color", new THREE.BufferAttribute(wallShade, 3));
  const walls = new THREE.InstancedMesh(
    wallGeometry,
    keep(
      new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.84,
        metalness: 0.02,
      }),
    ),
    wallCells.length,
  );
  walls.castShadow = true;
  walls.receiveShadow = true;
  walls.frustumCulled = false;
  walls.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  scene.add(walls);

  const farthest = Math.max(
    1,
    ...wallCells.map((c) => Math.hypot(c.x - start.x, c.y - start.y)),
  );
  const riseDelay = wallCells.map(
    (c) =>
      (Math.hypot(c.x - start.x, c.y - start.y) / farthest) *
      (INTRO_MS - RISE_MS),
  );
  const matrix = new THREE.Matrix4();
  const wallColor = new THREE.Color();
  let rising = true;

  const threadMaterial = keep(
    new THREE.MeshStandardMaterial({ roughness: 0.55, emissiveIntensity: 0.3 }),
  );
  const trailMaterial = keep(
    new THREE.MeshStandardMaterial({ roughness: 0.8, emissiveIntensity: 0.18 }),
  );
  const goldMaterial = keep(
    new THREE.MeshStandardMaterial({
      roughness: 0.3,
      metalness: 0.35,
      emissiveIntensity: 0.9,
    }),
  );
  const capacity = (total + 2) * 4 + 2;
  const live = makeTube(capacity, THREAD_R, threadMaterial);
  const trail = makeTube(capacity, TRAIL_R, trailMaterial);
  const gold = makeTube(capacity, GOLD_R, goldMaterial);
  keep(live.mesh.geometry);
  keep(trail.mesh.geometry);
  keep(gold.mesh.geometry);
  scene.add(trail.mesh, live.mesh, gold.mesh);
  const xs = new Float32Array(capacity);
  const zs = new Float32Array(capacity);
  let goldCount = 0;
  let goldXs = xs;
  let goldZs = zs;

  const spoolMaterial = keep(
    new THREE.MeshStandardMaterial({ roughness: 0.95 }),
  );
  const spoolWrapMaterial = keep(
    new THREE.MeshStandardMaterial({ roughness: 0.8 }),
  );
  const spool = new THREE.Group();
  spool.add(
    new THREE.Mesh(keep(new THREE.SphereGeometry(0.17, 24, 16)), spoolMaterial),
  );
  for (const tilt of [0.5, -0.6, 1.4]) {
    const wrap = new THREE.Mesh(
      keep(new THREE.TorusGeometry(0.168, 0.022, 8, 32)),
      spoolWrapMaterial,
    );
    wrap.rotation.set(tilt, tilt * 1.7, 0);
    spool.add(wrap);
  }
  spool.position.set(wx(start.x), 0.17, wz(start.y));
  spool.traverse((part) => (part.castShadow = true));
  scene.add(spool);

  const heroMaterial = keep(
    new THREE.MeshStandardMaterial({
      roughness: 0.45,
      emissive: toColor(TORCH),
      emissiveIntensity: 0.12,
    }),
  );
  const scarfMaterial = keep(
    new THREE.MeshStandardMaterial({ roughness: 0.6 }),
  );
  const hero = new THREE.Group();
  const body = new THREE.Mesh(
    keep(
      new THREE.LatheGeometry(
        [
          [0, 0],
          [0.24, 0],
          [0.24, 0.05],
          [0.18, 0.09],
          [0.12, 0.14],
          [0.095, 0.3],
          [0.14, 0.33],
          [0.14, 0.36],
          [0.07, 0.38],
          [0, 0.38],
        ].map(([x, y]) => new THREE.Vector2(x, y)),
        28,
      ),
    ),
    heroMaterial,
  );
  const head = new THREE.Mesh(
    keep(new THREE.SphereGeometry(0.12, 24, 16)),
    heroMaterial,
  );
  head.position.y = 0.48;
  const scarf = new THREE.Mesh(
    keep(new THREE.TorusGeometry(0.115, 0.03, 8, 24)),
    scarfMaterial,
  );
  scarf.rotation.x = Math.PI / 2;
  scarf.position.y = 0.35;
  const stick = new THREE.Mesh(
    keep(new THREE.CylinderGeometry(0.016, 0.02, 0.3, 8)),
    keep(new THREE.MeshStandardMaterial({ color: 0x5b3a22, roughness: 0.9 })),
  );
  stick.position.set(0.21, 0.36, 0.04);
  stick.rotation.z = -0.25;
  const flame = new THREE.Mesh(
    keep(new THREE.SphereGeometry(0.055, 16, 12)),
    keep(
      new THREE.MeshBasicMaterial({ color: toColor(FLAME), toneMapped: false }),
    ),
  );
  flame.position.set(0.25, 0.53, 0.04);
  const halo = new THREE.Mesh(
    keep(new THREE.SphereGeometry(0.075, 16, 12)),
    keep(
      new THREE.MeshBasicMaterial({
        color: toColor(TORCH),
        transparent: true,
        opacity: 0.3,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    ),
  );
  halo.position.copy(flame.position);
  const torch = new THREE.PointLight(toColor(TORCH), 0, 6, 2);
  torch.position.set(0.25, 0.62, 0.04);
  torch.castShadow = true;
  torch.shadow.mapSize.set(512, 512);
  torch.shadow.camera.near = 0.05;
  torch.shadow.bias = -0.004;
  const figure = new THREE.Group();
  figure.add(body, head, scarf, stick, flame, halo, torch);
  const blob = new THREE.Mesh(
    keep(new THREE.PlaneGeometry(0.7, 0.7)),
    keep(
      new THREE.MeshBasicMaterial({
        map: keep(
          canvasTexture(64, 64, (g) => {
            const shade = g.createRadialGradient(32, 32, 0, 32, 32, 32);
            shade.addColorStop(0, "rgba(0, 0, 0, 0.55)");
            shade.addColorStop(1, "rgba(0, 0, 0, 0)");
            g.fillStyle = shade;
            g.fillRect(0, 0, 64, 64);
          }),
        ),
        transparent: true,
        depthWrite: false,
      }),
    ),
  );
  blob.rotation.x = -Math.PI / 2;
  blob.position.y = 0.006;
  figure.scale.setScalar(1.25);
  hero.add(figure, blob);
  scene.add(hero);

  const beamTexture = keep(
    canvasTexture(4, 128, (g) => {
      const fade = g.createLinearGradient(0, 0, 0, 128);
      fade.addColorStop(0, "rgba(255, 255, 255, 0)");
      fade.addColorStop(1, "rgba(255, 255, 255, 0.9)");
      g.fillStyle = fade;
      g.fillRect(0, 0, 4, 128);
    }),
  );
  const padMaterial = keep(new THREE.MeshBasicMaterial({ toneMapped: false }));
  const beamMaterial = keep(
    new THREE.MeshBasicMaterial({
      map: beamTexture,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      toneMapped: false,
    }),
  );
  const ringMaterial = keep(
    new THREE.MeshBasicMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      toneMapped: false,
    }),
  );
  const padGeometry = keep(new THREE.PlaneGeometry(0.78, 0.78));
  const beamGeometry = keep(
    new THREE.CylinderGeometry(0.38, 0.42, 2.6, 32, 1, true),
  );
  beamGeometry.translate(0, 1.3, 0);
  const ringGeometry = keep(new THREE.RingGeometry(0.42, 0.5, 48));
  const beams = [];
  const rings = [];
  for (const exit of exits) {
    const pad = new THREE.Mesh(padGeometry, padMaterial);
    pad.rotation.x = -Math.PI / 2;
    pad.position.set(wx(exit.x), 0.008, wz(exit.y));
    const beam = new THREE.Mesh(beamGeometry, beamMaterial);
    beam.position.set(wx(exit.x), 0, wz(exit.y));
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(wx(exit.x), 0.012, wz(exit.y));
    ring.visible = false;
    scene.add(pad, beam, ring);
    beams.push(beam);
    rings.push(ring);
  }
  const exitLight = new THREE.PointLight(0xffffff, 0, 3.5, 2);
  if (exits.length) {
    exitLight.position.set(wx(exits[0].x), 0.5, wz(exits[0].y));
    scene.add(exitLight);
  }
  const glory = new THREE.PointLight(0xffffff, 0, 4.5, 1.6);
  scene.add(glory);

  const stack = [start];
  const onStack = new Map([[key(start), 0]]);
  const goalTarget = new THREE.Vector3();
  const goalOffset = new THREE.Vector3();
  const overviewOffset = new THREE.Vector3();
  const followOffset = new THREE.Vector3();
  const offset = new THREE.Vector3();
  const shift = new THREE.Vector3();
  const corner = new THREE.Vector3();

  let palette = null;
  let mode = motion.matches ? "overview" : "follow";
  let customized = false;
  let sized = false;
  let delay = 90;
  let progress = 0;
  let reached = 0;
  let finishedAt = null;
  let fogMoving = true;
  let yaw = 0;
  let clock = 0;
  let last = 0;
  let raf = 0;
  let alive = true;

  controls.addEventListener("start", () => {
    customized = true;
  });

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

  function smooth(points, count) {
    let n = 0;
    const push = (x, z) => {
      xs[n] = x;
      zs[n] = z;
      n += 1;
    };
    push(points[0].x, points[0].z);
    for (let i = 1; i < count - 1; i += 1) {
      const a = points[i - 1];
      const b = points[i];
      const c = points[i + 1];
      const ex = (b.x + c.x) / 2;
      const ez = (b.z + c.z) / 2;
      const turn = (b.x - a.x) * (c.z - b.z) - (b.z - a.z) * (c.x - b.x);
      const ahead = (b.x - a.x) * (c.x - b.x) + (b.z - a.z) * (c.z - b.z);
      if (ahead < 0) {
        push(b.x, b.z);
        continue;
      }
      if (Math.abs(turn) < 1e-6) {
        push(ex, ez);
        continue;
      }
      const sx = xs[n - 1];
      const sz = zs[n - 1];
      for (const t of [0.25, 0.5, 0.75, 1]) {
        const u = 1 - t;
        push(
          u * u * sx + 2 * u * t * b.x + t * t * ex,
          u * u * sz + 2 * u * t * b.z + t * t * ez,
        );
      }
    }
    if (count > 1) push(points[count - 1].x, points[count - 1].z);
    return n;
  }

  function finish() {
    finishedAt = clock;
    target.fill(1);
    if (escaped) {
      const points = stack.map((c) => ({ x: wx(c.x), z: wz(c.y) }));
      goldCount = smooth(points, points.length);
      goldXs = xs.slice(0, goldCount);
      goldZs = zs.slice(0, goldCount);
      gold.set(goldXs, goldZs, goldCount);
      gold.reveal(0);
    }
    setMode("overview");
    onCamera?.("overview");
    onFinish?.();
  }

  function applyPalette() {
    palette = readPalette(canvas);
    const p = palette;
    host?.style.setProperty("--maze-stone", rgba(p.stone));
    host?.style.setProperty("--maze-front", rgba(p.front));
    host?.style.setProperty("--maze-thread", rgba(p.thread));
    host?.style.setProperty("--maze-faded", rgba(p.threadFaded));
    host?.style.setProperty("--maze-torch", rgba(TORCH));
    host?.style.setProperty("--maze-flame", rgba(FLAME));

    hemi.color.copy(toColor(p.dark ? mix(p.stoneLit, WHITE, 0.4) : WHITE));
    hemi.groundColor.copy(
      toColor(p.dark ? p.floor : mix(p.floor, p.ink, 0.25)),
    );
    moon.color.copy(toColor(p.dark ? mix(p.stoneLit, WHITE, 0.6) : WHITE));
    plinthMaterial.color.copy(toColor(p.front));
    threadMaterial.color.copy(toColor(p.thread));
    threadMaterial.emissive.copy(toColor(p.thread));
    trailMaterial.color.copy(toColor(p.threadFaded));
    trailMaterial.emissive.copy(toColor(p.threadFaded));
    goldMaterial.color.copy(toColor(p.gold));
    goldMaterial.emissive.copy(toColor(p.gold));
    glory.color.copy(toColor(p.gold));
    spoolMaterial.color.copy(toColor(p.thread));
    spoolWrapMaterial.color.copy(toColor(p.threadDeep));
    scarfMaterial.color.copy(toColor(p.thread));
    heroMaterial.color.copy(toColor(mix(FLAME, TORCH, 0.2)));
    padMaterial.color.copy(toColor(p.success));
    beamMaterial.color.copy(toColor(p.success));
    beamMaterial.blending = p.dark
      ? THREE.AdditiveBlending
      : THREE.NormalBlending;
    ringMaterial.color.copy(toColor(p.success));
    exitLight.color.copy(toColor(p.success));
    paintFloor();
    paintWalls();
    paintFog();
  }

  function paintFloor() {
    const g = floorCanvas.getContext("2d");
    const p = palette;
    const t = floorTile;
    const base = p.dark ? mix(p.floor, p.stone, 0.35) : p.floor;
    const alt = p.dark ? mix(p.floorAlt, p.stone, 0.42) : p.floorAlt;
    g.fillStyle = rgba(base);
    g.fillRect(0, 0, floorCanvas.width, floorCanvas.height);
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        if (isWall(x, y)) continue;
        if ((x + y) % 2) {
          g.fillStyle = rgba(alt);
          g.fillRect(x * t, y * t, t, t);
        }
        g.fillStyle = rgba(p.grout, 0.6);
        g.fillRect(x * t, y * t, t, Math.max(1, t / 16));
        g.fillRect(x * t, y * t, Math.max(1, t / 16), t);
      }
    }
    for (const exit of exits) {
      g.fillStyle = rgba(p.success, 0.35);
      g.fillRect(exit.x * t, exit.y * t, t, t);
    }
    floorTexture.needsUpdate = true;
  }

  function paintWalls() {
    const p = palette;
    const stone = toColor(p.stone);
    const dim = toColor(mix(p.stone, p.fog, p.dark ? 0.5 : 0.5));
    wallCells.forEach((cell, i) => {
      wallColor
        .copy(dim)
        .lerp(stone, reveal[cell.y * cols + cell.x])
        .multiplyScalar(1 + 0.035 * noise(cell.x, cell.y));
      walls.setColorAt(i, wallColor);
    });
    walls.instanceColor.needsUpdate = true;
  }

  function paintFog() {
    const [r, g, b] = palette.fog;
    const alpha = palette.fogAlpha * 0.75 * 255;
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        const o = ((rows - 1 - y) * cols + x) * 4;
        fogData[o] = r;
        fogData[o + 1] = g;
        fogData[o + 2] = b;
        fogData[o + 3] = Math.round((1 - reveal[y * cols + x]) * alpha);
      }
    }
    fogTexture.needsUpdate = true;
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
    if (!fogMoving) return;
    paintWalls();
    paintFog();
  }

  function placeWalls() {
    const still = motion.matches;
    rising = false;
    wallCells.forEach((cell, i) => {
      const t = still ? 1 : clamp01((clock - riseDelay[i]) / RISE_MS);
      if (t < 1) rising = true;
      const scale = Math.max(0.001, t >= 1 ? 1 : easeBack(t));
      matrix.makeScale(1, scale, 1).setPosition(wx(cell.x), 0, wz(cell.y));
      walls.setMatrixAt(i, matrix);
    });
    walls.instanceMatrix.needsUpdate = true;
  }

  function frameOverview() {
    probe.aspect = camera.aspect;
    probe.updateProjectionMatrix();
    let distance = Math.max(cols, rows) * 1.4;
    const hx = cols / 2 + 0.45;
    const hz = rows / 2 + 0.45;
    for (let pass = 0; pass < 4; pass += 1) {
      probe.position.setFromSphericalCoords(distance, OVERVIEW_PHI, 0);
      probe.lookAt(0, 0, 0);
      probe.updateMatrixWorld();
      let extent = 0;
      for (const x of [-hx, hx]) {
        for (const z of [-hz, hz]) {
          for (const y of [-0.5, WALL_H]) {
            corner.set(x, y, z).project(probe);
            extent = Math.max(extent, Math.abs(corner.x), Math.abs(corner.y));
          }
        }
      }
      distance *= extent / 0.9;
    }
    overviewOffset.setFromSphericalCoords(distance, OVERVIEW_PHI, 0);
    followOffset.setFromSphericalCoords(
      Math.min(FOLLOW_DISTANCE, distance),
      FOLLOW_PHI,
      0,
    );
    controls.maxDistance = distance * 1.8;
  }

  function setMode(next) {
    mode = next;
    customized = false;
  }

  function headAt(moving) {
    const here = path[reached];
    if (!moving) return { x: wx(here.x), z: wz(here.y) };
    const next = path[reached + 1];
    const f = progress - reached;
    return {
      x: wx(here.x) + (next.x - here.x) * f,
      z: wz(here.y) + (next.y - here.y) * f,
    };
  }

  function updateThread(head, moving) {
    const steps = [];
    for (let i = 0; i <= reached; i += 1) {
      steps.push({ x: wx(path[i].x), z: wz(path[i].y) });
    }
    if (moving) steps.push(head);
    trail.set(xs, zs, steps.length > 1 ? smooth(steps, steps.length) : 0);

    const next = moving ? path[reached + 1] : null;
    const rewinding =
      next && stack.length > 1 && key(stack[stack.length - 2]) === key(next);
    const kept = rewinding ? stack.length - 1 : stack.length;
    const points = [];
    for (let i = 0; i < kept; i += 1) {
      points.push({ x: wx(stack[i].x), z: wz(stack[i].y) });
    }
    if (moving) points.push(head);
    live.set(xs, zs, points.length > 1 ? smooth(points, points.length) : 0);
  }

  function updateCamera(dt, head) {
    const still = motion.matches;
    const intro = !still && clock < INTRO_MS;
    const following = mode === "follow" && !intro && finishedAt === null;
    if (following) goalTarget.set(head.x, 0, head.z);
    else goalTarget.set(0, 0, 0);
    if (!customized) goalOffset.copy(following ? followOffset : overviewOffset);

    const k = still ? 1 : 1 - Math.exp(-dt / CAMERA_MS);
    const track = still
      ? 1
      : 1 - Math.exp(-dt / (following ? FOLLOW_MS : CAMERA_MS));
    shift.copy(goalTarget).sub(controls.target).multiplyScalar(track);
    controls.target.add(shift);
    camera.position.add(shift);
    if (!customized) {
      offset.copy(camera.position).sub(controls.target).lerp(goalOffset, k);
      camera.position.copy(controls.target).add(offset);
    }
    controls.update();
  }

  function render(dt) {
    const p = palette;
    const still = motion.matches;
    const t = clock / 1000;
    const moving = reached < total && !still;
    const head = headAt(moving);
    const since = finishedAt === null ? -1 : clock - finishedAt;
    const lift = since < 0 ? 0 : still ? 1 : ease(clamp01(since / LIFT_MS));
    const levels = p.dark ? LIGHTS.dark : LIGHTS.light;

    if (rising) placeWalls();
    updateThread(head, moving);

    const next = moving ? path[reached + 1] : null;
    if (next) {
      const here = path[reached];
      const want = Math.atan2(next.x - here.x, next.y - here.y);
      const turn = Math.atan2(Math.sin(want - yaw), Math.cos(want - yaw));
      yaw += turn * (1 - Math.exp(-dt / 90));
    }
    const hop = moving ? Math.abs(Math.sin(progress * Math.PI)) * 0.12 : 0;
    hero.position.set(head.x, 0, head.z);
    figure.position.y = hop;
    hero.rotation.y = yaw;
    blob.scale.setScalar(1 - hop * 1.5);

    const flicker = still
      ? 1
      : 1 +
        0.06 * Math.sin(t * 7.1) +
        0.04 * Math.sin(t * 12.7 + 1.3) +
        0.03 * Math.sin(t * 23.3 + 0.4);
    torch.intensity = levels.torch * flicker * (1 - lift * 0.4);
    flame.scale.set(1, 1.35 * flicker, 1);
    halo.scale.setScalar(flicker);

    hemi.intensity = lerp(levels.hemi[0], levels.hemi[1], lift);
    moon.intensity = lerp(levels.moon[0], levels.moon[1], lift);

    const pulse = still ? 1 : 0.85 + 0.15 * Math.sin(t * 2.4);
    const burst = since < 0 || !escaped ? 0 : clamp01(since / BURST_MS);
    beamMaterial.opacity =
      (p.dark ? 0.45 : 0.3) * pulse * (1 + burst * (1 - burst) * 3);
    for (const beam of beams)
      beam.scale.set(1, 1 + burst * (1 - burst) * 1.6, 1);
    exitLight.intensity = levels.exit * pulse * (1 + lift);
    rings.forEach((ring) => {
      ring.visible = burst > 0 && burst < 1 && !still;
      ring.scale.setScalar(1 + ease(burst) * 7);
      ringMaterial.opacity = 1 - ease(burst);
    });

    const sweep =
      goldCount && since >= 0
        ? still
          ? 1
          : ease(clamp01((since - SWEEP_DELAY) / SWEEP_MS))
        : 0;
    if (goldCount) {
      const reach = sweep * (goldCount - 1);
      gold.reveal(Math.floor(reach));
      const i = Math.min(goldCount - 1, Math.floor(reach));
      glory.position.set(goldXs[i], 0.6, goldZs[i]);
      glory.intensity = sweep > 0 && sweep < 1 ? 7 : 0;
    }

    updateCamera(dt, head);
    renderer.render(scene, camera);
  }

  function frame(now) {
    raf = 0;
    if (!alive) return;
    const dt = last ? Math.min(now - last, 64) : 16;
    last = now;
    clock += dt;

    const ready = motion.matches || clock >= INTRO_MS;
    if (sized && ready && progress < total) {
      progress = Math.min(total, progress + dt / delay);
      const step = Math.floor(progress);
      if (step > reached) advance(step);
    }
    if (sized && ready && finishedAt === null && progress >= total) finish();

    updateFog(dt);
    if (sized) render(dt);

    const settled =
      finishedAt !== null &&
      !fogMoving &&
      clock - finishedAt > SWEEP_DELAY + SWEEP_MS;
    if (!(motion.matches && settled)) schedule();
  }

  function schedule() {
    if (alive && !raf) raf = requestAnimationFrame(frame);
  }

  applyPalette();
  light(start, EXPLORED);
  placeWalls();
  onStep?.(0, total);

  return {
    kind: "3d",
    resize(width, height) {
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      frameOverview();
      if (!sized) {
        sized = true;
        controls.target.set(0, 0, 0);
        offset.copy(overviewOffset);
        if (!motion.matches)
          offset
            .multiplyScalar(1.45)
            .applyAxisAngle(THREE.Object3D.DEFAULT_UP, -0.7);
        camera.position.copy(offset);
        camera.lookAt(0, 0, 0);
      }
      schedule();
    },
    setDelay(ms) {
      delay = Math.max(1, ms);
    },
    setCamera(next) {
      if (next !== mode) setMode(next);
      schedule();
    },
    refresh() {
      applyPalette();
      schedule();
    },
    destroy() {
      alive = false;
      cancelAnimationFrame(raf);
      controls.dispose();
      walls.dispose();
      for (const thing of disposables) thing.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
