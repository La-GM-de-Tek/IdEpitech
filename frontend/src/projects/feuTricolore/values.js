export const explanationFeuTricolore =
  "load_level(1)\n\nturn_on_green()\nwait(5)\n";

export const hintsFeuTricolore = [
  "Niveau 1 : les voitures arrivent toutes les 3 secondes. Laisse le vert allumé jusqu'à ce que la 4e soit passée (avec wait(...) ou while cars_passed() < 4: wait(0.1)), puis passe à l'orange pendant au moins 2 secondes avant le rouge.",
  "Pour changer de couleur, éteins toujours l'ancienne lumière avant d'allumer la nouvelle : turn_off_green() puis turn_on_yellow(). Sinon le feu affiche deux couleurs en même temps.",
  "Niveau 2 : les deux feux ne doivent jamais être verts en même temps. Écris une fonction passer_au_rouge(feu) qui fait vert → orange (2 s) → rouge, puis alterne les deux feux dans une boucle while cars_left() > 0.",
  "Niveaux 3 et 4 : un piéton qui a commencé à traverser va jusqu'au bout (environ 6 s). Après avoir remis le feu piéton au rouge, attends quelques secondes avant de redonner le vert aux voitures.",
  "Niveau 4 : les piétons de « pieton_sud » traversent la route sud, ils peuvent donc passer pendant que « ouest » est au vert (et « pieton_ouest » pendant que « sud » est au vert).",
  "Bonus : dans ta boucle, regarde cars_waiting() et pedestrians_waiting() toutes les demi-secondes, et ne change de feu que quand personne n'arrive plus de ton côté alors que quelqu'un attend en face.",
  "Va demander à un Manta quel est le pire carrefour de sa ville, et comment il le reprogrammerait.",
];

export const stepsFeuTricolore = [
  {
    id: "niveau-1",
    title: "Un seul feu",
    goal: "Avec load_level(1), laissez passer les 4 premières voitures, puis arrêtez la 5e devant le feu rouge.",
    hints: hintsFeuTricolore.slice(0, 2),
  },
  {
    id: "niveau-2",
    title: "Le carrefour",
    goal: "Avec load_level(2), alternez les feux « ouest » et « sud » pour faire passer toutes les voitures sans accident.",
    hints: hintsFeuTricolore.slice(2, 3),
  },
  {
    id: "niveau-3",
    title: "Les piétons",
    goal: "Avec load_level(3), faites passer toutes les voitures et tous les piétons du passage « pieton_ouest » sans accident.",
    hints: hintsFeuTricolore.slice(3, 4),
  },
  {
    id: "niveau-4",
    title: "Le grand carrefour",
    goal: "Avec load_level(4), gérez les deux routes et les deux passages piétons : faites passer tout le monde sans accident.",
    hints: hintsFeuTricolore.slice(4, 5),
  },
  {
    id: "niveau-5",
    bonus: true,
    title: "L'heure de pointe",
    goal: "Avec load_level(5), faites passer tout le monde en moins de 66 secondes en vous servant des capteurs.",
    hints: hintsFeuTricolore.slice(5),
  },
];
