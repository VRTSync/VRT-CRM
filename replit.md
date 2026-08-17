# VRTSync CRM

Internal CRM for the VRTSync property maintenance software team, replacing Zoho for a 4 to 6 person company.

## Run & Operate

- Workflows: `API Server` (Express on port 3000) and `Client` (Vite dev server on port 5000, proxies /api and /auth to the API)
- `pnpm db:push` pushes the Drizzle schema to Postgres
- `pnpm db:seed` resets and reseeds users and customers (rerunnable)
- Required env: `DATABASE_URL`, `SESSION_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_WORKSPACE_DOMAIN` (see `.env.example`)

## Stack

- Plain JavaScript only (.js and .jsx). No TypeScript, no OpenAPI, no shared contract packages, no Tailwind or any CSS framework.
- `/client`: Vite + React SPA, react-router-dom
- `/server`: Express JSON API, Postgres via Drizzle, session auth (connect-pg-simple)
- Auth: Google OAuth only, restricted to the workspace domain in `GOOGLE_WORKSPACE_DOMAIN`

## Where things live

- Design source of truth: `/vrtsync-crm-mockup.html` at the repo root (do not modify or serve it)
- Binding spec and build prompts: `attached_assets/02-SPEC_*.md` (amendment A1 applies), `attached_assets/SLICE-1-PROMPT_*.md`
- Stylesheet: `client/src/styles/{tokens,base,components}.css`, lifted from the mockup
- DB schema: `server/db/schema.js` (users, customers only in slice 1)
- Auth: `server/auth.js`; routes: `server/routes/{users,customers}.js`

## Architecture decisions

- This project is intentionally NOT a pnpm monorepo with lib/artifacts. The original scaffolding was deleted per the build prompt. Do not re-add it.
- Deterministic avatar colors come from `client/src/lib/avatarColor.js` mapping user id to `--av-*` tokens.
- Stage enum has exactly nine values: lead, discovery, proposal, signed, mapping, data_load, training, live, churned.

## User preferences

- Follow the slice build prompts exactly; add nothing not named in BUILD.

## Gotchas

- No em dashes or en dashes anywhere: code, comments, UI copy, commit messages.
- No raw hex outside `tokens.css`; never use `--accent` as a text color (use `--accent-ink`).
- Padding rules: rows 8px vertical, table cells 10px, card headers 12px.
- Media queries use literal 1100px and 820px because custom properties cannot be read there.
