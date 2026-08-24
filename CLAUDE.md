# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A two-package pnpm workspace (`frontend`, `backend`) that generates AI pre-call sales briefings for IBM Data & AI sellers. Backend is an Express 5 / ESM API bundled with esbuild; frontend is a React 19 + Vite 7 + Tailwind 4 SPA. Deployed as two separate IBM Code Engine apps (backend container, nginx-served frontend container).

## Commands

```bash
pnpm install                    # workspace root — installs both packages

# backend/
pnpm run dev                    # NOT watch mode: build.mjs (esbuild bundle) then node dist/index.mjs
pnpm run build                  # esbuild → dist/index.mjs
pnpm run typecheck              # tsc --noEmit

# frontend/
pnpm run dev                    # vite dev server, port from VITE_PORT/PORT, default 3002
pnpm run build                  # → dist/public
pnpm run typecheck
```

Backend `dev` has no file watcher — re-run it after every backend edit.

There is no test framework, linter, or test script in this repo. `typecheck` is the only automated check.

## Environment (backend/.env)

Several modules throw at **import time** if their vars are missing, so the server will not boot at all without them — even for endpoints that don't use them:

- `PORT` — required, no default (`index.ts`). Set to `3001` locally so the Vite `/api` proxy hits it.
- `DATABASE_URL` — required (`lib/db.ts`); IBM Cloud Postgres. `PG_CA_CERT_BASE64` supplies the TLS CA. `sslmode=` is stripped from the URL.
- `ANTHROPIC_API_KEY` — required (`lib/anthropic-client.ts`); this is what actually generates content.
- `WATSONX_API_KEY` + `WATSONX_PROJECT_ID` (or the `AI_INTEGRATIONS_IBM_WATSONX_*` aliases) — required (`lib/watsonx-client.ts`) even though watsonx now only powers `/api/briefing/news` and the legacy `/api/briefing/prospect`.
- `PERPLEXITY_API_KEY` — optional; `perplexitySearch()` returns `""` when absent and every caller degrades gracefully.
- `VITE_BACKEND_URL` (frontend build-time) — see "Frontend → backend wiring".

`.env.example` at the repo root is the closest thing to a template, but it predates `DATABASE_URL`, `ANTHROPIC_API_KEY`, and `PERPLEXITY_API_KEY`.

## Architecture

### Request flow

`backend/src/index.ts` → `ensureTables()` → `app.ts` (pino-http, permissive `cors()`, JSON body) → `routes/index.ts` mounts everything under `/api`:

| Router | Path | Model | Shape |
|---|---|---|---|
| `briefing.ts` | `/api/briefing/*` | Claude Sonnet 4.5 | `/generate` streams SSE; also `/news` (Google News RSS + watsonx llama summarize), `/company-research` (Perplexity), `/parse-contact` (LinkedIn scrape), `/logo`, `/proxy-image`, `/industry` |
| `prospect.ts` | `/api/prospect/generate` | Claude Sonnet 4.5 | non-streaming JSON; scrape + Perplexity in parallel, then two prompts (research, sales play) in parallel |
| `chat.ts` | `/api/chat` | Claude Haiku 4.5 | SSE; briefing text injected as a synthetic first user turn |
| `architecture.ts` | `/api/architecture/generate` | Claude Sonnet 4.5 | SSE; emits a Mermaid diagram |
| `history.ts` | `/api/history/{briefings,prospects}` | — | CRUD over Drizzle |
| `health.ts` | `/api/healthz` | — | |

`prospectBriefing.ts` is dead code — an older watsonx `/text/chat` implementation, not mounted in `routes/index.ts`. `src/mcp/stdio.ts` is an untracked stub MCP server with no npm script wired up.

### SSE convention

Every streaming endpoint writes `data: {"content":"..."}` lines and terminates with `data: {"done":true, ...}`. Errors are **not** HTTP status codes once the stream has started: `/api/briefing/generate` catches, emits a locally-built template briefing (`buildFallbackBriefing`), and sets `done: true, fallback: true, error: "generation_failed"` — the frontend shows a warning banner off that flag. Preserve this contract when editing stream handlers.

