---
name: Preview requires the artifact shim
description: Why the preview pane works only through the registered artifact, and how the shim is wired.
---

The workspace preview pane only displays apps registered through Replit's artifact system (routed via the platform router on port 80). Plain workflows opening ports are NOT enough — curl checks against localhost or $REPLIT_DEV_DOMAIN can pass while the user's preview shows "couldn't reach this app".

**Why:** This project is intentionally plain `/client` + `/server` (spec forbids monorepo layout). Days of preview failures were solved only by registering a thin artifact shim.

**How to apply:** `artifacts/app` is a dependency-free shim package whose dev script is `pnpm --dir ../../client run dev`. The managed workflow `artifacts/app: web` injects PORT; `client/vite.config.js` reads `process.env.PORT` and proxies `/api` and `/auth` to localhost:3000. The legacy "Client" workflow and any `[[ports]]` entries were removed from `.replit` — do not re-add either. `pnpm-workspace.yaml` must keep `artifacts/*` in packages. Do NOT delete `artifacts/app` or call configureWorkflow for it. Restart via WorkflowsRestart name `artifacts/app: web`. Verify preview with the Screenshot tool (artifactDirName "app"), not curl.
