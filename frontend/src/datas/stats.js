import { dayKey, loadActivity } from "../activity";
import { completionMark, isCompleted } from "../completion";
import { SAMPLE_C } from "../languages/c";
import { SAMPLE_HTML } from "../languages/html";
import { SAMPLE_PYTHON } from "../languages/python";
import {
  COBRA_DIFFICULTIES,
  DIFFICULTIES,
  LANGUAGES,
  learningProjects,
  projects,
} from "../projects";
import { ACHIEVEMENTS, checkAchievements, hintsUsed } from "./achievements";
import { guidedProjects } from "./guidedProjets";

const API_URL = import.meta.env.VITE_API_URL ?? "";
const CODE_KEY = "manta-code-";
const SAMPLES = { python: SAMPLE_PYTHON, c: SAMPLE_C, html: SAMPLE_HTML };

const XP = {
  exercise: 50,
  firstTry: 10,
  achievement: 25,
  noHint: 100,
  project: [100, 200, 300, 500],
  goldBonus: 0.5,
};
const XP_LEVEL_STEP = 50;
const RANK_LEVELS = [1, 4, 7, 10];

const SKILLS = [
  {
    id: "basics",
    label: "Bases",
    exercises: ["print", "comment", "c-program", "c-print", "c-comment"],
  },
  { id: "variables", label: "Variables", exercises: ["variable", "c-variable"] },
  { id: "calc", label: "Calculs", exercises: ["calc", "calc2", "c-calc"] },
  {
    id: "conditions",
    label: "Conditions",
    exercises: ["condition", "condition2", "c-condition"],
  },
  { id: "loops", label: "Boucles", exercises: ["loop", "loop2", "c-loop"] },
  {
    id: "arrays",
    label: "Listes",
    exercises: ["array", "array2", "array3", "c-array"],
  },
  {
    id: "functions",
    label: "Fonctions",
    exercises: ["function", "function2", "c-function"],
  },
  { id: "memory", label: "Mémoire", exercises: ["c-string", "c-pointer"] },
];

const countableProjects = guidedProjects.filter((project) => project.hasEnd);
const runnableProjects = projects.filter((project) => !project.custom);

const sum = (values) => values.reduce((total, value) => total + value, 0);
const countLines = (code) =>
  code.split("\n").filter((line) => line.trim()).length;

function projectXp(project) {
  return XP.project[DIFFICULTIES.indexOf(project.difficulty)];
}

function earnedProjectXp(project) {
  const mark = completionMark(project.id);
  if (!mark) return 0;
  const bonus = mark === "gold" ? projectXp(project) * XP.goldBonus : 0;
  const noHint = hintsUsed(project.id) === 0 ? XP.noHint : 0;
  return projectXp(project) + bonus + noHint;
}

function savedCode(project) {
  const saved = localStorage.getItem(CODE_KEY + project.id);
  if (saved === null || project.language !== "html") return saved;
  try {
    return Object.values(JSON.parse(saved)).join("\n");
  } catch {
    return saved;
  }
}

function linesWritten(project) {
  const code = savedCode(project);
  if (code === null) return 0;
  const template = project.explanation ?? SAMPLES[project.language];
  return Math.max(countLines(code) - countLines(template), 0);
}

function nextDay(key) {
  const date = new Date(`${key}T00:00`);
  date.setDate(date.getDate() + 1);
  return dayKey(date);
}

function currentStreak(days) {
  const cursor = new Date();
  if (!days[dayKey(cursor)]) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days[dayKey(cursor)]) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function bestStreak(days) {
  let best = 0;
  let streak = 0;
  let previous = null;
  Object.keys(days)
    .sort()
    .forEach((key) => {
      streak = previous && nextDay(previous) === key ? streak + 1 : 1;
      best = Math.max(best, streak);
      previous = key;
    });
  return best;
}

function nextQuests(unlocked) {
  const exercise = learningProjects.find(({ id }) => !isCompleted(id));
  const project = countableProjects.find(({ id }) => !isCompleted(id));
  const achievement = ACHIEVEMENTS.find(({ id }) => !unlocked[id]);

  return [
    exercise && {
      icon: LANGUAGES[exercise.language].icon,
      tag: `Exercice ${LANGUAGES[exercise.language].label}`,
      name: exercise.name,
      xp: XP.exercise,
      to: `/learning/${exercise.id}`,
    },
    project && {
      icon: "🚀",
      tag: "Projet guidé",
      name: project.name,
      xp: projectXp(project),
      to: `/${project.id}`,
    },
    achievement && {
      icon: achievement.icon,
      tag: "Succès",
      name: achievement.name,
      xp: XP.achievement,
      to: "/achievements",
    },
  ].filter(Boolean);
}

