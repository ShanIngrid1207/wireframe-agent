// parser.js — CSV Parser
// Maps the exact Google Form CSV column headers to clean internal field names.
//
// FUTURE UPGRADE NOTE:
// To connect a live Google Sheet instead of CSV, replace this file with a
// Sheets API integration that returns the same array-of-objects shape.
// No other files need to change.

import Papa from "papaparse";

// Exact Google Form CSV header  ->  internal field name
const HEADER_MAP = {
  "Timestamp": "timestamp",
  "Name of the Business": "business_name",
  "Slogan / Tagline": "tagline",
  "What does your business do?": "business_description",
  "Preferred Colors if any:": "preferred_colors",
  "Preferred Fonts if any:": "preferred_fonts",
  "Core Application Features": "core_features",
  "Responsibility for Text/Written Content": "content_owner",
  "Responsibility for Photos & Videos (Media Assets)": "media_owner",
  "What design style do you lean towards?": "design_style",
  "Are there any specific design styles, colors, or elements we should absolutely avoid?": "avoid",
  "Design & Competitor Reference (Link/Name of Website/Platform)": "reference",
  "Why do you like the layout, style, or flow of the reference?": "reference_why",
  "Please share a link to your logo and any brand assets (Google Drive, Dropbox, your website, etc.)": "brand_assets_url",
};

/**
 * Turn a business name into a URL-friendly slug.
 * "Quest Construction" -> "quest-construction"
 */
export function slugify(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // drop punctuation
    .replace(/\s+/g, "-")         // spaces -> hyphens
    .replace(/-+/g, "-")          // collapse multiple hyphens
    .replace(/^-|-$/g, "")        // trim leading/trailing hyphens
    || "untitled";
}

/**
 * Parse a CSV buffer exported from Google Forms into clean response objects.
 * @param {Buffer} buffer raw uploaded file contents
 * @returns {Array<Object>} cleaned responses
 */
export function parseCSV(buffer) {
  const text = buffer.toString("utf8");

  const result = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
  });

  if (result.errors && result.errors.length > 0) {
    // Surface the first parse error so the caller can report it clearly.
    const first = result.errors[0];
    throw new Error(`CSV parse error: ${first.message} (row ${first.row})`);
  }

  const rows = result.data || [];

  // Confirm at least one recognized header is present; otherwise the file
  // probably wasn't exported from the expected Google Form.
  const rawHeaders = result.meta?.fields || [];
  const recognized = rawHeaders.some((h) => HEADER_MAP[h?.trim()]);
  if (!recognized) {
    throw new Error(
      "No recognized Google Form columns found. Make sure you exported the CSV directly from Google Forms."
    );
  }

  return rows.map((row) => {
    const clean = {};

    // Map every known header to its internal field name, trimming values.
    for (const [rawHeader, field] of Object.entries(HEADER_MAP)) {
      const value = row[rawHeader];
      clean[field] = typeof value === "string" ? value.trim() : (value ?? "");
    }

    // core_features: split by comma into a trimmed array (drop empties).
    clean.core_features = String(clean.core_features || "")
      .split(",")
      .map((f) => f.trim())
      .filter(Boolean);

    // Generate a slug from the business name.
    clean.slug = slugify(clean.business_name);

    return clean;
  });
}
