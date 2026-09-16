# AI Office — Base44 Dev Notes

## Stack
- **Monorepo** (npm workspaces): `server/` (Hono API) + `web/` (Vite + React 19)
- **Runtime**: Node 22+ required (uses built-in `node:sqlite`)
- **Database**: SQLite at `data/aioffice.sqlite` (auto-created on first boot)
- **Ports**: Vite on 5173 (mapped to host 3000), API on 8787 (internal only — Vite proxies `/api`)

## Running
```bash
docker compose -f docker-compose.base44.yml up -d --build
```
- `setup` service runs `npm install` once; `web` and `server` start after it completes.
- Both app services bind-mount the repo and run with live reload (tsx watch / vite).
- Vite's `/api` proxy target is configurable via `API_PROXY_TARGET` env (defaults to `http://localhost:8787` for local dev; set to `http://server:8787` in compose).

## Secrets (via /run/base44/app.env)
- `ANTHROPIC_API_KEY` — optional. Without it, the app runs in **demo mode** (founding, office simulation, demo reports all work; real AI execution and non-demo founding need the key).
- `AIOFFICE_SECRET` — 16+ char encryption key for the BYOK credential vault. Generated for development.

## Verifying
- Health: `curl http://localhost:3000/api/health` → `{"ok":true,...}`
- Landing page at `/` shows the marketing site with waitlist form.
- "데모로 둘러보기" (demo mode) founds a company without needing Anthropic.
