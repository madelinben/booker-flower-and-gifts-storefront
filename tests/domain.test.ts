import { describe, expect, it } from 'vitest';
import { canTransition } from '~/domain/order/order-transitions';
import { isDeliverablePostcode, isSlotAvailable } from '~/domain/delivery/delivery-rules';
import { parseCsv, parseOrdersCsv } from '~/domain/order/csv-orders';
import { safeNextPath } from '~/utilities/safe-next-path';

describe('order transitions', () => {
  it('moves forward, allows retry after failure, and locks refunds', () => {
    expect(canTransition('READY', 'OUT_FOR_DELIVERY')).toBe(true);
    expect(canTransition('FAILED', 'READY')).toBe(true);
    expect(canTransition('PAID', 'DELIVERED')).toBe(false);
    expect(canTransition('REFUNDED', 'PAID')).toBe(false);
  });
});

describe('delivery rules', () => {
  it('serves the published Liverpool districts only', () => {
    for (const ok of ['L18 4QY', 'l1 1aa', 'L36 9XX', 'L70 1AB', 'L28 2ZZ']) expect(isDeliverablePostcode(ok), ok).toBe(true);
    for (const no of ['L9 1AA', 'L20 1AA', 'L37 1AA', 'M1 1AA', 'CH41 1AA', '']) expect(isDeliverablePostcode(no), no).toBe(false);
  });
  it('same day needs today, before 2pm, not Sunday', () => {
    const now = { date: '2026-10-08', hour: 13, weekday: 4 };
    expect(isSlotAvailable('same_day', '2026-10-08', now)).toBe(true);
    expect(isSlotAvailable('same_day', '2026-10-08', { ...now, hour: 14 })).toBe(false);
    expect(isSlotAvailable('same_day', '2026-10-09', now)).toBe(false);
    expect(isSlotAvailable('standard', '2026-10-07', now)).toBe(false);
  });
});

describe('orders csv', () => {
  const header = 'external_ref,customer_email,recipient_name,address_line1,postcode,delivery_date,slot,gift_message,items';
  it('parses quotes, commas and newlines', () => {
    expect(parseCsv('a,"b,""c""",d\r\n"x\ny",,z\n')).toEqual([['a', 'b,"c"', 'd'], ['x\ny', '', 'z']]);
  });
  it('imports valid rows with totals and reports bad ones by line', () => {
    const csv = [
      header,
      'A1,a@x.co,Jo Bloggs,1 Rose St,l18 4qy,2026-10-09,morning,"Love, Sam",Petals of Pink Joy:1:55.00;Chocolates:2:6.50',
      'A1,a@x.co,Dup,1 Rose St,L18 4QY,2026-10-09,standard,,Roses:1:50',
      'A3,not-an-email,Jo,1 Rose St,L18 4QY,2026-10-09,standard,,Roses:1:50',
      'A4,a@x.co,Jo,1 Rose St,L18 4QY,9th Oct,standard,,Roses:1:50',
    ].join('\n');
    const { orders, errors } = parseOrdersCsv(csv);
    expect(orders).toHaveLength(1);
    expect(orders[0]).toMatchObject({ postcode: 'L18 4QY', giftMessage: 'Love, Sam', totalPence: 6800, slot: 'morning' });
    expect(errors.map((e) => e.line)).toEqual([3, 4, 5]);
  });
  it('rejects an empty file', () => expect(parseOrdersCsv('').errors).toHaveLength(1));
});

describe('safeNextPath', () => {
  it('only keeps same-site paths', () => {
    expect(safeNextPath('/driver')).toBe('/driver');
    for (const bad of ['//evil.com', 'https://evil.com', '/\\evil', null]) expect(safeNextPath(bad)).toBe('/admin/orders');
  });
});

import { priceCart } from '~/domain/checkout/price-cart';
import { signStripePayload, verifyStripeSignature } from '~/services/payments/stripe';

