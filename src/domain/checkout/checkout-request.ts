import { z } from 'zod';
import { DELIVERY_SLOTS } from '~/domain/delivery/delivery-rules';

export const checkoutRequestSchema = z.object({
  lines: z.array(z.object({ variantId: z.number().int().positive(), quantity: z.number().int().min(1).max(20) })).min(1).max(30),
  customerEmail: z.email(),
  recipientName: z.string().trim().min(1).max(100),
  recipientPhone: z.string().trim().max(30).default(''),
  addressLine1: z.string().trim().min(1).max(120),
  addressLine2: z.string().trim().max(120).default(''),
  postcode: z.string().trim().min(5).max(9),
  deliveryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  slot: z.enum(DELIVERY_SLOTS),
  giftMessage: z.string().trim().max(300).default(''),
});
export type CheckoutRequest = z.infer<typeof checkoutRequestSchema>;
