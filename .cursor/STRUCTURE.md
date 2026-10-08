# Structure

## Scripts
`dev`, `build`, `preview`, `test` (vitest), `lint`, `lint:fix`, `typecheck`, `check` (entry files + lint:fix + lint + typecheck), `pipeline` / `predeploy` (typecheck, lint, test, build), `db:migrate:local`, `db:migrate`.

## Routes
Public: `/`, `/flowers`, `/product/$slug`, `/cart`, `/thanks`, `/delivery`, `/contact`.
Auth: `/auth/login`, `/auth/callback`, `/auth/logout` (POST).
Admin (role admin): `/admin/orders`, `/admin/import`, `/admin/products`, `/admin/staff`.
Driver (role driver|admin): `/driver`, `/driver/route/$id`.
API: `/api/stripe-webhook`, `/api/stop-photo`, `/api/route-map`, `/photos/*`.

## Docs
`docs/ARCHITECTURE.md`, `docs/PREDEPLOY_CHECKLIST.md`, `docs/sample-orders.csv`.
