import { useTheme } from "../theme/ThemeContext";
import PatternPage from "./PatternPage";
import Icon from "./Icon";

export default function MobileBlock({ onBack }) {
  const { theme } = useTheme();

  return (
    <div className="h-full md:hidden">
      <PatternPage>
        <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
          <div className="grid h-24 w-24 place-items-center rounded-[1.75rem] bg-[color-mix(in_oklab,var(--accent)_14%,transparent)] text-5xl shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--accent)_25%,transparent)] animate-[float_3s_ease-in-out_infinite]">
            {theme.logo}
          </div>

          <div>
            <h1 className="page-title text-2xl">
              Oups, mauvais environnement !
            </h1>
            <p className="mx-auto mt-3 max-w-xs text-[0.9375rem] leading-relaxed text-[var(--text-muted)]">
              IDEpitech a besoin d&apos;un grand écran pour{" "}
              {theme.type == "manta" ? "nager" : "ramper"} à l&apos;aise.
              Reviens sur un ordinateur pour coder confortablement.
            </p>
          </div>

          <button onClick={onBack} className="btn btn-primary h-11 px-5 text-sm">
            <Icon name="arrowLeft" size={16} />
            Retour à l&apos;accueil
          </button>
        </div>
      </PatternPage>
    </div>
  );
}
