import { useMemo, useSyncExternalStore } from "react";
import { dayKey } from "./activity";
import { completionMark, saveCompletion } from "./completion";

const STORAGE_KEY = "manta-steps-";
const CHANGE_EVENT = "manta-steps-change";

export const hasSteps = (project) => Boolean(project?.steps?.length);

export function stepName(project, step) {
  if (step.bonus) return "Bonus";
  return `Étape ${project.steps.indexOf(step) + 1}`;
}

function legacyPassed(project) {
  const mark = completionMark(project.id);
  if (!mark) return {};
  const today = dayKey(new Date());
  return Object.fromEntries(
    project.steps
      .filter((step) => !step.bonus || mark === "gold")
      .map((step) => [step.id, today]),
  );
}

function readPassed(project) {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY + project.id));
    if (saved && typeof saved === "object") return saved;
  } catch {
    return legacyPassed(project);
  }
  return legacyPassed(project);
}

function writePassed(project, passed) {
  localStorage.setItem(STORAGE_KEY + project.id, JSON.stringify(passed));
  const required = project.steps.filter((step) => !step.bonus);
  if (required.every((step) => passed[step.id])) {
    const bonus = project.steps.find((step) => step.bonus);
    saveCompletion(project.id, Boolean(bonus && passed[bonus.id]));
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function getStepProgress(project) {
  if (!hasSteps(project)) return null;
  const passed = readPassed(project);
  let previousAllPassed = true;
  const steps = project.steps.map((step, index) => {
    const isPassed = Boolean(passed[step.id]);
    const state = isPassed
      ? "passed"
      : previousAllPassed
        ? "current"
        : "locked";
    previousAllPassed &&= isPassed;
    return {
      ...step,
      number: index + 1,
      name: stepName(project, step),
      passedAt: passed[step.id] ?? null,
      state,
    };
  });
  const required = steps.filter((step) => !step.bonus);
  const bonus = steps.find((step) => step.bonus) ?? null;
  return {
    steps,
    current: steps.find((step) => step.state === "current") ?? null,
    passedCount: steps.filter((step) => step.state === "passed").length,
    completed: required.every((step) => step.state === "passed"),
    gold: bonus?.state === "passed",
  };
}

export function passSteps(project, ids) {
  if (!hasSteps(project)) return [];
  const passed = readPassed(project);
  const newly = [];
  for (const id of ids) {
    const index = project.steps.findIndex((step) => step.id === id);
    if (index === -1 || passed[id]) continue;
    const before = project.steps.slice(0, index);
    if (!before.every((step) => passed[step.id])) break;
    passed[id] = dayKey(new Date());
    newly.push(project.steps[index]);
  }
  if (newly.length) writePassed(project, passed);
  return newly;
}

export function validateSteps(project, isPassing) {
  const passed = readPassed(project);
  const ids = [];
  let failed = null;
  for (const step of project.steps) {
    if (passed[step.id]) continue;
    if (!isPassing(step)) {
      failed = step;
      break;
    }
    ids.push(step.id);
  }
  return { passed: passSteps(project, ids), failed };
}

function subscribe(callback) {
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function useStepProgress(project) {
  const enabled = hasSteps(project);
  const saved = useSyncExternalStore(subscribe, () =>
    enabled ? localStorage.getItem(STORAGE_KEY + project.id) : null,
  );
  const mark = useSyncExternalStore(subscribe, () =>
    enabled ? localStorage.getItem(project.id) : null,
  );
  return useMemo(
    () => (enabled ? getStepProgress(project) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [enabled, project, saved, mark],
  );
}

export function useStepGate(project, stepId) {
  const progress = useStepProgress(project);
  return useMemo(() => {
    const step = progress?.steps.find(({ id }) => id === stepId) ?? null;
    const blocker = step?.state === "locked" ? progress.current : null;
    return { step, blocker };
  }, [progress, stepId]);
}
