import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { mix, readPalette, toRgb } from "../scenePalette";

export const STOP = 7.5;
export const APPROACH = 70;
const LANE = 1.75;
const CAR_LEN = 4.2;
const CAR_WID = 1.8;
const ROAD_HALF = 3.5;
const WALK_HALF = 6;
const FAR_WEST = -95;
const FAR_EAST = 55;
const CROSS_W = 3;
const INTRO_MS = 1100;
const TIME_EVERY = 90;
const OUTRO_FRAMES = 90;
const PED_OUTRO = 30;
const PED_SCALE = 1.3;

const CROSSINGS = {
  pieton_ouest: { road: "ouest", center: -5.5 },
  pieton_sud: { road: "sud", center: 5.5 },
};

const CAR_COLORS = [
  [232, 72, 85],
  [52, 152, 219],
  [255, 196, 61],
  [46, 204, 113],
  [155, 89, 182],
  [255, 127, 80],
  [26, 188, 156],
  [236, 240, 241],
];
const SHIRTS = [
  [255, 99, 132],
  [54, 162, 235],
  [255, 206, 86],
  [75, 192, 192],
  [153, 102, 255],
  [255, 159, 64],
];
const SKIN = [
  [241, 194, 125],
  [224, 172, 105],
  [198, 134, 66],
  [141, 85, 36],
];

const SCENE = {
  light: {
    grass: [146, 190, 116],
    asphalt: [86, 92, 102],
    walk: [214, 210, 200],
    curb: [188, 184, 176],
    paint: [246, 246, 240],
    housing: [44, 47, 54],
    pole: [96, 102, 112],
    hemi: 1.7,
    sun: 2.3,
    lamp: 2.6,
  },
  dark: {
    grass: [40, 66, 46],
    asphalt: [38, 42, 50],
    walk: [86, 90, 98],
    curb: [70, 74, 82],
    paint: [196, 200, 206],
    housing: [24, 26, 30],
    pole: [70, 76, 86],
    hemi: 1.1,
    sun: 1.3,
    lamp: 3.4,
  },
};

const LAMP_RGB = {
  r: [255, 59, 48],
  y: [255, 190, 0],
  g: [40, 220, 90],
};

const ease = (t) => 1 - Math.pow(1 - t, 3);
const clamp01 = (t) => Math.max(0, Math.min(1, t));
const lerp = (a, b, t) => a + (b - a) * t;
const toColor = ([r, g, b]) =>
  new THREE.Color().setRGB(r / 255, g / 255, b / 255, THREE.SRGBColorSpace);

export function carPose(road, s) {
  if (road === "ouest") {
    return { x: s - STOP - APPROACH - CAR_LEN / 2, z: LANE, yaw: 0 };
  }
  return { x: LANE, z: STOP + APPROACH - s + CAR_LEN / 2, yaw: Math.PI / 2 };
}

function canvasTexture(width, height, paint) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  paint(canvas.getContext("2d"));
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function lightAt(events, t) {
  let code = "";
  for (const [time, value] of events) {
    if (time > t + 1e-6) break;
    code = value;
  }
  return code;
}

function trackAt(track, start, stride, f) {
  const local = f - start;
  const count = track.length / stride;
  if (local < 0 || local > count - 1 + 1e-6) return null;
  const i = Math.min(Math.floor(local), count - 1);
  const j = Math.min(i + 1, count - 1);
  const a = local - i;
  const out = [];
  for (let k = 0; k < stride; k += 1) {
    out.push(lerp(track[i * stride + k], track[j * stride + k], a));
  }
  return out;
}

