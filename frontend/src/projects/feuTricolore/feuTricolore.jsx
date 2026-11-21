import { useEffect, useMemo, useRef, useState } from "react";
import { saveCompletion } from "../../completion";
import Icon from "../../components/Icon";
import carrefour from "./carrefour.py?raw";
const APPROACH = 70;

const MARKER = "__FEU__";
const SPEEDS = [1, 2, 4];
const HELPER_LINES =
  carrefour.split("\n").length - (carrefour.endsWith("\n") ? 1 : 0);

export function cleanError(text, offset = HELPER_LINES) {
  const lines = text.split("\n");
  const out = [];
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const frame = line.match(/^(\s*)File "([^"]+)", line (\d+)(.*)$/);
    if (!frame) {
      out.push(line);
      continue;
    }
    const [, indent, file, num, rest] = frame;
    const n = Number(num);
    const own = file === "<exec>" && n > offset;
    if (own) {
      out.push(
        `${indent}Ligne ${n - offset}${rest.replace(", in <module>", "")}`,
      );
      continue;
    }
    while (
      i + 1 < lines.length &&
      /^\s{4,}\S/.test(lines[i + 1]) &&
      !/^\s*File "/.test(lines[i + 1])
    ) {
      i += 1;
    }
  }
  const kept = out.filter(
    (line, i) => !(line.startsWith("Traceback") && i === out.length - 1),
  );
  return kept.join("\n").trim();
}

export function parseRun(lines) {
  let runStart = 0;
  for (let i = 0; i < lines.length; i += 1) {
    if (lines[i].stream === "system" && lines[i].text.includes("$ run"))
      runStart = i;
  }
  const runLines = lines.slice(runStart);
  const text = runLines
    .filter((line) => line.stream === "stdout")
    .map((line) => line.text)
    .join("");
  let data = null;
  const prints = [];
  for (const line of text.split("\n")) {
    if (line.startsWith(MARKER)) {
      try {
        data = JSON.parse(line.slice(MARKER.length));
      } catch {
        data = null;
      }
    } else if (line.trim()) prints.push(line);
  }
  let error = runLines
    .filter((line) => line.stream === "stderr")
    .map((line) => line.text)
    .join("")
    .trim();
  if (error.includes("FinDeSimulation")) error = "";
  if (error) return { error: cleanError(error), prints };
  return { data, prints };
}

function timeline(data) {
  const dt = data.dt;
  const carPass = data.cars.map((car) => {
    const i = car.s.findIndex((s) => s >= APPROACH);
    return i < 0 ? Infinity : (car.frame + i) * dt;
  });
  const pedDone = data.peds.map((ped) => {
    const count = ped.p.length / 2;
    const last = ped.frame + count - 1;
    return last < data.frames - 1 ? last * dt : Infinity;
  });
  return { carPass, pedDone };
}

