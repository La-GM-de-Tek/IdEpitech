import { isCompleted } from "./completion";

const STORAGE_KEY = "manta-activity";

export function dayKey(date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function loadActivity() {
  const empty = { days: {}, runs: {}, attempts: {}, seconds: {} };
  try {
    return { ...empty, ...JSON.parse(localStorage.getItem(STORAGE_KEY)) };
  } catch {
    return empty;
  }
}

function saveActivity(change) {
  const activity = loadActivity();
  change(activity);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(activity));
}

const increment = (counters, key, amount = 1) => {
  counters[key] = (counters[key] ?? 0) + amount;
};

export function trackRun(id) {
  saveActivity((activity) => {
    increment(activity.days, dayKey(new Date()));
    increment(activity.runs, id);
    if (!isCompleted(id)) increment(activity.attempts, id);
  });
}

export function trackTime(id, seconds) {
  saveActivity((activity) => increment(activity.seconds, id, seconds));
}
