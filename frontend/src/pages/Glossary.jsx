import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import HeaderBar from "../components/HeaderBar";
import LearningCard from "../components/LearningCard";
import CollapsibleSection from "../components/CollapsibleSection";
import PatternPage from "../components/PatternPage";
import PageIntro from "../components/PageIntro";
import Icon from "../components/Icon";
import { glossary } from "../glossary";

const markdownComponents = {
  table: ({ children }) => (
    <div className="table-wrap thin-scroll">
      <table>{children}</table>
    </div>
  ),
};

const SECTIONS = [
  { language: "python", label: "Glossaire Python" },
  { language: "html", label: "Glossaire HTML" },
  { language: "css", label: "Glossaire CSS" },
  { language: "js", label: "Glossaire JavaScript" },
  { language: "c", label: "Glossaire C" },
];

function Markdown({ source }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeHighlight]}
      components={markdownComponents}
    >
      {source}
    </ReactMarkdown>
  );
}

function navLabel(entry) {
  return (
    entry.language[0].toUpperCase() +
    entry.language.slice(1) +
    " : " +
    entry.name
  );
}

function MarkedownNavigation({ onPrev, prev, onNext, next }) {
  return (
    <nav className="mt-14 grid grid-cols-2 gap-3 border-t border-[var(--border)] pt-8">
      <button
        type="button"
        onClick={onPrev}
        disabled={prev == null}
        className="group flex flex-col items-start gap-1 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-left transition enabled:hover:border-[color-mix(in_oklab,var(--accent)_50%,var(--border))] enabled:hover:bg-[var(--surface-hover)] disabled:opacity-60"
      >
        <span className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-faint)]">
          {prev && (
            <Icon
              name="arrowLeft"
              size={14}
              className="transition-transform group-hover:-translate-x-0.5"
            />
          )}
          {prev ? "Précédent" : "Bonne Lecture !"}
        </span>
        {prev && (
          <span className="text-sm font-semibold text-[var(--text)]">
            {navLabel(prev)}
          </span>
        )}
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={next == null}
        className="group flex flex-col items-end gap-1 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-right transition enabled:hover:border-[color-mix(in_oklab,var(--accent)_50%,var(--border))] enabled:hover:bg-[var(--surface-hover)] disabled:opacity-60"
      >
        <span className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-faint)]">
          {next ? "Suivant" : "Bravo..."}
          {next && (
            <Icon
              name="arrowRight"
              size={14}
              className="transition-transform group-hover:translate-x-0.5"
            />
          )}
        </span>
        {next && (
          <span className="text-sm font-semibold text-[var(--text)]">
            {navLabel(next)}
          </span>
        )}
      </button>
    </nav>
  );
}

function MarkdownViewer({ entry, onBack, onPrev, prev, onNext, next }) {
  return (
    <PatternPage animated={false}>
      <header className="sticky top-0 z-30 flex items-center gap-4 border-b border-[var(--border)] bg-[color-mix(in_oklab,var(--surface)_86%,transparent)] px-4 py-3 backdrop-blur-md sm:px-6">
        <button
          type="button"
          onClick={onBack}
          className="btn btn-outline flex-none"
        >
          <Icon name="arrowLeft" size={15} />
          Retour
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-bold text-[var(--text)]">
            {entry.name}
          </h1>
          <p className="truncate text-xs text-[var(--text-faint)]">
            {entry.description}
          </p>
        </div>
        <div className="flex flex-none gap-1.5">
          <button
            type="button"
            onClick={onPrev}
            disabled={prev == null}
            title={prev ? navLabel(prev) : "Bonne Lecture !"}
            aria-label="Précédent"
            className="btn btn-outline btn-icon"
          >
            <Icon name="chevronLeft" size={16} />
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={next == null}
            title={next ? navLabel(next) : "Bravo..."}
            aria-label="Suivant"
            className="btn btn-outline btn-icon"
          >
            <Icon name="chevronRight" size={16} />
          </button>
        </div>
      </header>
      <main>
        <article className="mx-auto max-w-[44rem] px-6 pt-12 pb-20">
          <div className="md">
            <Markdown source={entry.code} />
          </div>
          <MarkedownNavigation
            onPrev={onPrev}
            prev={prev}
            onNext={onNext}
            next={next}
          />
        </article>
      </main>
    </PatternPage>
  );
}

export function Glossary({ embedded = false }) {
  const { id: routeId } = useParams();
  const navigate = useNavigate();
  const [localId, setLocalId] = useState(null);
  const activeId = embedded ? localId : routeId;
  const openEntry = (id) =>
    embedded ? setLocalId(id) : navigate(`/glossary/${id}`);
  const closeEntry = () =>
    embedded ? setLocalId(null) : navigate("/glossary");
  const active = glossary.find((entry) => entry.id === activeId) ?? null;
  const index = glossary.findIndex((entry) => entry.id === activeId);
  const prev = index > 0 ? glossary[index - 1] : null;
  const next = index < glossary.length ? glossary[index + 1] : null;

  return (
    <div className="h-full block">
      {active ? (
        <MarkdownViewer
          key={active.id}
          entry={active}
          onBack={closeEntry}
          onPrev={() => openEntry(prev.id)}
          prev={prev}
          onNext={() => openEntry(next.id)}
          next={next}
        />
      ) : (
        <PatternPage>
          <HeaderBar showAchievements={!embedded} />
          <main className="mx-auto max-w-6xl px-4 pt-10 pb-16 sm:px-6 lg:px-8">
            <PageIntro title="Glossaire" lede="Apprenez les mots clés" />
            {SECTIONS.map(({ language, label }) => {
              const entries = glossary.filter(
                (entry) => entry.language === language,
              );

              if (entries.length === 0) return null;

              return (
                <CollapsibleSection key={language} title={label}>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {entries.map((entry, index) => (
                      <LearningCard
                        key={entry.id}
                        project={entry}
                        onOpen={openEntry}
                        index={index}
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
  );
}
