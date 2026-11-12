import { createContext, useContext, useEffect, useState } from "react";
import ThemeDecorations from "./ThemeDecorations";

const HideDecorationsContext = createContext(null);

export function useHideDecorations(hidden) {
  const setHideCount = useContext(HideDecorationsContext);

  useEffect(() => {
    if (!hidden || !setHideCount) return;
    setHideCount((count) => count + 1);
    return () => setHideCount((count) => count - 1);
  }, [hidden, setHideCount]);
}

export default function ThemeBackground({ children }) {
  const [hideCount, setHideCount] = useState(0);

  return (
    <HideDecorationsContext.Provider value={setHideCount}>
      {hideCount === 0 && (
        <div className="pointer-events-none fixed inset-0 z-[-1]" aria-hidden="true">
          <ThemeDecorations />
        </div>
      )}
      {children}
    </HideDecorationsContext.Provider>
  );
}
