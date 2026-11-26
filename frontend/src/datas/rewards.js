import { useEffect, useState } from "react";
import { fetchMyThemes, unlockMyTheme } from "../auth/api";
import { useAuth } from "../auth/AuthContext";
import { computeLocalStats, levelInfo } from "./stats";

const theme = (target, icon, label, condition, check) => ({
  id: `theme-${target}`,
  kind: "theme",
  target,
  icon,
  name: `Thème ${label}`,
  condition,
  check,
});

const cDone = (stats) =>
  stats.languages.find(({ id }) => id === "c")?.done ?? 0;

export const REWARDS = [
  theme(
    "manta",
    "🐟",
    "Manta",
    "Atteindre le niveau 2.",
    (_, level) => level >= 2,
  ),
  theme(
    "printemps",
    "🌸",
    "Printemps",
    "Terminer 5 exercices.",
    (stats) => stats.exercises.done >= 5,
  ),
  theme(
    "cobra",
    "🐍",
    "Cobra",
    "Terminer un projet guidé.",
    (stats) => stats.projects.done >= 1,
  ),
  theme(
    "ete",
    "☀️",
    "Été",
    "Coder 3 jours d'affilée.",
    (stats) => stats.activity.bestStreak >= 3,
  ),
  theme(
    "paques",
    "🐣",
    "Pâques",
    "Terminer 3 exercices en C.",
    (stats) => cDone(stats) >= 3,
  ),
  theme(
    "aquarium",
    "🐠",
    "Manta Aquarium",
    "Atteindre le niveau 5.",
    (_, level) => level >= 5,
  ),
  theme(
    "saint-valentin",
    "💘",
    "Saint-Valentin",
    "Réussir 5 exercices du premier coup.",
    (stats) => stats.activity.firstTry >= 5,
  ),
  theme(
    "automne",
    "🍂",
    "Automne",
    "Débloquer 10 succès.",
    (stats) => stats.achievements.done >= 10,
  ),
  theme(
    "forest",
    "🌲",
    "Cobra Deep Forest",
    "Obtenir le bonus doré sur un projet.",
    (stats) => stats.projects.gold >= 1,
  ),
  theme(
    "octobre-rose",
    "🎀",
    "Octobre Rose",
    "Lancer 100 exécutions.",
    (stats) => stats.activity.runs >= 100,
  ),
  theme(
    "nouvel-an",
    "🥂",
    "Nouvel An",
    "Être actif 7 jours.",
    (stats) => stats.activity.activeDays >= 7,
  ),
  theme(
    "halloween",
    "🎃",
    "Halloween",
    "Écrire 500 lignes de code.",
    (stats) => stats.activity.lines >= 500,
  ),
  theme(
    "noel",
    "🎄",
    "Noël",
    "Atteindre le niveau 10.",
    (_, level) => level >= 10,
  ),
  {
    id: "avatar-dragon",
    kind: "avatar",
    target: "🐉",
    icon: "🐉",
    name: "Avatar Dragon",
    condition: "Atteindre le niveau 3.",
    check: (_, level) => level >= 3,
  },
  {
    id: "avatar-robot",
    kind: "avatar",
    target: "🤖",
    icon: "🤖",
    name: "Avatar Robot",
    condition: "Terminer 2 projets guidés.",
    check: (stats) => stats.projects.done >= 2,
  },
  {
    id: "avatar-invader",
    kind: "avatar",
    target: "👾",
    icon: "👾",
    name: "Avatar Invader",
    condition: "Atteindre le niveau 7.",
    check: (_, level) => level >= 7,
  },
  {
    id: "avatar-wizard",
    kind: "avatar",
    target: "🧙",
    icon: "🧙",
    name: "Avatar Mage",
    condition: "Terminer un projet sans indice.",
    check: (stats) => stats.projects.noHint >= 1,
  },
  {
    id: "avatar-rocket",
    kind: "avatar",
    target: "🚀",
    icon: "🚀",
    name: "Avatar Fusée",
    condition: "Terminer tous les projets guidés.",
    check: (stats) => stats.projects.done === stats.projects.total,
  },
];

export function unlockedRewards(stats = computeLocalStats()) {
  const { level } = levelInfo(stats.xp);
  return new Set(
    REWARDS.filter((reward) => reward.check(stats, level)).map(({ id }) => id),
  );
}

export function lockedTargets(kind, unlocked) {
  return new Set(
    REWARDS.filter(
      (reward) => reward.kind === kind && !unlocked.has(reward.id),
    ).map(({ target }) => target),
  );
}

export function rewardFor(kind, target) {
  return REWARDS.find(
    (reward) => reward.kind === kind && reward.target === target,
  );
}

async function syncThemeRewards(token, unlocked, signal) {
  const owned = new Set(
    (await fetchMyThemes(token, signal)).map(({ theme }) => theme.name),
  );
  const missing = REWARDS.filter(
    (reward) =>
      reward.kind === "theme" &&
      unlocked.has(reward.id) &&
      !owned.has(reward.target),
  );
  await Promise.all(
    missing.map((reward) => unlockMyTheme(token, reward.target, signal)),
  );
  missing.forEach((reward) => owned.add(reward.target));
  return owned;
}

export function useUnlockedRewards(stats) {
  const { token } = useAuth();
  const [local] = useState(() => unlockedRewards(stats));
  const [owned, setOwned] = useState(() => new Set());

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    syncThemeRewards(token, local, controller.signal)
      .then(setOwned)
      .catch((error) => {
        if (error.name !== "AbortError") {
          console.warn("Récompenses : synchro avec le back impossible.", error);
        }
      });
    return () => controller.abort();
  }, [token, local]);

  const unlocked = new Set(local);
  REWARDS.forEach((reward) => {
    if (reward.kind === "theme" && owned.has(reward.target)) {
      unlocked.add(reward.id);
    }
  });
  return unlocked;
}