function Stage({
  data,
  hostRef,
  speed,
  playing,
  onTime,
  onEnd,
  onReady,
  children,
}) {
  const stageRef = useRef(null);
  const engineRef = useRef(null);
  const latest = useRef(null);
  latest.current = { onTime, onEnd, onReady, speed, playing };
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const stage = stageRef.current;
    let alive = true;
    let engine = null;
    const canvas = document.createElement("canvas");
    canvas.className =
      "absolute inset-0 h-full w-full cursor-grab active:cursor-grabbing";
    canvas.setAttribute("role", "img");
    canvas.setAttribute(
      "aria-label",
      "Carrefour en 3D : voitures, piétons et feux tricolores",
    );
    stage.prepend(canvas);

    import("./crossroad3d")
      .then(({ createCrossroad3D }) => {
        if (!alive) return;
        engine = createCrossroad3D({
          canvas,
          host: hostRef.current,
          data,
          onTime: (t) => latest.current.onTime(t),
          onEnd: () => latest.current.onEnd(),
          onIntro: () => latest.current.onReady(true),
        });
        engineRef.current = engine;
        engine.setSpeed(latest.current.speed);
        engine.setPlaying(latest.current.playing);
        const { width, height } = stage.getBoundingClientRect();
        engine.resize(width, height);
      })
      .catch((error) => {
        if (!alive) return;
        console.warn("Carrefour 3D indisponible.", error);
        canvas.remove();
        setFailed(true);
        latest.current.onReady(false);
        latest.current.onTime(data.end);
        latest.current.onEnd();
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
      canvas.remove();
    };
  }, [data, hostRef]);

  useEffect(() => engineRef.current?.setSpeed(speed), [speed]);
  useEffect(() => engineRef.current?.setPlaying(playing), [playing]);

  return (
    <div
      ref={stageRef}
      className="relative min-h-[320px] flex-1 overflow-hidden rounded-lg"
    >
      {failed && (
        <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-[var(--text-muted)]">
          La 3D n'est pas disponible sur ce navigateur, mais le résultat de ta
          simulation est affiché ci-dessous.
        </div>
      )}
      {children}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="flex flex-col leading-tight">
      <span className="text-[10px] font-semibold tracking-[0.08em] text-[var(--text-faint)] uppercase">
        {label}
      </span>
      <span className="text-sm font-semibold tabular-nums text-[var(--text)]">
        {value}
      </span>
    </div>
  );
}

