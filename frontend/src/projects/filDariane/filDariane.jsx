import { useEffect, useMemo, useRef, useState } from "react";
import { saveCompletion } from "../../completion";
import Icon from "../../components/Icon";
import { MOVES, createLabyrinth } from "./labyrinth";

const STEP_DELAY = 90;
const MIN_DELAY = 5;
const MAX_DELAY = 300;

const LEGEND = [
  {
    label: "Mur",
    style:
      "h-3 w-3 rounded-[3px] bg-[linear-gradient(var(--maze-stone,#4a525d)_62%,var(--maze-front,#1e242d)_62%)]",
  },
  {
    label: "Fil d'Ariane",
    style: "h-[3px] w-4 rounded-full bg-[var(--maze-thread,#f05458)]",
  },
  {
    label: "Impasse",
    style: "h-[2px] w-4 rounded-full bg-[var(--maze-faded,#7f3438)]",
  },
  {
    label: "Thésée (joueur)",
    style:
      "h-2.5 w-2.5 rounded-full bg-[radial-gradient(circle_at_35%_30%,var(--maze-flame,#fff6e2),var(--maze-torch,#ffb260))] ring-[1.5px] ring-[var(--maze-thread,#f05458)]",
  },
  {
    label: "Sortie",
    style:
      "h-2.5 w-2.5 rounded-[3px] bg-[var(--success)] shadow-[0_0_6px_var(--success)]",
  },
];

function extractFirstList(text) {
  const start = text.indexOf("[");
  if (start === -1) return null;
  let depth = 0;
  for (let i = start; i < text.length; i += 1) {
    if (text[i] === "[") depth += 1;
    else if (text[i] === "]") {
      depth -= 1;
      if (depth === 0) return { json: text.slice(start, i + 1), start, end: i };
    }
  }
  return null;
}

export function parseRun(lines) {
  let runStart = 0;
  for (let i = 0; i < lines.length; i += 1) {
    if (lines[i].stream === "system" && lines[i].text.includes("$ run")) {
      runStart = i;
    }
  }

  const runLines = lines.slice(runStart);

  const error = runLines
    .filter((line) => line.stream === "stderr")
    .map((line) => line.text)
    .join("")
    .trim();
  if (error) return { error };

  const text = runLines
    .filter((line) => line.stream === "stdout")
    .map((line) => line.text)
    .join("");

  const found = extractFirstList(text);
  if (!found) return null;

  let grid;
  try {
    grid = JSON.parse(found.json.replaceAll("'", '"'));
  } catch {
    return null;
  }

  if (!Array.isArray(grid)) return null;
  grid = grid.filter((row) => Array.isArray(row) && row.length);
  if (!grid.length) return null;

  const header = text.slice(0, found.start).trim().split(" ");
  const py = Number(header[0]);
  const px = Number(header[1]);
  let start =
    Number.isInteger(py) && Number.isInteger(px) ? { y: py, x: px } : null;

  for (let y = 0; y < grid.length && !start; y += 1) {
    for (let x = 0; x < grid[y].length; x += 1) {
      if (grid[y][x] === "-") {
        start = { y, x };
        break;
      }
    }
  }
  if (!start) return null;

  const commands = text
    .slice(found.end + 1)
    .split("\n")
    .map((line) => line.trim());

  const moves = commands.filter((line) => Object.hasOwn(MOVES, line));

  let outcome = null;
  let victory = false;
  if (commands.includes("PlayerOut") && !commands.includes("testVictory"))
    outcome = "won";
  if (
    commands.includes("PlayerOut") &&
    commands.includes("CountVictory") &&
    !commands.includes("testVictory")
  )
    victory = true;

  return { grid, start, moves, outcome, victory };
}

const CAMERAS = [
  { id: "follow", label: "Suivre Thésée", icon: "crosshair" },
  { id: "overview", label: "Vue d'ensemble", icon: "scan" },
];

const defaultCamera = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? "overview"
    : "follow";

