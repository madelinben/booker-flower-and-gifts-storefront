# Predeploy checklist

- [ ] `pnpm predeploy` green
- [ ] Real D1 `database_id` and R2 bucket in `wrangler.jsonc`; remote migrations applied
- [ ] Worker secrets set (see `.cursor/rules/project-environment.mdc`)
- [ ] Google OAuth redirect URI, Stripe webhook endpoint, Resend sender domain verified
- [ ] Maps API key restricted (Geocoding + Static Maps, server only) with billing alert
- [ ] Real logo, photography and prices replace placeholders; palette re-checked against brand
- [ ] First admin signs in via `BOOTSTRAP_ADMIN_EMAIL`, adds drivers on `/admin/staff`
- [ ] Test order end to end: pay (Stripe test mode) → admin ready → driver route → delivered with photo → customer emails received
- [ ] Lighthouse mobile pass on `/`, `/flowers`, `/product/*`; axe pass; tap targets ≥ 40px
- [ ] `robots`/sitemap/JSON-LD added (see `seo.mdc` TODO)
