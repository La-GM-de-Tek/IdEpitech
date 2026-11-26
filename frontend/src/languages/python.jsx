import { useCallback, useRef, useState } from "react";
import Console from "../components/Console";
import LearningConsole from "../components/LearningConsole";
import { usePyodide } from "../usePyodide";
import { saveCompletion } from "../completion";
import { getStepProgress, stepName, validateSteps } from "../steps";

// Console feedback after a run of a subject split into parts.
function reportSteps(project, { passed, failed }, appendOutput) {
  let good = "";
  for (const step of passed) {
    good += step.bonus
      ? `✨ Bonus validé : ${step.title}. Vous décrochez la marque dorée !\n`
      : `✓ ${stepName(project, step)} validée : ${step.title}\n`;
  }
  if (passed.some((step) => !step.bonus) && getStepProgress(project).completed)
    good += "Sujet validé ! Tu peux passer à la suite.\n";
  if (!failed && passed.length === 0)
    good += "Toutes les étapes sont déjà validées.\n";
  if (failed?.bonus)
    good += `Bonus (${failed.title}) : pas encore, il est facultatif.\n`;
  if (good) appendOutput({ stream: "result", text: `\n${good}` });

  if (failed && !failed.bonus) {
    appendOutput({
      stream: "stderr",
      text: `${good ? "" : "\n"}${stepName(project, failed)} (${failed.title}) : pas encore (et c'est ok), réessaie.\n`,
    });
  }
}

export const SAMPLE_PYTHON = `# Welcome to Manta Editor

print("Hello Manta!\\nDiscover code with IDEpitech")
`;

export function usePythonLanguage({ onRequestPanel, project, onNext }) {
  const [lines, setLines] = useState([]);
  const [awaitingInput, setAwaitingInput] = useState(false);
  const stdoutRef = useRef("");

  const appendOutput = useCallback(({ stream, text }) => {
    if (stream === "stdout") stdoutRef.current += text;
    setLines((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.stream === stream) {
        const merged = [...prev];
        merged[merged.length - 1] = { stream, text: last.text + text };

        return merged;
      }

      return [...prev, { stream, text }];
    });
  }, []);
  const handleInputRequest = useCallback(() => setAwaitingInput(true), []);

  const { status, version, run, interrupt, sendInput } = usePyodide({
    onOutput: appendOutput,
    onInputRequest: handleInputRequest,
  });

  const execute = useCallback(
    async (code) => {
      if (status !== "ready" && status !== "running") return;
      if (status === "running") interrupt();

      onRequestPanel?.();

      stdoutRef.current = "";
      setLines((prev) => [
        ...prev,
        {
          stream: "system",
          text: `\n$ run · ${new Date().toLocaleTimeString("fr-FR", { hour12: false })}\n`,
        },
      ]);
      const source = [project.beforeCode, code, project.afterCode]
        .filter(Boolean)
        .map((part) => (part.endsWith("\n") ? part : part + "\n"))
        .join("");
      const res = await run(source);
      setAwaitingInput(false);
      if (!res?.ok) return;

      if (res.result != null) {
        appendOutput({ stream: "result", text: `=> ${res.result}\n` });
      }

      if (project.steps?.every((step) => step.check)) {
        const out = stdoutRef.current.trim();
        reportSteps(
          project,
          validateSteps(project, (step) => step.check(out)),
          appendOutput,
        );
      } else if (project.expected != null || project.goldenExpected != null) {
        const out = stdoutRef.current.trim();
        const gold =
          project.goldenExpected != null &&
          out === project.goldenExpected.trim();
        const ok =
          gold || (project.expected != null && out === project.expected.trim());
        appendOutput({
          stream: ok ? "result" : "stderr",
          text: gold
            ? "\n✨ Validé avec brio ! Vous décrochez la marque dorée.\n"
            : ok
              ? "\nValidé!\nTu peux passer à l'exercice suivant\n"
              : "\nPas encore (et c'est ok), réessaie.\n",
        });
        if (ok) {
          saveCompletion(project.id, gold);
        }
      }
    },
    [status, run, interrupt, appendOutput, onRequestPanel, project],
  );

  const submitInput = useCallback(
    (line) => {
      appendOutput({ stream: "input", text: line + "\n" });
      setAwaitingInput(false);
      sendInput(line);
    },
    [appendOutput, sendInput],
  );

  const renderPanel = useCallback(() => {
    if (project.component != null) {
      const Component = project.component;
      return (
        <Component
          lines={lines}
          status={status}
          onClear={() => setLines([])}
          project={project}
        />
      );
    }

    const consoleProps = {
      lines,
      awaitingInput,
      onSubmitInput: submitInput,
      onClear: () => setLines([]),
    };

    if (onNext !== undefined) {
      return (
        <LearningConsole project={project} onNext={onNext} {...consoleProps} />
      );
    }

    return <Console {...consoleProps} />;
  }, [project, lines, status, awaitingInput, submitInput, onNext]);

  return { status, version, execute, renderPanel };
}
