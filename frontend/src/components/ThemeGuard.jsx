import { useEffect } from "react";
import { fetchMyThemes } from "../auth/api";
import { useAuth } from "../auth/AuthContext";
import { lockedTargets, unlockedRewards } from "../datas/rewards";
import { useTheme } from "../theme/ThemeContext";
import { DEFAULT_THEME } from "../theme/themes";

export default function ThemeGuard() {
  const { token, loading } = useAuth();
  const { themeId, setThemeId } = useTheme();

  useEffect(() => {
    if (loading) return;
    if (!lockedTargets("theme", unlockedRewards()).has(themeId)) return;
    if (!token) {
      setThemeId(DEFAULT_THEME);
      return;
    }

    const controller = new AbortController();
    fetchMyThemes(token, controller.signal)
      .then((rows) => {
        if (!rows.some(({ theme }) => theme.name === themeId)) {
          setThemeId(DEFAULT_THEME);
        }
      })
      .catch(() => {});
    return () => controller.abort();
  }, [themeId, token, loading, setThemeId]);

  return null;
}
