import { useEffect, useState } from "react";
import { api } from "../api.js";

// Responses.jsx — table of parsed responses with per-row spec generation.
export default function Responses({ responses, onViewSpec }) {
  // Map of response index -> spec filename (which rows already have specs).
  const [specByIndex, setSpecByIndex] = useState({});
  const [rowBusy, setRowBusy] = useState({}); // index -> true while generating
  const [rowError, setRowError] = useState({}); // index -> error message
  const [bulk, setBulk] = useState(null); // { done, total } during Generate All
  const [loadingSpecs, setLoadingSpecs] = useState(true);

  useEffect(() => {
    loadSpecs();
  }, []);

  async function loadSpecs() {
    setLoadingSpecs(true);
    try {
      const specs = await api.getSpecs();
      const map = {};
      for (const s of specs) {
        // filename looks like "0-quest-construction.json" -> index 0
        const m = /^(\d+)-/.exec(s.filename);
        if (m) map[Number(m[1])] = s.filename;
      }
      setSpecByIndex(map);
    } catch {
      // Non-fatal: just show everything as pending.
    } finally {
      setLoadingSpecs(false);
    }
  }

  async function generateOne(index) {
    setRowError((e) => ({ ...e, [index]: null }));
    setRowBusy((b) => ({ ...b, [index]: true }));
    try {
      const data = await api.generate(index);
      setSpecByIndex((m) => ({ ...m, [index]: data.filename }));
      return data.filename;
    } catch (err) {
      setRowError((e) => ({ ...e, [index]: err.message }));
      return null;
    } finally {
      setRowBusy((b) => ({ ...b, [index]: false }));
    }
  }

  async function generateAll() {
    const pending = responses
      .map((_, i) => i)
      .filter((i) => !specByIndex[i]);

    if (pending.length === 0) return;

    setBulk({ done: 0, total: pending.length });
    for (let n = 0; n < pending.length; n++) {
      await generateOne(pending[n]);
      setBulk({ done: n + 1, total: pending.length });
    }
    setBulk(null);
  }

  if (!responses || responses.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center mt-20 text-slate-500">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Responses</h2>
        <p>No responses loaded yet. Upload a CSV first.</p>
      </div>
    );
  }

  const pendingCount = responses.filter((_, i) => !specByIndex[i]).length;

  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-6 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Responses</h2>
          <p className="text-slate-500 mt-1">
            {responses.length} loaded · {pendingCount} pending
          </p>
        </div>
        <button
          onClick={generateAll}
          disabled={!!bulk || pendingCount === 0}
          className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {bulk
            ? `Generating ${bulk.done} of ${bulk.total}…`
            : "Generate All"}
        </button>
      </header>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-200">
              <th className="px-4 py-3 w-10">#</th>
              <th className="px-4 py-3">Business Name</th>
              <th className="px-4 py-3">Tagline</th>
              <th className="px-4 py-3">Design Style</th>
              <th className="px-4 py-3">Features</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {responses.map((r, i) => {
              const filename = specByIndex[i];
              const busy = rowBusy[i];
              const err = rowError[i];
              const features = r.core_features || [];
              return (
                <tr key={i} className="border-b border-slate-100 last:border-0 align-top">
                  <td className="px-4 py-3 text-slate-400">{i + 1}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {r.business_name || "Untitled"}
                  </td>
                  <td className="px-4 py-3 text-slate-500 max-w-[180px] truncate">
                    {r.tagline || "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {r.design_style || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {features.slice(0, 3).map((f, k) => (
                        <span
                          key={k}
                          className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-xs"
                        >
                          {f}
                        </span>
                      ))}
                      {features.length > 3 && (
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-400 text-xs">
                          +{features.length - 3} more
                        </span>
                      )}
                    </div>
                    {err && (
                      <p className="text-xs text-red-600 mt-1">{err}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {filename ? (
                      <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">
                        Spec Ready
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-500 text-xs font-medium">
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {filename ? (
                      <button
                        onClick={() => onViewSpec(filename)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700"
                      >
                        View Spec
                      </button>
                    ) : (
                      <button
                        onClick={() => generateOne(i)}
                        disabled={busy}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-60 inline-flex items-center gap-2"
                      >
                        {busy && <MiniSpinner />}
                        {busy ? "Generating…" : "Generate Spec"}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {loadingSpecs && (
        <p className="text-xs text-slate-400 mt-3">Checking existing specs…</p>
      )}
    </div>
  );
}

function MiniSpinner() {
  return (
    <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