export function levelInfo(xp) {
  let level = 1;
  let floor = 0;
  while (xp >= floor + level * XP_LEVEL_STEP) {
    floor += level * XP_LEVEL_STEP;
    level++;
  }
  return { level, current: xp - floor, needed: level * XP_LEVEL_STEP };
}

export function rankInfo(level, themeType) {
  const labels = themeType === "manta" ? DIFFICULTIES : COBRA_DIFFICULTIES;
  const parse = (index) => {
    const [icons, name] = labels[index].split(" - ");
    return { icon: Array.from(icons)[0], name };
  };
  const index = RANK_LEVELS.findLastIndex((minLevel) => level >= minLevel);
  const next = RANK_LEVELS[index + 1];
  return {
    ...parse(index),
    next: next ? { ...parse(index + 1), level: next } : null,
  };
}

export function computeLocalStats() {
  const unlocked = checkAchievements();
  const activity = loadActivity();

  const doneExercises = learningProjects.filter(({ id }) => isCompleted(id));
  const doneProjects = countableProjects.filter(({ id }) => isCompleted(id));
  const goldProjects = doneProjects.filter(
    ({ id }) => completionMark(id) === "gold",
  );

  const attempts = [...doneExercises, ...doneProjects]
    .map(({ id }) => activity.attempts[id])
    .filter(Boolean);
  const firstTry = attempts.filter((count) => count === 1).length;

  const unlockedList = ACHIEVEMENTS.filter(({ id }) => unlocked[id]);
  const lastAchievement = unlockedList.reduce(
    (last, achievement) =>
      !last || unlocked[achievement.id] > unlocked[last.id] ? achievement : last,
    null,
  );

  const languages = Object.entries(LANGUAGES).map(([id, lang]) => {
    const inLanguage = (project) => project.language === id;
    const exercises = learningProjects.filter(inLanguage);
    const catalog = [...runnableProjects, ...exercises].filter(inLanguage);
    return {
      id,
      lang,
      done: exercises.filter((project) => isCompleted(project.id)).length,
      total: exercises.length,
      runs: sum(catalog.map((project) => activity.runs[project.id] ?? 0)),
      seconds: sum(catalog.map((project) => activity.seconds[project.id] ?? 0)),
      lines: sum(catalog.map(linesWritten)),
    };
  });

  const dailyRuns = Object.values(activity.days);
  const xp =
    doneExercises.length * XP.exercise +
    firstTry * XP.firstTry +
    unlockedList.length * XP.achievement +
    sum(countableProjects.map(earnedProjectXp));

  return {
    xp,
    exercises: { done: doneExercises.length, total: learningProjects.length },
    projects: {
      done: doneProjects.length,
      total: countableProjects.length,
      gold: goldProjects.length,
      noHint: doneProjects.filter(({ id }) => hintsUsed(id) === 0).length,
    },
    achievements: {
      done: unlockedList.length,
      total: ACHIEVEMENTS.length,
      last: lastAchievement?.name ?? null,
    },
    hints: {
      used: sum(countableProjects.map(({ id }) => hintsUsed(id))),
      total: sum(countableProjects.map(({ hints }) => hints?.length ?? 0)),
    },
    activity: {
      days: activity.days,
      activeDays: dailyRuns.length,
      bestDay: Math.max(0, ...dailyRuns),
      streak: currentStreak(activity.days),
      bestStreak: bestStreak(activity.days),
      runs: sum(languages.map(({ runs }) => runs)),
      seconds: sum(languages.map(({ seconds }) => seconds)),
      lines: sum(languages.map(({ lines }) => lines)),
      firstTry,
      accuracy: attempts.length ? attempts.length / sum(attempts) : null,
    },
    skills: SKILLS.map(({ id, label, exercises }) => ({
      id,
      label,
      done: exercises.filter((exercise) => isCompleted(exercise)).length,
      total: exercises.length,
    })),
    languages,
    guided: countableProjects.map((project) => ({
      id: project.id,
      name: project.name,
      difficultyIndex: DIFFICULTIES.indexOf(project.difficulty),
      mark: completionMark(project.id),
      hintsUsed: hintsUsed(project.id),
      hintsTotal: project.hints?.length ?? 0,
      xp: earnedProjectXp(project),
    })),
    quests: nextQuests(unlocked),
    community: null,
  };
}

export async function fetchStats() {
  try {
    const response = await fetch(`${API_URL}/api/stats`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.warn("Stats : back injoignable, repli sur les données locales.", error);
    return null;
  }
}
