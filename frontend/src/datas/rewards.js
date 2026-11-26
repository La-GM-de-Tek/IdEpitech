import { computeLocalStats, levelInfo } from "./stats";

// Local-only until the back stores rewards: unlocks are recomputed from stats.
export const REWARDS = [
  {
    id: "theme-cobra",
    kind: "theme",
    target: "cobra",
    icon: "🐍",
    name: "Thème Cobra",
    condition: "Terminer un projet guidé.",
    check: (stats) => stats.projects.done >= 1,
  },
  {
    id: "theme-aquarium",
    kind: "theme",
    target: "aquarium",
    icon: "🐠",
    name: "Thème Manta Aquarium",
    condition: "Atteindre le niveau 5.",
    check: (_, level) => level >= 5,
  },
  {
    id: "theme-forest",
    kind: "theme",
    target: "forest",
    icon: "🌲",
    name: "Thème Cobra Deep Forest",
    condition: "Obtenir le bonus doré sur un projet.",
    check: (stats) => stats.projects.gold >= 1,
  },
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

// Anything without a reward attached is free.
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
