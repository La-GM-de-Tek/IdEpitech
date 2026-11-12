import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { WHITE, mix, noise, readPalette, rgba } from "../scenePalette";

const GAP = 0.16;
const TILE = 0.88;
const TILE_H = 0.5;
const RAISED = 0.3;
const SUNK = 0.08;
const MARGIN = 0.6;
const HALF = 4.5 + GAP;
const INTRO_MS = 1200;
const RISE_MS = 560;
const IGNITE_MS = 650;
const WAVE_MS = 90;
const BEAM_MS = 1600;
const CAMERA_MS = 480;
const PHI = 0.8;
const THETA = 0.24;
const GLYPH = 128;
const PARTICLES = 600;

const SHEIKAH = { dark: [104, 216, 255], light: [0, 126, 196] };
const LIGHTS = {
  dark: { hemi: 2.4, moon: 2.8, flash: 9 },
  light: { hemi: 1.6, moon: 2, flash: 3 },
};

const ease = (t) => 1 - Math.pow(1 - t, 3);
const easeBack = (t) => 1 + 2.4 * Math.pow(t - 1, 3) + 1.4 * Math.pow(t - 1, 2);
const clamp01 = (t) => Math.max(0, Math.min(1, t));
const lerp = (a, b, t) => a + (b - a) * t;
const at = (i) => i + Math.floor(i / 3) * GAP - (4 + GAP);
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

function paintGlyph(g, digit, family, glow) {
  const s = GLYPH;
  g.clearRect(0, 0, s, s);
  g.save();
  g.fillStyle = "#fff";
  g.strokeStyle = "#fff";
  if (glow) {
    g.shadowColor = "#fff";
    g.shadowBlur = s * 0.09;
  }
  g.lineWidth = s * 0.026;
  g.lineCap = "round";
  g.globalAlpha = 0.55;
  for (let k = 0; k < 4; k += 1) {
    const angle = (k * Math.PI) / 2 + Math.PI / 4;
    g.beginPath();
    g.arc(s / 2, s / 2, s * 0.42, angle - 0.42, angle + 0.42);
    g.stroke();
  }
  g.globalAlpha = 1;
  g.font = `700 ${Math.round(s * 0.58)}px ${family}`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(String(digit), s / 2, s / 2 + s * 0.035);
  g.restore();
}

function groupRect(cells) {
  if (!cells.length) return null;
  const ys = new Set(cells.map(([y]) => y));
  const xs = new Set(cells.map(([, x]) => x));
  let y0;
  let y1;
  let x0;
  let x1;
  if (ys.size === 1) {
    [y0, y1, x0, x1] = [cells[0][0], cells[0][0], 0, 8];
  } else if (xs.size === 1) {
    [y0, y1, x0, x1] = [0, 8, cells[0][1], cells[0][1]];
  } else {
    const by = Math.floor(cells[0][0] / 3) * 3;
    const bx = Math.floor(cells[0][1] / 3) * 3;
    [y0, y1, x0, x1] = [by, by + 2, bx, bx + 2];
  }
  return {
    x: (at(x0) + at(x1)) / 2,
    z: (at(y0) + at(y1)) / 2,
    width: at(x1) - at(x0) + 1.08,
    depth: at(y1) - at(y0) + 1.08,
  };
}

