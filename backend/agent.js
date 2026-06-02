// agent.js — Claude Agent
// Converts a single client survey response into a structured wireframe spec,
// then enriches it with three Claude-powered design skills (palette, fonts,
// reference analysis) that run in parallel.
//
// ============================================================================
//  SYSTEM_PROMPT — THIS IS THE MAIN TUNING LEVER.
//  Edit the text below to change how the AI designs wireframes.
//  Keep the JSON schema intact so the frontend can render the result.
// ============================================================================

import { getClient, MODEL, textOf, parseJSON } from "./lib/claude.js";
import { generatePalette } from "./skills/colorPalette.js";
import { generateFontPairing } from "./skills/fontPairing.js";
import { analyzeReference } from "./skills/referenceAnalyzer.js";

const ALLOWED_TONES = [
  "minimal",
  "warm",
  "corporate",
  "playful",
  "elegant",
  "bold",
  "trustworthy",
];

export const SYSTEM_PROMPT = `You are a UI/UX design assistant that converts client survey responses into structured wireframe specifications for websites.

Output ONLY raw valid JSON. No markdown fences, no preamble, no explanation. Just the JSON object.

Follow this exact schema:
{
  "client": {
    "business_name": "",
    "tagline": "",
    "business_description": "",
    "design_style": "",
    "avoid": "",
    "colors": [],
    "fonts": [],
    "content_owner": "",
    "media_owner": "",
    "brand_assets_url": ""
  },
  "tone": "",
  "pages": [
    {
      "name": "",
      "sections": [
        {
          "type": "",
          "variant": "",
          "placeholder_copy": true,
          "placeholder_media": true,
          "notes": ""
        }
      ]
    }
  ],
  "design_tokens": {
    "primary_color": "",
    "accent_color": "",
    "background_color": "",
    "font_heading": "",
    "font_body": ""
  },
  "reference_insights": "",
  "constraints": "",
  "designer_summary": ""
}

Rules:
- tone must be one of: minimal, warm, corporate, playful, elegant, bold, trustworthy
- section type must be one of: nav, hero, services, gallery, about, testimonials, contact, cta, footer, pricing, faq, blog
- variant examples: centered, left-aligned, grid-3col, grid-2col, carousel, fullwidth, split
- Target audience is non-technical — prefer simple layouts, large readable text, obvious CTAs
- Primary goal is always to inform visitors and drive them to make contact — always include a strong CTA section and a contact section
- Infer tone from design_style and business_description together
- Infer pages and sections from the core_features array and business type
- If reference and reference_why are provided, extract specific layout patterns to borrow
- If colors or fonts are not specified, set them to null
- brand_assets_url: pass through as-is from the form, do not modify
- Never invent information not present in the form
- designer_summary: 2-3 sentences summarizing the client vibe, priorities, and any watch-outs for the designer
- notes per section: short, specific, written for a designer (e.g. "Use large hero image, client has strong photo assets")`;

// Small, fast prompt used to determine tone BEFORE the skills run, so the
// palette and font skills can be matched to the right tone.
const SYSTEM_PROMPT_TONE = `You determine the tone of a business website from its description and design style.

Respond with EXACTLY ONE word, no punctuation, chosen from this list:
minimal, warm, corporate, playful, elegant, bold, trustworthy

Pick the single best fit. Output only the word.`;

/**
 * Fast pre-pass: determine the site tone from description + design style.
 * Returns one of ALLOWED_TONES; falls back to "trustworthy" on any problem.
 */
async function determineTone(response) {
  try {
    const client = getClient();
    const userMessage = `Business description: ${
      response.business_description || "(none)"
    }\nDesign style: ${response.design_style || "(none)"}\n\nWhat is the tone?`;

    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 10,
      system: SYSTEM_PROMPT_TONE,
      messages: [{ role: "user", content: userMessage }],
    });

    const word = textOf(message).trim().toLowerCase().replace(/[^a-z]/g, "");
    return ALLOWED_TONES.includes(word) ? word : "trustworthy";
  } catch {
    return "trustworthy";
  }
}

/**
 * Generate the base wireframe spec (pages, sections, brief) — the main call.
 */
async function generateBaseSpec(response) {
  const client = getClient();
  const userMessage = `Here are the client's form responses:\n${JSON.stringify(
    response,
    null,
    2
  )}\n\nGenerate the wireframe spec.`;

  let raw;
  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });
    raw = textOf(message);
  } catch (err) {
    throw new Error(`Claude API request failed: ${err.message}`);
  }

  try {
    return parseJSON(raw);
  } catch (err) {
    throw new Error(
      `Could not parse spec JSON from the AI response. ${err.message}`
    );
  }
}

/**
 * Generate a full wireframe spec enriched by the three design skills.
 * @param {Object} response one cleaned form response
 * @returns {Promise<Object>} parsed + enriched wireframe spec JSON
 */
export async function generateSpec(response) {
  // 1. Fast pre-pass to lock in the tone the skills should target.
  const tone = await determineTone(response);

  // 2. Run the three skills AND the base spec in parallel. Each skill handles
  //    its own errors internally and returns sensible defaults, so one failing
  //    skill never blocks the others or the base spec.
  const [palette, fonts, reference, spec] = await Promise.all([
    generatePalette(response.preferred_colors, tone),
    generateFontPairing(tone, response.design_style),
    analyzeReference(response.reference, response.reference_why),
    generateBaseSpec(response),
  ]);

  // 3. Make sure the base spec carries our determined tone.
  if (!spec.tone) spec.tone = tone;

  // 4. Merge the skill outputs into the spec's design tokens + insights.
  spec.design_tokens = {
    ...(spec.design_tokens || {}),
    primary_color: palette.primary ?? spec.design_tokens?.primary_color ?? null,
    accent_color: palette.accent ?? spec.design_tokens?.accent_color ?? null,
    background_color:
      palette.background ?? spec.design_tokens?.background_color ?? null,
    surface_color: palette.surface ?? null,
    text_color: palette.text ?? null,
    font_heading:
      fonts.heading_font ?? spec.design_tokens?.font_heading ?? null,
    font_body: fonts.body_font ?? spec.design_tokens?.font_body ?? null,
    google_fonts_url: fonts.google_fonts_url ?? null,
  };

  spec.reference_insights =
    reference.what_to_borrow ?? spec.reference_insights ?? "";
  spec.reference_details = reference;
  spec.palette_rationale = palette.rationale ?? null;
  spec.font_rationale = fonts.rationale ?? null;

  // 5. Attach the full skill outputs for the Design Intelligence UI.
  spec.skills_summary = {
    palette,
    fonts,
    reference,
  };

  // 6. Per-skill success/failure status, surfaced via /api/skills-status.
  spec.skills_status = {
    palette: skillStatus(palette),
    fonts: skillStatus(fonts),
    reference: skillStatus(reference),
  };

  return spec;
}

// Normalize a skill output into a simple status descriptor.
function skillStatus(out) {
  if (out?._skipped) return { ok: true, skipped: true, error: null };
  return { ok: !out?._failed, skipped: false, error: out?._error ?? null };
}
