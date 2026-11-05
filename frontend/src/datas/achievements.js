import { completionMark, isCompleted } from "../completion";
import { DEFAULT_THEME } from "../theme/themes";
import { LANG } from "./languages";
import { guidedProjects } from "./guidedProjets";
import { learningPythonProjects } from "./learningPythonProjects";
import { learningCProjects } from "./learningCProjects";

const STORAGE_KEY = "manta-achievements";
const HINTS_KEY = "manta-hints-";
const CODE_KEY = "manta-code-";
const SUBJECT_KEY = "manta-create-subject-md";
const THEME_KEY = "manta-theme";
const MODE_KEY = "manta-mode";

const toIds = (projects) => projects.map((project) => project.id);

const pythonIds = toIds(learningPythonProjects);
const cIds = toIds(learningCProjects);
const learningIds = [...pythonIds, ...cIds];
const countableProjects = guidedProjects.filter((project) => project.hasEnd);
const projectIds = toIds(countableProjects);

const countCompleted = (ids) => ids.filter((id) => isCompleted(id)).length;
const allCompleted = (ids) => ids.every((id) => isCompleted(id));
const isGold = (id) => completionMark(id) === "gold";

function hintsUsed(id) {
  try {
    return JSON.parse(localStorage.getItem(HINTS_KEY + id))?.count ?? 0;
  } catch {
    return 0;
  }
}

const hasOpenedSandbox = (language) =>
  localStorage.getItem(`${CODE_KEY}libre-${language}`) !== null;

export const ACHIEVEMENT_CATEGORIES = [
  { id: "learning", label: "Apprentissage" },
  { id: "projects", label: "Projets" },
  { id: "exploration", label: "Exploration" },
];

