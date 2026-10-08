# chstr-run-and-social-cloudflare — agent entry

Website for the CHSTR Run & Social club: when/where/free info, waiver, contact and a KISS Stripe merchandise shop, fully on Cloudflare (D1 + content collections). Standalone Astro app: this folder is the app root inside the `chstr-run-and-social-website` repo (git root is one level up; CI, PR template and git hooks live there).

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
3. Stack and deploy target: `docs/CONFIG.md`, then the docs named in `.cursor/rules/project-config.mdc` and `.cursor/rules/project-environment.mdc`.
4. Scripts, routes, docs index: `.cursor/STRUCTURE.md`.

## Before handing work back

- `pnpm check` green (`.cursor/rules/dev-checks.mdc`). A working preview is not done.
- Pages you add or change: `pnpm build && pnpm check:site` green (SEO, schema.org, Core Web Vitals budgets: `seo.mdc`, `performance.mdc`).
- Commits/PRs: end commit messages and PR bodies with the attribution lines the harness provides, when it provides any.
