import { LANGUAGES } from "../projects";
import Icon from "./Icon";

export function LanguageTile({ lang, small = false }) {
  const isLetter = /^[A-Za-z]+$/.test(lang.icon);
  return (
    <span
      className={`tile ${small ? "tile--sm" : ""} ${isLetter ? "font-mono font-bold" : ""}`}
      style={{ "--tone": lang.color }}
      aria-hidden="true"
    >
      {lang.icon}
    </span>
  );
}

export default function ProjectCard({ project, onOpen, ok }) {
  const lang = LANGUAGES[project.language];
  const gold = ok === "gold";

  return (
    <button
      type="button"
      onClick={() => onOpen(project.id)}
      data-gold={gold || undefined}
      style={{ "--card-accent": lang.color }}
      className="card"
    >
      <div className="flex items-start justify-between gap-3">
        <LanguageTile lang={lang} />
        <div className="flex items-center gap-1.5">
          {!project.hasEnd ? (
            <span
              className="badge badge--quiet"
              title="Projet libre, sans validation"
            >
              Libre
            </span>
          ) : gold ? (
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
              style={{ "--tone": lang.color }}
              title="Terminé"
            >
              <Icon name="check" size={12} strokeWidth={3} />
            </span>
          ) : (
            <span className="badge badge--quiet" title="À faire">
              À faire
            </span>
          )}
          <span className="badge" style={{ "--tone": lang.color }}>
            {lang.label}
          </span>
        </div>
      </div>
      <div>
        <h2 className="card-title">
          {project.name}
        </h2>
        <p className="mt-1 text-[0.8125rem] leading-relaxed text-[var(--text-muted)]">
          {project.description}
        </p>
      </div>
      <span className="card-cta">
        Ouvrir
        <Icon name="arrowRight" size={14} />
      </span>
    </button>
  );
}