export const ACHIEVEMENTS = [
  {
    id: "first-learning",
    category: "learning",
    name: "Premier pas",
    description: "Terminer un exercice d'apprentissage.",
    icon: "🌱",
    check: () => countCompleted(learningIds) >= 1,
  },
  {
    id: "learning-5",
    category: "learning",
    name: "Studieux",
    description: "Terminer 5 exercices d'apprentissage.",
    icon: "📗",
    check: () => countCompleted(learningIds) >= 5,
  },
  {
    id: "learning-10",
    category: "learning",
    name: "Assidu",
    description: "Terminer 10 exercices d'apprentissage.",
    icon: "📘",
    check: () => countCompleted(learningIds) >= 10,
  },
  {
    id: "learning-20",
    category: "learning",
    name: "Acharné",
    description: "Terminer 20 exercices d'apprentissage.",
    icon: "📙",
    check: () => countCompleted(learningIds) >= 20,
  },
  {
    id: "all-learning",
    category: "learning",
    name: "Diplômé",
    description: "Terminer tous les exercices d'apprentissage.",
    icon: "🎓",
    check: () => allCompleted(learningIds),
  },
  {
    id: "python-first",
    category: "learning",
    name: "Premiers pas en Python",
    description: "Terminer un exercice Python.",
    icon: "🐣",
    check: () => countCompleted(pythonIds) >= 1,
  },
  {
    id: "python-learner",
    category: "learning",
    name: "Pythoniste",
    description: "Terminer tous les exercices Python.",
    icon: "🐍",
    check: () => allCompleted(pythonIds),
  },
  {
    id: "c-first",
    category: "learning",
    name: "Premiers pas en C",
    description: "Terminer un exercice C.",
    icon: "🔧",
    check: () => countCompleted(cIds) >= 1,
  },
  {
    id: "c-learner",
    category: "learning",
    name: "Codeur C",
    description: "Terminer tous les exercices C.",
    icon: "⚙️",
    check: () => allCompleted(cIds),
  },
  {
    id: "polyglot",
    category: "learning",
    name: "Polyglotte",
    description: "Terminer un exercice en Python et un exercice en C.",
    icon: "🌍",
    check: () => countCompleted(pythonIds) >= 1 && countCompleted(cIds) >= 1,
  },
  {
    id: "hello-world",
    category: "learning",
    name: "Hello World",
    description: "Terminer les exercices d'affichage en Python et en C.",
    icon: "👋",
    check: () => allCompleted(["print", "c-print"]),
  },
  {
    id: "calculations",
    category: "learning",
    name: "Calculatrice humaine",
    description: "Terminer tous les exercices sur les calculs.",
    icon: "🧮",
    check: () => allCompleted(["calc", "calc2", "c-calc"]),
  },
  {
    id: "conditions",
    category: "learning",
    name: "Aiguilleur",
    description: "Terminer tous les exercices sur les conditions.",
    icon: "🔀",
    check: () => allCompleted(["condition", "condition2", "c-condition"]),
  },
  {
    id: "loops",
    category: "learning",
    name: "Tourne en boucle",
    description: "Terminer tous les exercices sur les boucles.",
    icon: "🔁",
    check: () => allCompleted(["loop", "loop2", "c-loop"]),
  },
  {
    id: "arrays",
    category: "learning",
    name: "Bien rangé",
    description: "Terminer tous les exercices sur les listes et tableaux.",
    icon: "📦",
    check: () => allCompleted(["array", "array2", "array3", "c-array"]),
  },
  {
    id: "functions",
    category: "learning",
    name: "Fonctionnel",
    description: "Terminer tous les exercices sur les fonctions.",
    icon: "🧩",
    check: () => allCompleted(["function", "function2", "c-function"]),
  },
  {
    id: "strings",
    category: "learning",
    name: "Enfileur de chaînes",
    description: "Terminer l'exercice sur les chaînes de caractères en C.",
    icon: "🧵",
    check: () => isCompleted("c-string"),
  },
  {
    id: "pointers",
    category: "learning",
    name: "Pointeur fou",
    description: "Terminer l'exercice sur les pointeurs en C.",
    icon: "👉",
    check: () => isCompleted("c-pointer"),
  },
  {
    id: "first-project",
    category: "projects",
    name: "Premier projet",
    description: "Terminer un projet guidé.",
    icon: "🚀",
    check: () => countCompleted(projectIds) >= 1,
  },
  {
    id: "fil-ariane",
    category: "projects",
    name: "Sorti du labyrinthe",
    description: "Terminer le projet Fil d'Ariane.",
    icon: "🧶",
    check: () => isCompleted("fil-ariane"),
  },
  {
    id: "hyrule-attack",
    category: "projects",
    name: "Porte brisée",
    description: "Terminer le projet Assaut d'Hyrule.",
    icon: "⚔️",
    check: () => isCompleted("hyrule-attack"),
  },
  {
    id: "hyrule-defense",
    category: "projects",
    name: "Gardien d'Hyrule",
    description: "Terminer le projet Défense d'Hyrule.",
    icon: "🛡️",
    check: () => isCompleted("hyrule-defense"),
  },
  {
    id: "all-projects",
    category: "projects",
    name: "Complétionniste",
    description: "Terminer tous les projets guidés.",
    icon: "🏆",
    check: () => allCompleted(projectIds),
  },
  {
    id: "first-gold",
    category: "projects",
    name: "Bonus doré",
    description: "Obtenir le bonus doré sur un projet.",
    icon: "🏅",
    check: () => projectIds.some(isGold),
  },
  {
    id: "all-gold",
    category: "projects",
    name: "Tout en or",
    description: "Obtenir le bonus doré sur tous les projets guidés.",
    icon: "👑",
    check: () => projectIds.every(isGold),
  },
  {
    id: "no-hint",
    category: "projects",
    name: "Sans filet",
    description: "Terminer un projet guidé sans utiliser d'indice.",
    icon: "🧠",
    check: () =>
      projectIds.some((id) => isCompleted(id) && hintsUsed(id) === 0),
  },
  {
    id: "first-hint",
    category: "projects",
    name: "Coup de pouce",
    description: "Débloquer un indice.",
    icon: "💡",
    check: () => projectIds.some((id) => hintsUsed(id) > 0),
  },
  {
    id: "all-hints",
    category: "projects",
    name: "Lanterne allumée",
    description: "Débloquer tous les indices d'un projet.",
    icon: "🔦",
    check: () =>
      countableProjects.some(
        (project) =>
          project.hints?.length > 0 &&
          hintsUsed(project.id) >= project.hints.length,
      ),
  },
  {
    id: "sandbox",
    category: "exploration",
    name: "Bac à sable",
    description: "Ouvrir un espace de code libre.",
    icon: "🧪",
    check: () => Object.keys(LANG).some(hasOpenedSandbox),
  },
  {
    id: "all-sandboxes",
    category: "exploration",
    name: "Explorateur",
    description: "Ouvrir le code libre dans chaque langage.",
    icon: "🗺️",
    check: () => Object.keys(LANG).every(hasOpenedSandbox),
  },
  {
    id: "subject",
    category: "exploration",
    name: "Auteur",
    description: "Ouvrir le créateur de sujet.",
    icon: "📝",
    check: () => localStorage.getItem(SUBJECT_KEY) !== null,
  },
  {
    id: "theme",
    category: "exploration",
    name: "Décorateur",
    description: "Changer le thème du site.",
    icon: "🎨",
    check: () => {
      const theme = localStorage.getItem(THEME_KEY);
      return theme !== null && theme !== DEFAULT_THEME;
    },
  },
  {
    id: "light-mode",
    category: "exploration",
    name: "Lumière du jour",
    description: "Passer en mode clair.",
    icon: "☀️",
    check: () => localStorage.getItem(MODE_KEY) === "light",
  },
];

export function loadAchievements() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? {};
  } catch {
    return {};
  }
}

export function checkAchievements() {
  const unlocked = loadAchievements();
  ACHIEVEMENTS.forEach((achievement) => {
    if (!unlocked[achievement.id] && achievement.check()) {
      unlocked[achievement.id] = Date.now();
    }
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(unlocked));
  return unlocked;
}
