export const DELIVERY_SLOTS = ['standard', 'same_day', 'morning'] as const;
export type DeliverySlot = (typeof DELIVERY_SLOTS)[number];

export const SLOT_FEE_PENCE: Record<DeliverySlot, number> = { standard: 750, same_day: 1000, morning: 1250 };
export const SLOT_LABEL: Record<DeliverySlot, string> = { standard: 'Standard', same_day: 'Same day', morning: 'Guaranteed morning' };
export const SAME_DAY_CUTOFF_HOUR = 14;

// Liverpool postcode districts served by our vans (live site: L1–L8, L11–L19, L24–L28, L36, L70).
const RANGES: readonly (readonly [number, number])[] = [[1, 8], [11, 19], [24, 28], [36, 36], [70, 70]];

/** District number for an `L` postcode ("L18 4QY" -> 18), or null when it is not a Liverpool L postcode. */
export function liverpoolDistrict(postcode: string): number | null {
  const match = /^L(\d{1,2})\s*\d[A-Z]{2}$/.exec(postcode.trim().toUpperCase());
  return match ? Number(match[1]) : null;
}

export function isDeliverablePostcode(postcode: string): boolean {
  const district = liverpoolDistrict(postcode);
  return district !== null && RANGES.some(([lo, hi]) => district >= lo && district <= hi);
}

/** Same day is only offered Mon–Sat before 2pm local time on the delivery date itself. */
export function isSlotAvailable(slot: DeliverySlot, deliveryDate: string, now: { date: string; hour: number; weekday: number }): boolean {
  if (slot !== 'same_day') return deliveryDate >= now.date;
  return deliveryDate === now.date && now.hour < SAME_DAY_CUTOFF_HOUR && now.weekday !== 0;
}
