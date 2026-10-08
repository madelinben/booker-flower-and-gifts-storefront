import { mkdtempSync, readdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { getPlatformProxy } from 'wrangler';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { getOrder, insertOrders, listOrders, markDateReady, updateOrderStatus } from '~/data/Order/order-dal';
import { completeStop, createRoute, getRoute, saveLayout } from '~/data/Route/route-dal';
import { getProduct, listProducts, saveProduct } from '~/data/Catalog/catalog-dal';
import { parseOrdersCsv } from '~/domain/order/csv-orders';

let db: D1Database;
let dispose: () => Promise<void>;

beforeAll(async () => {
  // Real local D1 (miniflare) in a throwaway dir: the dev database is never touched.
  const proxy = await getPlatformProxy<{ DB: D1Database }>({ persist: { path: mkdtempSync(join(tmpdir(), 'booker-d1-')) } });
  db = proxy.env.DB;
  dispose = proxy.dispose;
  for (const file of readdirSync('migrations').sort()) {
    for (const statement of readFileSync(join('migrations', file), 'utf8').split(/;\s*\n/).map((s) => s.trim()).filter(Boolean)) await db.prepare(statement).run();
  }
}, 60_000);
afterAll(() => dispose());

const csv = readFileSync('docs/sample-orders.csv', 'utf8');

describe('orders', () => {
  it('imports the sample CSV once; a re-import adds nothing and does not double lines', async () => {
    const { orders, errors } = parseOrdersCsv(csv);
    expect(errors).toEqual([]);
    expect(await insertOrders(db, 'csv', orders)).toBe(5);
    expect(await insertOrders(db, 'csv', orders)).toBe(0);
    const all = await listOrders(db, { date: '2026-10-09' });
    expect(all).toHaveLength(5);
    const two = all.find((o) => o.externalRef === 'TEST-1002')!;
    const detail = await getOrder(db, two.id);
    expect(detail!.lines).toHaveLength(2);
    expect(detail!.totalPence).toBe(7150);
  });

  it('moves status optimistically: stale or illegal moves are refused', async () => {
    const [o] = await listOrders(db, { status: 'PAID' });
    expect(await updateOrderStatus(db, o.id, 'PAID', 'DELIVERED')).toBe(false);
    expect(await updateOrderStatus(db, o.id, 'PAID', 'PREPARING')).toBe(true);
    expect(await updateOrderStatus(db, o.id, 'PAID', 'READY')).toBe(false); // already PREPARING
  });

  it('marks a date ready', async () => {
    expect(await markDateReady(db, '2026-10-09')).toBe(5);
    expect(await listOrders(db, { status: 'READY' })).toHaveLength(5);
  });
});

describe('routes', () => {
  it('stores layout from drag-and-drop with section breaks and records results once', async () => {
    const ready = await listOrders(db, { status: 'READY' });
    const base = { driverEmail: 'Driver@Example.com', routeDate: '2026-10-09', startLabel: 'Shop', startLat: 53.37, startLng: -2.9, endLabel: 'Shop', endLat: 53.37, endLng: -2.9 };
    const id = await createRoute(db, base, ready.map((o) => o.id));
    const route = (await getRoute(db, id))!;
    expect(route.driverEmail).toBe('driver@example.com');
    const ids = route.stops.map((s) => s.id);

    await saveLayout(db, id, [{ type: 'stop', id: ids[2] }, { type: 'stop', id: ids[0] }, { type: 'break' }, { type: 'stop', id: ids[1] }, { type: 'stop', id: ids[3] }, { type: 'stop', id: ids[4] }]);
    const after = (await getRoute(db, id))!.stops;
    expect(after.map((s) => [s.id, s.section, s.position])).toEqual([[ids[2], 1, 0], [ids[0], 1, 1], [ids[1], 2, 0], [ids[3], 2, 1], [ids[4], 2, 2]]);

    expect(await completeStop(db, ids[2], 'DELIVERED', 'left with neighbour')).toBe(true);
    expect(await completeStop(db, ids[2], 'FAILED', '')).toBe(false);
  });
});

describe('catalogue', () => {
  it('lists seeded products with from-prices and saves edits with new variants', async () => {
    const list = await listProducts(db);
    expect(list.find((p) => p.slug === 'petals-of-pink-joy')!.fromPence).toBe(5500);
    await saveProduct(db, { slug: 'petals-of-pink-joy', name: 'Petals of Pink Joy', description: 'x', categorySlug: 'hand-tied', imageUrl: null, published: false, variants: [{ label: 'Only', pricePence: 4000 }] });
    expect(await getProduct(db, 'petals-of-pink-joy')).toBeNull(); // hidden
    expect((await getProduct(db, 'petals-of-pink-joy', true))!.variants).toEqual([expect.objectContaining({ label: 'Only', pricePence: 4000 })]);
  });
});
