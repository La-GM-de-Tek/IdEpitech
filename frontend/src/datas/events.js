export const CAMPUSES = [
  "Barcelone",
  "Berlin",
  "Bordeaux",
  "Bruxelles",
  "Cotonou",
  "La Réunion",
  "Lille",
  "Lyon",
  "Madrid",
  "Marseille",
  "Montpellier",
  "Moulins",
  "Mulhouse",
  "Nancy",
  "Nantes",
  "Nice",
  "Paris",
  "Rennes",
  "Strasbourg",
  "Toulouse",
];

export const EVENT_TYPES = {
  "coding-club": {
    label: "Coding Club",
    color: "#10b981",
  },
  "portes-ouvertes": {
    label: "Portes Ouvertes",
    color: "#0ea5e9",
  },
};

//google sheet partagé csv (autre option?)
//date | heure | fin | campus | type | titre | lieu | lien | description
//lien du sheet
export const SHEET_CSV_URL = "";

//exemple si sheet pas dispo
const FALLBACK_EVENTS = [
  {
    id: "lyon-coding-club-2026-07-29",
    title: "Coding Club — Découverte Python",
    type: "coding-club",
    campus: "Lyon",
    date: "2026-07-29T18:00",
    end: "2026-07-29T20:00",
    location: "Epitech Lyon",
    link: "https://www.epitech.eu/", //lien formulaire de la dm pour s'inscrire
    description: "Premiers pas avec Python, ouvert à tous les niveaux.",
  },
  {
    id: "paris-portes-ouvertes-2026-08-12",
    title: "Portes Ouvertes",
    type: "portes-ouvertes",
    campus: "Paris",
    date: "2026-08-12T14:00",
    end: "2026-08-12T17:30",
    location: "Epitech Paris",
    link: "https://www.epitech.eu/",
    description: "Visite du campus et rencontre avec les équipes.",
  },
  {
    id: "bordeaux-coding-club-2026-09-16",
    title: "Coding Club — Algorithmique",
    type: "coding-club",
    campus: "Bordeaux",
    date: "2026-09-16T18:30",
    end: "2026-09-16T20:30",
    location: "Epitech Bordeaux",
    description: "Résolution de problèmes en équipe.",
  },
];

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }

  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

function toIsoDate(dateText, timeText) {
  const date = dateText.trim();
  const time = timeText.trim() || "00:00";
  let day = null;

  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(date)) {
    const [year, month, dayOfMonth] = date.split("-");
    day = `${year}-${month.padStart(2, "0")}-${dayOfMonth.padStart(2, "0")}`;
  } else {
    const match = date.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (match) {
      day = `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
    }
  }

  if (!day) return null;
  return `${day}T${time.padStart(5, "0")}`;
}

function normalizeType(value) {
  const text = value.trim().toLowerCase();
  const entry = Object.entries(EVENT_TYPES).find(
    ([key, type]) => key === text || type.label.toLowerCase() === text,
  );
  return entry ? entry[0] : text;
}

function rowsToEvents(rows) {
  if (rows.length < 2) return [];

  const header = rows[0].map((cell) => cell.trim().toLowerCase());
  const columnOf = (name) => header.indexOf(name);
  const columns = {
    date: columnOf("date"),
    heure: columnOf("heure"),
    fin: columnOf("fin"),
    campus: columnOf("campus"),
    type: columnOf("type"),
    titre: columnOf("titre"),
    lieu: columnOf("lieu"),
    lien: columnOf("lien"),
    description: columnOf("description"),
  };

  return rows
    .slice(1)
    .map((row, position) => {
      const cell = (name) =>
        columns[name] >= 0 ? (row[columns[name]] ?? "").trim() : "";

      const date = toIsoDate(cell("date"), cell("heure"));
      const title = cell("titre");
      if (!date || !title) return null;

      const endText = cell("fin");

      return {
        id: `${cell("campus")}-${date}-${position}`,
        title,
        type: normalizeType(cell("type")),
        campus: cell("campus"),
        date,
        end: (endText && toIsoDate(cell("date"), endText)) || undefined,
        location: cell("lieu") || undefined,
        link: cell("lien") || undefined,
        description: cell("description") || undefined,
      };
    })
    .filter(Boolean);
}

export async function fetchEvents() {
  if (!SHEET_CSV_URL) return FALLBACK_EVENTS;

  try {
    const response = await fetch(SHEET_CSV_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const parsed = rowsToEvents(parseCsv(await response.text()));
    return parsed.length ? parsed : FALLBACK_EVENTS;
  } catch (error) {
    console.warn(
      "Agenda : Sheet injoignable, repli sur la liste locale.",
      error,
    );
    return FALLBACK_EVENTS;
  }
}
