import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { PyodideProvider } from "./usePyodide.jsx";
import "./index.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { LearningPage } from "./pages/LearningPage.jsx";
import { Glossary } from "./pages/Glossary.jsx";
import { Agenda } from "./pages/Agenda.jsx";
import { ThemeProvider } from "./theme/ThemeContext.jsx";
import { AuthProvider } from "./auth/AuthContext.jsx";
import { applyThemeStyles } from "./theme/themes.jsx";
import ThemeBackground from "./components/ThemeBackground.jsx";

applyThemeStyles();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <ThemeBackground>
          <BrowserRouter>
            <Routes>
              <Route
                path="/"
                element={
                  <PyodideProvider>
                    <App />
                  </PyodideProvider>
                }
              />
              <Route
                path="/learning"
                element={
                  <PyodideProvider>
                    <LearningPage />
                  </PyodideProvider>
                }
              />
              <Route
                path="/glossary"
                element={
                  <PyodideProvider>
                    <Glossary />
                  </PyodideProvider>
                }
              />
              <Route path="/agenda" element={<Agenda />} />
            </Routes>
          </BrowserRouter>
        </ThemeBackground>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
);