function Labyrinth3DStage({
  run,
  delay,
  camera,
  hostRef,
  onStep,
  onFinish,
  onCamera,
  onReady,
  children,
}) {
  const stageRef = useRef(null);
  const engineRef = useRef(null);
  const latest = useRef(null);
  latest.current = { delay, camera, onStep, onFinish, onCamera, onReady };

  useEffect(() => {
    const stage = stageRef.current;
    let alive = true;
    let engine = null;
    let canvas = null;

    const options = {
      host: hostRef.current,
      run,
      onStep: (step, total) => latest.current.onStep(step, total),
      onFinish: () => latest.current.onFinish(),
      onCamera: (mode) => latest.current.onCamera(mode),
    };
    const mount = (className) => {
      canvas?.remove();
      canvas = document.createElement("canvas");
      canvas.className = className;
      canvas.setAttribute("role", "img");
      canvas.setAttribute(
        "aria-label",
        "Labyrinthe : Thésée déroule le fil d'Ariane vers la sortie",
      );
      stage.prepend(canvas);
      return canvas;
    };

    import("./labyrinth3d")
      .then(({ createLabyrinth3D }) =>
        alive
          ? createLabyrinth3D({
              ...options,
              canvas: mount(
                "absolute inset-0 h-full w-full cursor-grab active:cursor-grabbing",
              ),
            })
          : null,
      )
      .catch((error) => {
        console.warn("Labyrinthe 3D indisponible, rendu 2.5D utilisé.", error);
        return alive
          ? createLabyrinth({
              ...options,
              canvas: mount("absolute inset-0 m-auto"),
            })
          : null;
      })
      .then((created) => {
        if (!created) return;
        if (!alive) {
          created.destroy();
          return;
        }
        engine = created;
        engineRef.current = created;
        created.setDelay(latest.current.delay);
        created.setCamera?.(latest.current.camera);
        latest.current.onReady(Boolean(created.setCamera));
        const { width, height } = stage.getBoundingClientRect();
        created.resize(width, height);
      });

    const resize = new ResizeObserver(([entry]) =>
      engine?.resize(entry.contentRect.width, entry.contentRect.height),
    );
    resize.observe(stage);
    const theme = new MutationObserver(() => engine?.refresh());
    theme.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "data-mode"],
    });

    return () => {
      alive = false;
      resize.disconnect();
      theme.disconnect();
      engine?.destroy();
      engineRef.current = null;
      canvas?.remove();
    };
  }, [run]);

  useEffect(() => engineRef.current?.setDelay(delay), [delay]);
  useEffect(() => engineRef.current?.setCamera?.(camera), [camera]);

  return (
    <div ref={stageRef} className="relative min-h-0 flex-1">
      {children}
    </div>
  );
}

