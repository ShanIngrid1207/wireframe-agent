// SectionBlock.jsx — one section row inside the Spec Viewer's page list.

import { sectionColor } from "../constants.js";

export default function SectionBlock({ section }) {
  const { type, variant, notes } = section;
  return (
    <div className="flex items-start gap-3 py-2">
      <span
        className="px-2 py-1 rounded text-xs font-semibold text-white shrink-0"
        style={{ backgroundColor: sectionColor(type) }}
      >
        {type}
      </span>
      <div className="min-w-0">
        {variant && (
          <span className="text-sm text-slate-600">{variant}</span>
        )}
        {notes && (
          <p className="text-sm italic text-slate-400 mt-0.5">{notes}</p>
        )}
      </div>
    </div>
  );
}
