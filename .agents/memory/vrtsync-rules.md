---
name: VRTSync CRM project rules
description: Durable constraints for the VRTSync CRM slices
---

- The repo was deliberately stripped of the pnpm monorepo scaffolding (lib/, artifacts/). Structure is /client (Vite React) + /server (Express). **Why:** the build prompt forbids monorepo, TypeScript, OpenAPI, Tailwind. **How to apply:** never re-scaffold artifacts or add TS/contract packages in future slices.
- Standing style constraints across all slices: no em or en dashes anywhere (including commit messages), no raw hex outside client/src/styles/tokens.css, --accent never as text color (use --accent-ink), row padding 8px vertical / cells 10px / card headers 12px.
- The mockup at /vrtsync-crm-mockup.html is the approved design; slices lift its CSS as-is. Attached specs govern; amendment A1 removed extra property columns from customers.
- Screenshot tool has no artifact registered here; for mobile-width checks, temporarily serve an iframe wrapper page from client/public and screenshot via externalUrl, then delete it. Same trick works for exact-viewport density checks.
- Auth is Google-only with no dev bypass; verifying authed screens requires a temporary measure that must be fully reverted (and 401 re-confirmed) before completion.
- Null-role users may read but can never be task assignees; enforce this in the API, not just the UI. Derived task status is computed at read time only, never stored.
