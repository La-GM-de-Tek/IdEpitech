export const explanationHyruleAttack =
  "def verifier(sudoku: list) -> bool:\n    # à vous de jouer !\n    return False\n";

export const hintsHyruleAttack = [
  "Le sceau n'est juste que si, sur chaque ligne, chaque colonne et chaque bloc, on retrouve exactement les neuf runes de 1 à 9 — donc une case encore vide (un 0) doit rendre toute la grille invalide.",
  "Parcourez les 9 lignes (getLine(sudoku[i])), les 9 colonnes (getColumn(sudoku, i)) et les 9 blocs (getBlock(sudoku, x, y) avec x et y qui prennent les valeurs 0, 3 et 6).",
  "Ces fonctions éliminent déjà les doublons : comparez simplement chaque ensemble de runes à la cible, par exemple set(getLine(sudoku[i])) == {1, 2, 3, 4, 5, 6, 7, 8, 9}.",
  "Dès qu'une seule de ces comparaisons est fausse, renvoyez False. Ne renvoyez True qu'après les avoir toutes validées.",
  "La porte a cédé, héros ! Levez-vous et allez fredonner le thème de Zelda à un Manta pour prouver votre triomphe.",
];

const SEAL_LINE =
  /^sceau n°(\d+) ==> obtenu: (?:True|False), attendu: (?:True|False)\. (Réussi|Raté) !$/;

// The grader prints one line per seal, then its verdict:
// SCELLE (a seal is misjudged), OUVERT (all judged), MAITRISE (all judged
// without getLine, getColumn nor getBlock). The student's own print() come
// before, so the last grader lines win.
function graderReport(out) {
  const seals = new Map();
  let verdict = null;
  for (const line of out.split("\n")) {
    const seal = line.trim().match(SEAL_LINE);
    if (seal) seals.set(Number(seal[1]), seal[2] === "Réussi");
    const end = line.match(/Verification interne ==>(\w+)<==/);
    if (end) verdict = end[1];
  }
  return { seals, verdict };
}

const judged = (out, numbers) => {
  const { seals } = graderReport(out);
  return numbers.every((number) => seals.get(number) === true);
};

export const stepsHyruleAttack = [
  {
    id: "sceaux-incomplets",
    title: "Les sceaux incomplets",
    goal: "Faites rendre True à verifier pour les trois sceaux justes (n°1 à 3) et False pour les sceaux auxquels il manque des runes, avec une case à 0 (n°8 à 12).",
    hints: hintsHyruleAttack.slice(0, 1),
    check: (out) => judged(out, [1, 2, 3, 8, 9, 10, 11, 12]),
  },
  {
    id: "runes-en-double",
    title: "Les runes en double",
    goal: "Rejetez aussi les sceaux où une rune apparaît deux fois sur une ligne, une colonne ou un bloc (n°4 à 7) : les douze sceaux doivent être bien jugés pour briser la porte.",
    hints: hintsHyruleAttack.slice(1, 4),
    check: (out) => ["OUVERT", "MAITRISE"].includes(graderReport(out).verdict),
  },
  {
    id: "sans-runes-anciennes",
    bonus: true,
    title: "Sans les runes anciennes",
    goal: "Refaites le vérificateur sans jamais appeler getLine, getColumn ni getBlock : parcourez vous-même les lignes, les colonnes et les blocs.",
    hints: hintsHyruleAttack.slice(4),
    check: (out) => graderReport(out).verdict === "MAITRISE",
  },
];
