import { useRef, useState } from "react";
import { api } from "../api.js";

// UploadCSV.jsx — drag/drop or browse to upload a Google Forms CSV.
export default function UploadCSV({ onLoaded, onGoResponses }) {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null); // { count, responses }
  const inputRef = useRef(null);

  async function handleFile(file) {
    setError(null);
    setResult(null);

    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Please choose a .csv file exported from Google Forms.");
      return;
    }

    setLoading(true);
    try {
      const data = await api.uploadCSV(file);
      setResult(data);
      onLoaded?.(data.responses);
    } catch (err) {
      setError(
        err.message ||
          "CSV format not recognized — make sure you exported directly from Google Forms."
      );
    } finally {
      setLoading(false);
    }
  }

  function onDrop(e) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    handleFile(file);
  }

  return (
    <div className="max-w-3xl mx-auto">
      <header className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Upload CSV</h2>
        <p className="text-slate-500 mt-1">
          Drop the CSV you exported from Google Forms to load client responses.
        </p>
      </header>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={
          "rounded-2xl border-2 border-dashed p-12 text-center cursor-pointer transition-colors " +
          (dragging
            ? "border-emerald-500 bg-emerald-50"
            : "border-slate-300 bg-white hover:border-emerald-400")
        }
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />

        {loading ? (
          <div className="flex flex-col items-center gap-3 text-slate-600">
            <Spinner />
            <p>Uploading and parsing…</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-slate-600">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <p className="font-medium text-slate-700">
              Drag &amp; drop your CSV here
            </p>
            <p className="text-sm text-slate-400">or click to browse</p>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="font-semibold text-emerald-800">
            {result.count} response{result.count === 1 ? "" : "s"} loaded
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {result.responses.map((r, i) => (
              <span
                key={i}
                className="px-3 py-1 rounded-full bg-white border border-emerald-300 text-sm text-emerald-800"
              >
                {r.business_name || "Untitled"}
              </span>
            ))}
          </div>
          <button
            onClick={onGoResponses}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700"
          >
            Go to Responses →
          </button>
        </div>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-6 w-6 text-emerald-600" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
