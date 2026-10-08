import type { CsvOrder } from '~/domain/order/csv-orders';
import type { OrderStatus } from '~/domain/order/order-status';
import { canTransition } from '~/domain/order/order-transitions';

export interface OrderLine { productName: string; variant: string; quantity: number; unitPricePence: number }
export interface OrderSummary {
  id: number; source: 'stripe' | 'csv'; externalRef: string; status: OrderStatus; customerEmail: string; recipientName: string; recipientPhone: string;
  addressLine1: string; addressLine2: string; city: string; postcode: string; lat: number | null; lng: number | null;
  deliveryDate: string; slot: 'standard' | 'same_day' | 'morning'; giftMessage: string; totalPence: number; createdAt: string;
}
export interface OrderDetail extends OrderSummary { lines: OrderLine[] }

interface OrderRow {
  id: number; source: 'stripe' | 'csv'; external_ref: string; status: OrderStatus; customer_email: string; recipient_name: string; recipient_phone: string;
  address_line1: string; address_line2: string; city: string; postcode: string; lat: number | null; lng: number | null;
  delivery_date: string; slot: OrderSummary['slot']; gift_message: string; total_pence: number; created_at: string;
}
const COLUMNS = 'id, source, external_ref, status, customer_email, recipient_name, recipient_phone, address_line1, address_line2, city, postcode, lat, lng, delivery_date, slot, gift_message, total_pence, created_at';

export const toOrder = (r: OrderRow): OrderSummary => ({
  id: r.id, source: r.source, externalRef: r.external_ref, status: r.status, customerEmail: r.customer_email, recipientName: r.recipient_name,
  recipientPhone: r.recipient_phone, addressLine1: r.address_line1, addressLine2: r.address_line2, city: r.city, postcode: r.postcode,
  lat: r.lat, lng: r.lng, deliveryDate: r.delivery_date, slot: r.slot, giftMessage: r.gift_message, totalPence: r.total_pence, createdAt: r.created_at,
});

/**
 * Idempotent: re-importing the same (source, external_ref) is a no-op. Lines are attached only to orders that have none yet,
 * so a repeat run cannot double them. Returns how many orders were new.
 */
export async function insertOrders(db: D1Database, source: 'stripe' | 'csv', orders: CsvOrder[], now = new Date().toISOString()): Promise<number> {
  if (orders.length === 0) return 0;
  const statements = orders.flatMap((o) => [
    db
      .prepare(
        `INSERT INTO orders (source, external_ref, status, customer_email, recipient_name, recipient_phone, address_line1, address_line2, city, postcode, delivery_date, slot, gift_message, total_pence, created_at, updated_at)
         VALUES (?1, ?2, 'PAID', ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?14) ON CONFLICT (source, external_ref) DO NOTHING`,
      )
      .bind(source, o.externalRef, o.customerEmail, o.recipientName, o.recipientPhone, o.addressLine1, o.addressLine2, o.city, o.postcode, o.deliveryDate, o.slot, o.giftMessage, o.totalPence, now),
    ...o.lines.map((l) =>
      db
        .prepare(
          `INSERT INTO order_lines (order_id, product_name, variant, quantity, unit_price_pence)
           SELECT id, ?3, '', ?4, ?5 FROM orders WHERE source = ?1 AND external_ref = ?2
             AND NOT EXISTS (SELECT 1 FROM order_lines WHERE order_id = orders.id AND product_name = ?3)`,
        )
        .bind(source, o.externalRef, l.productName, l.quantity, l.unitPricePence),
    ),
  ]);
  const results = await db.batch(statements);
  let created = 0;
  let cursor = 0;
  for (const o of orders) {
    created += results[cursor]?.meta.changes ?? 0;
    cursor += 1 + o.lines.length;
  }
  return created;
}

export async function listOrders(db: D1Database, filter: { date?: string; status?: OrderStatus } = {}): Promise<OrderSummary[]> {
  const where: string[] = [];
  const binds: string[] = [];
  if (filter.date) { binds.push(filter.date); where.push(`delivery_date = ?${binds.length}`); }
  if (filter.status) { binds.push(filter.status); where.push(`status = ?${binds.length}`); }
  const sql = `SELECT ${COLUMNS} FROM orders ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY delivery_date DESC, id DESC LIMIT 500`;
  const { results } = await db.prepare(sql).bind(...binds).all<OrderRow>();
  return results.map(toOrder);
}

export async function getOrder(db: D1Database, id: number): Promise<OrderDetail | null> {
  const row = await db.prepare(`SELECT ${COLUMNS} FROM orders WHERE id = ?1`).bind(id).first<OrderRow>();
  if (!row) return null;
  const { results } = await db
    .prepare('SELECT product_name, variant, quantity, unit_price_pence FROM order_lines WHERE order_id = ?1 ORDER BY id')
    .bind(id)
    .all<{ product_name: string; variant: string; quantity: number; unit_price_pence: number }>();
  return { ...toOrder(row), lines: results.map((l) => ({ productName: l.product_name, variant: l.variant, quantity: l.quantity, unitPricePence: l.unit_price_pence })) };
}

/** Optimistic: only moves the order if it is still in `from`, so two staff cannot both win a race. */
export async function updateOrderStatus(db: D1Database, id: number, from: OrderStatus, to: OrderStatus, now = new Date().toISOString()): Promise<boolean> {
  if (!canTransition(from, to)) return false;
  const res = await db.prepare('UPDATE orders SET status = ?1, updated_at = ?2 WHERE id = ?3 AND status = ?4').bind(to, now, id, from).run();
  return res.meta.changes === 1;
}

export async function setOrderCoordinates(db: D1Database, id: number, lat: number, lng: number): Promise<void> {
  await db.prepare('UPDATE orders SET lat = ?1, lng = ?2 WHERE id = ?3').bind(lat, lng, id).run();
}

/** Admin shortcut: everything still being prepared for a delivery date becomes READY for the van. Returns rows moved. */
export async function markDateReady(db: D1Database, date: string, now = new Date().toISOString()): Promise<number> {
  const res = await db.prepare("UPDATE orders SET status = 'READY', updated_at = ?1 WHERE delivery_date = ?2 AND status IN ('PAID', 'PREPARING')").bind(now, date).run();
  return res.meta.changes;
}
