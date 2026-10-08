import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { getOrder, insertOrders, listOrders, updateOrderStatus } from '~/data/Order/order-dal';
import { parseOrdersCsv } from '~/domain/order/csv-orders';
import { ORDER_STATUSES } from '~/domain/order/order-status';
import { requireStaff } from '~/services/auth/current-staff';
import { getServerEnvironment } from '~/services/environment/server-environment';
import { notifyCustomer } from '~/services/notifications/notify-customer';

export const fetchOrders = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), status: z.enum(ORDER_STATUSES).optional() }))
  .handler(async ({ data }) => {
    await requireStaff('admin');
    return listOrders(getServerEnvironment().DB, data);
  });

export const fetchOrder = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ id: z.number().int() }))
  .handler(async ({ data }) => {
    await requireStaff('admin');
    return getOrder(getServerEnvironment().DB, data.id);
  });

export const changeOrderStatus = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.number().int(), from: z.enum(ORDER_STATUSES), to: z.enum(ORDER_STATUSES) }))
  .handler(async ({ data }) => {
    await requireStaff('admin');
    const env = getServerEnvironment();
    const moved = await updateOrderStatus(env.DB, data.id, data.from, data.to);
    if (moved) {
      const order = await getOrder(env.DB, data.id);
      if (order) await notifyCustomer(env, order, data.to);
    }
    return { moved };
  });

const importInput = z.object({ csv: z.string().max(1_000_000), commit: z.boolean() });

/** Preview (commit=false) parses and reports; commit=true inserts the valid rows. Bad rows are never inserted. */
export const importOrdersCsv = createServerFn({ method: 'POST' })
  .inputValidator(importInput)
  .handler(async ({ data }) => {
    await requireStaff('admin');
    const preview = parseOrdersCsv(data.csv);
    const created = data.commit ? await insertOrders(getServerEnvironment().DB, 'csv', preview.orders) : 0;
    return { total: preview.orders.length, created, errors: preview.errors, sample: preview.orders.slice(0, 5) };
  });
