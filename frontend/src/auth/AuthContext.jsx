import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import * as api from "./api";

const TOKEN_KEY = "manta-auth-token";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // True while a stored token is being checked against the backend.
  const [loading, setLoading] = useState(() =>
    Boolean(localStorage.getItem(TOKEN_KEY)),
  );

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;

    const controller = new AbortController();
    api
      .fetchMe(token, controller.signal)
      .then(setUser)
      .catch((error) => {
        // Keep the token on network or server errors: it may still be valid.
        if (error.status === 401 || error.status === 404) {
          localStorage.removeItem(TOKEN_KEY);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, []);

  const openSession = useCallback(({ access_token, user }) => {
    localStorage.setItem(TOKEN_KEY, access_token);
    setUser(user);
  }, []);

  const login = useCallback(
    async (credentials) => openSession(await api.login(credentials)),
    [openSession],
  );

  const register = useCallback(
    async (details) => openSession(await api.register(details)),
    [openSession],
  );

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout }),
    [user, loading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
