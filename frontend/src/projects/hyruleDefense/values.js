export const explanationHyruleDefense =
  "grille = charger_facile()\nsudoku = [[v if v != 0 else [i for i in range(1, 10)] for v in ligne] for ligne in grille]\n\nafficher(sudoku)\n";

export const hintsHyruleDefense = [
  "Commencez par le sceau facile : grille = charger_facile(). Chaque 0 devient la liste [1, 2, 3, 4, 5, 6, 7, 8, 9] des runes encore possibles (c'est ce que fait déjà la deuxième ligne du code de départ).",
  "getLine, getColumn et getBlock ignorent les cases encore en liste et ne renvoient que les runes déjà fixées : pour une case non résolue, retirez de sa liste toutes les runes présentes sur sa ligne (getLine(sudoku[ligne])), sa colonne (getColumn(sudoku, colonne)) et son bloc (getBlock(sudoku, ligne, colonne)).",
  "Dès que la liste d'une case ne contient plus qu'une seule rune, remplacez cette liste par cet unique entier : la case est résolue.",
  "Répétez ce balayage dans une boucle tant qu'il reste des cases en liste, et appelez afficher(sudoku) à chaque tour pour voir le sceau se restaurer (il s'illumine en vert une fois complet).",
  "Hyrule est sauvée ! Allez demander à un Manta, l'air de rien, son personnage préféré de jeux vidéo.",
];

// One part per seal of sceaux.py: the visualiser passes the difficulty it
// read ("facile", "moyen", "difficile"), then the bonus.
export const stepsHyruleDefense = [
  {
    id: "facile",
    title: "Le sceau facile",
    goal: "Avec charger_facile(), retirez de chaque case les runes déjà présentes sur sa ligne, sa colonne et son bloc, et fixez celles où il n'en reste qu'une.",
    hints: hintsHyruleDefense.slice(0, 3),
  },
  {
    id: "moyen",
    title: "Le sceau moyen",
    goal: "Avec charger_moyen(), répétez ce balayage tour après tour jusqu'à ce que la grille soit entièrement restaurée.",
    hints: hintsHyruleDefense.slice(3, 4),
  },
  {
    id: "difficile",
    title: "Le sceau difficile",
    goal: "Restaurez le sceau ultime de charger_difficile() : c'est lui qui sauve Hyrule.",
    hints: [],
  },
  {
    id: "sans-runes-anciennes",
    bonus: true,
    title: "Sans les runes anciennes",
    goal: "Restaurez le sceau difficile sans appeler getLine, getColumn ni getBlock.",
    hints: hintsHyruleDefense.slice(4),
  },
];
