# Architecture

## Flow
1. **Storefront** → customer picks variants, delivery postcode (checked against `domain/delivery/delivery-rules.ts`), date and slot → `startCheckout` re-prices from D1, stores the request in `pending_checkouts`, creates a Stripe Checkout Session → Stripe → `/api/stripe-webhook` verifies the signature, checks the paid amount, turns the pending row into a `PAID` order (idempotent) and emails the customer.
2. **Admin** → imports test orders from CSV (`/admin/import`, format below), moves orders `PAID → PREPARING → READY`, or bulk "mark day ready". Manages products and staff (Google emails with role `admin` or `driver`).
3. **Driver** → signs in with Google, picks the day's `READY` orders, "Load the van": addresses are geocoded (Google Geocoding, cached on the order), `route-planner.ts` orders the stops (nearest neighbour + 2-opt, straight-line distance) from start to end, orders become `OUT_FOR_DELIVERY` and customers are emailed. The route page lets the driver drag stops and section breaks (persisted via `assignSections`), re-plan, open each section in Google Maps, and mark each stop delivered/failed with a note and optional photo (R2). Delivered/failed updates the order and emails the customer (photo link included).

## Order status
`PAID → PREPARING → READY → OUT_FOR_DELIVERY → DELIVERED | FAILED`; `FAILED → READY` to retry; any pre-delivery state or `DELIVERED/FAILED → REFUNDED`. See `domain/order/order-transitions.ts`. Updates are optimistic (`WHERE status = from`).

## Security model
- Session: HS256 JWT cookie `booker_session` (8h, httpOnly, Lax). Role is re-read from D1 `staff` on every request, so deactivating staff locks them out immediately. `BOOTSTRAP_ADMIN_EMAIL` is always admin.
- Every staff server function calls `requireStaff(role...)`; drivers only see their own routes. Mutating API routes check same-origin `Origin`.
- Delivery photos are served from unguessable keys at `/photos/stops/<uuid>.<ext>` (linked from customer emails); keys are validated by regex before touching R2.

## CSV order import (test data)
Header row: `external_ref, customer_email, recipient_name, recipient_phone, address_line1, address_line2, city, postcode, delivery_date, slot, gift_message, items`. `items` = `Name:qty:price;Name:qty:price` (price in £). `slot` ∈ `standard|same_day|morning`. Re-importing an `external_ref` is a no-op. Sample: `docs/sample-orders.csv`.

## Deliberate simplifications (upgrade paths)
- Route order uses straight-line distance (heuristic). Upgrade: Google Routes `optimizeWaypointOrder`.
- Google Maps deep links carry ≤ 9 waypoints per section.
- No daily cron yet: add a Workers cron trigger that calls the same insert function as the CSV import.
- Single depot for start/end (from `DEPOT_*`).
- No Playwright e2e yet; D1 behaviour is covered by `tests/dal.test.ts`.
