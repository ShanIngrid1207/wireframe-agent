// index.js — Express server for Wireframe Agent
//
// Endpoints:
//   POST /api/upload          upload + parse a Google Forms CSV
//   GET  /api/responses       list parsed responses
//   POST /api/generate/:index generate a wireframe spec for one response
//   GET  /api/specs           list all generated specs
//   GET  /api/specs/:filename return one spec by filename

import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load the .env file from the project root (one level up from /backend),
// falling back to a .env inside /backend if present.
dotenv.config({ path: path.join(__dirname, "..", ".env") });
dotenv.config(); // also load ./backend/.env or cwd .env if it exists

import { parseCSV } from "./parser.js";
import { generateSpec } from "./agent.js";

const DATA_DIR = path.join(__dirname, "data");
const SPECS_DIR = path.join(DATA_DIR, "specs");
const RESPONSES_FILE = path.join(DATA_DIR, "responses.json");

const PORT = process.env.PORT || 3001;

const app = express();
app.use(cors());
app.use(express.json());

// Store uploaded file in memory so we can hand the buffer straight to papaparse.
const upload = multer({ storage: multer.memoryStorage() });

// --- helpers ---------------------------------------------------------------

async function ensureDirs() {
  await fs.mkdir(SPECS_DIR, { recursive: true });
}

async function readResponses() {
  try {
    const raw = await fs.readFile(RESPONSES_FILE, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === "ENOENT") return []; // no file yet
    throw err;
  }
}

// --- routes ----------------------------------------------------------------

// POST /api/upload — accept a CSV, parse, save, return parsed responses.
app.post("/api/upload", upload.single("csv"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: "No file received. Please attach a CSV file in the 'csv' field.",
      });
    }

    const responses = parseCSV(req.file.buffer);

    await ensureDirs();
    await fs.writeFile(RESPONSES_FILE, JSON.stringify(responses, null, 2));

    res.json({ count: responses.length, responses });
  } catch (err) {
    res.status(400).json({
      error:
        "CSV format not recognized — make sure you exported directly from Google Forms.",
      detail: err.message,
    });
  }
});

// GET /api/responses — return saved responses (or empty array).
app.get("/api/responses", async (_req, res) => {
  try {
    const responses = await readResponses();
    res.json(responses);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Could not read saved responses.", detail: err.message });
  }
});

// POST /api/generate/:index — generate + save a spec for one response.
app.post("/api/generate/:index", async (req, res) => {
  try {
    const index = Number.parseInt(req.params.index, 10);
    const responses = await readResponses();

    if (Number.isNaN(index) || index < 0 || index >= responses.length) {
      return res
        .status(404)
        .json({ error: `No response found at index ${req.params.index}.` });
    }

    const row = responses[index];
    const spec = await generateSpec(row);

    // Stamp with metadata used by the spec list view.
    spec._meta = {
      index,
      business_name: row.business_name,
      created_at: new Date().toISOString(),
    };

    await ensureDirs();
    const slug = row.slug || "untitled";
    const filename = `${index}-${slug}.json`;
    await fs.writeFile(
      path.join(SPECS_DIR, filename),
      JSON.stringify(spec, null, 2)
    );

    res.json({ filename, spec });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to generate spec.", detail: err.message });
  }
});

// GET /api/specs — list all generated specs.
app.get("/api/specs", async (_req, res) => {
  try {
    await ensureDirs();
    const files = (await fs.readdir(SPECS_DIR)).filter((f) =>
      f.endsWith(".json")
    );

    const specs = await Promise.all(
      files.map(async (filename) => {
        try {
          const raw = await fs.readFile(path.join(SPECS_DIR, filename), "utf8");
          const json = JSON.parse(raw);
          return {
            filename,
            business_name:
              json._meta?.business_name ||
              json.client?.business_name ||
              filename,
            created_at: json._meta?.created_at || null,
          };
        } catch {
          return { filename, business_name: filename, created_at: null };
        }
      })
    );

    res.json(specs);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Could not list specs.", detail: err.message });
  }
});

// GET /api/specs/:filename — return one spec.
app.get("/api/specs/:filename", async (req, res) => {
  try {
    // Guard against path traversal — only allow a bare filename.
    const filename = path.basename(req.params.filename);
    const raw = await fs.readFile(path.join(SPECS_DIR, filename), "utf8");
    res.json(JSON.parse(raw));
  } catch (err) {
    if (err.code === "ENOENT") {
      return res.status(404).json({ error: "Spec not found." });
    }
    res
      .status(500)
      .json({ error: "Could not read spec.", detail: err.message });
  }
});

// GET /api/skills-status — report which design skills succeeded/failed per spec.
app.get("/api/skills-status", async (_req, res) => {
  try {
    await ensureDirs();
    const files = (await fs.readdir(SPECS_DIR)).filter((f) =>
      f.endsWith(".json")
    );

    const statuses = await Promise.all(
      files.map(async (filename) => {
        try {
          const raw = await fs.readFile(path.join(SPECS_DIR, filename), "utf8");
          const json = JSON.parse(raw);

          // Prefer the stored skills_status; otherwise derive from skills_summary.
          const status =
            json.skills_status ||
            deriveStatus(json.skills_summary) || {
              palette: { ok: false, skipped: false, error: "no skill data" },
              fonts: { ok: false, skipped: false, error: "no skill data" },
              reference: { ok: false, skipped: false, error: "no skill data" },
            };

          return {
            filename,
            business_name:
              json._meta?.business_name ||
              json.client?.business_name ||
              filename,
            skills: status,
          };
        } catch (err) {
          return { filename, business_name: filename, error: err.message };
        }
      })
    );

    res.json(statuses);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Could not read skills status.", detail: err.message });
  }
});

// Fallback: derive a status object from a stored skills_summary block.
function deriveStatus(summary) {
  if (!summary) return null;
  const one = (out) =>
    out?._skipped
      ? { ok: true, skipped: true, error: null }
      : { ok: !out?._failed, skipped: false, error: out?._error ?? null };
  return {
    palette: one(summary.palette),
    fonts: one(summary.fonts),
    reference: one(summary.reference),
  };
}

// --- serve the built frontend (production) ---------------------------------
// When the frontend has been built (npm run build in /frontend), serve it from
// the same server so the whole app runs as a single deployable URL. API routes
// above take priority; everything else falls back to the SPA's index.html.
const FRONTEND_DIST = path.join(__dirname, "..", "frontend", "dist");
if (existsSync(FRONTEND_DIST)) {
  app.use(express.static(FRONTEND_DIST));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    res.sendFile(path.join(FRONTEND_DIST, "index.html"), (err) => {
      if (err) next();
    });
  });
  console.log("Serving built frontend from", FRONTEND_DIST);
}

// --- start -----------------------------------------------------------------

ensureDirs()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Wireframe Agent backend running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
  });
