# 🐍 IDEpitech

A learning IDE that runs **entirely in the browser** — no install, no account, no server-side execution.

## What you get

- **Free sandbox** — one per language, to write and run whatever you want.
- **Learning track** (`/learning`) — short exercises (print, variables, conditions, loops, lists, functions, pointers…) whose output is checked against an expected result. Progress is stored in `localStorage`.
- **Guided projects** — bigger subjects shipped with a PDF statement, hints, and sometimes a custom visualiser (e.g. _Fil d'Ariane_ animates Theseus walking the maze your code solves).
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
3. Put your assets in `src/projects/<myProject>/` (statement `.md`, `.pdf`, images, helper `.py` imported with `?raw`). Follow the layout of [src/projects/filDariane/](src/projects/filDariane/).
4. Need a custom visualiser instead of the plain console? Add a `<myProject>.jsx` component next to the assets, like `filDariane.jsx`.
5. Run `npm run dev`, check your exercise passes with a correct solution **and** fails with a wrong one.

### Pull request flow

```bash
git checkout -b feat/my-project
git commit -m "feat: add my-project"
git push -u origin feat/my-project
```

Then open a PR against `main` on [github.com/Ethanlsbr/IdEpitech](https://github.com/Ethanlsbr/IdEpitech). Direct pushes to `main` are not the way in — every project is reviewed and merged through a PR.
