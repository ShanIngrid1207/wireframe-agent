// Sidebar.jsx — fixed left navigation.

const NAV = [
  { key: "upload", label: "Upload CSV", icon: UploadIcon },
  { key: "responses", label: "Responses", icon: TableIcon },
  { key: "spec", label: "Spec Viewer", icon: DocIcon },
  { key: "preview", label: "Wireframe Preview", icon: FrameIcon },
];

export default function Sidebar({ view, onNavigate, hasData }) {
  return (
    <aside className="w-60 shrink-0 bg-slate-900 text-slate-200 flex flex-col h-screen sticky top-0">
      <div className="px-5 py-6 border-b border-slate-700/60">
        <h1 className="text-lg font-bold text-white leading-tight">
          Wireframe Agent
        </h1>
        <p className="text-xs text-slate-400 mt-1">CSV → AI → Wireframe</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map((item) => {
          const active = view === item.key;
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className={
                "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors " +
                (active
                  ? "bg-emerald-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white")
              }
            >
              <Icon />
              <span>{item.label}</span>
              {item.key === "responses" && hasData && (
                <span className="ml-auto w-2 h-2 rounded-full bg-emerald-400" />
              )}
            </button>
          );
        })}
      </nav>

      <div className="px-5 py-4 border-t border-slate-700/60">
        <p className="text-[11px] text-slate-500">v1.0 — CSV Mode</p>
      </div>
    </aside>
  );
}

// --- tiny inline icons (no icon library needed) ---------------------------

function UploadIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function TableIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="3" y1="15" x2="21" y2="15" />
      <line x1="9" y1="3" x2="9" y2="21" />
    </svg>
  );
}

function DocIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="16" y2="17" />
    </svg>
  );
}

function FrameIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <line x1="2" y1="7" x2="22" y2="7" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}
