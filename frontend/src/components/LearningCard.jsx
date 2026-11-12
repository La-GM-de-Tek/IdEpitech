import { useNavigate } from "react-router-dom";
import Icon from "./Icon";

export default function LearningCard({
  name,
  description,
  goTo,
  project,
  onOpen,
  ok,
  index,
  icon = "📚",
  badge = "Learning",
}) {
  let navigate = useNavigate();
  const handleClick = () => {
    if (project && onOpen) {
      onOpen(project.id);
    } else {
      navigate(goTo);
    }
  };

  const title = project?.name ?? name;
  const desc = project?.description ?? description;
  const gold = ok === "gold";
  const inList = index != null;

  return (
    <button
      type="button"
      data-gold={gold || undefined}
      style={{ "--card-accent": "var(--learn)" }}
      className="card"
      onClick={handleClick}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={`tile ${inList ? "font-mono text-base font-bold tabular-nums" : ""}`}
          style={{ "--tone": "var(--learn)" }}
          aria-hidden="true"
        >
          {inList ? String(index + 1).padStart(2, "0") : icon}
        </span>
        <div className="flex items-center gap-1.5">
          {gold ? (
            <span
              className="check-dot"
              style={{ "--tone": "var(--gold)" }}
              title="Terminé — bonus doré"
            >
              <Icon name="check" size={12} strokeWidth={3} />
            </span>
          ) : ok ? (
            <span
              className="check-dot"
              style={{ "--tone": "var(--learn)" }}
              title="Terminé"
            >
              <Icon name="check" size={12} strokeWidth={3} />
            </span>
          ) : (
            project &&
            onOpen &&
            project.hasEnd && (
              <span className="badge badge--quiet" title="À faire">
                À faire
              </span>
            )
          )}
          {!inList && (
            <span className="badge" style={{ "--tone": "var(--learn)" }}>
              {badge}
            </span>
          )}
        </div>
      </div>
      <div>
        <h2 className="card-title">
          {title}
        </h2>
        <p className="mt-1 text-[0.8125rem] leading-relaxed text-[var(--text-muted)]">
          {desc}
        </p>
      </div>
      <span className="card-cta">
        Ouvrir
        <Icon name="arrowRight" size={14} />
      </span>
    </button>
  );
}
