// Automatic checks for the Appleton calculator, one list of criteria per
// part. Each scenario loads the student's page in its own hidden frame,
// sandboxed with scripts only (no access to this page), so every scenario
// starts from a fresh calculator.

const TIMEOUT_MS = 4000;
const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
const OPERATORS = ["+", "-", "×", "÷"];

// Runs inside the test frame, after the student's code. It is serialised with
// toString(), so it must stay self-contained.
function harness(scenario, token) {
  const DIGIT_KEYS = "0123456789".split("");
  const OPERATOR_KEYS = ["+", "-", "×", "÷"];
  const LABELS = [...DIGIT_KEYS, ...OPERATOR_KEYS, "=", "AC"];
  const ALIASES = {
    "−": "-",
    "–": "-",
    "*": "×",
    X: "×",
    "/": "÷",
    ":": "÷",
    C: "AC",
  };
  const CLICKABLE =
    "button, input[type=button], input[type=submit], [role=button], [onclick]";
  const SCREEN_NAME = /screen|display|[ée]cran|result|affich|output/i;
  const SKIPPED = ["SCRIPT", "STYLE", "TEMPLATE", "NOSCRIPT"];

  // Lets the page react to a click. Not a timer: Chrome slows timers down to
  // about one per second in hidden cross-origin frames like this one.
  const settle = () =>
    new Promise((resolve) => {
      const channel = new MessageChannel();
      channel.port1.onmessage = () => resolve();
      channel.port2.postMessage(null);
    });

  const textOf = (el) =>
    (el.matches("input, textarea") ? el.value : el.textContent) ?? "";
  const keyOf = (el) => {
    const text = textOf(el).replace(/\s+/g, "");
    return ALIASES[text.toUpperCase()] ?? text.toUpperCase();
  };
  const nameOf = (el) => `${el.id} ${el.getAttribute("class") ?? ""}`;
  const clean = (text) =>
    text.replace(/\s+/g, "").replace(",", ".").replace(/[−–]/g, "-");
  const elements = () =>
    Array.from(document.body?.querySelectorAll("*") ?? []).filter(
      (el) => !SKIPPED.includes(el.tagName),
    );

  // One element per key, found by its label: "7", "+", "AC"…
  function findButtons() {
    const candidates = new Map();
    for (const el of elements()) {
      const field = el.matches("input[type=button], input[type=submit]");
      if (!field && el.matches("input, textarea, select")) continue;
      if (!field && el.children.length > 0 && !el.matches(CLICKABLE)) continue;
      const key = keyOf(el);
      if (!LABELS.includes(key)) continue;
      if (!candidates.has(key)) candidates.set(key, []);
      candidates.get(key).push(el);
    }
    // Most keys share one tag: with the names, it tells the 0 key apart from
    // a screen showing 0. On a tie the last one wins, screens come first.
    const tags = new Map();
    for (const list of candidates.values())
      for (const el of list)
        tags.set(el.tagName, (tags.get(el.tagName) ?? 0) + 1);
    const usualTag = [...tags].sort((a, b) => b[1] - a[1])[0]?.[0];
    const score = (el) =>
      (el.matches(CLICKABLE) ? 4 : 0) +
      (el.tagName === usualTag ? 2 : 0) -
      (SCREEN_NAME.test(nameOf(el)) ? 3 : 0);
    const buttons = {};
    for (const [key, list] of candidates)
      buttons[key] = list.reduce((best, el) =>
        score(el) >= score(best) ? el : best,
      );
    return buttons;
  }

  const outsideButtons = (buttons) =>
    elements().filter(
      (el) =>
        !Object.values(buttons).some(
          (button) =>
            button === el || button.contains(el) || el.contains(button),
        ),
    );

  function findScreen(buttons) {
    const usable = outsideButtons(buttons);
    return (
      usable.find((el) => SCREEN_NAME.test(nameOf(el))) ??
      usable.find((el) =>
        el.matches(
          "output, input:not([type=button]):not([type=submit]), textarea",
        ),
      ) ??
      usable.find(
        (el) =>
          el.children.length === 0 && /^-?[\d.,]+$/.test(textOf(el).trim()),
      ) ??
      null
    );
  }

  // Clicks a key and returns the element whose text changed, the deepest one.
  async function pressAndWatch(buttons, key) {
    const before = new Map(
      outsideButtons(buttons).map((el) => [el, textOf(el)]),
    );
    buttons[key].click();
    await settle();
    const changed = [...before]
      .filter(([el, text]) => el.isConnected && textOf(el) !== text)
      .map(([el]) => el);
    return changed.find(
      (el) => !changed.some((o) => o !== el && el.contains(o)),
    );
  }

  const ctx = document.createElement("canvas").getContext("2d");
  function rgba(color) {
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = "rgba(0, 0, 0, 0)";
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 1, 1);
    return Array.from(ctx.getImageData(0, 0, 1, 1).data);
  }

  // The colour seen behind the keys: the first opaque background around them.
  function backdrop(keys) {
    let el = keys[0];
    while (el && !keys.every((key) => el.contains(key))) el = el.parentElement;
    for (; el; el = el.parentElement) {
      const color = rgba(getComputedStyle(el).backgroundColor);
      if (color[3] >= 128) return color;
    }
    return [255, 255, 255, 255];
  }

  // Corner radius over the smaller side: 0.5 is a circle or a pill.
  function roundness(el) {
    const rect = el.getBoundingClientRect();
    const side = Math.min(rect.width, rect.height);
    if (side <= 0) return 0;
    const raw = getComputedStyle(el).borderTopLeftRadius.split(" ")[0];
    const radius = raw.endsWith("%")
      ? (parseFloat(raw) / 100) * rect.width
      : parseFloat(raw) || 0;
    return Math.min(radius, side / 2) / side;
  }

  async function inspectPage() {
    const buttons = findButtons();
    const keys = Object.values(buttons);
    const rects = keys.map((el) => el.getBoundingClientRect());
    const distinct = (values) =>
      new Set(values.map((value) => Math.round(value / 4))).size;
    const digits = DIGIT_KEYS.filter((key) => buttons[key]);
    const operators = OPERATOR_KEYS.filter((key) => buttons[key]);
    const page = {
      keys: Object.keys(buttons),
      columns: distinct(rects.map((rect) => rect.left)),
      rows: distinct(rects.map((rect) => rect.top)),
      backdrop: keys.length ? backdrop(keys) : null,
      digits: digits.map((key) => ({
        color: rgba(getComputedStyle(buttons[key]).backgroundColor),
        roundness: roundness(buttons[key]),
      })),
      operators: operators.map((key) =>
        rgba(getComputedStyle(buttons[key]).backgroundColor),
      ),
      screen: Boolean(findScreen(buttons)),
    };
    // No screen found by its look: a key that changes some text shows one.
    if (!page.screen && buttons["7"])
      page.screen = Boolean(await pressAndWatch(buttons, "7"));
    return page;
  }

  async function pressKeys(keys) {
    const missing = keys.filter((key) => !findButtons()[key]);
    if (missing.length) return { missing };
    let screen = null;
    const screens = [];
    for (const [index, key] of keys.entries()) {
      const buttons = findButtons();
      if (index === 0) {
        const fixed = findScreen(buttons);
        const changed = await pressAndWatch(buttons, key);
        screen =
          fixed && changed && fixed.contains(changed)
            ? fixed
            : (changed ?? fixed);
      } else {
        buttons[key].click();
        await settle();
      }
      if (screen && !screen.isConnected) screen = findScreen(findButtons());
      screens.push(screen ? clean(textOf(screen)) : null);
    }
    return { screens };
  }

  async function run() {
    let result;
    try {
      result =
        scenario.kind === "page"
          ? await inspectPage()
          : await pressKeys(scenario.keys);
    } catch (error) {
      result = { error: String(error) };
    }
    window.parent.postMessage({ source: "manta-check", token, result }, "*");
  }

  const start = () => settle().then(run);
  if (document.readyState === "complete") start();
  else window.addEventListener("load", start);
}

