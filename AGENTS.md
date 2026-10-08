# booker-flowers-storefront — agent entry

Storefront, admin dashboard and delivery-driver portal for Booker Flowers & Gifts (Liverpool florist with its own vans). One TanStack Start app on Cloudflare Workers (D1 + R2).

This file is a pointer only. Every rule and doc lives in `.cursor/rules/` and `docs/`; the same text is written to `CLAUDE.md` (Claude Code), `AGENTS.md` (Codex + generic agents) and `PROJECT_RULES.md` (v0). Never add rules here — add them under `.cursor/rules/`. `pnpm check` fails if the three copies differ.

## Before any change

1. Read every always-on rule in `.cursor/rules/` (Cursor loads these itself; every other tool must read them):
   - `.cursor/rules/ai-contributors.mdc`
   - `.cursor/rules/dev-checks.mdc`
   - `.cursor/rules/general.mdc`
   - `.cursor/rules/layers.mdc`
   - `.cursor/rules/naming.mdc`
   - `.cursor/rules/no-barrels.mdc`
   - `.cursor/rules/no-deprecated.mdc`
   - `.cursor/rules/performance.mdc`
   - `.cursor/rules/predeploy.mdc`
   - `.cursor/rules/project-config.mdc`
   - `.cursor/rules/project-environment.mdc`
   - `.cursor/rules/project-overview.mdc`
   - `.cursor/rules/project-structure.mdc`
   - `.cursor/rules/pull-requests.mdc`
   - `.cursor/rules/scripts.mdc`
   - `.cursor/rules/seo.mdc`
   - `.cursor/rules/software-development-lifecycle.mdc`
2. Before touching matching paths, read the on-demand rule for them — table in `.cursor/rules/project-overview.mdc`.
3. Architecture, data model, flows: `docs/ARCHITECTURE.md`. Launch checks: `docs/PREDEPLOY_CHECKLIST.md`.
4. Scripts, routes, docs index: `.cursor/STRUCTURE.md`.

## Before handing work back

- `pnpm check` green (`.cursor/rules/dev-checks.mdc`). A working preview is not done.
- Commits/PRs: plain messages with no attribution trailers (owner preference).
