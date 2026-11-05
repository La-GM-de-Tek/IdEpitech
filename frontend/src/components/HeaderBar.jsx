import { useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "../theme/ThemeContext";
import SettingsButton from "./SettingsButton";
import Icon from "./Icon";
import EpitechLogoWhite from "../assets/epitech-eu_BIG.D.svg";
import EpitechLogoBlue from "../assets/epitech-eu_BIG.svg";

export default function HeaderBar() {
  let navigate = useNavigate();
  const { theme, mode } = useTheme();
  const isHome = useLocation().pathname === "/";
  const HeaderDecor = theme.HeaderDecor;
  const routeChange = () => {
    navigate("/");
  };

  return (
    <header className="site-header sticky top-0 z-30 grid grid-cols-[1fr_auto_1fr] items-center border-b border-[var(--border)] bg-[color-mix(in_oklab,var(--surface)_86%,transparent)] px-4 py-3 backdrop-blur-md sm:px-6">
      <button
        onClick={routeChange}
        disabled={isHome}
        title={isHome ? undefined : "Retour à l'accueil"}
        className={`group flex items-center gap-2.5 justify-self-start rounded-xl py-1 pr-3 pl-1 transition ${
          isHome ? "cursor-default" : "cursor-pointer hover:bg-[var(--surface-hover)]"
        }`}
      >
        <span className="relative grid h-8 w-8 place-items-center rounded-[0.65rem] bg-[color-mix(in_oklab,var(--accent)_14%,transparent)] text-lg leading-none">
          <span
            className={`transition duration-200 ${
              isHome ? "" : "group-hover:scale-50 group-hover:opacity-0"
            }`}
          >
            {theme.logo}
          </span>
          {!isHome && (
            <Icon
              name="arrowLeft"
              size={18}
              className="absolute text-[var(--accent)] opacity-0 transition duration-200 group-hover:opacity-100"
            />
          )}
        </span>
        <span className="brand-word">IDEpitech</span>
      </button>

      {isHome ? (
        <a
          href="https://www.epitech.eu/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Epitech"
          className="shrink-0 rounded-md opacity-90 transition hover:opacity-100"
        >
          <img
            src={mode === "dark" ? EpitechLogoWhite : EpitechLogoBlue}
            alt="Epitech"
            className="h-6 w-auto sm:h-7"
          />
        </a>
      ) : (
        <span />
      )}

      <div className="flex items-center gap-2 justify-self-end">
        <button
          type="button"
          onClick={() => navigate("/stats")}
          title="Statistiques"
          aria-label="Statistiques"
          className="btn btn-outline btn-icon"
        >
          <Icon name="chart" size={17} />
        </button>
        <button
          type="button"
          onClick={() => navigate("/achievements")}
          title="Succès"
          aria-label="Succès"
          className="btn btn-outline btn-icon"
        >
          <Icon name="trophy" size={17} />
        </button>
        <SettingsButton />
      </div>

      {HeaderDecor && <HeaderDecor mode={mode} />}
    </header>
  );
}
