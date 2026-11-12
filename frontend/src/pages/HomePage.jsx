import { useEffect, useState } from "react";
import HeaderBar from "../components/HeaderBar";
import LearningCard from "../components/LearningCard";
import ProjectCard from "../components/ProjectCard";
import PatternPage from "../components/PatternPage";
import Progress from "../components/Progress";
import Select from "../components/Select";
import {
  LANGUAGES,
  DIFFICULTIES,
  COBRA_DIFFICULTIES,
  learningProjects,
} from "../projects";
import { completionMark, isCompleted } from "../completion";
import { useTheme } from "../theme/ThemeContext";

export default function HomePage({ projects, onOpen }) {
  const [language, setLanguage] = useState("all");
  const [difficulty, setDifficulty] = useState("all");
  const [completion, setCompletion] = useState("all");

  const matchesCompletion = (project) => {
    if (completion === "all") return true;
    if (!project.hasEnd) return false;
    const mark = completionMark(project.id);
    if (completion === "no") return mark === false;
    if (completion === "yes") return mark === true;
    if (completion === "gold") return mark === "gold";
    return true;
  };

  const { theme } = useTheme();

  const createSubjectProject = projects.find(
    (project) => project.custom === "create-subject",
  );

  const filteredProjects = projects.filter(
    (project) =>
      !project.custom &&
      (language === "all" || project.language === language) &&
      (difficulty === "all" || project.difficulty === difficulty) &&
      matchesCompletion(project),
  );

  const [allLearnings, setAllLearnings] = useState(false);

  const isProjetOk = (id) => isCompleted(id);

  const learningTotal = learningProjects.length;
  const learningDone = learningProjects.filter((p) => isProjetOk(p.id)).length;

  const countableProjects = projects.filter((p) => p.hasEnd);
  const projectsTotal = countableProjects.length;
  const projectsDone = countableProjects.filter((p) => isProjetOk(p.id)).length;

  useEffect(() => {
    let allOks = true;
    learningProjects.map((project) => {
      if (!isProjetOk(project.id)) {
        allOks = false;
      }
    });
    setAllLearnings(allOks);
  }, []);

  return (
    <PatternPage>
      <HeaderBar />
      <main className="mx-auto max-w-6xl px-4 pt-10 pb-16 sm:px-6 lg:px-8">
        <section>
          <div className="mb-5 flex items-center gap-5">
            <h2 className="section-title">Apprentissage</h2>
            <Progress
              done={learningDone}
              total={learningTotal}
              tone="var(--learn)"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <LearningCard
              name={"Glossaire"}
              description={"Apprenez les mots clés"}
              goTo={"/glossary"}
            />
            <LearningCard
              name={"Exercices d'Apprentissage"}
              description={"Apprenez les bases"}
              goTo={"/learning"}
              ok={allLearnings}
            />
            <LearningCard
              name={"Agenda"}
              description={"Les prochains événements..."}
              goTo={"/agenda"}
              icon={"📅"}
              badge={"Agenda"}
            />
            {createSubjectProject && (
              <LearningCard
                project={createSubjectProject}
                onOpen={onOpen}
                icon={"📝"}
                tag={"Sujet"}
              />
            )}
          </div>
        </section>
        <section className="mt-14">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
            <div className="flex items-center gap-5">
              <h2 className="section-title">Projets</h2>
              <Progress done={projectsDone} total={projectsTotal} />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select
                aria-label="Langage"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="all">Tous les langages</option>
                {Object.entries(LANGUAGES).map(([id, lang]) => (
                  <option key={id} value={id}>
                    {lang.label}
                  </option>
                ))}
              </Select>
              <Select
                aria-label="Difficulté"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
              >
                <option value="all">Toutes difficultés</option>
                {theme.type == "manta"
                  ? DIFFICULTIES.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))
                  : COBRA_DIFFICULTIES.map((level, index) => (
                      <option
                        key={DIFFICULTIES[index]}
                        value={DIFFICULTIES[index]}
                      >
                        {level}
                      </option>
                    ))}
              </Select>
              <Select
                aria-label="Complétion"
                value={completion}
                onChange={(e) => setCompletion(e.target.value)}
              >
                <option value="all">Toutes complétions</option>
                <option value="no">Non complété</option>
                <option value="yes">Complété</option>
                <option value="gold">Gold</option>
              </Select>
            </div>
          </div>
          {filteredProjects.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onOpen={onOpen}
                  ok={project.hasEnd && completionMark(project.id)}
                />
              ))}
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed border-[var(--border-strong)] px-6 py-12 text-center text-sm text-[var(--text-muted)]">
              Aucun projet ne correspond à ces filtres.
            </p>
          )}
        </section>
      </main>
    </PatternPage>
  );
}
