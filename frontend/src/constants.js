// Shared color maps used by the Spec Viewer and Wireframe Preview.

export const SECTION_COLORS = {
  nav: "#374151",
  hero: "#2d6a4f",
  services: "#40916c",
  gallery: "#52b788",
  about: "#74c69d",
  testimonials: "#0ea5e9",
  contact: "#f59e0b",
  cta: "#ef4444",
  footer: "#1b4332",
  pricing: "#8b5cf6",
  faq: "#6366f1",
  blog: "#ec4899",
};

// Background colors for the tone badge.
export const TONE_COLORS = {
  minimal: "#64748b",
  warm: "#f97316",
  corporate: "#2563eb",
  playful: "#ec4899",
  elegant: "#7c3aed",
  bold: "#dc2626",
  trustworthy: "#0d9488",
};

export function sectionColor(type) {
  return SECTION_COLORS[type] || "#64748b";
}

export function toneColor(tone) {
  return TONE_COLORS[tone] || "#64748b";
}
