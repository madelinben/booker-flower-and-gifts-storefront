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
