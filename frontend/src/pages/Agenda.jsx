import { useEffect, useMemo, useState } from "react";
import HeaderBar from "../components/HeaderBar";
import PatternPage from "../components/PatternPage";
import PageIntro from "../components/PageIntro";
import Select from "../components/Select";
import Icon from "../components/Icon";
import { CAMPUSES, EVENT_TYPES, fetchEvents } from "../datas/events";

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function typeInfo(type) {
  return (
    EVENT_TYPES[type] ?? {
      label: type,
      color: "var(--text-faint)",
    }
  );
}

function formatTime(value) {
  return new Date(value).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function dayKey(date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function Agenda() {
  const [campus, setCampus] = useState("all");
  const [type, setType] = useState("all");
  const [selected, setSelected] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  useEffect(() => {
    let active = true;
    fetchEvents().then((list) => {
      if (!active) return;
      setEvents(list);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(
    () =>
      events.filter(
        (event) =>
          (campus === "all" || event.campus === campus) &&
          (type === "all" || event.type === type),
      ),
    [events, campus, type],
  );

  const nextEvent = useMemo(() => {
    const now = new Date();
    return filtered
      .filter((event) => new Date(event.date) >= now)
      .sort((a, b) => new Date(a.date) - new Date(b.date))[0];
  }, [filtered]);

  const byDay = useMemo(() => {
    const map = {};
    filtered.forEach((event) => {
      const key = dayKey(new Date(event.date));
      (map[key] ??= []).push(event);
    });
    return map;
  }, [filtered]);

  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const offset = (new Date(year, monthIndex, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const todayKey = dayKey(new Date());

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <PatternPage>
      <HeaderBar />
      <main className="mx-auto max-w-6xl px-4 pt-10 pb-16 sm:px-6 lg:px-8">
        <PageIntro title="Agenda" lede="Les prochains événements">
          <Select
            aria-label="Campus"
            value={campus}
            onChange={(e) => setCampus(e.target.value)}
          >
            <option value="all">Tous les campus</option>
            {CAMPUSES.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </Select>
          <Select
            aria-label="Type d'événement"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="all">Tous les types</option>
            {Object.entries(EVENT_TYPES).map(([id, eventType]) => (
              <option key={id} value={id}>
                {eventType.label}
              </option>
            ))}
          </Select>
        </PageIntro>

        <div className="mb-6 flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-sm)]">
          <span
            className="tile"
            style={nextEvent ? undefined : { "--tone": "var(--text-faint)" }}
            aria-hidden="true"
          >
            <Icon name="calendar" size={20} />
          </span>
          {loading ? (
            <p className="text-sm text-[var(--text-muted)]">
              Chargement des événements…
            </p>
          ) : nextEvent ? (
            <button
              type="button"
              onClick={() => setSelected(nextEvent)}
              className="group min-w-0 flex-1 text-left"
            >
              <span className="block text-xs font-semibold text-[var(--text-faint)]">
                Prochain événement
              </span>
              <span className="mt-0.5 block truncate text-[0.9375rem] font-bold text-[var(--text)] group-hover:underline group-hover:underline-offset-4">
                {nextEvent.title}
              </span>
              <span className="mt-0.5 block text-[0.8125rem] text-[var(--text-muted)] first-letter:uppercase">
                {nextEvent.campus} ·{" "}
                {new Date(nextEvent.date).toLocaleDateString("fr-FR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </button>
          ) : (
            <p className="text-sm text-[var(--text-muted)]">
              Aucun événement à venir pour ces filtres.
            </p>
          )}
        </div>

        <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-sm)]">
          <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3">
            <button
              type="button"
              onClick={() => setMonth(new Date(year, monthIndex - 1, 1))}
              className="btn btn-ghost btn-sm"
            >
              <Icon name="chevronLeft" size={15} />
              Mois précédent
            </button>
            <span className="text-base font-bold capitalize text-[var(--text)]">
              {month.toLocaleDateString("fr-FR", {
                month: "long",
                year: "numeric",
              })}
            </span>
            <button
              type="button"
              onClick={() => setMonth(new Date(year, monthIndex + 1, 1))}
              className="btn btn-ghost btn-sm"
            >
              Mois suivant
              <Icon name="chevronRight" size={15} />
            </button>
          </div>

          <div className="grid grid-cols-7 border-b border-[var(--border)] text-center text-[0.6875rem] font-bold tracking-[0.08em] text-[var(--text-faint)] uppercase">
            {WEEKDAYS.map((weekday) => (
              <span key={weekday} className="py-2">
                {weekday}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-px bg-[var(--border)]">
            {cells.map((day, index) => {
              const weekend = index % 7 >= 5;
              const cellBg = weekend
                ? "bg-[color-mix(in_oklab,var(--surface)_70%,var(--bg))]"
                : "bg-[var(--surface)]";

              if (day === null)
                return (
                  <div
                    key={`empty-${index}`}
                    className="bg-[color-mix(in_oklab,var(--surface)_40%,var(--bg))]"
                  />
                );

              const key = dayKey(new Date(year, monthIndex, day));
              const dayEvents = byDay[key] ?? [];
              const isToday = key === todayKey;

              return (
                <div
                  key={key}
                  className={`min-h-24 p-1.5 ${
                    isToday
                      ? "bg-[color-mix(in_oklab,var(--accent)_7%,var(--surface))]"
                      : cellBg
                  }`}
                >
                  <span
                    className={`inline-grid h-6 min-w-6 place-items-center rounded-full px-1.5 text-xs tabular-nums ${
                      isToday
                        ? "bg-[var(--accent)] font-bold text-[var(--accent-contrast)]"
                        : "font-medium text-[var(--text-faint)]"
                    }`}
                  >
                    {day}
                  </span>
                  <div className="mt-1 flex flex-col gap-1">
                    {dayEvents.map((event) => (
                      <button
                        key={event.id}
                        type="button"
                        onClick={() => setSelected(event)}
                        title={`${event.title} — ${event.campus} — ${formatTime(
                          event.date,
                        )}${event.end ? ` – ${formatTime(event.end)}` : ""}`}
                        style={{ "--tone": typeInfo(event.type).color }}
                        className="flex items-center gap-1.5 truncate rounded-md bg-[color-mix(in_oklab,var(--tone)_14%,transparent)] px-1.5 py-1 text-left text-[0.6875rem] font-semibold text-[color-mix(in_oklab,var(--tone)_var(--tone-mix),var(--text))] transition hover:bg-[color-mix(in_oklab,var(--tone)_24%,transparent)]"
                      >
                        <span className="h-1.5 w-1.5 flex-none rounded-full bg-[var(--tone)]" />
                        <span className="truncate">
                          {event.campus} · {event.title}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {selected && (
        <div className="overlay" onClick={() => setSelected(null)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label={selected.title}
            className="dialog max-w-md p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span
                  className="badge"
                  style={{ "--tone": typeInfo(selected.type).color }}
                >
                  {typeInfo(selected.type).label}
                </span>
                <h3 className="mt-3 text-lg font-bold text-[var(--text)]">
                  {selected.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-label="Fermer"
                className="btn btn-ghost btn-sm btn-icon"
              >
                <Icon name="x" size={16} />
              </button>
            </div>

            <div className="mt-4 space-y-2 text-[0.8125rem] text-[var(--text-muted)]">
              <p className="flex items-start gap-2.5">
                <Icon
                  name="mapPin"
                  size={16}
                  className="mt-px text-[var(--text-faint)]"
                />
                <span>
                  {selected.campus}
                  {selected.location ? ` — ${selected.location}` : ""}
                </span>
              </p>
              <p className="flex items-start gap-2.5">
                <Icon
                  name="clock"
                  size={16}
                  className="mt-px text-[var(--text-faint)]"
                />
                <span className="first-letter:uppercase">
                  {new Date(selected.date).toLocaleDateString("fr-FR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {selected.end ? ` – ${formatTime(selected.end)}` : ""}
                </span>
              </p>
            </div>

            {selected.description && (
              <p className="mt-4 text-sm leading-relaxed text-[var(--text-muted)]">
                {selected.description}
              </p>
            )}

            {selected.link ? (
              <a
                href={selected.link}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary mt-6 h-10 w-full"
              >
                S'inscrire
                <Icon name="external" size={15} />
              </a>
            ) : (
              <p className="mt-6 rounded-xl border border-dashed border-[var(--border-strong)] px-4 py-3 text-center text-xs text-[var(--text-faint)]">
                Lien d'inscription à venir.
              </p>
            )}
          </div>
        </div>
      )}
    </PatternPage>
  );
}