export function createCrossroad3D({
  canvas,
  host,
  data,
  onTime,
  onEnd,
  onIntro,
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
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xffffff, 60, 140);
  const disposables = [];
  const keep = (thing) => {
    disposables.push(thing);
    return thing;
  };

  const hasSud = data.lights.some((l) => l.name === "sud");
  const crossings = data.lights
    .filter((l) => l.kind === "ped")
    .map((l) => l.name);
  const target = hasSud
    ? new THREE.Vector3(-7, 0, 6)
    : new THREE.Vector3(-18, 0, 0);
  const baseDistance = hasSud ? 74 : 64;
  const PHI = 0.86;
  const THETA = hasSud ? 0.5 : 0.22;
  const PROP = 1.6;

  const camera = new THREE.PerspectiveCamera(32, 1, 0.5, 400);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.rotateSpeed = 0.6;
  controls.zoomSpeed = 0.8;
  controls.minDistance = 14;
  controls.maxDistance = 120;
  controls.minPolarAngle = 0.15;
  controls.maxPolarAngle = 1.32;
  controls.target.copy(target);
  let customized = false;
  controls.addEventListener("start", () => {
    customized = true;
  });

  const hemi = new THREE.HemisphereLight(0xffffff, 0x445544, 1);
  const sun = new THREE.DirectionalLight(0xffffff, 1);
  sun.position.set(-18, 34, 22);
  sun.target.position.copy(target);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, {
    left: -42,
    right: 42,
    top: 42,
    bottom: -42,
    near: 1,
    far: 100,
  });
  sun.shadow.camera.updateProjectionMatrix();
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 0.03;
  scene.add(hemi, sun, sun.target);

  const flat = (tone, extra = {}) => {
    const material = keep(
      new THREE.MeshStandardMaterial({ roughness: 0.9, ...extra }),
    );
    material.userData.tone = tone;
    return material;
  };
  const mats = {
    grass: flat("grass"),
    asphalt: flat("asphalt", { roughness: 0.95 }),
    walk: flat("walk"),
    curb: flat("curb"),
    paint: flat("paint", { roughness: 0.7 }),
    housing: flat("housing", { roughness: 0.6 }),
    pole: flat("pole", { roughness: 0.5, metalness: 0.3 }),
  };
  const toned = Object.values(mats);

  const box = keep(new THREE.BoxGeometry(1, 1, 1));
  const addBox = (material, x0, x1, y0, y1, z0, z1, shadows = true) => {
    const mesh = new THREE.Mesh(box, material);
    mesh.scale.set(x1 - x0, y1 - y0, z1 - z0);
    mesh.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    mesh.receiveShadow = shadows;
    scene.add(mesh);
    return mesh;
  };

  const ground = new THREE.Mesh(
    keep(new THREE.PlaneGeometry(400, 400)),
    mats.grass,
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(target.x, -0.02, target.z);
  ground.receiveShadow = true;
  scene.add(ground);

  addBox(mats.asphalt, FAR_WEST, FAR_EAST, -0.01, 0.02, -ROAD_HALF, ROAD_HALF);
  if (hasSud)
    addBox(
      mats.asphalt,
      -ROAD_HALF,
      ROAD_HALF,
      -0.01,
      0.021,
      -FAR_EAST,
      -FAR_WEST,
    );

  const WALK_H = 0.16;
  const walkStrip = (x0, x1, z0, z1) => {
    addBox(mats.walk, x0, x1, 0, WALK_H, z0, z1);
  };
  if (hasSud) {
    for (const side of [-1, 1]) {
      const z0 = side > 0 ? ROAD_HALF : -WALK_HALF;
      const z1 = side > 0 ? WALK_HALF : -ROAD_HALF;
      walkStrip(FAR_WEST, -ROAD_HALF, z0, z1);
      walkStrip(ROAD_HALF, FAR_EAST, z0, z1);
      const x0 = side > 0 ? ROAD_HALF : -WALK_HALF;
      const x1 = side > 0 ? WALK_HALF : -ROAD_HALF;
      walkStrip(x0, x1, WALK_HALF, -FAR_WEST);
      walkStrip(x0, x1, -FAR_EAST, -WALK_HALF);
    }
  } else {
    walkStrip(FAR_WEST, FAR_EAST, ROAD_HALF, WALK_HALF);
    walkStrip(FAR_WEST, FAR_EAST, -WALK_HALF, -ROAD_HALF);
  }

  const P_Y0 = 0.021;
  const P_Y1 = 0.04;
  const blocked = (road, a, b) => {
    if (hasSud && b > -ROAD_HALF - 0.5 && a < ROAD_HALF + 0.5) return true;
    for (const name of crossings) {
      const c = CROSSINGS[name];
      if (c.road !== road) continue;
      const lo =
        road === "ouest" ? c.center - CROSS_W / 2 : -(c.center + CROSS_W / 2);
      if (b > lo - 0.4 && a < lo + CROSS_W + 0.4) return true;
    }
    return false;
  };
  for (let a = FAR_WEST; a < FAR_EAST; a += 4) {
    const b = a + 2.2;
    if (!blocked("ouest", a, b)) {
      addBox(mats.paint, a, b, P_Y0, P_Y1, -0.08, 0.08, true);
    }
    if (hasSud && !blocked("sud", a, b)) {
      addBox(mats.paint, -0.08, 0.08, P_Y0, P_Y1, -b, -a, true);
    }
  }
  addBox(mats.paint, -STOP - 0.45, -STOP, P_Y0, P_Y1, 0.1, ROAD_HALF - 0.1);
  if (hasSud)
    addBox(mats.paint, 0.1, ROAD_HALF - 0.1, P_Y0, P_Y1, STOP, STOP + 0.45);

  for (const name of crossings) {
    const c = CROSSINGS[name];
    for (let k = -3; k <= 3; k += 1) {
      const across = k * 1.0;
      if (c.road === "ouest") {
        addBox(
          mats.paint,
          c.center - CROSS_W / 2,
          c.center + CROSS_W / 2,
          P_Y0,
          P_Y1,
          across - 0.25,
          across + 0.25,
        );
      } else {
        addBox(
          mats.paint,
          across - 0.25,
          across + 0.25,
          P_Y0,
          P_Y1,
          c.center - CROSS_W / 2,
          c.center + CROSS_W / 2,
        );
      }
    }
  }

  const glowTexture = keep(
    canvasTexture(64, 64, (g) => {
      const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, "rgba(255,255,255,1)");
      grad.addColorStop(0.25, "rgba(255,255,255,0.55)");
      grad.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = grad;
      g.fillRect(0, 0, 64, 64);
    }),
  );

  const labelSprite = (text, scale = 1) => {
    const font = "600 44px ui-monospace, SFMono-Regular, Menlo, monospace";
    const probe = document.createElement("canvas").getContext("2d");
    probe.font = font;
    const width = Math.ceil(probe.measureText(text).width) + 40;
    const texture = keep(
      canvasTexture(width, 72, (g) => {
        g.fillStyle = "rgba(20, 24, 30, 0.82)";
        g.beginPath();
        g.roundRect(2, 2, width - 4, 68, 18);
        g.fill();
        g.font = font;
        g.fillStyle = "#ffffff";
        g.textAlign = "center";
        g.textBaseline = "middle";
        g.fillText(text, width / 2, 38);
      }),
    );
    const material = keep(
      new THREE.SpriteMaterial({
        map: texture,
        depthWrite: false,
        transparent: true,
        fog: false,
      }),
    );
    const sprite = new THREE.Sprite(material);
    const h = 0.9 * scale;
    sprite.scale.set((h * width) / 72, h, 1);
    sprite.renderOrder = 10;
    return sprite;
  };

  const poleGeo = keep(new THREE.CylinderGeometry(0.09, 0.11, 1, 10));
  const lampGeo = keep(new THREE.SphereGeometry(1, 16, 12));
  const ringGeo = keep(new THREE.RingGeometry(0.75, 1, 48));
  const lamps = [];
  const lightMeshes = {};

  const buildLight = (name, kind, x, z, withLabel) => {
    const group = new THREE.Group();
    group.position.set(x, WALK_H, z);
    group.scale.setScalar(PROP);
    const height = kind === "car" ? 3.3 : 2.3;
    const pole = new THREE.Mesh(poleGeo, mats.pole);
    pole.scale.set(1, height, 1);
    pole.position.y = height / 2;
    pole.castShadow = true;
    group.add(pole);
    const colors = kind === "car" ? ["r", "y", "g"] : ["r", "g"];
    const step = kind === "car" ? 0.46 : 0.42;
    const r = kind === "car" ? 0.2 : 0.17;
    const housing = new THREE.Mesh(box, mats.housing);
    housing.scale.set(0.42, colors.length * step + 0.16, 0.42);
    housing.position.y = height + (colors.length * step) / 2 + 0.02;
    housing.castShadow = true;
    group.add(housing);
    const own = [];
    colors.forEach((code, i) => {
      const y = height + 0.1 + step / 2 + (colors.length - 1 - i) * step;
      const material = keep(
        new THREE.MeshStandardMaterial({
          color: 0x111111,
          roughness: 0.3,
          emissive: 0x000000,
        }),
      );
      const lamp = new THREE.Mesh(lampGeo, material);
      lamp.scale.setScalar(r * 1.12);
      lamp.position.y = y;
      group.add(lamp);
      const glowMaterial = keep(
        new THREE.SpriteMaterial({
          map: glowTexture,
          color: toColor(LAMP_RGB[code]),
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          transparent: true,
          fog: false,
        }),
      );
      const glow = new THREE.Sprite(glowMaterial);
      glow.scale.setScalar(kind === "car" ? 1.7 : 1.3);
      glow.position.y = y;
      glow.visible = false;
      group.add(glow);
      const entry = { name, code, material, glow, on: null };
      lamps.push(entry);
      own.push(entry);
    });
    if (withLabel) {
      const label = labelSprite(name, kind === "car" ? 1 : 0.85);
      label.position.y = height + colors.length * step + 0.9;
      group.add(label);
    }
    scene.add(group);
    lightMeshes[name] = lightMeshes[name] ?? { x, z, groups: [] };
    lightMeshes[name].groups.push({ group, lamps: own });
  };

  for (const light of data.lights) {
    if (light.name === "ouest")
      buildLight("ouest", "car", -STOP - 1.9, ROAD_HALF + 1.2, true);
    else if (light.name === "sud")
      buildLight("sud", "car", ROAD_HALF + 1.2, STOP + 1.8, true);
    else if (light.name === "pieton_ouest") {
      const x = CROSSINGS.pieton_ouest.center - CROSS_W / 2 - 0.4;
      buildLight(light.name, "ped", x, ROAD_HALF + 0.8, false);
      buildLight(light.name, "ped", x, -ROAD_HALF - 0.8, true);
    } else if (light.name === "pieton_sud") {
      const z = CROSSINGS.pieton_sud.center - CROSS_W / 2 - 0.4;
      buildLight(light.name, "ped", ROAD_HALF + 0.8, z, true);
      buildLight(light.name, "ped", -ROAD_HALF - 0.8, z, false);
    }
  }

  const bodyGeo = keep(new RoundedBoxGeometry(CAR_LEN, 0.85, CAR_WID, 3, 0.22));
  const cabinGeo = keep(
    new RoundedBoxGeometry(2.3, 0.72, CAR_WID - 0.2, 3, 0.18),
  );
  const wheelGeo = keep(new THREE.CylinderGeometry(0.36, 0.36, 0.28, 16));
  wheelGeo.rotateX(Math.PI / 2);
  const tinyGeo = keep(new THREE.BoxGeometry(0.08, 0.18, 0.42));
  const glass = keep(
    new THREE.MeshStandardMaterial({
      color: 0x1d2633,
      roughness: 0.15,
      metalness: 0.4,
    }),
  );
  const tyre = keep(
    new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.8 }),
  );
  const headMat = keep(
    new THREE.MeshStandardMaterial({
      color: 0xfff6d8,
      emissive: 0xfff2c0,
      emissiveIntensity: 0.6,
    }),
  );
  const numbered = data.level === 1;

  const cars = data.cars.map((car, index) => {
    const group = new THREE.Group();
    const color =
      CAR_COLORS[
        (index * 3 + (car.road === "sud" ? 1 : 0)) % CAR_COLORS.length
      ];
    const paint = keep(
      new THREE.MeshStandardMaterial({
        color: toColor(color),
        roughness: 0.45,
        metalness: 0.1,
      }),
    );
    const body = new THREE.Mesh(bodyGeo, paint);
    body.position.y = 0.78;
    body.castShadow = true;
    const cabin = new THREE.Mesh(cabinGeo, glass);
    cabin.position.set(-0.25, 1.48, 0);
    cabin.castShadow = true;
    const roof = new THREE.Mesh(box, paint);
    roof.scale.set(1.9, 0.08, CAR_WID - 0.34);
    roof.position.set(-0.3, 1.86, 0);
    group.add(body, cabin, roof);
    const wheels = [];
    for (const [wx, wz] of [
      [1.3, 0.8],
      [1.3, -0.8],
      [-1.3, 0.8],
      [-1.3, -0.8],
    ]) {
      const wheel = new THREE.Mesh(wheelGeo, tyre);
      wheel.position.set(wx, 0.36, wz);
      wheel.castShadow = true;
      group.add(wheel);
      wheels.push(wheel);
    }
    for (const wz of [0.55, -0.55]) {
      const head = new THREE.Mesh(tinyGeo, headMat);
      head.position.set(CAR_LEN / 2 + 0.01, 0.85, wz);
      group.add(head);
    }
    const brake = keep(
      new THREE.MeshStandardMaterial({ color: 0x5a0d0d, emissive: 0x000000 }),
    );
    for (const wz of [0.6, -0.6]) {
      const tail = new THREE.Mesh(tinyGeo, brake);
      tail.position.set(-CAR_LEN / 2 - 0.01, 0.88, wz);
      group.add(tail);
    }
    if (numbered) {
      const tag = labelSprite(String(index + 1), 1.1);
      tag.position.set(0, 2.9, 0);
      group.add(tag);
    }
    group.visible = false;
    scene.add(group);
    return { data: car, group, paint, brake, wheels, color };
  });

  const legGeo = keep(new THREE.CapsuleGeometry(0.09, 0.55, 4, 8));
  legGeo.translate(0, -0.37, 0);
  const torsoGeo = keep(new THREE.CapsuleGeometry(0.22, 0.42, 4, 10));
  const headGeo = keep(new THREE.SphereGeometry(0.19, 14, 10));
  const trousers = keep(
    new THREE.MeshStandardMaterial({ color: 0x2f3b52, roughness: 0.8 }),
  );
  const skins = SKIN.map((c) =>
    keep(new THREE.MeshStandardMaterial({ color: toColor(c), roughness: 0.7 })),
  );

  const peds = data.peds.map((ped, index) => {
    const group = new THREE.Group();
    const shirt = keep(
      new THREE.MeshStandardMaterial({
        color: toColor(SHIRTS[index % SHIRTS.length]),
        roughness: 0.7,
      }),
    );
    const legs = [-0.11, 0.11].map((side) => {
      const leg = new THREE.Mesh(legGeo, trousers);
      leg.position.set(0, 0.95, side);
      leg.castShadow = true;
      group.add(leg);
      return leg;
    });
    const torso = new THREE.Mesh(torsoGeo, shirt);
    torso.position.y = 1.28;
    torso.castShadow = true;
    const head = new THREE.Mesh(headGeo, skins[index % skins.length]);
    head.position.y = 1.78;
    head.castShadow = true;
    group.add(torso, head);
    group.visible = false;
    scene.add(group);
    return { data: ped, group, legs, shirt, heading: 0, walk: 0 };
  });

  const ringMaterial = keep(
    new THREE.MeshBasicMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      toneMapped: false,
    }),
  );
  const ring = new THREE.Mesh(ringGeo, ringMaterial);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.25;
  ring.visible = false;
  scene.add(ring);
  const haloMaterial = keep(
    new THREE.SpriteMaterial({
      map: glowTexture,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
      fog: false,
    }),
  );
  const halo = new THREE.Sprite(haloMaterial);
  halo.visible = false;
  scene.add(halo);

  const incident = data.incident;
  let incidentAt = null;
  if (incident) {
    if (incident.at)
      incidentAt = new THREE.Vector3(incident.at[0], 0, incident.at[1]);
    else if (incident.light && lightMeshes[incident.light]) {
      const m = lightMeshes[incident.light];
      incidentAt = new THREE.Vector3(m.x, WALK_H, m.z);
    }
  }
  const flashCars = new Set(incident?.cars ?? []);
  const flashPeds = new Set(incident?.peds ?? []);
  const flashLight = incident?.light ?? null;

  let palette = null;
  let tones = SCENE.light;
  const dangerColor = new THREE.Color();
  const successColor = new THREE.Color();
  const goldColor = new THREE.Color();
  const lampColors = Object.fromEntries(
    Object.entries(LAMP_RGB).map(([k, v]) => [k, toColor(v)]),
  );
  const lampOff = Object.fromEntries(
    Object.entries(LAMP_RGB).map(([k, v]) => [
      k,
      toColor(v.map((c) => c * 0.16 + 14)),
    ]),
  );

  function applyPalette() {
    palette = readPalette(host);
    tones = palette.dark ? SCENE.dark : SCENE.light;
    for (const material of toned)
      material.color.copy(toColor(tones[material.userData.tone]));
    const bg = toRgb(
      getComputedStyle(host).getPropertyValue("--bg").trim(),
      palette.dark ? "#0d1117" : "#f6f8fa",
    );
    scene.fog.color.copy(toColor(bg));
    hemi.intensity = tones.hemi;
    hemi.groundColor.copy(toColor(mix(tones.grass, [0, 0, 0], 0.4)));
    sun.intensity = tones.sun;
    dangerColor.copy(toColor(palette.danger));
    successColor.copy(toColor(palette.success));
    goldColor.copy(toColor(palette.gold));
    for (const lamp of lamps) lamp.on = null;
  }

  let distance = baseDistance;
  const goal = new THREE.Vector3();
  function frameView() {
    const aspect = camera.aspect || 1;
    distance = baseDistance * Math.max(1, Math.min(1.9, 1.35 / aspect));
    scene.fog.near = distance * 0.85;
    scene.fog.far = distance * 2;
    controls.maxDistance = Math.max(120, distance * 1.8);
  }

  let simTime = 0;
  let speed = 1;
  let playing = true;
  let ended = false;
  let clock = 0;
  let last = 0;
  let raf = 0;
  let alive = true;
  let sized = false;
  let introDone = false;
  let lastReport = -Infinity;
  const dt = data.dt;
  const endTime = data.end;
  const result = data.result;

  function updateLights(t, pulse) {
    for (const lamp of lamps) {
      const events = data.lights.find((l) => l.name === lamp.name).events;
      const code = lightAt(events, t);
      const on = code.includes(lamp.code);
      const faulty = flashLight === lamp.name && t >= incident.t - 1e-6;
      const key = `${on}${faulty ? pulse.toFixed(2) : ""}`;
      if (lamp.on === key) continue;
      lamp.on = key;
      if (on) {
        lamp.material.color.copy(lampColors[lamp.code]);
        lamp.material.emissive
          .copy(lampColors[lamp.code])
          .multiplyScalar(tones.lamp * (faulty ? pulse : 1));
      } else {
        lamp.material.color.copy(lampOff[lamp.code]);
        lamp.material.emissive.setRGB(0, 0, 0);
      }
      lamp.glow.visible = on;
      lamp.glow.material.opacity =
        (palette.dark ? 0.95 : 0.7) * (faulty ? pulse : 1);
    }
  }

  function updateCars(f, t, pulse) {
    for (const car of cars) {
      const track = car.data.s;
      const lastFrame = car.data.frame + track.length - 1;
      let sample = trackAt(track, car.data.frame, 1, f);
      if (!sample && track.length > 1 && lastFrame < data.frames - 1) {
        const extra = f - lastFrame;
        const v = track[track.length - 1] - track[track.length - 2];
        if (extra > 0 && extra < OUTRO_FRAMES)
          sample = [track[track.length - 1] + v * extra];
      }
      if (!sample) {
        car.group.visible = false;
        continue;
      }
      const s = sample[0];
      const pose = carPose(car.data.road, s);
      car.group.visible = true;
      car.group.position.set(pose.x, 0, pose.z);
      car.group.rotation.y = pose.yaw;
      for (const wheel of car.wheels) wheel.rotation.z = -s / 0.36;
      const ahead = trackAt(car.data.s, car.data.frame, 1, f + 1);
      const behind = trackAt(car.data.s, car.data.frame, 1, f - 1);
      const v = ahead ? (ahead[0] - s) / dt : 0;
      const vBefore = behind ? (s - behind[0]) / dt : v;
      const braking = v < 0.4 || v < vBefore - 0.08;
      car.brake.emissive
        .setRGB(braking ? 1 : 0, 0, 0)
        .multiplyScalar(braking ? 2.2 : 0);
      if (flashCars.has(cars.indexOf(car)) && t >= incident.t - 1e-6) {
        car.paint.emissive.copy(dangerColor).multiplyScalar(0.25 + 0.5 * pulse);
      } else car.paint.emissive.setRGB(0, 0, 0);
    }
  }

  function updatePeds(f, t, pulse, realDt) {
    peds.forEach((ped, index) => {
      const track = ped.data.p;
      const count = track.length / 2;
      const lastFrame = ped.data.frame + count - 1;
      const finished = count > 1 && lastFrame < data.frames - 1;
      const at = (frame) => {
        const sample = trackAt(track, ped.data.frame, 2, frame);
        if (sample || !finished) return sample;
        const extra = frame - lastFrame;
        if (extra <= 0 || extra >= PED_OUTRO) return null;
        const n = track.length;
        return [
          track[n - 2] + (track[n - 2] - track[n - 4]) * extra,
          track[n - 1] + (track[n - 1] - track[n - 3]) * extra,
        ];
      };
      const p = at(f);
      if (!p) {
        ped.group.visible = false;
        return;
      }
      const q = at(f + 1) ?? p;
      const fade = finished ? clamp01((PED_OUTRO - (f - lastFrame)) / 8) : 1;
      ped.group.scale.setScalar(Math.max(0.001, fade * PED_SCALE));
      const dx = q[0] - p[0];
      const dz = q[1] - p[1];
      const moving = Math.hypot(dx, dz) > 0.02;
      if (moving) ped.heading = Math.atan2(-dz, dx);
      if (moving && playing && !ended) ped.walk += realDt * 0.011 * speed;
      const swing = moving ? Math.sin(ped.walk) * 0.55 : 0;
      ped.legs[0].rotation.z = swing;
      ped.legs[1].rotation.z = -swing;
      ped.group.visible = true;
      ped.group.position.set(p[0], WALK_H * onWalk(p[0], p[1]), p[1]);
      ped.group.position.y += moving ? Math.abs(Math.sin(ped.walk)) * 0.05 : 0;
      ped.group.rotation.y = ped.heading;
      if (flashPeds.has(index) && t >= incident.t - 1e-6) {
        ped.shirt.emissive.copy(dangerColor).multiplyScalar(0.3 + 0.6 * pulse);
      } else ped.shirt.emissive.setRGB(0, 0, 0);
    });
  }

  function onWalk(x, z) {
    const inWe = Math.abs(z) < ROAD_HALF;
    const inSn = hasSud && Math.abs(x) < ROAD_HALF;
    return inWe || inSn ? 0 : 1;
  }

  function updateMarkers(t, now) {
    const pulse = 0.5 + 0.5 * Math.sin(now * 0.008);
    if (incident && incidentAt && t >= incident.t - 1e-6) {
      const since = (now - (incidentShownAt ??= now)) / 1000;
      ring.visible = true;
      halo.visible = true;
      ring.position.set(incidentAt.x, incidentAt.y + 0.25, incidentAt.z);
      const grow = motion.matches ? 1 : ease(clamp01(since / 0.5));
      ring.scale.setScalar(lerp(0.5, 3.2, grow) * (0.94 + 0.06 * pulse));
      ringMaterial.color.copy(dangerColor);
      ringMaterial.opacity = 0.75;
      halo.position.set(incidentAt.x, incidentAt.y + 1.2, incidentAt.z);
      halo.material.color.copy(dangerColor);
      halo.material.opacity = 0.5 + 0.4 * pulse;
      halo.scale.setScalar(5 + 2 * pulse);
      return pulse;
    }
    if (ended && result?.ok) {
      const since = (now - (successShownAt ??= now)) / 1000;
      const color = result.gold ? goldColor : successColor;
      ring.visible = since < 2.4 && !motion.matches;
      ring.position.set(hasSud ? 0 : -STOP, 0.25, hasSud ? 0 : 0);
      ring.scale.setScalar(2 + ease(clamp01(since / 2.4)) * 16);
      ringMaterial.color.copy(color);
      ringMaterial.opacity = 0.8 * (1 - clamp01(since / 2.4));
      halo.visible = false;
      return pulse;
    }
    ring.visible = false;
    halo.visible = false;
    return pulse;
  }
  let incidentShownAt = null;
  let successShownAt = null;

  function render(realDt, now) {
    if (playing && introDone && !ended) {
      simTime = Math.min(endTime, simTime + (realDt / 1000) * speed);
      if (simTime >= endTime - 1e-9) {
        ended = true;
        playing = false;
        onTime?.(simTime);
        onEnd?.();
      }
    }
    if (now - lastReport > TIME_EVERY) {
      lastReport = now;
      onTime?.(simTime);
    }
    const f = simTime / dt;
    const pulse = updateMarkers(simTime, now);
    updateLights(simTime, 0.35 + 0.65 * pulse);
    updateCars(f, simTime, pulse);
    updatePeds(f, simTime, pulse, realDt);

    const k = motion.matches ? 1 : 1 - Math.exp(-realDt / 420);
    if (!customized) {
      goal.setFromSphericalCoords(distance, PHI, THETA).add(target);
      camera.position.lerp(goal, k);
    }
    controls.update();
    renderer.render(scene, camera);
  }

  function frame(now) {
    raf = 0;
    if (!alive) return;
    const realDt = last ? Math.min(now - last, 64) : 16;
    last = now;
    clock += realDt;
    if (sized) render(realDt, now);
    if (sized && !introDone && (motion.matches || clock >= INTRO_MS)) {
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
    setSpeed(value) {
      speed = value;
    },
    setPlaying(value) {
      if (ended && value) return;
      playing = value;
    },
    resize(width, height) {
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      frameView();
      if (!sized) {
        sized = true;
        camera.position
          .setFromSphericalCoords(
            motion.matches ? distance : distance * 1.45,
            motion.matches ? PHI : 0.5,
            motion.matches ? THETA : THETA - 0.9,
          )
          .add(target);
        camera.lookAt(target);
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
