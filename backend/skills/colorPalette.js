// skills/colorPalette.js — Skill 1: Color Palette Generator
// Turns a client's color preference text + tone into a full 5-color palette.

import { getClient, MODEL, textOf, parseJSON } from "../lib/claude.js";

// ============================================================================
//  SYSTEM_PROMPT_COLOR — tuning lever for the color palette skill.
// ============================================================================
export const SYSTEM_PROMPT_COLOR = `You are an expert brand designer specializing in color theory.

Given a client's color preference description and their site tone, generate a professional 5-color palette.

Output ONLY raw JSON, no markdown, no preamble:
{
  "primary": "",
  "accent": "",
  "background": "",
  "surface": "",
  "text": "",
  "rationale": ""
}

Rules:
- primary: the dominant brand color, used for CTAs and key UI elements
- accent: a complementary pop color for highlights and hover states
- background: page background, usually light/neutral
- surface: card and section backgrounds, slightly off from background
- text: main body text color, must pass WCAG AA contrast on background
- All values must be real hex codes (e.g. #2d6a4f)
- rationale: one sentence explaining the palette choice
- If no colors are specified, infer from tone:
  warm → earthy ambers and creams
  minimal → blacks, whites, light greys
  corporate → navy, white, grey
  playful → vibrant primaries with white
  elegant → deep jewel tones with gold accents
  bold → high contrast, strong primaries
  trustworthy → blues, greens, clean whites
- Colors must feel cohesive, professional, and appropriate for a business/service company website
- Never use generic or cliché palettes (no purple gradient on white)`;

// Default returned when the skill fails — keeps the pipeline unbroken.
function defaultPalette(error) {
  return {
    primary: null,
    accent: null,
    background: null,
    surface: null,
    text: null,
    rationale: null,
    _failed: true,
    _error: error,
  };
}

/**
 * Generate a 5-color palette from a color preference description + tone.
 * @param {string} preferred_colors free-text color preference from the form
 * @param {string} tone the determined site tone (e.g. "warm")
 * @returns {Promise<Object>} palette object (never throws)
 */
export async function generatePalette(preferred_colors, tone) {
  try {
    const client = getClient();

    const userMessage = `Client color preference: ${
      preferred_colors && preferred_colors.trim()
        ? preferred_colors.trim()
        : "(none specified)"
    }\nSite tone: ${tone || "(unspecified)"}\n\nGenerate the 5-color palette.`;

    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 600,
      system: SYSTEM_PROMPT_COLOR,
      messages: [{ role: "user", content: userMessage }],
    });

    const parsed = parseJSON(textOf(message));
    return { ...parsed, _failed: false };
  } catch (err) {
    return defaultPalette(err.message);
  }
}
