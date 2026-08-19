---
name: Main environment DB setup after task merges
description: Task agents seed isolated DBs; main env DB stays empty until schema+seed are run here.
---

Task agents run in isolated environments with their own Postgres. When their work merges, the main environment's database does NOT get their schema or seed data. Symptom: app serves fine but every API call fails with `relation "..." does not exist`, which can look like a preview/connectivity problem.

**Why:** Lost significant debugging time chasing proxy/preview config when the real cause was an empty main-env database after Slices 1–3 merged.

**How to apply:** After any slice merge that touches `server/db/schema.js`, apply the generated SQL migrations in the main environment. Generate from `server/` with its relative config; the root config's absolute migration path breaks snapshot lookup in the current Drizzle version. `drizzle-kit push` fails here (interactive TTY prompt over the `session` table conflict), so use `psql "$DATABASE_URL" -f db/migrations/<file>.sql`. Only run `node db/seed.js` when intentionally resetting demo data: it truncates the app tables. Consider adding safe migration application to `scripts/post-merge.sh`.

Preview routing is covered in [preview-artifact-shim.md](preview-artifact-shim.md) — the app must be served through the registered artifact, not raw workflows or `[[ports]]` entries.
