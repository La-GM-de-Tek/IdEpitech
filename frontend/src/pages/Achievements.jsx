import { useState } from "react";
import HeaderBar from "../components/HeaderBar";
import PatternPage from "../components/PatternPage";
import PageIntro from "../components/PageIntro";
import Progress from "../components/Progress";
import Icon from "../components/Icon";
import {
  ACHIEVEMENTS,
  ACHIEVEMENT_CATEGORIES,
  checkAchievements,
} from "../datas/achievements";

function AchievementCard({ achievement, date }) {
  return (
    <div
      className={`flex items-center gap-4 rounded-2xl border bg-[var(--surface)] p-4 shadow-[var(--shadow-sm)] ${
        date
          ? "border-[color-mix(in_oklab,var(--gold)_40%,var(--border))]"
          : "border-[var(--border)] opacity-60"
      }`}
    >
      <span
        className={`tile ${date ? "" : "grayscale"}`}
        style={{ "--tone": date ? "var(--gold)" : "var(--text-faint)" }}
        aria-hidden="true"
      >
        {achievement.icon}
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="card-title">{achievement.name}</h3>
        <p className="mt-1 text-[0.8125rem] leading-relaxed text-[var(--text-muted)]">
          {achievement.description}
        </p>
        {date && (
          <p className="mt-1 text-xs text-[var(--text-faint)]">
            Débloqué le{" "}
            {new Date(date).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        )}
      </div>
      {date ? (
        <span
          className="check-dot"
          style={{ "--tone": "var(--gold)" }}
          title="Débloqué"
        >
          <Icon name="check" size={12} strokeWidth={3} />
        </span>
      ) : (
        <span className="badge badge--quiet">Verrouillé</span>
      )}
    </div>
  );
}

export function Achievements() {
  const [unlocked] = useState(checkAchievements);
  const countUnlocked = (list) =>
    list.filter((achievement) => unlocked[achievement.id]).length;

  return (
    <PatternPage>
      <HeaderBar />
      <main className="mx-auto max-w-6xl px-4 pt-10 pb-16 sm:px-6 lg:px-8">
        <PageIntro title="Succès" lede="Débloquez des succès en progressant">
          <Progress
            done={countUnlocked(ACHIEVEMENTS)}
            total={ACHIEVEMENTS.length}
            tone="var(--gold)"
          />
        </PageIntro>

        {ACHIEVEMENT_CATEGORIES.map((category, index) => {
          const list = ACHIEVEMENTS.filter(
            (achievement) => achievement.category === category.id,
          );
          return (
            <section
              key={category.id}
              className={index > 0 ? "mt-14" : undefined}
            >
              <div className="mb-5 flex items-center gap-5">
                <h2 className="section-title">{category.label}</h2>
                <Progress
                  done={countUnlocked(list)}
                  total={list.length}
                  tone="var(--gold)"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((achievement) => (
                  <AchievementCard
                    key={achievement.id}
                    achievement={achievement}
                    date={unlocked[achievement.id]}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </main>
    </PatternPage>
  );
}
