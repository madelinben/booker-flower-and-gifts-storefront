import { SLOT_FEE_PENCE, type DeliverySlot } from '~/domain/delivery/delivery-rules';

export interface PricedVariant { id: number; productName: string; label: string; pricePence: number }
export interface PricedLine { productName: string; variant: string; quantity: number; unitPricePence: number }

/** Prices come from the database, never the browser. Unknown variant ids make the whole cart invalid (null). */
export function priceCart(
  lines: { variantId: number; quantity: number }[],
  variants: Map<number, PricedVariant>,
  slot: DeliverySlot,
): { lines: PricedLine[]; subtotalPence: number; deliveryPence: number; totalPence: number } | null {
  const priced: PricedLine[] = [];
  for (const l of lines) {
    const v = variants.get(l.variantId);
    if (!v) return null;
    priced.push({ productName: v.productName, variant: v.label, quantity: l.quantity, unitPricePence: v.pricePence });
  }
  const subtotalPence = priced.reduce((s, l) => s + l.quantity * l.unitPricePence, 0);
  const deliveryPence = SLOT_FEE_PENCE[slot];
  return { lines: priced, subtotalPence, deliveryPence, totalPence: subtotalPence + deliveryPence };
}
