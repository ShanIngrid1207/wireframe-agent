import { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar.jsx";
import UploadCSV from "./views/UploadCSV.jsx";
import Responses from "./views/Responses.jsx";
import SpecViewer from "./views/SpecViewer.jsx";
import WireframePreview from "./views/WireframePreview.jsx";
import { api } from "./api.js";

// Top-level app: fixed sidebar + main content, with simple useState routing.
export default function App() {
  const [view, setView] = useState("upload");
  const [responses, setResponses] = useState([]);
  // When navigating to the Spec Viewer / Preview from elsewhere, preselect this.
  const [selectedSpec, setSelectedSpec] = useState(null);

  // On load: check whether responses already exist.
  useEffect(() => {
    api
      .getResponses()
      .then((data) => {
        setResponses(Array.isArray(data) ? data : []);
        // If data already exists, land the user on the Responses view.
        if (Array.isArray(data) && data.length > 0) setView("responses");
      })
      .catch(() => {
        // Backend may not be running yet — stay on Upload, no hard error.
      });
  }, []);

  function navigate(target, payload) {
    if (payload?.spec) setSelectedSpec(payload.spec);
    setView(target);
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar
        view={view}
        onNavigate={(v) => navigate(v)}
        hasData={responses.length > 0}
      />

      <main className="flex-1 min-w-0 p-8">
        {view === "upload" && (
          <UploadCSV
            onLoaded={(data) => setResponses(data)}
            onGoResponses={() => navigate("responses")}
          />
        )}

        {view === "responses" && (
          <Responses
            responses={responses}
            onViewSpec={(filename) =>
              navigate("spec", { spec: filename })
            }
          />
        )}

        {view === "spec" && (
          <SpecViewer
            preselect={selectedSpec}
            onPreview={(filename) => navigate("preview", { spec: filename })}
          />
        )}

        {view === "preview" && (
          <WireframePreview
            preselect={selectedSpec}
            onBack={() => navigate("spec", { spec: selectedSpec })}
          />
        )}
      </main>
    </div>
  );
}
