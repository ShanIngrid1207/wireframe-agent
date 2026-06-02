// DesignTokens.jsx — color swatches + font labels for a spec's design tokens.

export default function DesignTokens({ tokens }) {
  const t = tokens || {};

  return (
    <div className="flex flex-wrap items-center gap-6">
      <Swatch label="Primary" color={t.primary_color} />
      <Swatch label="Accent" color={t.accent_color} />
      <Swatch label="Background" color={t.background_color} />

      <FontLabel label="Heading font" value={t.font_heading} />
      <FontLabel label="Body font" value={t.font_body} />
    </div>
  );
}

function Swatch({ label, color }) {
  const has = color && typeof color === "string";
  return (
    <div className="flex items-center gap-2">
      {has ? (
        <span
          className="w-8 h-8 rounded-full border border-slate-200 shadow-sm"
          style={{ backgroundColor: color }}
          title={color}
        />
      ) : (
        <span className="w-8 h-8 rounded-full border border-dashed border-slate-300 bg-slate-50" />
      )}
      <div className="text-xs">
        <p className="font-medium text-slate-700">{label}</p>
        <p className="text-slate-400">{has ? color : "Not specified"}</p>
      </div>
    </div>
  );
}

function FontLabel({ label, value }) {
  const has = value && typeof value === "string";
  return (
    <div className="text-xs">
      <p className="font-medium text-slate-700">{label}</p>
      <p className={has ? "text-slate-600" : "text-slate-400"}>
        {has ? value : "Not specified"}
      </p>
    </div>
  );
}
