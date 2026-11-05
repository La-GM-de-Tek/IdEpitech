import { useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "../theme/ThemeContext";
import SettingsButton from "./SettingsButton";
import AccountButton from "./AccountButton";
import EpitechLogoWhite from "../assets/epitech-eu_BIG.D.svg";
import EpitechLogoBlue from "../assets/epitech-eu_BIG.svg";

export default function HeaderBar() {
  let navigate = useNavigate();
  const { theme, mode } = useTheme();
  const isHome = useLocation().pathname === "/";
  const routeChange = () => {
    navigate("/");
  };

  return (
    <header className="flex items-start justify-between border-b border-[var(--border)] bg-[var(--surface)] px-6 py-4">
      <button
        onClick={routeChange}
        disabled={isHome}
        className={`group ${isHome ? "cursor-default" : "cursor-pointer"}`}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">
            <span className={isHome ? "" : "group-hover:hidden"}>
              {theme.logo}
            </span>
            {!isHome && (
              <span className="hidden group-hover:inline text-[var(--accent)]">
                ⇜
              </span>
            )}
          </span>
          <h1 className="text-sm font-semibold text-[var(--text)]">
            IDEpitech
          </h1>
        </div>
      </button>

      {isHome && (
        <a
          href="https://www.epitech.eu/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Epitech"
          className="shrink-0 transition hover:opacity-80"
        >
          <img
            src={mode === "dark" ? EpitechLogoWhite : EpitechLogoBlue}
            alt="Epitech"
            className="h-8 w-auto"
          />
        </a>
      )}

      <div className="flex items-center gap-2">
        <AccountButton />
        <SettingsButton />
      </div>
    </header>
  );
}
