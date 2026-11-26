export const explanationFilDariane = "print_map()\n\nright()";

export const hintsFilDariane = [
  "Utilise une boucle while qui continue tant que tu n'es pas sur la sortie 'o'.",
  "À chaque tour, regarde les cases voisines et déplace-toi si elle vaut '-' (chemin) ou 'o' (sortie).",
  "Mémorise chaque déplacement dans une liste pour savoir par où tu es passé.",
  "Si tu es bloqué, dépile ton dernier déplacement et fais le mouvement inverse (right<->left, up<->down) pour revenir en arrière.",
  "Lèves toi va voir un manta pour lui dire ton top 3 spotify.",
];

export const stepsFilDariane = [
  {
    id: "premier-couloir",
    map: "FIRST",
    title: "Le premier couloir",
    goal: "Chargez la carte avec print_map(), amenez Thésée sur la sortie « o » avec right(), down()… puis appelez finish().",
    hints: hintsFilDariane.slice(0, 1),
  },
  {
    id: "labyrinthe-facile",
    map: "EASY",
    title: "Le labyrinthe facile",
    goal: "Avec print_easy_map(), écrivez un algorithme qui regarde les cases voisines, avance, et rebrousse chemin dans les culs-de-sac.",
    hints: hintsFilDariane.slice(1, 4),
  },
  {
    id: "labyrinthe-moyen",
    map: "MEDIUM",
    title: "Le labyrinthe moyen",
    goal: "Faites sortir Thésée du labyrinthe de print_medium_map(), plus grand et plus tortueux, avec le même algorithme.",
    hints: [],
  },
  {
    id: "labyrinthe-difficile",
    map: "HARD",
    bonus: true,
    title: "Le labyrinthe difficile",
    goal: "Sortez du labyrinthe de print_hard_map() pour décrocher la marque dorée.",
    hints: hintsFilDariane.slice(4),
  },
];
