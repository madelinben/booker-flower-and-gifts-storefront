export const ORDER_STATUSES = ['PAID', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED', 'REFUNDED'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PAID: 'Paid',
  PREPARING: 'Preparing',
  READY: 'Ready for van',
  OUT_FOR_DELIVERY: 'Out for delivery',
  DELIVERED: 'Delivered',
  FAILED: 'Delivery failed',
  REFUNDED: 'Refunded',
};
