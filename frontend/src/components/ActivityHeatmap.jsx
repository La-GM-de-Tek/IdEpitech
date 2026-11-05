import { useEffect, useRef } from "react";
import { dayKey } from "../activity";

const WEEKS = 52;
const LEVEL_THRESHOLDS = [1, 3, 6, 11];

function buildWeeks() {
  const today = new Date();
  const cursor = new Date(today);
  const weekday = (today.getDay() + 6) % 7;
  cursor.setDate(today.getDate() - weekday - (WEEKS - 1) * 7);

  const weeks = [];
  while (cursor <= today) {
    if (weeks.length === 0 || weeks.at(-1).length === 7) weeks.push([]);
    weeks.at(-1).push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return weeks;
}

function runLevel(count) {
  return LEVEL_THRESHOLDS.filter((threshold) => count >= threshold).length;
}

function dayTitle(date, count) {
  const label = date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
  });
  return `${label} : ${count} exécution${count > 1 ? "s" : ""}`;
}

export default function ActivityHeatmap({ days }) {
  const weeks = buildWeeks();
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
  }, []);

  return (
    <div ref={scrollRef} className="thin-scroll overflow-x-auto pb-1">
      <div className="heat-grid heat-months" aria-hidden="true">
        {weeks.map(([monday], index) =>
          monday.getDate() <= 7 ? (
            <span key={monday.getTime()} style={{ gridColumn: index + 1 }}>
              {monday.toLocaleDateString("fr-FR", { month: "short" })}
            </span>
          ) : null,
        )}
      </div>
      <div className="heat-grid heat-days">
        {weeks.flat().map((date) => {
          const count = days[dayKey(date)] ?? 0;
          return (
            <span
              key={date.getTime()}
              className="heat-cell"
              data-level={runLevel(count)}
              title={dayTitle(date, count)}
            />
          );
        })}
      </div>
      <div className="sticky left-0 mt-3 flex items-center gap-1 text-[0.6875rem] text-[var(--text-faint)]">
        Moins
        {[0, 1, 2, 3, 4].map((level) => (
          <span key={level} className="heat-cell" data-level={level} />
        ))}
        Plus
      </div>
    </div>
  );
}
