import { createServerFn } from '@tanstack/react-start';
import { insertOrders } from '~/data/Order/order-dal';
import { checkoutRequestSchema, type CheckoutRequest } from '~/domain/checkout/checkout-request';
import { priceCart, type PricedVariant } from '~/domain/checkout/price-cart';
import { isDeliverablePostcode, isSlotAvailable, SLOT_FEE_PENCE, SLOT_LABEL } from '~/domain/delivery/delivery-rules';
import { requireSetting } from '~/services/environment/require-setting';
import { getServerEnvironment, type ServerEnvironment } from '~/services/environment/server-environment';
import { createStripeSession } from '~/services/payments/stripe';

function londonNow(): { date: string; hour: number; weekday: number } {
  const now = new Date();
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', hour: '2-digit', hour12: false, weekday: 'short' }).formatToParts(now).map((p) => [p.type, p.value]));
  const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(parts.weekday);
  return { date: now.toLocaleDateString('en-CA', { timeZone: 'Europe/London' }), hour: Number(parts.hour) % 24, weekday };
}

async function loadVariants(db: D1Database, ids: number[]): Promise<Map<number, PricedVariant>> {
  const marks = ids.map((_, i) => `?${i + 1}`).join(',');
  const { results } = await db
    .prepare(`SELECT v.id, p.name AS product_name, v.label, v.price_pence FROM product_variants v JOIN products p ON p.slug = v.product_slug WHERE p.published = 1 AND v.id IN (${marks})`)
    .bind(...ids)
    .all<{ id: number; product_name: string; label: string; price_pence: number }>();
  return new Map(results.map((r) => [r.id, { id: r.id, productName: r.product_name, label: r.label, pricePence: r.price_pence }]));
}

export const startCheckout = createServerFn({ method: 'POST' })
  .validator(checkoutRequestSchema)
  .handler(async ({ data }: { data: CheckoutRequest }) => {
    const env = getServerEnvironment();
    if (!isDeliverablePostcode(data.postcode)) return { error: 'Sorry, we only deliver to Liverpool postcodes L1–L8, L11–L19, L24–L28, L36 and L70.' } as const;
    if (!isSlotAvailable(data.slot, data.deliveryDate, londonNow())) return { error: `${SLOT_LABEL[data.slot]} delivery is not available for that date or time.` } as const;
    const priced = priceCart(data.lines, await loadVariants(env.DB, data.lines.map((l) => l.variantId)), data.slot);
    if (!priced) return { error: 'An item in your basket is no longer available.' } as const;

    const pendingId = crypto.randomUUID();
    await env.DB.prepare('INSERT INTO pending_checkouts (id, payload, created_at) VALUES (?1, ?2, ?3)')
      .bind(pendingId, JSON.stringify({ request: data, priced }), new Date().toISOString()).run();
    const url = await createStripeSession({
      secretKey: requireSetting(env.STRIPE_SECRET_KEY, 'STRIPE_SECRET_KEY'),
      pendingId,
      customerEmail: data.customerEmail,
      successUrl: `${env.SITE_ORIGIN}/thanks`,
      cancelUrl: `${env.SITE_ORIGIN}/cart`,
      items: [
        ...priced.lines.map((l) => ({ name: `${l.productName} (${l.variant})`, unitAmountPence: l.unitPricePence, quantity: l.quantity })),
        { name: `${SLOT_LABEL[data.slot]} delivery`, unitAmountPence: SLOT_FEE_PENCE[data.slot], quantity: 1 },
      ],
    });
    return { url } as const;
  });

/** Webhook side: pending checkout -> paid order. Idempotent on the pending id (Stripe retries). */
export async function completePendingCheckout(env: ServerEnvironment, pendingId: string, amountTotal: number): Promise<'created' | 'duplicate' | 'unknown' | 'amount_mismatch'> {
  const row = await env.DB.prepare('SELECT payload FROM pending_checkouts WHERE id = ?1').bind(pendingId).first<{ payload: string }>();
  if (!row) return 'duplicate';
  const { request, priced } = JSON.parse(row.payload) as { request: CheckoutRequest; priced: NonNullable<ReturnType<typeof priceCart>> };
  if (priced.totalPence !== amountTotal) return 'amount_mismatch';
  const created = await insertOrders(env.DB, 'stripe', [{
    externalRef: pendingId, customerEmail: request.customerEmail, recipientName: request.recipientName, recipientPhone: request.recipientPhone,
    addressLine1: request.addressLine1, addressLine2: request.addressLine2, city: 'Liverpool', postcode: request.postcode.toUpperCase(),
    deliveryDate: request.deliveryDate, slot: request.slot, giftMessage: request.giftMessage,
    lines: priced.lines.map((l) => ({ productName: l.variant ? `${l.productName} (${l.variant})` : l.productName, quantity: l.quantity, unitPricePence: l.unitPricePence })),
    totalPence: priced.totalPence,
  }]);
  await env.DB.prepare('DELETE FROM pending_checkouts WHERE id = ?1').bind(pendingId).run();
  return created ? 'created' : 'unknown';
}
