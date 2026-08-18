---
name: Main environment DB setup after task merges
description: Task agents seed isolated DBs; main env DB stays empty until schema+seed are run here.
---

Task agents run in isolated environments with their own Postgres. When their work merges, the main environment's database does NOT get their schema or seed data. Symptom: app serves fine but every API call fails with `relation "..." does not exist`, which can look like a preview/connectivity problem.

**Why:** Lost significant debugging time chasing proxy/preview config when the real cause was an empty main-env database after Slices 1–3 merged.

**How to apply:** After any slice merge that touches `server/db/schema.js`, apply schema and re-seed in the main env. `drizzle-kit push` fails here (interactive TTY prompt over the `session` table conflict) — instead run `npx drizzle-kit generate` in `server/` and apply the SQL with `psql "$DATABASE_URL" -f db/migrations/<file>.sql`, then `node db/seed.js`. Consider adding this to `scripts/post-merge.sh`.

Also: the preview pane REQUIRES `[[ports]] localPort=5000 externalPort=80` in `.replit` — webview logs prove it connects only when the mapping exists. Do not judge preview reachability by curling `$REPLIT_DEV_DOMAIN` from inside the container: that path returns 502 with the mapping and 200 without it, the exact opposite of what the user's preview sees (the preview uses Replit's internal mTLS proxy). Trust browser console logs, not curl. Never remove the ports mapping, and avoid unnecessary Client restarts — each one drops the user's webview connection.
