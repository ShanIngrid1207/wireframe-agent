# Deploying Wireframe Agent (free, one shareable link)

This guide puts the whole app online as a **single web service** on
[Render](https://render.com) (free tier). The backend serves the built
frontend, so there's just one URL to share. Your Anthropic API key lives only
on the server — it is never exposed in the browser.

## Step 1 — Put the project on GitHub

1. Go to <https://github.com/new> and create a new **empty** repository
   (no README, no .gitignore). Name it e.g. `wireframe-agent`. Copy its URL,
   which looks like `https://github.com/YOUR-NAME/wireframe-agent.git`.

2. In PowerShell, from the project folder, run these one at a time:

   ```powershell
   cd C:\Users\tagal\wireframe-agent
   git init
   git add .
   git commit -m "Wireframe Agent app"
   git branch -M main
   git remote add origin https://github.com/YOUR-NAME/wireframe-agent.git
   git push -u origin main
   ```

   On the first `git push`, a browser window may open asking you to log in to
   GitHub — that's normal. Approve it.

   > Your `.env` (with the API key) is **not** uploaded — it's ignored on
   > purpose. You'll paste the key into Render in Step 2.

## Step 2 — Create the web service on Render

1. Sign up / log in at <https://render.com> (use "Sign in with GitHub").
2. Click **New +** → **Web Service**.
3. Connect your GitHub and pick the `wireframe-agent` repository.
4. Fill in the settings:
   - **Name:** `wireframe-agent` (this becomes part of your URL)
   - **Region:** the one closest to you
   - **Branch:** `main`
   - **Root Directory:** *(leave blank)*
   - **Runtime:** Node
   - **Build Command:** `npm run install:all && npm run build`
   - **Start Command:** `npm start`
   - **Instance Type:** **Free**
5. Scroll to **Environment Variables** → **Add Environment Variable**:
   - **Key:** `ANTHROPIC_API_KEY`
   - **Value:** your Anthropic key (starts with `sk-ant-`)
6. Click **Create Web Service**.

Render will build and start the app (first build takes a few minutes). When it
says **Live**, click the URL at the top (looks like
`https://wireframe-agent.onrender.com`) — that's your shareable link.

## Updating the app later

Whenever you change the code, push it and Render redeploys automatically:

```powershell
cd C:\Users\tagal\wireframe-agent
git add .
git commit -m "what I changed"
git push
```

## Things to know about the free tier

- **It sleeps when idle.** After ~15 minutes with no visitors, the service
  goes to sleep. The next visit takes ~30–60 seconds to wake up, then it's
  fast again. (Paid plans stay awake.)
- **Generated specs are not permanent.** Specs are saved as files on the
  server, and the free tier wipes the disk on every restart/redeploy. For the
  normal flow (upload CSV → generate specs → download the JSON / use in Figma in
  the same session) this is fine. If you need specs to persist forever, add a
  Render **Disk** (a small paid add-on) or ask to switch storage to a database.
- **Your API usage is billed by Anthropic**, not Render — each spec generation
  makes several Claude calls.
