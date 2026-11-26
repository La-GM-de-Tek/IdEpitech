import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import HeaderBar from "../components/HeaderBar";
import PageIntro from "../components/PageIntro";
import PatternPage from "../components/PatternPage";
import { ACHIEVEMENTS, loadAchievements } from "../datas/achievements";
import {
  AVATARS,
  BIO_MAX,
  PROFILE_LIMITS,
  PROFILE_STATS,
  PSEUDO_MAX,
  loadProfile,
  resolveShowcase,
  saveProfile,
} from "../datas/profile";
import { computeLocalStats, levelInfo, rankInfo } from "../datas/stats";
import { COBRA_DIFFICULTIES, DIFFICULTIES } from "../projects";
import { useTheme } from "../theme/ThemeContext";
import { StatTile } from "./Stats";

const inputClass =
  "w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-1.5 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent)]";

const MARKS = {
  gold: { label: "Doré", tone: "var(--gold)" },
  true: { label: "Terminé", tone: "var(--success)" },
};

function Pickable({ selected, full, onClick, children }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={full && !selected}
      onClick={onClick}
      className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition disabled:cursor-default disabled:opacity-40 ${
        selected
          ? "border-[var(--accent)] bg-[color-mix(in_oklab,var(--accent)_8%,var(--surface))]"
          : "border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)]"
      }`}
    >
      {children}
    </button>
  );
}

function Section({ title, count, limit, children }) {
  return (
    <section className="mt-14">
      <div className="mb-5 flex items-center gap-4">
        <h2 className="section-title">{title}</h2>
        {count !== undefined && (
          <span className="badge badge--quiet">
            {count}/{limit}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

function Empty({ children }) {
  return (
    <p className="rounded-2xl border border-dashed border-[var(--border-strong)] px-6 py-8 text-center text-sm text-[var(--text-muted)]">
      {children}
    </p>
  );
}

function AchievementItem({ achievement }) {
  return (
    <>
      <span className="tile" style={{ "--tone": "var(--gold)" }} aria-hidden="true">
        {achievement.icon}
      </span>
      <span className="min-w-0">
        <span className="card-title block">{achievement.name}</span>
        <span className="mt-1 block text-[0.8125rem] leading-relaxed text-[var(--text-muted)]">
          {achievement.description}
        </span>
      </span>
    </>
  );
}

function ProjectItem({ project, difficulties }) {
  const mark = MARKS[project.mark];
  return (
    <span className="flex min-w-0 flex-1 items-start justify-between gap-3">
      <span className="min-w-0">
        <span className="card-title block">{project.name}</span>
        <span className="mt-1 block text-xs text-[var(--text-faint)]">
          {difficulties[project.difficultyIndex]}
        </span>
      </span>
      <span className="badge" style={{ "--tone": mark.tone }}>
        {mark.label}
      </span>
    </span>
  );
}

function IdentityCard({ user, view, stats, editing, onChange }) {
  const { theme } = useTheme();
  const { level, current, needed } = levelInfo(stats.xp);
  const rank = rankInfo(level, theme.type);
  const favourite = stats.languages.reduce((best, language) =>
    language.runs > best.runs ? language : best,
  );
  const pseudo = view.pseudo || user.username;

  return (
    <section className="player-card">
      <span className="player-emblem" aria-hidden="true">
        {view.avatar ?? rank.icon}
      </span>
      <div className="min-w-0">
        {editing ? (
          <div className="flex flex-col gap-3">
            <label className="block text-xs font-medium text-[var(--text-muted)]">
              Pseudo
              <input
                className={`${inputClass} mt-1`}
                maxLength={PSEUDO_MAX}
                placeholder={user.username}
                value={view.pseudo ?? ""}
                onChange={(event) => onChange({ pseudo: event.target.value })}
              />
            </label>
            <label className="block text-xs font-medium text-[var(--text-muted)]">
              Bio ({(view.bio ?? "").length}/{BIO_MAX})
              <textarea
                rows={2}
                className={`${inputClass} mt-1 resize-none`}
                maxLength={BIO_MAX}
                placeholder="Quelques mots sur toi…"
                value={view.bio ?? ""}
                onChange={(event) => onChange({ bio: event.target.value })}
              />
            </label>
            <div>
              <p className="text-xs font-medium text-[var(--text-muted)]">Avatar</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {[null, ...AVATARS].map((avatar) => (
                  <button
                    key={avatar ?? "rank"}
                    type="button"
                    aria-pressed={(view.avatar ?? null) === avatar}
                    title={avatar ? undefined : "Icône du rang"}
                    onClick={() => onChange({ avatar })}
                    className={`grid h-9 w-9 place-items-center rounded-lg border text-lg transition ${
                      (view.avatar ?? null) === avatar
                        ? "border-[var(--accent)] bg-[color-mix(in_oklab,var(--accent)_12%,transparent)]"
                        : "border-[var(--border)] hover:bg-[var(--surface-hover)]"
                    }`}
                  >
                    {avatar ?? rank.icon}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            <p className="stat-label">
              Niveau {level} · {rank.name}
            </p>
            <h2 className="player-rank truncate">{pseudo}</h2>
            {pseudo !== user.username && (
              <p className="text-xs text-[var(--text-faint)]">@{user.username}</p>
            )}
            {view.bio && (
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
                {view.bio}
              </p>
            )}
          </>
        )}
        <div className="xp-bar" aria-hidden="true">
          <span style={{ width: `${(current / needed) * 100}%` }} />
        </div>
        <p className="mt-2 text-xs font-semibold tabular-nums text-[var(--text-muted)]">
          {current} / {needed} XP
        </p>
      </div>
      <dl className="player-totals">
        <div>
          <dt className="stat-label">XP totale</dt>
          <dd className="stat-value">{stats.xp.toLocaleString("fr-FR")}</dd>
        </div>
        <div>
          <dt className="stat-label">Langage favori</dt>
          <dd className="stat-value">
            {favourite.runs > 0
              ? `${favourite.lang.icon} ${favourite.lang.label}`
              : "—"}
          </dd>
        </div>
      </dl>
    </section>
  );
}

function ProfileView({ user }) {
  const { theme } = useTheme();
  const [stats] = useState(computeLocalStats);
  const [unlocked] = useState(loadAchievements);
  const [profile, setProfile] = useState(loadProfile);
  const [draft, setDraft] = useState(null);

  const editing = draft !== null;
  const view = draft ?? profile;
  const showcase = resolveShowcase(view, stats, unlocked);
  const difficulties =
    theme.type === "manta" ? DIFFICULTIES : COBRA_DIFFICULTIES;

  const unlockedAchievements = ACHIEVEMENTS.filter(({ id }) => unlocked[id]);
  const doneProjects = stats.guided.filter(({ mark }) => mark);
  const byId = (list) => (id) => list.find((item) => item.id === id);

  const startEditing = () => setDraft({ ...profile, ...showcase });
  const change = (fields) => setDraft((current) => ({ ...current, ...fields }));
  const toggle = (key, id) =>
    setDraft((current) => {
      const list = current[key];
      if (list.includes(id)) {
        return { ...current, [key]: list.filter((item) => item !== id) };
      }
      if (list.length >= PROFILE_LIMITS[key]) return current;
      return { ...current, [key]: [...list, id] };
    });
  const save = () => {
    const next = {
      ...draft,
      pseudo: draft.pseudo?.trim() || null,
      bio: draft.bio?.trim() || null,
    };
    saveProfile(next);
    setProfile(next);
    setDraft(null);
  };

  return (
    <main className="mx-auto max-w-6xl px-4 pt-10 pb-16 sm:px-6 lg:px-8">
      <PageIntro
        title="Ma fiche"
        lede={
          editing
            ? "Choisis ce qui s'affiche sur ton profil"
            : "Ton profil de codeur"
        }
      >
        {editing ? (
          <>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setDraft(null)}
            >
              Annuler
            </button>
            <button type="button" className="btn btn-primary" onClick={save}>
              Enregistrer
            </button>
          </>
        ) : (
          <button type="button" className="btn btn-outline" onClick={startEditing}>
            Modifier
          </button>
        )}
      </PageIntro>

      <IdentityCard
        user={user}
        view={view}
        stats={stats}
        editing={editing}
        onChange={change}
      />

      <Section
        title="Succès en vitrine"
        count={editing ? showcase.achievements.length : undefined}
        limit={PROFILE_LIMITS.achievements}
      >
        {editing ? (
          unlockedAchievements.length ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {unlockedAchievements.map((achievement) => (
                <Pickable
                  key={achievement.id}
                  selected={showcase.achievements.includes(achievement.id)}
                  full={showcase.achievements.length >= PROFILE_LIMITS.achievements}
                  onClick={() => toggle("achievements", achievement.id)}
                >
                  <AchievementItem achievement={achievement} />
                </Pickable>
              ))}
            </div>
          ) : (
            <Empty>Débloque un succès pour pouvoir l'exposer.</Empty>
          )
        ) : showcase.achievements.length ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {showcase.achievements.map(byId(ACHIEVEMENTS)).map((achievement) => (
              <div
                key={achievement.id}
                className="flex items-center gap-4 rounded-2xl border border-[color-mix(in_oklab,var(--gold)_40%,var(--border))] bg-[var(--surface)] p-4 shadow-[var(--shadow-sm)]"
              >
                <AchievementItem achievement={achievement} />
              </div>
            ))}
          </div>
        ) : (
          <Empty>Aucun succès en vitrine.</Empty>
        )}
      </Section>

      <Section
        title="Meilleures stats"
        count={editing ? showcase.stats.length : undefined}
        limit={PROFILE_LIMITS.stats}
      >
        {editing ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {PROFILE_STATS.map((stat) => (
              <Pickable
                key={stat.id}
                selected={showcase.stats.includes(stat.id)}
                full={showcase.stats.length >= PROFILE_LIMITS.stats}
                onClick={() => toggle("stats", stat.id)}
              >
                <span className="tile tile--sm" aria-hidden="true">
                  {stat.icon}
                </span>
                <span className="min-w-0">
                  <span className="stat-label block">{stat.label}</span>
                  <span className="card-title block">{stat.value(stats)}</span>
                </span>
              </Pickable>
            ))}
          </div>
        ) : showcase.stats.length ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {showcase.stats.map(byId(PROFILE_STATS)).map((stat) => (
              <StatTile
                key={stat.id}
                icon={stat.icon}
                label={stat.label}
                value={stat.value(stats)}
              />
            ))}
          </div>
        ) : (
          <Empty>Aucune stat affichée.</Empty>
        )}
      </Section>

      <Section
        title="Projets favoris"
        count={editing ? showcase.projects.length : undefined}
        limit={PROFILE_LIMITS.projects}
      >
        {editing ? (
          doneProjects.length ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {doneProjects.map((project) => (
                <Pickable
                  key={project.id}
                  selected={showcase.projects.includes(project.id)}
                  full={showcase.projects.length >= PROFILE_LIMITS.projects}
                  onClick={() => toggle("projects", project.id)}
                >
                  <ProjectItem project={project} difficulties={difficulties} />
                </Pickable>
              ))}
            </div>
          ) : (
            <Empty>Termine un projet guidé pour pouvoir l'épingler.</Empty>
          )
        ) : showcase.projects.length ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {showcase.projects.map(byId(stats.guided)).map((project) => (
              <div
                key={project.id}
                className="stat-panel flex"
                data-gold={project.mark === "gold" || undefined}
              >
                <ProjectItem project={project} difficulties={difficulties} />
              </div>
            ))}
          </div>
        ) : (
          <Empty>Aucun projet épinglé.</Empty>
        )}
      </Section>
    </main>
  );
}

export function Profile() {
  const { user, loading } = useAuth();

  return (
    <PatternPage>
      <HeaderBar />
      {!loading &&
        (user ? (
          <ProfileView user={user} />
        ) : (
          <main className="mx-auto max-w-6xl px-4 pt-10 pb-16 sm:px-6 lg:px-8">
            <PageIntro title="Ma fiche" lede="Ton profil de codeur" />
            <Empty>
              🔒 Connecte-toi avec le bouton « Connexion » en haut à droite pour
              voir ta fiche.
            </Empty>
          </main>
        ))}
    </PatternPage>
  );
}
