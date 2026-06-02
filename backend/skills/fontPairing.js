// skills/fontPairing.js — Skill 2: Font Pairing Suggester
// Recommends a specific Google Fonts pairing from tone + design style.

import { getClient, MODEL, textOf, parseJSON } from "../lib/claude.js";

// ============================================================================
//  SYSTEM_PROMPT_FONTS — tuning lever for the font pairing skill.
// ============================================================================
export const SYSTEM_PROMPT_FONTS = `You are a typography expert who specializes in web design for business and service company websites.

Given a site's tone and design style, recommend a specific Google Fonts pairing.

Output ONLY raw JSON, no markdown, no preamble:
{
  "heading_font": "",
  "body_font": "",
  "heading_weight": "",
  "body_weight": "",
  "heading_size_desktop": "",
  "body_size_desktop": "",
  "google_fonts_url": "",
  "rationale": ""
}

Rules:
- heading_font and body_font must be real Google Fonts names (verify they exist)
- heading_weight: e.g. "700" or "800"
- body_weight: e.g. "400" or "300"
- heading_size_desktop: e.g. "56px" for hero, use standard H1 size
- body_size_desktop: e.g. "17px"
- google_fonts_url: valid Google Fonts embed URL for both fonts combined e.g. "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Source+Sans+3:wght@400&display=swap"
- rationale: one sentence on why this pairing fits the tone
- Tone matching guide:
  warm → humanist serifs paired with friendly sans (e.g. Lora + Nunito)
  minimal → geometric sans paired with light sans (e.g. DM Sans + Inter)
  corporate → professional transitional serif + clean sans (e.g. Merriweather + Source Sans 3)
  playful → rounded sans + friendly sans (e.g. Nunito + Poppins)
  elegant → high-contrast serif + refined sans (e.g. Playfair Display + Cormorant Garamond)
  bold → strong display + neutral sans (e.g. Oswald + Open Sans)
  trustworthy → clear humanist + readable sans (e.g. Libre Baskerville + Lato)
- Never suggest Inter, Roboto, or Arial as heading fonts — these are too generic
- The pairing must feel distinctive and professionally considered`;

// Default returned when the skill fails — keeps the pipeline unbroken.
function defaultFonts(error) {
  return {
    heading_font: null,
    body_font: null,
    heading_weight: null,
    body_weight: null,
    heading_size_desktop: null,
    body_size_desktop: null,
    google_fonts_url: null,
    rationale: null,
    _failed: true,
    _error: error,
  };
}

/**
 * Recommend a Google Fonts pairing from tone + design style.
 * @param {string} tone the determined site tone (e.g. "elegant")
 * @param {string} design_style free-text design style from the form
 * @returns {Promise<Object>} font pairing object (never throws)
 */
export async function generateFontPairing(tone, design_style) {
  try {
    const client = getClient();

    const userMessage = `Site tone: ${tone || "(unspecified)"}\nDesign style: ${
      design_style && design_style.trim() ? design_style.trim() : "(none specified)"
    }\n\nRecommend the Google Fonts pairing.`;

    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 600,
      system: SYSTEM_PROMPT_FONTS,
      messages: [{ role: "user", content: userMessage }],
    });

    const parsed = parseJSON(textOf(message));
    return { ...parsed, _failed: false };
  } catch (err) {
    return defaultFonts(err.message);
  }
}
