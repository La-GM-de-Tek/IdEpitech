import HomePage from "./pages/HomePage";
import Sandbox from "./pages/Sandbox";
import MobileBlock from "./components/MobileBlock";
import { projects } from "./projects";
import Subject from "./components/Subject";
import Toolbar from "./components/Toolbar";
import CreateSubject from "./projects/createSubject/CreateSubject";
import { completionMark } from "./completion";
import { useNavigate, useParams } from "react-router-dom";

const STORAGE_KEY = "manta-active-project";

export default function App() {
  const { id: activeId } = useParams();
  const navigate = useNavigate();
  const openEntry = (id) => navigate(`/${id}`);
  const active = projects.find((project) => project.id === activeId) ?? null;

  return (
    <div className="h-full block">
      {active ? (
        active.custom === "create-subject" ? (
          <>
            <MobileBlock onBack={() => navigate("/")} />
            <div className="hidden h-full md:block">
              <CreateSubject onBack={() => navigate("/")} />
            </div>
          </>
        ) : active.subject ? (
          <>
            <div className="md:hidden h-full block">
              <Toolbar
                onBack={() => navigate("/")}
                projectName={active.name}
                ok={active.hasEnd && completionMark(active.id)}
              />
              <Subject subject={active.subject} />
            </div>
            <div className="hidden h-full md:block">
              <Sandbox project={active} onBack={() => navigate("/")} />
            </div>
          </>
        ) : (
          <>
            <MobileBlock onBack={() => navigate("/")} />
            <div className="hidden h-full md:block">
              <Sandbox project={active} onBack={() => navigate("/")} />
            </div>
          </>
        )
      ) : (
        <HomePage projects={projects} onOpen={openEntry} />
      )}
    </div>
  );
}
