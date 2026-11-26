// Replays the Pyodide worker init in Node so a broken dependency fails CI
// instead of the site. Needs `pyodide@<PYODIDE_VERSION>` installed.
import { readFileSync } from "node:fs";
import { loadPyodide, version } from "pyodide";

const worker = readFileSync(
  new URL("../src/pyodide.worker.js", import.meta.url),
  "utf8",
);
const expected = worker.match(/PYODIDE_VERSION = "([^"]+)"/)[1];
const packages = [...worker.matchAll(/micropip\.install\("([^"]+)"\)/g)].map(
  (match) => match[1],
);

if (version !== expected) {
  throw new Error(`pyodide ${version} installed, worker uses ${expected}`);
}

const pyodide = await loadPyodide();
await pyodide.loadPackage("micropip");
const micropip = pyodide.pyimport("micropip");
for (const pkg of packages) {
  console.log(`micropip.install("${pkg}")`);
  await micropip.install(pkg);
}
pyodide.runPython("import reportlab; print('reportlab', reportlab.Version)");
console.log(`Pyodide ${version} OK`);
