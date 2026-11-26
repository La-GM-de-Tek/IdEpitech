import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ActivityHeatmap from "../components/ActivityHeatmap";
import HeaderBar from "../components/HeaderBar";
import Icon from "../components/Icon";
import PageIntro from "../components/PageIntro";
import PatternPage from "../components/PatternPage";
import Progress from "../components/Progress";
import { LanguageTile } from "../components/ProjectCard";
import SkillRadar from "../components/SkillRadar";
import {
  computeLocalStats,
  fetchStats,
  levelInfo,
  rankInfo,
} from "../datas/stats";
import { COBRA_DIFFICULTIES, DIFFICULTIES } from "../projects";
import { useTheme } from "../theme/ThemeContext";

const formatNumber = (value) => value.toLocaleString("fr-FR");

export function formatDuration(seconds) {
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const rest = String(minutes % 60).padStart(2, "0");
  return `${Math.floor(minutes / 60)} h ${rest}`;
}

const plural = (count, word) => `${count} ${word}${count > 1 ? "s" : ""}`;

function BackBadge({ remote }) {
  if (remote === undefined) {
    return <span className="badge badge--quiet">Synchronisation…</span>;
  }
  if (remote === null) {
    return (
      <span
        className="badge badge--quiet"
        title="Serveur injoignable : les stats viennent de ce navigateur."
      >
        Stats locales
      </span>
    );
  }
  return (
    <span className="badge" style={{ "--tone": "var(--success)" }}>
      Synchronisé
    </span>
  );
}

function PlayerCard({ stats }) {
  const { theme } = useTheme();
  const { level, current, needed } = levelInfo(stats.xp);
  const rank = rankInfo(level, theme.type);
  const doneCount = stats.exercises.done + stats.projects.done;
  const totalCount = stats.exercises.total + stats.projects.total;
  const completion = Math.round((doneCount / totalCount) * 100);

  return (
    <section className="player-card">
      <span className="player-emblem" aria-hidden="true">
        {rank.icon}
      </span>
      <div className="min-w-0">
        <p className="stat-label">Niveau {level}</p>
        <h2 className="player-rank">{rank.name}</h2>
        <div className="xp-bar" aria-hidden="true">
          <span style={{ width: `${(current / needed) * 100}%` }} />
        </div>
        <p className="mt-2 flex flex-wrap justify-between gap-x-4 text-xs font-semibold tabular-nums text-[var(--text-muted)]">
          <span>
            {formatNumber(current)} / {formatNumber(needed)} XP
          </span>
          <span>
            {rank.next
              ? `${rank.next.icon} ${rank.next.name} au niveau ${rank.next.level}`
              : "Rang maximum atteint"}
          </span>
        </p>
      </div>
      <dl className="player-totals">
        <div>
          <dt className="stat-label">XP totale</dt>
          <dd className="stat-value">{formatNumber(stats.xp)}</dd>
        </div>
        <div>
          <dt className="stat-label">Complétion</dt>
          <dd className="stat-value">{completion} %</dd>
        </div>
      </dl>
    </section>
  );
}

export function StatTile({ icon, label, value, detail }) {
  return (
    <div className="stat-panel flex items-start gap-3">
      <span className="tile tile--sm" aria-hidden="true">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="stat-label">{label}</p>
        <p className="stat-value">{value}</p>
        {detail && (
          <p className="mt-0.5 truncate text-xs text-[var(--text-faint)]" title={detail}>
            {detail}
          </p>
        )}
      </div>
    </div>
  );
}

function SectionTitle({ title }) {
  return <h2 className="section-title mt-14 mb-5">{title}</h2>;
}

