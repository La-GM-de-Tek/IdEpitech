# 🐍 IDEpitech

A learning IDE that runs **entirely in the browser** — no install, no account, no server-side execution.

## What you get

- **Free sandbox** — one per language, to write and run whatever you want.
- **Learning track** (`/learning`) — short exercises (print, variables, conditions, loops, lists, functions, pointers…) whose output is checked against an expected result. Progress is stored in `localStorage`.
- **Guided projects** — bigger subjects shipped with a PDF statement, hints, and sometimes a custom visualiser (e.g. _Fil d'Ariane_ animates Theseus walking the maze your code solves). Each subject is split into **steps** (_étapes_) that unlock in order: passing every required step validates the subject, and an optional last step earns the golden mark.
- **Glossary** (`/glossary`) — the vocabulary used across the exercises.
- **Stats** (`/stats`) — XP, level, skills, streaks and activity, computed from `localStorage`. The page also calls `GET /api/stats` and prefers the backend's values when it answers (`VITE_API_URL` sets its origin).
- **Interactive `input()`** — synchronous stdin, handled with `SharedArrayBuffer` + `Atomics`, so the UI never freezes.
- **Themes** — switchable look and feel, light and dark.

## Supported languages

| Language   | Runtime                                                                                                            | Runs on                                                      |
| ---------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------ |
| **Python** | [Pyodide](https://pyodide.org/) (CPython → WebAssembly), loaded from the jsDelivr CDN                              | Web Worker. `import numpy`, `pandas`… auto-loads the package |
| **C**      | [wasm-clang](https://github.com/binji/wasm-clang) (Clang 8.0.1 → WebAssembly), self-hosted in `public/wasm-clang/` | Web Worker. Compiles _and_ links in the browser              |
| **HTML**   | The browser itself                                                                                                 | Sandboxed `<iframe>` preview, live                           |

## Use it online

<https://idepitech.vercel.app>

Everything runs on your machine — your code never leaves the tab.

## Run it locally

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build
npm run preview  # serve the production build
```

Requires Node 18+ and a Chromium- or Firefox-based browser. Use a desktop screen: the editor is hidden on small viewports.

## Add a project

Projects are declared in [src/projects.jsx](src/projects.jsx). Adding one is a code change, so it goes through a **pull request** — see below.

1. Pick the list your project belongs to:
   - `learningPythonProjects` / `learningCProjects` — short, auto-checked exercises.
   - `guidedProjects` — a full subject with a PDF, shown on the home page.
2. Add an entry
3. Put your assets in `src/projects/<myProject>/` (statement `.md`, `.pdf`, images, helper `.py` imported with `?raw`). Follow the layout of `filDariane/`.
4. Need a custom visualiser instead of the plain console? Add a `<myProject>.jsx` component next to the assets, like `filDariane.jsx`.
5. Split a guided project into steps with a `steps` array (see below).
6. Run `npm run dev`, check your exercise passes with a correct solution **and** fails with a wrong one.

`frontend/src/projects/` is a git submodule pointing to [La-GM-de-Tek/IdEpitech-projects](https://github.com/La-GM-de-Tek/IdEpitech-projects). Clone with `git clone --recurse-submodules`, or run `git submodule update --init` on an existing clone. Project files go through a PR on that repo (see its [CONTRIBUTING.md](https://github.com/La-GM-de-Tek/IdEpitech-projects/blob/main/CONTRIBUTING.md)); the declaration in step 2 and the submodule bump go through a PR here.

### Split a subject into steps

A guided project gets a `steps` array, usually declared in its `values.js` ([feuTricolore/values.js](https://github.com/La-GM-de-Tek/IdEpitech-projects/blob/main/feuTricolore/values.js) is a good model). The editor shows a step tracker (the current step unfolds to show its title, its goal is in the tooltip), the hints follow the selected step, and the steps unlock in order.

```js
export const stepsMyProject = [
  {
    id: "niveau-1", // stored in localStorage: never rename it once shipped
    title: "Un seul feu",
    goal: "One or two sentences: what the student must do in this step.",
    hints: hintsMyProject.slice(0, 2), // this step's slice of the hints
  },
  // ...
  { id: "niveau-5", title: "...", goal: "...", bonus: true }, // optional golden mark, last only
];
```

How a step gets passed depends on the subject:

- **Console output** — give every step a `check: (stdout) => boolean`, like [hyruleAttack/values.js](https://github.com/La-GM-de-Tek/IdEpitech-projects/blob/main/hyruleAttack/values.js). After each run, the steps are checked in order until one fails.
- **Visualiser** — the component calls `passSteps(project, [stepId])` from [steps.js](frontend/src/steps.js) when a run succeeds, and uses `useStepGate(project, stepId)` to show `<StepLocked>` when the student plays a step that is still locked.
- **HTML** — give the project a `checkHtml: (html) => Promise<{ [stepId]: [{ label, ok, detail? }] }>`, like [appletonCalculator/checks.js](https://github.com/La-GM-de-Tek/IdEpitech-projects/blob/main/appletonCalculator/checks.js), which clicks through the page in hidden sandboxed frames.

The subject's completion mark (`true` / `"gold"`) is derived from its steps, so the stats, achievements and cards keep working unchanged.

### Pull request flow

```bash
git checkout -b feat/my-project
git commit -m "feat: add my-project"
git push -u origin feat/my-project
```

Then open a PR against `main` on [github.com/Ethanlsbr/IdEpitech](https://github.com/Ethanlsbr/IdEpitech). Direct pushes to `main` are not the way in — every project is reviewed and merged through a PR.
