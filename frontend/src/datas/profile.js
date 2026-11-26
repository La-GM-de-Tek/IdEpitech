import { formatDuration } from "../pages/Stats";

const STORAGE_KEY = "manta-profile";

export const PROFILE_LIMITS = { achievements: 3, stats: 4, projects: 3 };
export const BIO_MAX = 160;
export const PSEUDO_MAX = 32;
export const AVATARS = ["🐍", "🦈", "🦊", "🐙", "🦉", "🐉", "🤖", "👾", "🧙", "🚀"];

const formatNumber = (value) => value.toLocaleString("fr-FR");
const plural = (count, word) => `${count} ${word}${count > 1 ? "s" : ""}`;

export const PROFILE_STATS = [
  { id: "xp", icon: "✨", label: "XP totale", value: (s) => formatNumber(s.xp) },
  {
    id: "exercises",
    icon: "📚",
    label: "Exercices",
    value: (s) => `${s.exercises.done}/${s.exercises.total}`,
  },
  {
    id: "projects",
    icon: "🚀",
    label: "Projets",
    value: (s) => `${s.projects.done}/${s.projects.total}`,
  },
  {
    id: "gold",
    icon: "🏅",
    label: "Bonus dorés",
    value: (s) => `${s.projects.gold}/${s.projects.total}`,
  },
  {
    id: "achievements",
    icon: "🏆",
    label: "Succès",
    value: (s) => `${s.achievements.done}/${s.achievements.total}`,
  },
  {
    id: "streak",
    icon: "🔥",
    label: "Série en cours",
    value: (s) => plural(s.activity.streak, "jour"),
  },
  {
    id: "bestStreak",
    icon: "⚡",
    label: "Meilleure série",
    value: (s) => plural(s.activity.bestStreak, "jour"),
  },
  {
    id: "activeDays",
    icon: "📅",
    label: "Jours actifs",
    value: (s) => formatNumber(s.activity.activeDays),
  },
  {
    id: "runs",
    icon: "▶️",
    label: "Exécutions",
    value: (s) => formatNumber(s.activity.runs),
  },
  {
    id: "lines",
    icon: "⌨️",
    label: "Lignes écrites",
    value: (s) => formatNumber(s.activity.lines),
  },
  {
    id: "time",
    icon: "⏱️",
    label: "Temps de code",
    value: (s) => formatDuration(s.activity.seconds),
  },
  {
    id: "firstTry",
    icon: "🥷",
    label: "Du premier coup",
    value: (s) => formatNumber(s.activity.firstTry),
  },
  {
    id: "noHint",
    icon: "🧠",
    label: "Projets sans indice",
    value: (s) => formatNumber(s.projects.noHint),
  },
];

const DEFAULT_STATS = ["xp", "bestStreak", "exercises", "projects"];

export function loadProfile() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? {};
  } catch {
    return {};
  }
}

export function saveProfile(profile) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

// Without a choice of their own, the profile shows the latest achievements,
// a fixed set of stats and the guided projects that earned the most XP.
export function resolveShowcase(profile, stats, unlocked) {
  const achievements =
    profile.achievements ??
    Object.keys(unlocked)
      .sort((a, b) => unlocked[b] - unlocked[a])
      .slice(0, PROFILE_LIMITS.achievements);
  const projects =
    profile.projects ??
    stats.guided
      .filter(({ mark }) => mark)
      .sort((a, b) => b.xp - a.xp)
      .slice(0, PROFILE_LIMITS.projects)
      .map(({ id }) => id);

  return {
    achievements: achievements.filter((id) => unlocked[id]),
    stats: profile.stats ?? DEFAULT_STATS,
    projects: projects.filter((id) =>
      stats.guided.some((project) => project.id === id && project.mark),
    ),
  };
}