function runScenario(html, scenario) {
  return new Promise((resolve) => {
    const frame = document.createElement("iframe");
    const token = Math.random().toString(36).slice(2);
    frame.setAttribute("sandbox", "allow-scripts");
    frame.setAttribute("aria-hidden", "true");
    frame.tabIndex = -1;
    frame.style.cssText =
      "position:fixed;left:-10000px;top:0;width:420px;height:760px;border:0;opacity:0;pointer-events:none";

    const finish = (result) => {
      clearTimeout(timer);
      window.removeEventListener("message", onMessage);
      frame.remove();
      resolve(result);
    };
    const onMessage = (event) => {
      if (
        event.source === frame.contentWindow &&
        event.data?.source === "manta-check" &&
        event.data.token === token
      )
        finish(event.data.result);
    };
    const timer = setTimeout(() => finish({ error: "timeout" }), TIMEOUT_MS);
    window.addEventListener("message", onMessage);

    frame.srcdoc = `${html}\n<script>(${harness})(${JSON.stringify(scenario)}, ${JSON.stringify(token)});</script>`;
    document.body.appendChild(frame);
  });
}

const SCENARIOS = {
  page: { kind: "page" },
  digits: { keys: ["7", "8"] },
  add: { keys: ["1", "2", "+", "3", "="] },
  sub: { keys: ["8", "-", "3", "="] },
  mul: { keys: ["9", "×", "8", "="] },
  div: { keys: ["8", "÷", "2", "="] },
  clear: { keys: ["1", "2", "+", "AC", "5", "="] },
};

function hsl([r, g, b]) {
  const [rn, gn, bn] = [r / 255, g / 255, b / 255];
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l };
  const s = d / (1 - Math.abs(2 * l - 1));
  const h =
    max === rn
      ? 60 * (((gn - bn) / d + 6) % 6)
      : max === gn
        ? 60 * ((bn - rn) / d + 2)
        : 60 * ((rn - gn) / d + 4);
  return { h, s, l };
}