describe('priceCart', () => {
  const variants = new Map([[1, { id: 1, productName: 'Roses', label: 'Standard', pricePence: 5500 }]]);
  it('prices from the database and adds the slot fee', () => {
    expect(priceCart([{ variantId: 1, quantity: 2 }], variants, 'morning')).toMatchObject({ subtotalPence: 11000, deliveryPence: 1250, totalPence: 12250 });
  });
  it('rejects unknown variants', () => expect(priceCart([{ variantId: 9, quantity: 1 }], variants, 'standard')).toBeNull());
});

describe('stripe signature', () => {
  it('accepts a valid signature and rejects tampering and replays', async () => {
    const t = 1_800_000_000;
    const sig = await signStripePayload('whsec_test', t, '{"a":1}');
    const header = `t=${t},v1=${sig}`;
    expect(await verifyStripeSignature('{"a":1}', header, 'whsec_test', t + 10)).toBe(true);
    expect(await verifyStripeSignature('{"a":2}', header, 'whsec_test', t + 10)).toBe(false);
    expect(await verifyStripeSignature('{"a":1}', header, 'whsec_test', t + 301)).toBe(false);
    expect(await verifyStripeSignature('{"a":1}', null, 'whsec_test', t)).toBe(false);
  });
});

import { assignSections, haversineKm, pathLengthKm, planRoute, splitEvenly } from '~/domain/route/route-planner';

describe('route planner', () => {
  const start = { lat: 0, lng: 0 };
  const end = { lat: 0, lng: 0 };
  it('haversine: one degree of latitude is ~111 km', () => expect(haversineKm({ lat: 0, lng: 0 }, { lat: 1, lng: 0 })).toBeCloseTo(111.19, 1));
  it('visits stops along a line in order and beats a shuffled order', () => {
    const stops = [4, 1, 3, 2].map((x) => ({ lat: 0, lng: x * 0.01 }));
    const order = planRoute(start, stops, end);
    expect(order.map((i) => stops[i].lng)).toEqual([0.01, 0.02, 0.03, 0.04]);
    expect(pathLengthKm(start, order.map((i) => stops[i]), end)).toBeLessThan(pathLengthKm(start, stops, end));
  });
  it('handles zero and one stop', () => {
    expect(planRoute(start, [], end)).toEqual([]);
    expect(planRoute(start, [{ lat: 1, lng: 1 }], end)).toEqual([0]);
  });
  it('2-opt untangles a crossing', () => {
    const stops = [{ lat: 0, lng: 1 }, { lat: 1, lng: 1 }, { lat: 1, lng: 0 }, { lat: 0, lng: 0.5 }];
    const order = planRoute({ lat: 0, lng: 0 }, stops, { lat: 0, lng: 0 });
    const best = Math.min(...[[0, 1, 2, 3], [3, 2, 1, 0], [3, 0, 1, 2], [2, 1, 0, 3]].map((o) => pathLengthKm({ lat: 0, lng: 0 }, o.map((i) => stops[i]), { lat: 0, lng: 0 })));
    expect(pathLengthKm({ lat: 0, lng: 0 }, order.map((i) => stops[i]), { lat: 0, lng: 0 })).toBeLessThanOrEqual(best + 1e-6);
  });
  it('assigns sections from breaks and ignores stray breaks', () => {
    expect(assignSections([{ type: 'break' }, { type: 'stop', id: 5 }, { type: 'stop', id: 6 }, { type: 'break' }, { type: 'break' }, { type: 'stop', id: 7 }, { type: 'break' }]))
      .toEqual([{ id: 5, section: 1, position: 0 }, { id: 6, section: 1, position: 1 }, { id: 7, section: 2, position: 0 }]);
  });
  it('splits evenly', () => {
    expect(splitEvenly([1, 2, 3, 4, 5], 2)).toEqual([[1, 2, 3], [4, 5]]);
    expect(splitEvenly([1, 2], 5)).toEqual([[1], [2]]);
    expect(splitEvenly([], 3)).toEqual([[]]);
  });
});
