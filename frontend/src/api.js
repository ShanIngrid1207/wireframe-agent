// Small fetch helper that targets the backend API.
// - In development, Vite proxies "/api" to the backend (see vite.config.js).
// - In production, the backend serves this frontend, so a same-origin ""
//   base hits the API on the same URL.
// - VITE_API_URL can still override the base if you host them separately.

const BASE = import.meta.env.VITE_API_URL || "";

async function handle(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data.error || `Request failed (${res.status})`;
    const detail = data.detail ? `: ${data.detail}` : "";
    throw new Error(message + detail);
  }
  return data;
}

export const api = {
  base: BASE,

  async getResponses() {
    return handle(await fetch(`${BASE}/api/responses`));
  },

  async uploadCSV(file) {
    const form = new FormData();
    form.append("csv", file);
    return handle(
      await fetch(`${BASE}/api/upload`, { method: "POST", body: form })
    );
  },

  async generate(index) {
    return handle(
      await fetch(`${BASE}/api/generate/${index}`, { method: "POST" })
    );
  },

  async getSpecs() {
    return handle(await fetch(`${BASE}/api/specs`));
  },

  async getSkillsStatus() {
    return handle(await fetch(`${BASE}/api/skills-status`));
  },

  async getSpec(filename) {
    return handle(await fetch(`${BASE}/api/specs/${encodeURIComponent(filename)}`));
  },
};
