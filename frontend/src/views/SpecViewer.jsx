import { useEffect, useState } from "react";
import { api } from "../api.js";
import DesignTokens from "../components/DesignTokens.jsx";
import DesignIntelligence from "../components/DesignIntelligence.jsx";
import SectionBlock from "../components/SectionBlock.jsx";
import { toneColor } from "../constants.js";

// SpecViewer.jsx — pick a generated spec and view the designer brief.
export default function SpecViewer({ preselect, onPreview }) {
  const [specs, setSpecs] = useState([]); // [{ filename, business_name }]
  const [selected, setSelected] = useState(preselect || "");
  const [spec, setSpec] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load the list of specs once.
  useEffect(() => {
    api
      .getSpecs()
      .then((list) => {
        setSpecs(list);
        if (!selected && list.length > 0) setSelected(list[0].filename);
      })
      .catch((err) => setError(err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load the selected spec whenever it changes.
  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    setError(null);
    api
      .getSpec(selected)
      .then((data) => setSpec(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [selected]);

  function downloadJSON() {
    if (!spec) return;
    const blob = new Blob([JSON.stringify(spec, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = selected || "spec.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (specs.length === 0 && !error) {
    return (
      <div className="max-w-2xl mx-auto text-center mt-20 text-slate-500">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Spec Viewer</h2>
        <p>No specs generated yet. Generate one from the Responses tab.</p>
      </div>
    );
  }

  const client = spec?.client || {};

  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-6 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Spec Viewer</h2>
          <p className="text-slate-500 mt-1">Designer brief and wireframe plan.</p>
        </div>
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm"
        >
          {specs.map((s) => (
            <option key={s.filename} value={s.filename}>
              {s.business_name}
            </option>
          ))}
        </select>
      </header>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 mb-4">
          {error}
        </div>
      )}

      {loading && <p className="text-slate-400">Loading spec…</p>}

      {spec && !loading && (
        <div className="space-y-6">
          {/* 1. Designer Brief */}
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between gap-3 mb-3">
              <h3 className="font-semibold text-slate-800">
                {client.business_name || "Designer Brief"}
              </h3>
              {spec.tone && (
                <span
                  className="px-3 py-1 rounded-full text-xs font-semibold text-white capitalize"
                  style={{ backgroundColor: toneColor(spec.tone) }}
                >
                  {spec.tone}
                </span>
              )}
            </div>
            {client.tagline && (
              <p className="text-slate-500 italic mb-3">“{client.tagline}”</p>
            )}
            <p className="text-slate-700 leading-relaxed">
              {spec.designer_summary || "No summary provided."}
            </p>
            {spec.constraints && (
              <p className="mt-3 text-sm text-slate-500">
                <span className="font-medium text-slate-600">Constraints: </span>
                {spec.constraints}
              </p>
            )}
          </section>

          {/* 2. Design Tokens */}
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="font-semibold text-slate-800 mb-4">Design Tokens</h3>
            <DesignTokens tokens={spec.design_tokens} />
          </section>

          {/* Design Intelligence — the three Claude-powered design skills */}
          {spec.skills_summary && (
            <DesignIntelligence skills={spec.skills_summary} />
          )}

          {/* 3. Brand Assets */}
          {client.brand_assets_url && (
            <section className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="font-semibold text-slate-800 mb-2">Brand Assets</h3>
              <a
                href={client.brand_assets_url}
                target="_blank"
                rel="noreferrer"
                className="text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Client Brand Assets →
              </a>
            </section>
          )}

          {/* 4. Reference Insights */}
          {spec.reference_insights && (
            <section className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="font-semibold text-slate-800 mb-2">
                Reference Insights
              </h3>
              <p className="italic text-slate-600">{spec.reference_insights}</p>
            </section>
          )}

          {/* 5. Pages + Sections */}
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="font-semibold text-slate-800 mb-3">Pages &amp; Sections</h3>
            <div className="space-y-5">
              {(spec.pages || []).map((page, pi) => (
                <div key={pi}>
                  <h4 className="text-sm font-bold uppercase tracking-wide text-slate-500 mb-1">
                    {page.name}
                  </h4>
                  <div className="divide-y divide-slate-100">
                    {(page.sections || []).map((section, si) => (
                      <SectionBlock key={si} section={section} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 6. Action buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => onPreview(selected)}
              className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700"
            >
              Preview Wireframe →
            </button>
            <button
              onClick={downloadJSON}
              className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50"
            >
              Download Spec JSON
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
