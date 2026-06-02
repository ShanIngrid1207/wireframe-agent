# Wireframe Agent

Wireframe Agent turns a CSV of Google Form responses into low-fidelity website
wireframe specs using Claude AI. You upload the CSV your clients filled out,
review the parsed responses, and let the AI agent generate a structured JSON
"spec" for each one — a designer brief, design tokens, and a page-by-page list
of sections. You can then view that spec and see an instant low-fidelity
wireframe preview rendered in the browser.

**Pipeline:** Upload CSV → Parse responses → AI Agent (Claude) → JSON Spec → Wireframe Preview

---

## Prerequisites

- **Node.js 18 or newer** — check with `node --version`
- **An Anthropic API key** — get one at https://console.anthropic.com

---

## Setup

1. **Get the project** (clone or download), then open a terminal in the
   `wireframe-agent` folder.

2. **Install the backend dependencies:**
   ```bash
   cd backend
   npm install
   ```

3. **Install the frontend dependencies:**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Create your environment file.** From the `wireframe-agent` root folder,
   copy the example file and add your key:

   On **Windows (PowerShell):**
   ```powershell
   Copy-Item .env.example .env
   ```
   On **Mac/Linux:**
   ```bash
   cp .env.example .env
   ```

5. **Open `.env`** and paste in your Anthropic API key:
   ```
   ANTHROPIC_API_KEY=sk-ant-your-real-key-here
   PORT=3001
   VITE_API_URL=http://localhost:3001
   ```

---

## How to export a CSV from Google Forms

1. Open your form in **Google Forms**.
2. Click the **Responses** tab at the top.
3. Click the green **Sheets** icon (**Link to Sheets**) — this opens the
   responses in **Google Sheets**. (If you've already linked a sheet, click
   **View in Sheets**.)
4. In Google Sheets, click **File → Download → Comma-separated values (.csv)**.
5. The CSV downloads to your computer. That's the file you upload into
   Wireframe Agent.

> The app expects the exact column headers from the standard intake form
> (Business Name, Slogan / Tagline, Core Application Features, etc.). If the
> upload says the format isn't recognized, double-check you exported the
> responses sheet directly.

---

## How to run

You need **two terminals** running at the same time — one for the backend,
one for the frontend.

**Terminal 1 — backend:**
```bash
cd backend
npm run dev
```
You should see: `Wireframe Agent backend running on http://localhost:3001`

**Terminal 2 — frontend:**
```bash
cd frontend
npm run dev
```
Vite will print a local URL (usually **http://localhost:5173**). Open it in
your browser.

### Using the app
1. **Upload CSV** — drag in your exported CSV.
2. **Responses** — review the parsed rows. Click **Generate Spec** on a row
   (or **Generate All**) to run the AI agent.
3. **Spec Viewer** — read the designer brief, design tokens, and section plan.
4. **Wireframe Preview** — see the low-fidelity wireframe for each page.

---

## Design Intelligence skills

When you generate a spec, three extra Claude-powered skills run **in parallel**
to make real design decisions before the spec is finished:

1. **Color Palette Generator** — turns the client's color notes + tone into a
   full 5-color palette with real hex codes.
2. **Font Pairing Suggester** — recommends a specific Google Fonts pairing with
   weights, sizes, and an embed URL.
3. **Reference Analyzer** — fetches the client's reference website and extracts
   concrete layout patterns to borrow (uses web search as a fallback).

These results appear in the **Spec Viewer** under "Design Intelligence", and the
palette + fonts are applied live in the **Wireframe Preview**. Each skill fails
safely on its own — if one can't complete, the rest still finish and the spec is
still produced. You can see which skills succeeded per spec at
`http://localhost:3001/api/skills-status`.

> **Note:** these skills added one new dependency (`node-fetch`). If you set the
> app up before this update, re-run `npm install` inside the `backend` folder
> once before starting the server.

The skill prompts live at the top of each file in `backend/skills/` —
`SYSTEM_PROMPT_COLOR`, `SYSTEM_PROMPT_FONTS`, and `SYSTEM_PROMPT_REFERENCE` —
and are edited the same way as the main agent prompt.

---

## How to tune the agent

The AI's behavior is controlled by one editable prompt. Open
[`backend/agent.js`](backend/agent.js) and edit the **`SYSTEM_PROMPT`** constant
at the top of the file. It defines the output JSON schema and all the design
rules (allowed tones, section types, layout guidance). Keep the JSON schema
shape intact so the frontend can still render the result — but feel free to
adjust the rules, tone options, or guidance to match your design style.

After editing, restart the backend (`Ctrl+C`, then `npm run dev` again).

---

## Future upgrade note

To connect a **live Google Sheet** instead of uploading a CSV, replace
[`backend/parser.js`](backend/parser.js) with a Google Sheets API integration
that returns the same array-of-objects shape. **No other files need to change.**

---

## Project structure

```
wireframe-agent/
├── backend/
│   ├── index.js      Express server + API endpoints
│   ├── agent.js      Claude agent + SYSTEM_PROMPT (main tuning lever)
│   ├── parser.js     CSV → clean response objects
│   └── data/
│       ├── responses.json
│       └── specs/    generated spec JSON files
├── frontend/
│   └── src/
│       ├── App.jsx
│       ├── views/    UploadCSV, Responses, SpecViewer, WireframePreview
│       └── components/  Sidebar, SectionBlock, DesignTokens
├── .env.example
└── README.md
```
