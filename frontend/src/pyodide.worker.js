const PYODIDE_VERSION = "0.28.3";
const INDEX_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

importScripts(`${INDEX_URL}pyodide.js`);

let pyodide = null;
let ready = false;

const control = new Int32Array(new SharedArrayBuffer(8));
const DATA_SIZE = 1 << 20;
const data = new Uint8Array(new SharedArrayBuffer(DATA_SIZE));
const interrupt = new Uint8Array(new SharedArrayBuffer(1));

const MAX_OUTPUT_CHUNKS = 7500;
let outputCount = 0;

function makeWriter(stream) {
  const decoder = new TextDecoder();
  return {
    write: (buffer) => {
      outputCount += 1;
      if (outputCount > MAX_OUTPUT_CHUNKS) return buffer.length;
      if (outputCount === MAX_OUTPUT_CHUNKS) {
        self.postMessage({
          type: "output",
          stream: "stderr",
          text: "… sortie tronquée (trop de lignes)\n",
        });
        return buffer.length;
      }
      const text = decoder.decode(buffer, { stream: true });
      if (text) self.postMessage({ type: "output", stream, text });
      return buffer.length;
    },
  };
}

function stdin() {
  Atomics.store(control, 0, 0);
  self.postMessage({ type: "input-request" });
  Atomics.wait(control, 0, 0);
  const status = Atomics.load(control, 0);
  if (status === 2) return null;
  const len = Atomics.load(control, 1);
  return new TextDecoder().decode(data.slice(0, len));
}

async function init() {
  pyodide = await loadPyodide({ indexURL: INDEX_URL });
  pyodide.setStdout(makeWriter("stdout"));
  pyodide.setStderr(makeWriter("stderr"));
  pyodide.setStdin({ stdin, autoEOF: true });
  pyodide.setInterruptBuffer(interrupt);
  await pyodide.loadPackage("micropip");
  const micropip = pyodide.pyimport("micropip");
  await micropip.install("reportlab==5.1.0");
  ready = true;
  self.postMessage({ type: "ready", version: pyodide.version });
}

const initPromise = init().catch((error) => {
  self.postMessage({ type: "fatal", message: String(error) });
});

async function run(id, code) {
  await initPromise;
  if (!ready) return;
  interrupt[0] = 0;
  outputCount = 0;
  try {
    await pyodide.loadPackagesFromImports(code, {
      messageCallback: (msg) => self.postMessage({ type: "status", text: msg }),
    });
    const result = pyodide.runPython(code);
    let repr;
    if (result !== undefined && result !== null) {
      try {
        repr = pyodide.globals.get("repr")(result);
      } catch {
        repr = String(result);
      }
    }
    let pdf = null;
    try {
      const bytes = pyodide.FS.readFile("/output.pdf");
      pyodide.FS.unlink("/output.pdf");
      pdf = bytes.buffer;
    } catch {
      pdf = null;
    }
    self.postMessage(
      { type: "done", id, result: repr ?? null, pdf },
      pdf ? [pdf] : [],
    );
  } catch (error) {
    const message = String(error.message || error);
    if (message.includes("KeyboardInterrupt")) {
      self.postMessage({ type: "interrupted", id });
    } else {
      self.postMessage({ type: "error", id, message });
    }
  }
}

self.onmessage = (event) => {
  const msg = event.data;
  switch (msg.type) {
    case "handshake":
      self.postMessage({
        type: "shared",
        control: control.buffer,
        data: data.buffer,
        interrupt: interrupt.buffer,
      });
      break;
    case "run":
      run(msg.id, msg.code);
      break;
    default:
      break;
  }
};