export default function FeuTricolore({ lines, status, onClear, project }) {
  const running = status === "running";
  const parsed = useMemo(
    () => (running ? null : parseRun(lines)),
    [running, lines],
  );
  const error = parsed?.error ?? null;
  const data = error ? null : (parsed?.data ?? null);
  const prints = parsed?.prints ?? [];

  const [time, setTime] = useState(0);
  const [ended, setEnded] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [playing, setPlaying] = useState(true);
  const [replays, setReplays] = useState(0);
  const hostRef = useRef(null);

  useEffect(() => {
    setTime(0);
    setEnded(false);
    setPlaying(true);
  }, [data, replays]);

  const marks = useMemo(() => (data ? timeline(data) : null), [data]);
  const result = data?.result ?? null;
  const level = data?.level ?? null;

  useEffect(() => {
    if (!ended || !result?.ok) return;
    if (level === 4) saveCompletion(project.id, false);
    if (level === 5) saveCompletion(project.id, Boolean(result.gold));
  }, [ended, result, level, project.id]);

  const replay = () => setReplays((count) => count + 1);

  let banner = null;
  if (ended && result) {
    if (result.ok && result.gold)
      banner = { tone: "var(--gold)", icon: "trophy", text: result.msg };
    else if (result.ok)
      banner = { tone: "var(--success)", icon: "check", text: result.msg };
    else
      banner = {
        tone: data.incident ? "var(--danger)" : "var(--warning)",
        icon: "alert",
        text: result.msg,
      };
  }

  const passed = marks
    ? marks.carPass.filter((t) => t <= time + 1e-6).length
    : 0;
  const crossed = marks
    ? marks.pedDone.filter((t) => t <= time + 1e-6).length
    : 0;
  const carsTotal = data?.total.cars ?? 0;
  const pedsTotal = data?.total.peds ?? 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[var(--bg)]">
      <div className="panel-head">
        <span className="panel-title whitespace-nowrap">
          CARREFOUR
          {data && (
            <span className="font-medium tracking-normal normal-case tabular-nums text-[var(--text-faint)]">
              {`niveau ${data.level} · ${data.title}`}
            </span>
          )}
        </span>
        <div className="flex items-center gap-2">
          {data && (
            <>
              <div
                className="flex items-center gap-1"
                role="group"
                aria-label="Vitesse de lecture"
              >
                {SPEEDS.map((value) => (
                  <button
                    key={value}
                    onClick={() => setSpeed(value)}
                    aria-pressed={speed === value}
                    className={`btn btn-sm ${speed === value ? "btn-primary" : "btn-ghost"}`}
                  >
                    ×{value}
                  </button>
                ))}
              </div>
              {!ended && (
                <button
                  onClick={() => setPlaying((p) => !p)}
                  className="btn btn-ghost btn-sm"
                >
                  <Icon name={playing ? "pause" : "play"} size={12} />
                  {playing ? "Pause" : "Lecture"}
                </button>
              )}
              <button onClick={replay} className="btn btn-ghost btn-sm">
                <Icon name="replay" size={12} />
                Rejouer
              </button>
            </>
          )}
          <button onClick={onClear} className="btn btn-ghost btn-sm">
            <Icon name="stop" size={12} />
            Arrêter
          </button>
        </div>
      </div>

      <div className="thin-scroll flex min-h-0 flex-1 flex-col gap-3 overflow-auto p-4">
        {running ? (
          <div className="m-auto flex items-center gap-2 text-sm text-[var(--text-muted)]">
            <span
              className="status-dot animate-pulse"
              style={{ "--tone": "var(--accent)" }}
            />
            Simulation en cours…
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
        ) : data ? (
          <div ref={hostRef} className="flex min-h-0 flex-1 flex-col gap-3">
            <Stage
              key={replays}
              data={data}
              hostRef={hostRef}
              speed={speed}
              playing={playing}
              onTime={setTime}
              onEnd={() => setEnded(true)}
              onReady={() => {}}
            >
              <div className="pointer-events-none absolute top-3 left-3 flex flex-wrap gap-x-5 gap-y-2 rounded-lg bg-[color-mix(in_oklab,var(--surface)_86%,transparent)] px-3 py-2 shadow-[var(--shadow-md)] backdrop-blur-sm">
                <Stat label="Temps" value={`${time.toFixed(1)} s`} />
                <Stat
                  label="Voitures passées"
                  value={`${passed} / ${carsTotal}`}
                />
                {pedsTotal > 0 && (
                  <Stat
                    label="Piétons traversés"
                    value={`${crossed} / ${pedsTotal}`}
                  />
                )}
                {level === 5 && result?.target && (
                  <Stat label="Objectif doré" value={`${result.target} s`} />
                )}
              </div>
              <div
                role="status"
                aria-live="polite"
                className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center px-3"
              >
                {banner && (
                  <div
                    className="callout flex max-w-xl animate-[pop-in_420ms_cubic-bezier(0.2,0.8,0.2,1)] items-center gap-2 px-4 py-2 text-center text-sm font-semibold shadow-[var(--shadow-md)]"
                    style={{
                      "--tone": banner.tone,
                      background:
                        "color-mix(in oklab, var(--tone) 14%, var(--surface))",
                    }}
                  >
                    <Icon name={banner.icon} size={15} />
                    {banner.text}
                  </div>
                )}
              </div>
            </Stage>
            <div className="flex flex-none flex-wrap items-center justify-between gap-x-6 gap-y-1 text-xs text-[var(--text-faint)]">
              <span>Feux : {data.lights.map((l) => l.name).join(", ")}</span>
              <span>Glisser pour pivoter · molette pour zoomer</span>
            </div>
            {prints.length > 0 && (
              <details className="flex-none rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs">
                <summary className="cursor-pointer font-semibold text-[var(--text-muted)]">
                  Tes print() ({prints.length} ligne
                  {prints.length > 1 ? "s" : ""})
                </summary>
                <pre className="thin-scroll mt-2 max-h-40 overflow-auto font-mono leading-relaxed whitespace-pre-wrap text-[var(--text)]">
                  {prints.slice(-300).join("\n")}
                </pre>
              </details>
            )}
          </div>
        ) : (
          <div className="m-auto max-w-md text-center text-sm leading-loose text-[var(--text-muted)]">
            Exécutez votre code pour lancer la simulation.
            <br />
            Commencez par choisir un niveau avec{" "}
            <code className="inline-code">load_level(1)</code>, puis allumez le
            feu avec <code className="inline-code">turn_on_green()</code> et
            laissez passer le temps avec{" "}
            <code className="inline-code">wait(secondes)</code>.
          </div>
        )}
      </div>
    </div>
  );
}
