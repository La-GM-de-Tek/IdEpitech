import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Sandbox from "./Sandbox";
import MobileBlock from "../components/MobileBlock";
import HeaderBar from "../components/HeaderBar";
import LearningCard from "../components/LearningCard";
import CollapsibleSection from "../components/CollapsibleSection";
import PatternPage from "../components/PatternPage";
import { learningProjects, LANGUAGES } from "../projects";
import { completionMark, isCompleted } from "../completion";
import PageIntro from "../components/PageIntro";
import Progress from "../components/Progress";
import Select from "../components/Select";
import { LanguageTile } from "../components/ProjectCard";

const LEARNING_STORAGE_KEY = "manta-active-learning";

export function LearningPage() {
  const { id: activeId } = useParams();
  const navigate = useNavigate();
  const openEntry = (id) => navigate(`/learning/${id}`);
  const active =
    learningProjects.find((project) => project.id === activeId) ?? null;

  const nextExercise = (() => {
    if (!active) return null;
    const sameLang = learningProjects.filter(
      (project) => project.language === active.language,
    );
    const index = sameLang.findIndex((project) => project.id === active.id);
    return index >= 0 ? (sameLang[index + 1] ?? null) : null;
  })();
  const [completion, setCompletion] = useState("all");

  const matchesCompletion = (project) => {
    if (completion === "all") return true;
    if (!project.hasEnd) return false;
    const mark = completionMark(project.id);
    if (completion === "no") return mark === false;
    if (completion === "yes") return mark === true;
    return true;
  };

  const isProjetOk = (id) => isCompleted(id);

  const countOk = (lang) => {
    let count = 0;
    learningProjects.map((project) => {
      if (project.language === lang && isProjetOk(project.id)) {
        count++;
      }
    });
    return count;
  };

  return (
    <>
      <MobileBlock
        onBack={() => {
          navigate("/");
        }}
      />
      <div className="hidden h-full md:block">
        {active ? (
          <Sandbox
            key={active.id}
            project={active}
            onBack={() => navigate("/learning")}
            onNext={nextExercise ? () => openEntry(nextExercise.id) : null}
            PyodideProvider
          />
        ) : (
          <PatternPage>
            <HeaderBar />
            <main className="mx-auto max-w-6xl px-4 pt-10 pb-16 sm:px-6 lg:px-8">
              <PageIntro
                title="Exercices d'Apprentissage"
                lede="Apprenez les bases"
              >
                <Select
                  aria-label="Complétion"
                  value={completion}
                  onChange={(e) => setCompletion(e.target.value)}
                >
                  <option value="all">Toutes complétions</option>
                  <option value="no">Non complété</option>
                  <option value="yes">Complété</option>
                </Select>
              </PageIntro>
              {Object.entries(LANGUAGES).map(([id, lang]) => {
                const track = learningProjects.filter(
                  (project) => project.language === id,
                );
                const exercises = track.filter(matchesCompletion);

                if (exercises.length === 0) return null;

                return (
                  <CollapsibleSection
                    key={id}
                    title={lang.label}
                    leading={<LanguageTile lang={lang} small />}
                    meta={
                      <Progress
                        done={countOk(id)}
                        total={track.length}
                        tone="var(--learn)"
                      />
                    }
                  >
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {exercises.map((project) => (
                        <LearningCard
                          key={project.id}
                          project={project}
                          onOpen={openEntry}
                          ok={completionMark(project.id)}
                          index={track.indexOf(project)}
                        />
                      ))}
                    </div>
                  </CollapsibleSection>
                );
              })}
            </main>
          </PatternPage>
        )}
      </div>
    </>
  );
}
