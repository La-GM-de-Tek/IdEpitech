import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { PyodideProvider } from "./usePyodide.jsx";
import "./index.css";
import "./theme/themes.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { LearningPage } from "./pages/LearningPage.jsx";
import { Glossary } from "./pages/Glossary.jsx";
import { Agenda } from "./pages/Agenda.jsx";
import { Achievements } from "./pages/Achievements.jsx";
import { Stats } from "./pages/Stats.jsx";
import { Profile } from "./pages/Profile.jsx";
import { ThemeProvider } from "./theme/ThemeContext.jsx";
import { AuthProvider } from "./auth/AuthContext.jsx";
import { applyThemeStyles } from "./theme/themes.jsx";
import ThemeBackground from "./components/ThemeBackground.jsx";
import ThemeGuard from "./components/ThemeGuard.jsx";

applyThemeStyles();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <ThemeGuard />
        <ThemeBackground>
          <BrowserRouter>
            <Routes>
              <Route
                path="/:id?"
                element={
                  <PyodideProvider>
                    <App />
                  </PyodideProvider>
                }
              />
              <Route
                path="/learning/:id?"
                element={
                  <PyodideProvider>
                    <LearningPage />
                  </PyodideProvider>
                }
              />
              <Route path="/glossary/:id?" element={<Glossary />} />
              <Route path="/agenda" element={<Agenda />} />
              <Route path="/achievements" element={<Achievements />} />
              <Route path="/stats" element={<Stats />} />
              <Route path="/profile" element={<Profile />} />
            </Routes>
          </BrowserRouter>
        </ThemeBackground>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
);