const isDark = ([r, g, b]) =>
  (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 < 0.25;
const isDarkGrey = (color) => {
  const { s, l } = hsl(color);
  return color[3] >= 128 && s <= 0.25 && l >= 0.05 && l <= 0.5;
};
const isOrange = (color) => {
  const { h, s, l } = hsl(color);
  return (
    color[3] >= 128 && h >= 15 && h <= 50 && s >= 0.5 && l >= 0.35 && l <= 0.75
  );
};

const listMissing = (keys, wanted) => {
  const missing = wanted.filter((key) => !keys.includes(key));
  return missing.length ? `il manque : ${missing.join(", ")}` : undefined;
};

// What the screen showed, for the student.
function shown(text) {
  if (text == null) return "aucun écran n'a changé";
  if (text === "") return "l'écran est vide";
  return `l'écran affiche « ${text} »`;
}

// Why a scenario could not be played, or null.
function broken(result) {
  if (result.error === "timeout")
    return "la page ne répond pas (balise mal fermée, boucle infinie ?)";
  if (result.error) return `erreur : ${result.error}`;
  if (result.missing)
    return `bouton introuvable : ${result.missing.join(", ")}`;
  return null;
}

function screenIs(result, index, expected) {
  const problem = broken(result);
  if (problem) return { ok: false, detail: problem };
  const text = result.screens[index];
  const ok =
    typeof expected === "number"
      ? text !== "" && text != null && Number(text) === expected
      : text === expected;
  return { ok, detail: ok ? undefined : shown(text) };
}

// { [stepId]: [{ label, ok, detail? }] }, for the steps of values.js.
export async function checkAppleton(html) {
  const results = Object.fromEntries(
    await Promise.all(
      Object.entries(SCENARIOS).map(async ([name, scenario]) => [
        name,
        await runScenario(html, scenario),
      ]),
    ),
  );
  const page = results.page;
  const pageFailed = broken(page);
  const keys = page.keys ?? [];

  const criterion = (label, ok, detail) => ({
    label,
    ok: !pageFailed && Boolean(ok),
    detail: pageFailed ?? (ok ? undefined : detail),
  });
  const clearFailed = broken(results.clear);
  const remembered = !clearFailed && Number(results.clear.screens[5]) === 17;

  return {
    interface: [
      criterion(
        "Un écran pour afficher les nombres",
        page.screen,
        "donnez-lui une classe comme « screen » ou « display »",
      ),
      criterion(
        "Les chiffres de 0 à 9",
        !listMissing(keys, DIGITS),
        listMissing(keys, DIGITS),
      ),
      criterion(
        "Les opérateurs +, -, × et ÷",
        !listMissing(keys, OPERATORS),
        listMissing(keys, OPERATORS),
      ),
      criterion(
        "Les boutons AC et =",
        !listMissing(keys, ["AC", "="]),
        listMissing(keys, ["AC", "="]),
      ),
    ],
    style: [
      criterion(
        "Un fond sombre derrière les boutons",
        page.backdrop && isDark(page.backdrop),
        "le fond autour des boutons est trop clair",
      ),
      criterion(
        "Des boutons ronds",
        page.digits?.length && page.digits.every((d) => d.roundness >= 0.2),
        "arrondissez davantage les coins des boutons",
      ),
      criterion(
        "Les chiffres sur fond gris foncé",
        page.digits?.length && page.digits.every((d) => isDarkGrey(d.color)),
        "donnez un fond gris foncé aux boutons des chiffres",
      ),
      criterion(
        "Les opérateurs sur fond orange",
        page.operators?.length === 4 && page.operators.every(isOrange),
        "donnez un fond orange aux boutons +, -, × et ÷",
      ),
      criterion(
        "Les boutons rangés en lignes et en colonnes",
        page.columns >= 4 && page.rows >= 4,
        "utilisez une grille CSS pour les aligner",
      ),
    ],
    chiffres: [
      {
        label: "Un clic sur 7 affiche 7 (le 0 de départ disparaît)",
        ...screenIs(results.digits, 0, "7"),
      },
      {
        label: "Puis un clic sur 8 affiche 78",
        ...screenIs(results.digits, 1, "78"),
      },
    ],
    operations: [
      { label: "12 + 3 = affiche 15", ...screenIs(results.add, 4, 15) },
      { label: "8 - 3 = affiche 5", ...screenIs(results.sub, 3, 5) },
      { label: "9 × 8 = affiche 72", ...screenIs(results.mul, 3, 72) },
      { label: "8 ÷ 2 = affiche 4", ...screenIs(results.div, 3, 4) },
    ],
    ac: [
      { label: "AC remet l'écran à 0", ...screenIs(results.clear, 3, "0") },
      {
        label: "AC oublie le calcul en cours (12 +, AC, 5, = n'affiche pas 17)",
        ok: !clearFailed && !remembered,
        detail:
          clearFailed ?? (remembered ? "le 12 + a été retenu" : undefined),
      },
    ],
  };
}
