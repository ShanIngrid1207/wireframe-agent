// skills/referenceAnalyzer.js — Skill 3: Reference Analyzer
// Fetches the client's reference site and extracts actionable layout patterns.

import fetch from "node-fetch";
import { getClient, MODEL, textOf, parseJSON } from "../lib/claude.js";

// ============================================================================
//  SYSTEM_PROMPT_REFERENCE — tuning lever for the reference analyzer skill.
// ============================================================================
export const SYSTEM_PROMPT_REFERENCE = `You are a senior UI/UX designer who analyzes websites and extracts layout patterns.

You will be given a website's content and the client's reason for liking it. Extract specific, actionable layout insights for a designer building a wireframe.

Output ONLY raw JSON, no markdown, no preamble:
{
  "nav_pattern": "",
  "hero_pattern": "",
  "content_pattern": "",
  "cta_pattern": "",
  "trust_elements": [],
  "layout_principles": [],
  "what_to_borrow": "",
  "what_to_avoid": ""
}

Rules:
- nav_pattern: describe the navigation structure (e.g. "sticky top nav, logo left, 5 links right, phone number as CTA button")
- hero_pattern: describe the hero section layout (e.g. "full-bleed image with centered headline overlay, single CTA button")
- content_pattern: describe how content sections are organized (e.g. "alternating image-text rows, 3-column service grid below fold")
- cta_pattern: how calls to action are placed (e.g. "persistent phone number top right, floating contact button bottom right")
- trust_elements: list of trust signals used (e.g. ["star ratings", "years in business badge", "client logos", "certifications"])
- layout_principles: 3-5 key design decisions worth borrowing (short phrases)
- what_to_borrow: one sentence on the strongest layout pattern to replicate
- what_to_avoid: one sentence on anything that doesn't fit the current client
- Base analysis on what the client said they like in reference_why — prioritize those specific aspects
- If the URL can't be fetched, analyze based on the reference name and reference_why text alone`;

// Default returned when the skill fails — keeps the pipeline unbroken.
function defaultReference(error, extra = {}) {
  return {
    nav_pattern: null,
    hero_pattern: null,
    content_pattern: null,
    cta_pattern: null,
    trust_elements: [],
    layout_principles: [],
    what_to_borrow: null,
    what_to_avoid: null,
    _failed: true,
    _error: error,
    ...extra,
  };
}

// Very light HTML → text: drop script/style, strip tags, collapse whitespace.
function htmlToText(html) {
  return String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Does this string look like a fetchable URL?
function looksLikeUrl(value) {
  return /^https?:\/\//i.test(String(value || "").trim());
}

// Fetch a URL's text content (first 3000 chars) with a short timeout.
async function fetchPageText(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (WireframeAgent reference analyzer)" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    return htmlToText(html).slice(0, 3000);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Analyze a reference site for layout patterns.
 * @param {string} reference_url a URL or a reference name from the form
 * @param {string} reference_why why the client likes the reference
 * @returns {Promise<Object>} reference insights object (never throws)
 */
export async function analyzeReference(reference_url, reference_why) {
  const ref = (reference_url || "").trim();
  const why = (reference_why || "").trim();

  // Nothing to analyze — skip cleanly rather than burning a call.
  if (!ref && !why) {
    return defaultReference(null, { _failed: false, _skipped: true });
  }

  // 1. Attempt to fetch the page content if it looks like a URL.
  let pageText = "";
  let fetchOk = false;
  if (looksLikeUrl(ref)) {
    try {
      pageText = await fetchPageText(ref);
      fetchOk = pageText.length > 0;
    } catch {
      fetchOk = false; // fall back to name + reason only
    }
  }

  // 2. Build the user message from whatever we have.
  const userMessage = fetchOk
    ? `Reference URL: ${ref}\nReference page content (first 3000 chars):\n"""\n${pageText}\n"""\n\nClient's reason for liking it (reference_why): ${
        why || "(not provided)"
      }\n\nExtract the layout insights.`
    : `Reference (name or URL, page could not be fetched): ${
        ref || "(none provided)"
      }\nClient's reason for liking it (reference_why): ${
        why || "(not provided)"
      }\n\nUse web search if helpful to understand this reference, then extract the layout insights.`;

  // 3. Call Claude with the web_search tool enabled.
  try {
    const client = getClient();
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 1200,
      system: SYSTEM_PROMPT_REFERENCE,
      tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 3 }],
      messages: [{ role: "user", content: userMessage }],
    });

    const parsed = parseJSON(textOf(message));
    return { ...parsed, _failed: false, _fetched: fetchOk };
  } catch (err) {
    return defaultReference(err.message, { _fetched: fetchOk });
  }
}
