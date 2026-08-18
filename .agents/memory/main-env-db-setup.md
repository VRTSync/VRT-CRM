---
name: Main environment DB setup after task merges
description: Task agents seed isolated DBs; main env DB stays empty until schema+seed are run here.
---

Task agents run in isolated environments with their own Postgres. When their work merges, the main environment's database does NOT get their schema or seed data. Symptom: app serves fine but every API call fails with `relation "..." does not exist`, which can look like a preview/connectivity problem.

**Why:** Lost significant debugging time chasing proxy/preview config when the real cause was an empty main-env database after Slices 1–3 merged.

**How to apply:** After any slice merge that touches `server/db/schema.js`, apply schema and re-seed in the main env. `drizzle-kit push` fails here (interactive TTY prompt over the `session` table conflict) — instead run `npx drizzle-kit generate` in `server/` and apply the SQL with `psql "$DATABASE_URL" -f db/migrations/<file>.sql`, then `node db/seed.js`. Consider adding this to `scripts/post-merge.sh`.

Also: never add a `[[ports]]` entry to `.replit` here — it broke the proxy (502 repl unreachable); the Client workflow's `waitForPort = 5000` + webview output handles routing.
