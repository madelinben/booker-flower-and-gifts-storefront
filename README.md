# Booker Flowers & Gifts

Storefront, admin dashboard and delivery-driver portal for an independent Liverpool florist. TanStack Start on Cloudflare Workers (D1 + R2).

```sh
pnpm install
cp .dev.vars.example .dev.vars   # fill in secrets; never commit
pnpm db:migrate:local
pnpm dev                         # http://localhost:5173
pnpm check && pnpm test
```

Import test orders at `/admin/import` using `docs/sample-orders.csv`. Architecture and flows: `docs/ARCHITECTURE.md`. Launch list: `docs/PREDEPLOY_CHECKLIST.md`.