export default function FilDariane({ lines, status, onClear, project }) {
  const running = status === "running";
  const parsed = useMemo(
    () => (running ? null : parseRun(lines)),
    [running, lines],
  );
  const error = parsed?.error ?? null;
  const run = error ? null : parsed;
  const output = lines
    .filter((line) => line.stream === "stdout")
    .map((line) => line.text)
    .join("\n")
    .trim();

  const [delay, setDelay] = useState(STEP_DELAY);
  const [replays, setReplays] = useState(0);
  const [finishedRun, setFinishedRun] = useState(null);
  const [camera, setCamera] = useState(defaultCamera);
  const [is3D, setIs3D] = useState(false);
  const hostRef = useRef(null);
  const counterRef = useRef(null);

  const finished = Boolean(run) && finishedRun === run;
  const outcome = finished ? run.outcome : null;

  useEffect(() => {
    if (!finished) return;
    if (run.victory) saveCompletion(project.id, true);
    else if (run.outcome === "won") saveCompletion(project.id, false);
  }, [finished, run]);

  useEffect(() => setCamera(defaultCamera()), [run]);

  const replay = () => {
    setFinishedRun(null);
    setCamera(defaultCamera());
    setReplays((count) => count + 1);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[var(--bg)]">
      <div className="panel-head">
        <span className="panel-title">
          LABYRINTHE
          {run && (
            <span className="font-medium tracking-normal normal-case tabular-nums text-[var(--text-faint)]">
              <span ref={counterRef} /> pas
            </span>
          )}
        </span>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs font-medium text-[var(--text-muted)]">
            Vitesse
            <input
              type="range"
              min={MIN_DELAY}
              max={MAX_DELAY}
              step={5}
              value={MIN_DELAY + MAX_DELAY - delay}
              onChange={(e) =>
                setDelay(MIN_DELAY + MAX_DELAY - Number(e.target.value))
              }
              className="h-1 w-24 cursor-pointer accent-[var(--accent)]"
            />
            <span className="w-12 tabular-nums text-[var(--text-faint)]">
              {delay} ms
            </span>
          </label>
          {run && (
            <button onClick={replay} className="btn btn-ghost btn-sm">
              <Icon name="replay" size={12} />
              Rejouer
            </button>
          )}
          <button onClick={onClear} className="btn btn-ghost btn-sm">
            <Icon name="stop" size={12} />
            Arrêter
          </button>
        </div>
      </div>

      <div className="thin-scroll flex min-h-0 flex-1 flex-col gap-4 overflow-auto p-5">
        {running ? (
          <div className="m-auto flex items-center gap-2 text-sm text-[var(--text-muted)]">
            <span
              className="status-dot animate-pulse"
              style={{ "--tone": "var(--accent)" }}
            />
            Exécution en cours…
          </div>
        ) : error ? (
          <div
            className="callout mx-auto w-full max-w-2xl p-4"
            style={{ "--tone": "var(--danger)" }}
          >
            <div className="mb-2 flex items-center gap-2 text-xs font-bold tracking-[0.08em]">
              <Icon name="alert" size={15} />
              ERREUR PYTHON
            </div>
            <pre className="thin-scroll overflow-auto font-mono text-[13px] leading-relaxed whitespace-pre-wrap">
              {error}
            </pre>
          </div>
        ) : run ? (
          <div ref={hostRef} className="flex min-h-0 flex-1 flex-col gap-4">
            <Labyrinth3DStage
              key={replays}
              run={run}
              delay={delay}
              camera={camera}
              hostRef={hostRef}
              onStep={(step, total) => {
                if (counterRef.current) {
                  counterRef.current.textContent = `${step} / ${total}`;
                }
              }}
              onFinish={() => setFinishedRun(run)}
              onCamera={setCamera}
              onReady={setIs3D}
            >
              {is3D && (
                <div className="absolute top-0 right-0 flex gap-0.5 rounded-[0.625rem] border border-[var(--border)] bg-[var(--surface)] p-0.5 shadow-[var(--shadow-sm)]">
                  {CAMERAS.map(({ id, label, icon }) => (
                    <button
                      key={id}
                      type="button"
                      aria-pressed={camera === id}
                      onClick={() => setCamera(id)}
                      className={`btn btn-sm ${
                        camera === id
                          ? "bg-[var(--surface-hover)] text-[var(--text)]"
                          : "btn-ghost"
                      }`}
                    >
                      <Icon name={icon} size={12} />
                      {label}
                    </button>
                  ))}
                </div>
              )}
              <div
                role="status"
                aria-live="polite"
                className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center"
              >
                {outcome && (
                  <div
                    className="callout flex animate-[pop-in_420ms_cubic-bezier(0.2,0.8,0.2,1)] items-center gap-2 px-4 py-2 text-sm font-semibold shadow-[var(--shadow-md)]"
                    style={{
                      "--tone":
                        outcome === "won" ? "var(--success)" : "var(--warning)",
                      background:
                        "color-mix(in oklab, var(--tone) 14%, var(--surface))",
                    }}
                  >
                    <Icon
                      name={outcome === "won" ? "check" : "alert"}
                      size={15}
                    />
                    {outcome === "won"
                      ? "Thésée est sorti du labyrinthe !"
                      : "Thésée est bloqué, le fil s'arrête ici."}
                  </div>
                )}
              </div>
            </Labyrinth3DStage>

            <div className="flex flex-none flex-wrap items-center justify-between gap-x-6 gap-y-1">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                {LEGEND.map(({ style, label }) => (
                  <span
                    key={label}
                    className="flex items-center gap-2 text-xs font-medium text-[var(--text-muted)]"
                  >
                    <span className={`inline-block flex-none ${style}`} />
                    {label}
                  </span>
                ))}
              </div>
              {is3D && (
                <span className="text-xs text-[var(--text-faint)]">
                  Glisser pour pivoter · molette pour zoomer
                </span>
              )}
            </div>
          </div>
        ) : output ? (
          <pre className="thin-scroll overflow-auto font-mono text-[13px] leading-relaxed whitespace-pre-wrap text-[var(--text)]">
            {output}
          </pre>
        ) : (
          <div className="m-auto max-w-md text-center text-sm leading-loose text-[var(--text-muted)]">
            Exécutez votre code pour guider Thésée.
            <br />
            écrivez en première ligne{" "}
            <code className="inline-code">print_map()</code> ou
            <code className="inline-code">print_medium_map()</code> ou
            <code className="inline-code">print_hard_map()</code> pour choisir
            la difficulté du labyrinthe, puis{" "}
            <code className="inline-code">
              up() · down() · left() · right()
            </code>
            .
          </div>
        )}
      </div>
    </div>
  );
}
