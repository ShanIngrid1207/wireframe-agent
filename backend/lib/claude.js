// lib/claude.js — shared Anthropic client + JSON helpers used by the
// agent and all design skills. Each skill keeps its OWN SYSTEM_PROMPT; this
// file only centralizes the client setup and JSON parsing so they stay DRY.

import Anthropic from "@anthropic-ai/sdk";

export const MODEL = "claude-sonnet-4-20250514";

// Lazily create the client so a missing key only errors when a call is made.
export function getClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Add it to your .env file before generating specs."
    );
  }
  return new Anthropic({ apiKey });
}

// Pull all text blocks out of a messages.create response and join them.
export function textOf(message) {
  return (message.content || [])
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("");
}

// Remove accidental ```json ... ``` fences from a model response.
export function stripFences(text) {
  let t = String(text || "").trim();
  t = t.replace(/^```(?:json)?\s*/i, "");
  t = t.replace(/\s*```$/i, "");
  return t.trim();
}

// Parse JSON from a model response, tolerating fences and surrounding prose.
export function parseJSON(text) {
  const cleaned = stripFences(text);
  try {
    return JSON.parse(cleaned);
  } catch {
    // Fall back to the largest {...} span if the model wrapped the JSON.
    const first = cleaned.indexOf("{");
    const last = cleaned.lastIndexOf("}");
    if (first !== -1 && last !== -1 && last > first) {
      return JSON.parse(cleaned.slice(first, last + 1));
    }
    throw new Error(`Could not parse JSON from model response: ${cleaned.slice(0, 200)}`);
  }
}