export function createSeal3D({ canvas, host, given, onIntro }) {
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
  const scene = new THREE.Scene();
  const disposables = [];
  const keep = (thing) => {
    disposables.push(thing);
    return thing;
  };

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 200);
  const probe = new THREE.PerspectiveCamera(30, 1, 0.1, 200);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.rotateSpeed = 0.6;
  controls.zoomSpeed = 0.8;
  controls.minDistance = 6;
  controls.minPolarAngle = 0.1;
  controls.maxPolarAngle = 1.25;

  const hemi = new THREE.HemisphereLight(0xffffff, 0x000000, 1);
  const moon = new THREE.DirectionalLight(0xffffff, 1);
  moon.position.set(-6, 13, -7);
  moon.castShadow = true;
  moon.shadow.mapSize.set(1024, 1024);
  Object.assign(moon.shadow.camera, {
    left: -8,
    right: 8,
    top: 8,
    bottom: -8,
    near: 1,
    far: 40,
  });
  moon.shadow.camera.updateProjectionMatrix();
  moon.shadow.bias = -0.0005;
  moon.shadow.normalBias = 0.02;
  const flash = new THREE.PointLight(0xffffff, 0, 5, 2);
  scene.add(hemi, moon, moon.target, flash);

  const slabSize = HALF * 2 + MARGIN * 2;
  const slabGeometry = keep(
    new RoundedBoxGeometry(slabSize, 0.6, slabSize, 4, 0.16),
  );
  slabGeometry.translate(0, -0.3, 0);
  const slabMaterial = keep(new THREE.MeshStandardMaterial({ roughness: 0.9 }));
  const slab = new THREE.Mesh(slabGeometry, slabMaterial);
  slab.receiveShadow = true;
  const ground = new THREE.Mesh(
    keep(new THREE.PlaneGeometry(slabSize * 1.6, slabSize * 1.6)),
    keep(
      new THREE.MeshBasicMaterial({
        map: keep(
          canvasTexture(128, 128, (g) => {
            const shade = g.createRadialGradient(64, 64, 20, 64, 64, 64);
            shade.addColorStop(0, "rgba(0, 0, 0, 0.45)");
            shade.addColorStop(1, "rgba(0, 0, 0, 0)");
            g.fillStyle = shade;
            g.fillRect(0, 0, 128, 128);
          }),
        ),
        transparent: true,
        depthWrite: false,
      }),
    ),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.62;
  scene.add(slab, ground);

  const grooveMaterial = keep(
    new THREE.MeshBasicMaterial({
      transparent: true,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  const grooveLine = keep(new THREE.BoxGeometry(1, 0.02, 1));
  const cut = (at(2) + at(3)) / 2;
  [
    [0, -cut, HALF * 2 + 0.2, 0.05],
    [0, cut, HALF * 2 + 0.2, 0.05],
    [-cut, 0, 0.05, HALF * 2 + 0.2],
    [cut, 0, 0.05, HALF * 2 + 0.2],
    [0, -HALF - 0.1, HALF * 2 + 0.25, 0.05],
    [0, HALF + 0.1, HALF * 2 + 0.25, 0.05],
    [-HALF - 0.1, 0, 0.05, HALF * 2 + 0.25],
    [HALF + 0.1, 0, 0.05, HALF * 2 + 0.25],
  ].forEach(([x, z, width, depth]) => {
    const groove = new THREE.Mesh(grooveLine, grooveMaterial);
    groove.position.set(x, 0.012, z);
    groove.scale.set(width, 1, depth);
    scene.add(groove);
  });

  const faultMaterial = keep(
    new THREE.MeshBasicMaterial({
      transparent: true,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  const faultPlane = new THREE.Mesh(
    keep(new THREE.PlaneGeometry(1, 1)),
    faultMaterial,
  );
  faultPlane.rotation.x = -Math.PI / 2;
  faultPlane.position.y = 0.02;
  faultPlane.visible = false;
  scene.add(faultPlane);

  const glyphCanvases = [];
  const crisp = [null];
  const glow = [null];
  for (let digit = 1; digit <= 9; digit += 1) {
    for (const [list, lit] of [
      [crisp, false],
      [glow, true],
    ]) {
      const texture = keep(canvasTexture(GLYPH, GLYPH, () => {}));
      texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
      glyphCanvases.push({ texture, digit, lit });
      list.push(texture);
    }
  }

  const tileGeometry = keep(
    new RoundedBoxGeometry(TILE, TILE_H, TILE, 3, 0.07),
  );
  tileGeometry.translate(0, -TILE_H / 2, 0);
  const glyphGeometry = keep(new THREE.PlaneGeometry(TILE * 0.82, TILE * 0.82));
  const cells = [];
  for (let y = 0; y < 9; y += 1) {
    for (let x = 0; x < 9; x += 1) {
      const material = keep(
        new THREE.MeshStandardMaterial({ roughness: 0.78 }),
      );
      const mesh = new THREE.Mesh(tileGeometry, material);
      mesh.position.set(at(x), SUNK, at(y));
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      const glyphMaterial = keep(
        new THREE.MeshBasicMaterial({
          transparent: true,
          depthWrite: false,
          toneMapped: false,
        }),
      );
      const glyph = new THREE.Mesh(glyphGeometry, glyphMaterial);
      glyph.rotation.x = -Math.PI / 2;
      glyph.position.y = 0.004;
      glyph.visible = false;
      mesh.add(glyph);
      scene.add(mesh);
      cells.push({
        y,
        x,
        mesh,
        material,
        glyph,
        glyphMaterial,
        value: 0,
        given: Boolean(given?.[y]?.[x]),
        igniteAt: 0,
        sparked: true,
        introDelay: Math.hypot(x - 4, y - 4) * 70,
        jitter: 1 + 0.05 * noise(x + 11, y + 7),
      });
    }
  }

  const beamTexture = keep(
    canvasTexture(4, 128, (g) => {
      const fade = g.createLinearGradient(0, 0, 0, 128);
      fade.addColorStop(0, "rgba(255, 255, 255, 0)");
      fade.addColorStop(0.72, "rgba(255, 255, 255, 0.8)");
      fade.addColorStop(0.9, "rgba(255, 255, 255, 0.45)");
      fade.addColorStop(1, "rgba(255, 255, 255, 0.12)");
      g.fillStyle = fade;
      g.fillRect(0, 0, 4, 128);
    }),
  );
  const beamMaterial = keep(
    new THREE.MeshBasicMaterial({
      map: beamTexture,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      toneMapped: false,
    }),
  );
  const beamGeometry = keep(
    new THREE.CylinderGeometry(0.85, 1.15, 12, 48, 1, true),
  );
  beamGeometry.translate(0, 6, 0);
  const beam = new THREE.Mesh(beamGeometry, beamMaterial);
  beam.visible = false;
  const ringMaterial = keep(
    new THREE.MeshBasicMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      toneMapped: false,
    }),
  );
  const ring = new THREE.Mesh(
    keep(new THREE.RingGeometry(0.9, 1, 96)),
    ringMaterial,
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.35;
  ring.visible = false;
  scene.add(beam, ring);

  const sparkPositions = new Float32Array(PARTICLES * 3).fill(-100);
  const sparkColors = new Float32Array(PARTICLES * 4);
  const sparkVelocity = new Float32Array(PARTICLES * 3);
  const sparkLife = new Float32Array(PARTICLES);
  const sparkTint = new Float32Array(PARTICLES * 3);
  const sparkGeometry = keep(new THREE.BufferGeometry());
  const sparkPosition = new THREE.BufferAttribute(sparkPositions, 3);
  const sparkColor = new THREE.BufferAttribute(sparkColors, 4);
  sparkPosition.setUsage(THREE.DynamicDrawUsage);
  sparkColor.setUsage(THREE.DynamicDrawUsage);
  sparkGeometry.setAttribute("position", sparkPosition);
  sparkGeometry.setAttribute("color", sparkColor);
  const sparkMaterial = keep(
    new THREE.PointsMaterial({
      size: 0.16,
      map: keep(
        canvasTexture(32, 32, (g) => {
          const dot = g.createRadialGradient(16, 16, 0, 16, 16, 16);
          dot.addColorStop(0, "rgba(255, 255, 255, 1)");
          dot.addColorStop(1, "rgba(255, 255, 255, 0)");
          g.fillStyle = dot;
          g.fillRect(0, 0, 32, 32);
        }),
      ),
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  const sparks = new THREE.Points(sparkGeometry, sparkMaterial);
  sparks.frustumCulled = false;
  scene.add(sparks);
  let sparkCursor = 0;

  const goal = new THREE.Vector3();
  const corner = new THREE.Vector3();
  const tint = new THREE.Color();
  const glowColor = new THREE.Color();
  let colors = null;
  let palette = null;
  let family = "sans-serif";
  let distance = 16;
  let sized = false;
  let customized = false;
  let initialized = false;
  let faultKeys = new Set();
  let solvedAt = null;
  let victoryAt = null;
  let golden = false;
  let flashAt = -1e9;
  let clock = 0;
  let last = 0;
  let raf = 0;
  let alive = true;
  let introDone = false;

  controls.addEventListener("start", () => {
    customized = true;
  });

  function paintGlyphs() {
    for (const { texture, digit, lit } of glyphCanvases) {
      paintGlyph(texture.image.getContext("2d"), digit, family, lit);
      texture.needsUpdate = true;
    }
  }

  function applyPalette() {
    palette = readPalette(canvas);
    const p = palette;
    const light = SHEIKAH[p.dark ? "dark" : "light"];
    colors = {
      stone: toColor(p.stone),
      engraved: toColor(
        p.dark ? mix(p.stone, WHITE, 0.55) : mix(p.stone, p.ink, 0.66),
      ),
      light: toColor(light),
      danger: toColor(p.danger),
      success: toColor(p.success),
      gold: toColor(p.gold),
    };
    host?.style.setProperty("--seal-stone", rgba(p.stone));
    host?.style.setProperty(
      "--seal-engraved",
      rgba(p.dark ? mix(p.stone, WHITE, 0.55) : mix(p.stone, p.ink, 0.66)),
    );
    host?.style.setProperty("--seal-sunk", rgba(mix(p.stone, p.ink, 0.3)));
    host?.style.setProperty("--seal-light", rgba(light));

    hemi.color.copy(toColor(p.dark ? mix(p.stoneLit, WHITE, 0.4) : WHITE));
    hemi.groundColor.copy(
      toColor(p.dark ? p.floor : mix(p.floor, p.ink, 0.25)),
    );
    moon.color.copy(toColor(p.dark ? mix(p.stoneLit, WHITE, 0.6) : WHITE));
    const levels = p.dark ? LIGHTS.dark : LIGHTS.light;
    hemi.intensity = levels.hemi;
    moon.intensity = levels.moon;
    flash.color.copy(colors.light);
    slabMaterial.color.copy(toColor(p.front));
    for (const material of [
      grooveMaterial,
      beamMaterial,
      ringMaterial,
      faultMaterial,
      sparkMaterial,
    ]) {
      material.blending = p.dark
        ? THREE.AdditiveBlending
        : THREE.NormalBlending;
    }
    faultMaterial.color.copy(colors.danger);

    const display = getComputedStyle(canvas)
      .getPropertyValue("--font-display")
      .trim();
    family = display || "sans-serif";
    paintGlyphs();
    document.fonts
      ?.load(`700 64px ${family}`)
      .then(() => alive && paintGlyphs())
      .catch(() => {});
  }

  function spawn(x, z, count, color, spread, lift) {
    for (let n = 0; n < count; n += 1) {
      const i = sparkCursor;
      sparkCursor = (sparkCursor + 1) % PARTICLES;
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * spread;
      sparkPositions[i * 3] = x + Math.cos(angle) * radius;
      sparkPositions[i * 3 + 1] = RAISED + 0.05;
      sparkPositions[i * 3 + 2] = z + Math.sin(angle) * radius;
      sparkVelocity[i * 3] = Math.cos(angle) * 0.35 * Math.random();
      sparkVelocity[i * 3 + 1] = lift * (0.6 + Math.random() * 0.8);
      sparkVelocity[i * 3 + 2] = Math.sin(angle) * 0.35 * Math.random();
      sparkLife[i] = 1;
      sparkTint[i * 3] = color.r;
      sparkTint[i * 3 + 1] = color.g;
      sparkTint[i * 3 + 2] = color.b;
    }
  }

  function updateSparks(dt) {
    const step = dt / 1000;
    for (let i = 0; i < PARTICLES; i += 1) {
      if (sparkLife[i] <= 0) continue;
      sparkLife[i] = Math.max(0, sparkLife[i] - step / 1.3);
      sparkVelocity[i * 3 + 1] *= 1 - step * 0.6;
      sparkPositions[i * 3] += sparkVelocity[i * 3] * step;
      sparkPositions[i * 3 + 1] += sparkVelocity[i * 3 + 1] * step;
      sparkPositions[i * 3 + 2] += sparkVelocity[i * 3 + 2] * step;
      const alpha = Math.sin(sparkLife[i] * Math.PI) * 0.9;
      sparkColors[i * 4] = sparkTint[i * 3];
      sparkColors[i * 4 + 1] = sparkTint[i * 3 + 1];
      sparkColors[i * 4 + 2] = sparkTint[i * 3 + 2];
      sparkColors[i * 4 + 3] = alpha;
      if (sparkLife[i] === 0) sparkPositions[i * 3 + 1] = -100;
    }
    sparkPosition.needsUpdate = true;
    sparkColor.needsUpdate = true;
  }

  function frameView() {
    probe.aspect = camera.aspect;
    probe.updateProjectionMatrix();
    distance = 24;
    const half = slabSize / 2;
    for (let pass = 0; pass < 4; pass += 1) {
      probe.position.setFromSphericalCoords(distance, PHI, THETA);
      probe.lookAt(0, 0, 0);
      probe.updateMatrixWorld();
      let extent = 0;
      for (const x of [-half, half]) {
        for (const z of [-half, half]) {
          for (const y of [-0.6, RAISED + 0.1]) {
            corner.set(x, y, z).project(probe);
            extent = Math.max(extent, Math.abs(corner.x), Math.abs(corner.y));
          }
        }
      }
      distance *= extent / 0.86;
    }
    controls.maxDistance = distance * 2;
  }

  function render(dt) {
    const still = motion.matches;
    const t = clock / 1000;
    const solveColor = golden ? colors.gold : colors.success;

    for (const cell of cells) {
      const intro = still ? 1 : clamp01((clock - cell.introDelay) / RISE_MS);
      const lit = cell.value && !cell.given;
      const a =
        !lit || still ? 1 : clamp01((clock - cell.igniteAt) / IGNITE_MS);
      if (lit && !cell.sparked && clock >= cell.igniteAt) {
        cell.sparked = true;
        flashAt = clock;
        flash.position.set(at(cell.x), 1.1, at(cell.y));
        if (!still) spawn(at(cell.x), at(cell.y), 9, colors.light, 0.35, 1.3);
      }
      const ignited = lit && clock >= cell.igniteAt;
      const height =
        cell.value && (cell.given || ignited)
          ? lerp(SUNK, RAISED, cell.given ? 1 : easeBack(a))
          : SUNK;
      cell.mesh.position.y =
        intro < 1 ? lerp(-0.55, height, easeBack(intro)) : height;

      cell.glyph.visible =
        Boolean(cell.value) && (cell.given ? intro > 0.4 : ignited);
      cell.glyph.scale.setScalar(cell.given ? 1 : lerp(1.6, 1, ease(a)));
      cell.glyphMaterial.opacity = cell.given
        ? ease(clamp01(intro * 2 - 0.8))
        : ease(a);

      const faulty = faultKeys.has(cell.y * 9 + cell.x);
      const wave =
        solvedAt === null || still
          ? Number(solvedAt !== null)
          : clamp01(
              (clock -
                solvedAt -
                Math.hypot(cell.x - 4, cell.y - 4) * WAVE_MS) /
                420,
            );
      tint.copy(cell.given ? colors.engraved : colors.light);
      if (faulty) tint.copy(colors.danger);
      else if (wave > 0) tint.lerp(solveColor, wave);
      cell.glyphMaterial.color.copy(tint);

      cell.material.color
        .copy(colors.stone)
        .multiplyScalar(cell.value ? cell.jitter : cell.jitter * 0.78);
      glowColor.setRGB(0, 0, 0);
      if (ignited && a < 1)
        glowColor.copy(colors.light).multiplyScalar((1 - a) * 0.7);
      if (faulty)
        glowColor
          .copy(colors.danger)
          .multiplyScalar(0.3 + (still ? 0 : 0.18 * Math.sin(t * 6)));
      else if (wave > 0 && wave < 1)
        glowColor
          .copy(solveColor)
          .multiplyScalar(Math.sin(wave * Math.PI) * 0.45);
      cell.material.emissive.copy(glowColor);
    }

    const levels = palette.dark ? LIGHTS.dark : LIGHTS.light;
    flash.intensity = levels.flash * Math.exp(-(clock - flashAt) / 280);

    const settled =
      solvedAt === null
        ? 0
        : still
          ? 1
          : ease(clamp01((clock - solvedAt) / 1400));
    grooveMaterial.color.copy(colors.light).lerp(solveColor, settled);
    grooveMaterial.opacity = lerp(palette.dark ? 0.32 : 0.45, 1, settled);

    faultPlane.visible = faultKeys.size > 0;
    faultMaterial.opacity =
      (palette.dark ? 0.35 : 0.22) *
      (still ? 1 : 0.75 + 0.25 * Math.sin(t * 6));

    const since = victoryAt === null ? -1 : clock - victoryAt;
    beam.visible = since >= 0;
    ring.visible = since >= 0 && since < 1600 && !still;
    if (since >= 0) {
      const rise = still ? 1 : ease(clamp01(since / BEAM_MS));
      beam.scale.set(1, Math.max(0.001, rise), 1);
      beamMaterial.color.copy(solveColor);
      const fade = still
        ? 0.45
        : lerp(1, 0.45, ease(clamp01((since - 2200) / 1800)));
      beamMaterial.opacity =
        (palette.dark ? 0.4 : 0.28) *
        fade *
        (still ? 1 : 0.85 + 0.15 * Math.sin(t * 2));
      const burst = clamp01(since / 1600);
      ring.scale.setScalar(1 + ease(burst) * 7);
      ringMaterial.color.copy(solveColor);
      ringMaterial.opacity = 1 - ease(burst);
      if (!still && Math.random() < dt / 60) {
        spawn(0, 0, 2, solveColor, 1.3, 2.4);
      }
    }

    updateSparks(dt);

    const k = still ? 1 : 1 - Math.exp(-dt / CAMERA_MS);
    if (!customized) {
      const sway = still ? 0 : Math.sin(t * 0.3) * 0.07;
      goal.setFromSphericalCoords(distance, PHI, THETA + sway);
      camera.position.lerp(goal, k);
    }
    controls.update();
    renderer.render(scene, camera);
  }

  function frame(now) {
    raf = 0;
    if (!alive) return;
    const dt = last ? Math.min(now - last, 64) : 16;
    last = now;
    clock += dt;
    if (sized) render(dt);
    if (sized && !introDone && (motion.matches || clock >= INTRO_MS - 150)) {
      introDone = true;
      onIntro?.();
    }
    schedule();
  }

  function schedule() {
    if (alive && !raf) raf = requestAnimationFrame(frame);
  }

  applyPalette();

  return {
    kind: "3d",
    update({ grid, fault, solved, victory, golden: gilded }) {
      if (!grid) return;
      const fresh = [];
      for (const cell of cells) {
        const value = grid[cell.y][cell.x] || 0;
        if (value === cell.value) continue;
        if (value) {
          cell.glyphMaterial.map = (cell.given ? crisp : glow)[value];
          cell.glyphMaterial.needsUpdate = true;
        }
        if (value && !cell.value && !cell.given) fresh.push(cell);
        else {
          cell.igniteAt = clock;
          cell.sparked = true;
        }
        cell.value = value;
      }
      const start = initialized ? clock : INTRO_MS;
      const stagger = fresh.length ? Math.min(40, 520 / fresh.length) : 0;
      fresh.forEach((cell, i) => {
        cell.igniteAt = start + i * stagger;
        cell.sparked = false;
      });
      initialized = true;

      faultKeys = new Set(
        [...(fault ?? [])].map((key) => {
          const [y, x] = key.split(",").map(Number);
          return y * 9 + x;
        }),
      );
      const rect = groupRect(
        [...faultKeys].map((k) => [Math.floor(k / 9), k % 9]),
      );
      if (rect) {
        faultPlane.position.set(rect.x, 0.02, rect.z);
        faultPlane.scale.set(rect.width, rect.depth, 1);
      }

      const settle = fresh.length
        ? start + fresh.length * stagger + IGNITE_MS
        : clock;
      golden = Boolean(gilded);
      if (solved && solvedAt === null) solvedAt = Math.max(clock, settle);
      if (!solved) solvedAt = null;
      if (victory && victoryAt === null) victoryAt = (solvedAt ?? clock) + 900;
      if (!victory) victoryAt = null;
      schedule();
    },
    resize(width, height) {
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      frameView();
      if (!sized) {
        sized = true;
        controls.target.set(0, 0, 0);
        camera.position.setFromSphericalCoords(
          motion.matches ? distance : distance * 1.5,
          motion.matches ? PHI : 0.35,
          motion.matches ? THETA : -0.9,
        );
        camera.lookAt(0, 0, 0);
      }
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
      for (const thing of disposables) thing.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