### Persistence

Postgres via Drizzle (`lib/schema.ts` — `briefings`, `prospect_results`). There are **no migration files**: `ensureTables()` in `lib/db.ts` runs `CREATE TABLE IF NOT EXISTS` at boot. Adding a column means editing both `schema.ts` and the DDL in `db.ts`. Note it is `IF NOT EXISTS` only — it will not alter an existing table, so column additions need a manual `ALTER` against deployed databases. `backend/data/*.db` are leftovers from the pre-Postgres SQLite era and are gitignored.

`/api/briefing/generate` auto-saves the briefing and returns its id in the `done` event; explicit saves PATCH that id and fall back to POST on 404.

### Prompt architecture

Prompts are large inline template literals inside the route files, not a separate prompt directory:

- `briefing.ts` — the main prompt fixes six `##` sections (`Key Takeaways`, `Who is <name>?`, `Company Background`, `Discovery Questions`, `Opportunity Qualification`, `Product Recommendations`); `buildSections()` appends call-type-specific instructions (Discovery / Competitive / Renewal & Upsell / EBC).
- `prospect.ts` — `researchPrompt()` / `salesPlayPrompt()`, both single-string (the helper takes no system param).
- `data/ibm-products.ts` — `IBM_PRODUCTS`, the shared product catalog injected into prompts to keep recommendations anchored to the Data & AI portfolio.

The frontend parses output by splitting on `"##"` and matching section titles by exact string (`BriefingPage.tsx` around lines 263 and 1598). **Renaming a `##` heading in a prompt silently breaks the corresponding UI card and PDF box.** Prospect markdown goes through `cleanProspectMarkdown()`, which whitelists section titles the same way.

### Frontend

Routing is a `window.location.pathname` switch in `App.tsx` (`/prospect`, `/architecture`, else briefing) — `wouter` is installed but unused. `BriefingPage.tsx` is ~3k lines and holds the dashboard, streaming reader, chat panel, and the hand-laid-out jsPDF export (`buildPDF`, with binary-search font fitting per box). `SetupPage.tsx` exists but is not routed. User identity (name, role, avatar) and theme live in `localStorage`, not the database.

### Frontend → backend wiring (a recurring source of bugs)

All API calls must go through `getBaseUrl()` from `@/lib/api-client`, set once in `App.tsx` from `import.meta.env.VITE_BACKEND_URL`. In production the frontend Dockerfile bakes the backend's **public HTTPS URL** into `.env.production` so the browser calls the backend directly with CORS; the nginx `/api` proxy in `nginx.conf` is present but does not work (the Code Engine internal svc address doesn't resolve, and proxying to the public HTTPS upstream fails the SSL handshake). Relative `/api/...` URLs therefore hang in production — see commits `b71cb54` and `54f8a54`. Locally `VITE_BACKEND_URL` is unset, so relative URLs fall through the Vite proxy to `localhost:3001`.

## Deployment

`./deploy-frontend.sh` deletes and recreates the Code Engine app from the GitHub main branch (build-context `frontend`, dockerfile strategy, port 8080, `BACKEND_URL` env). The backend Dockerfile builds with pnpm from the package dir; the frontend Dockerfile builds with `npm install --legacy-peer-deps` and serves the bundle from nginx as a non-root user with all writable paths redirected to `/tmp`. `.ceignore` keeps `node_modules`, `.git`, `backend/data`, and `backend/.env` out of the source upload.

## Documentation drift

`README.md`, `USER_GUIDE.md`, `SETUP_TROUBLESHOOTING.md`, `DISTRIBUTION_GUIDE.md`, and the `setup.sh`/`start.sh`/`quick-start.sh` scripts describe an earlier distributable version of this tool: ports 3000/5173, watsonx Granite as the generator, a `docs/` directory that doesn't exist, and no Postgres. Treat this file and the source as authoritative.
