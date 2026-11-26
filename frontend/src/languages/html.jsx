import { useCallback, useRef, useState } from "react";
import HtmlView from "../components/HtmlView";
import { validateSteps } from "../steps";

export const SAMPLE_HTML = `<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <title>Welcome to Manta Editor</title>
  </head>
  <body>
    <h1>Hello Manta!</h1>
    <p>Discover code with IDEpitech</p>
  </body>
</html>
`;

export function useHtmlLanguage({ onRequestPanel, project }) {
  const [preview, setPreview] = useState("");
  const [report, setReport] = useState(null);
  const lastRun = useRef(0);

  const execute = useCallback(
    async (code) => {
      onRequestPanel?.();
      const page = project.beforeCode + code + project.afterCode;
      setPreview(page);
      if (!project.checkHtml) return;

      const run = ++lastRun.current;
      setReport({ running: true });
      const criteria = await project.checkHtml(page);
      if (run !== lastRun.current) return;
      const outcome = validateSteps(
        project,
        (step) => criteria[step.id]?.every(({ ok }) => ok) ?? false,
      );
      setReport({ criteria, ...outcome });
    },
    [onRequestPanel, project],
  );

  const clear = useCallback(() => {
    lastRun.current += 1;
    setPreview("");
    setReport(null);
  }, []);

  const renderPanel = useCallback(
    () => (
      <HtmlView
        html={preview}
        onClear={clear}
        project={project}
        report={report}
      />
    ),
    [preview, clear, project, report],
  );

  return { status: "ready", version: "5", execute, renderPanel };
}
