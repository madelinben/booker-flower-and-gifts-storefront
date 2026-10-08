## Summary

## App
<!-- storefront, admin, driver portal, or infra -->

## Scope
<!-- Layers, routes, D1 migrations, env vars, payment-provider or auth changes -->

## Dev test plan
<!-- Local URLs -->

## Reviewer checklist
- [ ] Correct layer, no forbidden imports, no new barrels
- [ ] `pnpm check` green
- [ ] `pnpm predeploy` green
- [ ] Copy follows `copy.mdc`; accessible per `accessibility.mdc`
- [ ] New env var added to `.dev.vars.example` and `.dev.vars.example`

## Infra / deploy config
<!-- N/A, or Cloudflare Workers / DNS / env / webhook endpoint change -->

## Deployment plan
Preview deployment → check preview URL → merge → production deploy on `main`.

## Reversion plan
- [ ] Revert merge commit / redeploy previous Cloudflare deployment
- [ ] Data change (D1 / Shopify): none, or named recovery step