function Quests({ quests }) {
  const navigate = useNavigate();

  if (quests.length === 0) {
    return (
      <p className="text-sm text-[var(--text-muted)]">
        Plus aucun objectif : tout est terminé. 👑
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {quests.map((quest) => (
        <button
          key={quest.tag}
          type="button"
          className="card flex-row items-center gap-3 p-3"
          onClick={() => navigate(quest.to)}
        >
          <span className="tile tile--sm" aria-hidden="true">
            {quest.icon}
          </span>
          <span className="min-w-0 flex-1">
            <span className="stat-label block">{quest.tag}</span>
            <span className="card-title block truncate">{quest.name}</span>
          </span>
          <span className="badge" style={{ "--tone": "var(--gold)" }}>
            +{quest.xp} XP
          </span>
          <Icon name="arrowRight" size={15} className="text-[var(--text-faint)]" />
        </button>
      ))}
    </div>
  );
}

function SkillList({ skills }) {
  return (
    <ul className="flex flex-col gap-2.5">
      {skills.map(({ id, label, done, total }) => (
        <li key={id} className="flex items-center justify-between gap-3">
          <span className="text-[0.8125rem] font-semibold text-[var(--text-muted)]">
            {label}
          </span>
          <Progress done={done} total={total} />
        </li>
      ))}
    </ul>
  );
}

function LanguageCard({ lang, done, total, runs, lines, seconds }) {
  return (
    <div className="stat-panel">
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-3">
          <LanguageTile lang={lang} small />
          <span className="card-title">{lang.label}</span>
        </span>
        {total > 0 && <Progress done={done} total={total} tone="var(--learn)" />}
      </div>
      <dl className="mt-4 grid grid-cols-3 gap-2">
        <div>
          <dt className="stat-label">Exécutions</dt>
          <dd className="card-title tabular-nums">{formatNumber(runs)}</dd>
        </div>
        <div>
          <dt className="stat-label">Lignes</dt>
          <dd className="card-title tabular-nums">{formatNumber(lines)}</dd>
        </div>
        <div>
          <dt className="stat-label">Temps</dt>
          <dd className="card-title tabular-nums">{formatDuration(seconds)}</dd>
        </div>
      </dl>
    </div>
  );
}

function GuidedProjectCard({ project }) {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const difficulties =
    theme.type === "manta" ? DIFFICULTIES : COBRA_DIFFICULTIES;
  const status = {
    gold: { label: "Doré", tone: "var(--gold)" },
    true: { label: "Terminé", tone: "var(--success)" },
    false: { label: "À faire", tone: "var(--text-faint)" },
  }[project.mark];

  return (
    <button
      type="button"
      className="card"
      data-gold={project.mark === "gold" || undefined}
      onClick={() => navigate(`/${project.id}`)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="card-title">{project.name}</h3>
          <p className="mt-1 text-xs text-[var(--text-faint)]">
            {difficulties[project.difficultyIndex]}
          </p>
        </div>
        <span className="badge" style={{ "--tone": status.tone }}>
          {status.label}
        </span>
      </div>
      <div className="flex justify-between gap-3 text-xs font-semibold tabular-nums text-[var(--text-muted)]">
        <span>
          {project.hintsUsed}/{project.hintsTotal} indices
        </span>
        <span>{formatNumber(project.xp)} XP</span>
      </div>
    </button>
  );
}

function Leaderboard({ community }) {
  if (!community) {
    return (
      <p className="rounded-2xl border border-dashed border-[var(--border-strong)] px-6 py-10 text-center text-sm text-[var(--text-muted)]">
        🔒 Le classement arrive avec le serveur.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
      <StatTile
        icon="🥇"
        label="Rang"
        value={`#${formatNumber(community.rank)}`}
        detail={`sur ${formatNumber(community.players)} joueurs`}
      />
      <StatTile
        icon="📈"
        label="Percentile"
        value={`Top ${community.percentile} %`}
      />
    </div>
  );
}

export function Stats() {
  const [local] = useState(computeLocalStats);
  const [remote, setRemote] = useState(undefined);

  useEffect(() => {
    let active = true;
    fetchStats().then((response) => {
      if (active) setRemote(response);
    });
    return () => {
      active = false;
    };
  }, []);

  const stats = { ...local, ...remote };
  const { activity, projects, hints } = stats;
  const favourite = stats.languages.reduce((best, language) =>
    language.runs > best.runs ? language : best,
  );

  return (
    <PatternPage>
      <HeaderBar />
      <main className="mx-auto max-w-6xl px-4 pt-10 pb-16 sm:px-6 lg:px-8">
        <PageIntro title="Statistiques" lede="Votre progression en un coup d'œil">
          <BackBadge remote={remote} />
        </PageIntro>

        <PlayerCard stats={stats} />

        <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatTile
            icon="📚"
            label="Exercices"
            value={`${stats.exercises.done}/${stats.exercises.total}`}
          />
          <StatTile
            icon="🚀"
            label="Projets"
            value={`${projects.done}/${projects.total}`}
          />
          <StatTile
            icon="🏅"
            label="Bonus dorés"
            value={`${projects.gold}/${projects.total}`}
          />
          <StatTile
            icon="🏆"
            label="Succès"
            value={`${stats.achievements.done}/${stats.achievements.total}`}
            detail={
              stats.achievements.last &&
              `Dernier : ${stats.achievements.last}`
            }
          />
        </div>

        <div className="mt-14 grid grid-cols-1 gap-4 lg:grid-cols-5">
          <section className="stat-panel lg:col-span-3">
            <h2 className="section-title mb-4">Compétences</h2>
            <div className="grid grid-cols-1 items-center gap-6 sm:grid-cols-[3fr_2fr]">
              <SkillRadar skills={stats.skills} />
              <SkillList skills={stats.skills} />
            </div>
          </section>
          <section className="stat-panel lg:col-span-2">
            <h2 className="section-title mb-4">Prochains objectifs</h2>
            <Quests quests={stats.quests} />
          </section>
        </div>

        <SectionTitle title="Activité" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatTile
            icon="🔥"
            label="Série en cours"
            value={plural(activity.streak, "jour")}
          />
          <StatTile
            icon="⚡"
            label="Meilleure série"
            value={plural(activity.bestStreak, "jour")}
          />
          <StatTile
            icon="📅"
            label="Jours actifs"
            value={formatNumber(activity.activeDays)}
          />
          <StatTile
            icon="💥"
            label="Record en un jour"
            value={plural(activity.bestDay, "run")}
          />
        </div>
        <div className="stat-panel mt-4">
          <ActivityHeatmap days={activity.days} />
        </div>

        <SectionTitle title="Code" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatTile
            icon="▶️"
            label="Exécutions"
            value={formatNumber(activity.runs)}
          />
          <StatTile
            icon="⌨️"
            label="Lignes écrites"
            value={formatNumber(activity.lines)}
          />
          <StatTile
            icon="⏱️"
            label="Temps de code"
            value={formatDuration(activity.seconds)}
          />
          <StatTile
            icon="🎯"
            label="Précision"
            value={
              activity.accuracy === null
                ? "—"
                : `${Math.round(activity.accuracy * 100)} %`
            }
            detail="Validations par exécution"
          />
          <StatTile
            icon="🥷"
            label="Du premier coup"
            value={formatNumber(activity.firstTry)}
          />
          <StatTile
            icon="🧠"
            label="Projets sans indice"
            value={formatNumber(projects.noHint)}
          />
          <StatTile
            icon="💡"
            label="Indices utilisés"
            value={`${hints.used}/${hints.total}`}
          />
          <StatTile
            icon={favourite.lang.icon}
            label="Langage favori"
            value={favourite.runs > 0 ? favourite.lang.label : "—"}
          />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {stats.languages.map((language) => (
            <LanguageCard key={language.id} {...language} />
          ))}
        </div>

        <SectionTitle title="Projets guidés" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stats.guided.map((project) => (
            <GuidedProjectCard key={project.id} project={project} />
          ))}
        </div>

        <SectionTitle title="Classement" />
        <Leaderboard community={stats.community} />
      </main>
    </PatternPage>
  );
}
