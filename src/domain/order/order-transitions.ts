import type { OrderStatus } from '~/domain/order/order-status';

const NEXT: Record<OrderStatus, readonly OrderStatus[]> = {
  PAID: ['PREPARING', 'READY', 'REFUNDED'],
  PREPARING: ['READY', 'REFUNDED'],
  READY: ['OUT_FOR_DELIVERY', 'REFUNDED'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'FAILED'],
  FAILED: ['READY', 'REFUNDED'], // re-attempt or give up
  DELIVERED: ['REFUNDED'],
  REFUNDED: [],
};

export const canTransition = (from: OrderStatus, to: OrderStatus): boolean => NEXT[from].includes(to);
export const nextStatuses = (from: OrderStatus): readonly OrderStatus[] => NEXT[from];
