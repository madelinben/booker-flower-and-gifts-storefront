## Summary

## App
<!-- chstr-run-and-social-cloudflare, chstr-run-and-social-shopify, or both -->

## Scope
<!-- Layers, routes, CMS fields / Storefront queries, env vars, payment-provider or auth changes -->

## Dev test plan
<!-- Local URLs; Cloudflare: provider test mode (Stripe test card, `stripe listen`, or the mock provider); Shopify: test order path; user path -->

## Reviewer checklist
- [ ] Correct layer, no forbidden imports, no new barrels
- [ ] `pnpm check` green in each changed app
- [ ] `pnpm predeploy` green in each changed app (includes `check:site`: SEO, schema.org, size budgets)
- [ ] Copy follows `copy.mdc`; accessible per `accessibility.mdc`
- [ ] New env var added to the app's `.env.example` and `docs/CONFIG.md`

## Infra / deploy config
<!-- N/A, or Cloudflare Workers / DNS / env / webhook endpoint change; Shopify app scope change -->

## Deployment plan
Preview deployment → check preview URL → merge → production deploy on `main`.

## Reversion plan
- [ ] Revert merge commit / redeploy previous Cloudflare deployment
- [ ] Data change (D1 / Shopify): none, or named recovery step
