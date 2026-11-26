import ArianeCode from "../projects/filDariane/dedale.py?raw";
import ArianeSubject from "../projects/filDariane/filDariane.pdf";
import AppletonSubject from "../projects/appletonCalculator/appletonCalculator.pdf";
import HyruleAttackSubject from "../projects/hyruleAttack/hyruleAttack.pdf";
import HyruleAttackHelpers from "../projects/hyruleAttack/sceau.py?raw";
import HyruleAttackGrader from "../projects/hyruleAttack/grader.py?raw";
import HyruleDefenseSubject from "../projects/hyruleDefense/hyruleDefense.pdf";
import HyruleDefenseHelpers from "../projects/hyruleDefense/sceaux.py?raw";
import FilDariane from "../projects/filDariane/filDariane";
import HyruleDefense from "../projects/hyruleDefense/hyruleDefense";
import FeuTricoloreSubject from "../projects/feuTricolore/feuTricolore.pdf";
import FeuTricoloreHelpers from "../projects/feuTricolore/carrefour.py?raw";
import FeuTricolore from "../projects/feuTricolore/feuTricolore";
import {
  explanationHyruleAttack,
  hintsHyruleAttack,
  stepsHyruleAttack,
} from "../projects/hyruleAttack/values";
import {
  explanationHyruleDefense,
  hintsHyruleDefense,
  stepsHyruleDefense,
} from "../projects/hyruleDefense/values";
import {
  explanationFilDariane,
  hintsFilDariane,
  stepsFilDariane,
} from "../projects/filDariane/values";
import {
  explanationFeuTricolore,
  hintsFeuTricolore,
  stepsFeuTricolore,
} from "../projects/feuTricolore/values";
import { stepsAppletonCalculator } from "../projects/appletonCalculator/values";
import { checkAppleton } from "../projects/appletonCalculator/checks";

export const DIFF = [
  "🥚 - Oeuf",
  "🐠🐠 - Raie",
  "🦈🦈🦈 - Raie Manta",
  "🐉🐉🐉🐉 - Raie Léviathan",
];
export const COBRA_DIFF = [
  "🥚 - Oeuf",
  "🐍🐍 - Cobra",
  "🐍🐍🐍 - Cobra Royal",
  "🐉🐉🐉🐉 - Léviathan",
];

export const guidedProjects = [
  {
    id: "fil-ariane",
    name: "Fil d'Ariane",
    language: "python",
    description: "Guidez Thésée hors du labyrinthe en déroulant le fil.",
    subject: ArianeSubject,
    beforeCode: ArianeCode,
    afterCode: "",
    explanation: explanationFilDariane,
    hints: hintsFilDariane,
    steps: stepsFilDariane,
    difficulty: DIFF[2],
    hasEnd: true,
    component: FilDariane,
  },
  {
    id: "appleton-calculator",
    name: "Appleton Calculator",
    language: "html",
    description: "Recréez la fameuse calculatrice d'Apple.",
    subject: AppletonSubject,
    beforeCode: "",
    afterCode: "",
    steps: stepsAppletonCalculator,
    checkHtml: checkAppleton,
    difficulty: DIFF[1],
    hasEnd: true,
  },
  {
    id: "hyrule-attack",
    name: "Assaut d'Hyrule",
    language: "python",
    description: "Vérifiez le sceau Sheikah pour briser la porte d'Hyrule.",
    subject: HyruleAttackSubject,
    beforeCode: HyruleAttackHelpers,
    afterCode: HyruleAttackGrader,
    explanation: explanationHyruleAttack,
    hints: hintsHyruleAttack,
    steps: stepsHyruleAttack,
    difficulty: DIFF[2],
    hasEnd: true,
  },
  {
    id: "hyrule-defense",
    name: "Défense d'Hyrule",
    language: "python",
    description: "Restaurez les sceaux brisés pour sauver Hyrule de Ganon.",
    subject: HyruleDefenseSubject,
    beforeCode: HyruleDefenseHelpers,
    afterCode: "",
    explanation: explanationHyruleDefense,
    hints: hintsHyruleDefense,
    steps: stepsHyruleDefense,
    difficulty: DIFF[3],
    hasEnd: true,
    component: HyruleDefense,
  },
  {
    id: "feu-tricolore",
    name: "Feu Tricolore",
    language: "python",
    description: "Programmez les feux du carrefour sans provoquer d'accident.",
    subject: FeuTricoloreSubject,
    beforeCode: FeuTricoloreHelpers,
    afterCode: "_feu_end()",
    explanation: explanationFeuTricolore,
    hints: hintsFeuTricolore,
    steps: stepsFeuTricolore,
    difficulty: DIFF[0],
    hasEnd: true,
    component: FeuTricolore,
  },
];
