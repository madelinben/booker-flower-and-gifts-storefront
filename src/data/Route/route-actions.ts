import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { getOrder, listOrders, setOrderCoordinates, updateOrderStatus } from '~/data/Order/order-dal';
import { completeStop, createRoute, getRoute, getStop, listRoutes, saveLayout } from '~/data/Route/route-dal';
import { planRoute, splitEvenly, type RouteItem } from '~/domain/route/route-planner';
import { requireStaff } from '~/services/auth/current-staff';
import { requireSetting } from '~/services/environment/require-setting';
import { getServerEnvironment } from '~/services/environment/server-environment';
import { geocode } from '~/services/maps/google-maps';
import { notifyCustomer } from '~/services/notifications/notify-customer';

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/** Driver or admin; drivers are limited to their own routes. */
async function ownRoute(routeId: number) {
  const staff = await requireStaff('driver', 'admin');
  const env = getServerEnvironment();
  const route = await getRoute(env.DB, routeId);
  if (!route || (staff.role === 'driver' && route.driverEmail.toLowerCase() !== staff.email.toLowerCase())) throw new Response('Not found', { status: 404 });
  return { staff, env, route };
}

export const fetchLoadableOrders = createServerFn({ method: 'GET' })
  .validator(z.object({ date }))
  .handler(async ({ data }) => {
    await requireStaff('driver', 'admin');
    const all = await listOrders(getServerEnvironment().DB, { date: data.date, status: 'READY' });
    return all;
  });

export const fetchMyRoutes = createServerFn({ method: 'GET' }).handler(async () => {
  const staff = await requireStaff('driver', 'admin');
  return listRoutes(getServerEnvironment().DB, staff.role === 'driver' ? staff.email : null);
});

export const fetchDepot = createServerFn({ method: 'GET' }).handler(async () => {
  await requireStaff('driver', 'admin');
  const env = getServerEnvironment();
  return { label: env.DEPOT_LABEL ?? 'Booker Flowers, 7 Booker Avenue', lat: Number(env.DEPOT_LAT ?? 53.3697), lng: Number(env.DEPOT_LNG ?? -2.8967) };
});

const point = z.object({ label: z.string().min(1).max(120), lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) });

/** Load the van: geocode any un-located addresses, plan the shortest path, create the route and mark orders out for delivery. */
export const startRoute = createServerFn({ method: 'POST' })
  .validator(z.object({ date, orderIds: z.array(z.number().int()).min(1).max(100), start: point, end: point }))
  .handler(async ({ data }) => {
    const staff = await requireStaff('driver', 'admin');
    const env = getServerEnvironment();
    const key = requireSetting(env.GOOGLE_MAPS_API_KEY, 'GOOGLE_MAPS_API_KEY');
    const orders = (await Promise.all(data.orderIds.map((id) => getOrder(env.DB, id)))).filter((o) => o && o.status === 'READY' && o.deliveryDate === data.date);
    if (orders.length !== data.orderIds.length) return { error: 'Some orders are no longer ready for this date. Refresh and try again.' } as const;

    const failed: string[] = [];
    for (const o of orders) {
      if (!o || (o.lat !== null && o.lng !== null)) continue;
      const found = await geocode(`${o.addressLine1}, ${o.addressLine2 ? `${o.addressLine2}, ` : ''}${o.city}, ${o.postcode}`, key);
      if (found) { await setOrderCoordinates(env.DB, o.id, found.lat, found.lng); o.lat = found.lat; o.lng = found.lng; }
      else failed.push(o.externalRef);
    }
    if (failed.length) return { error: `Could not locate: ${failed.join(', ')}. Fix the addresses in admin and retry.` } as const;

    const located = orders.filter((o): o is NonNullable<typeof o> => !!o);
    const order = planRoute(data.start, located.map((o) => ({ lat: o.lat!, lng: o.lng! })), data.end);
    const routeId = await createRoute(env.DB, { driverEmail: staff.email, routeDate: data.date, startLabel: data.start.label, startLat: data.start.lat, startLng: data.start.lng, endLabel: data.end.label, endLat: data.end.lat, endLng: data.end.lng }, order.map((i) => located[i].id));
    for (const o of located) {
      if (await updateOrderStatus(env.DB, o.id, 'READY', 'OUT_FOR_DELIVERY')) await notifyCustomer(env, { ...o, status: 'OUT_FOR_DELIVERY' }, 'OUT_FOR_DELIVERY');
    }
    return { routeId } as const;
  });

export const fetchRoute = createServerFn({ method: 'GET' })
  .validator(z.object({ id: z.number().int() }))
  .handler(async ({ data }) => (await ownRoute(data.id)).route);

const item = z.union([z.object({ type: z.literal('stop'), id: z.number().int() }), z.object({ type: z.literal('break') })]);

export const saveRouteLayout = createServerFn({ method: 'POST' })
  .validator(z.object({ routeId: z.number().int(), items: z.array(item).max(300) }))
  .handler(async ({ data }) => {
    const { env } = await ownRoute(data.routeId);
    await saveLayout(env.DB, data.routeId, data.items as RouteItem[]);
    return { ok: true };
  });

/** Re-run the planner over all still-pending stops, then cut into `sections` consecutive sections. Completed stops stay first. */
export const optimiseRoute = createServerFn({ method: 'POST' })
  .validator(z.object({ routeId: z.number().int(), sections: z.number().int().min(1).max(10) }))
  .handler(async ({ data }) => {
    const { env, route } = await ownRoute(data.routeId);
    const done = route.stops.filter((s) => s.status !== 'PENDING');
    const pending = route.stops.filter((s) => s.status === 'PENDING' && s.lat !== null && s.lng !== null);
    const start = done.length ? { lat: done[done.length - 1].lat ?? route.startLat, lng: done[done.length - 1].lng ?? route.startLng } : { lat: route.startLat, lng: route.startLng };
    const order = planRoute(start, pending.map((s) => ({ lat: s.lat!, lng: s.lng! })), { lat: route.endLat, lng: route.endLng }).map((i) => pending[i]);
    const items: RouteItem[] = done.map((s) => ({ type: 'stop', id: s.id }));
    splitEvenly(order, data.sections).forEach((chunk, i) => {
      if (i > 0) items.push({ type: 'break' });
      chunk.forEach((s) => items.push({ type: 'stop', id: s.id }));
    });
    await saveLayout(env.DB, data.routeId, items);
    return { ok: true };
  });

export const finishStop = createServerFn({ method: 'POST' })
  .validator(z.object({ stopId: z.number().int(), result: z.enum(['DELIVERED', 'FAILED']), note: z.string().max(500).default('') }))
  .handler(async ({ data }) => {
    const staff = await requireStaff('driver', 'admin');
    const env = getServerEnvironment();
    const stop = await getStop(env.DB, data.stopId);
    if (!stop || (staff.role === 'driver' && stop.driverEmail.toLowerCase() !== staff.email.toLowerCase())) throw new Response('Not found', { status: 404 });
    if (!(await completeStop(env.DB, data.stopId, data.result, data.note))) return { ok: false } as const;
    if (await updateOrderStatus(env.DB, stop.orderId, 'OUT_FOR_DELIVERY', data.result)) {
      const order = await getOrder(env.DB, stop.orderId);
      if (order) await notifyCustomer(env, order, data.result, { note: data.note || undefined, photoUrl: stop.photoKey ? `${env.SITE_ORIGIN}/photos/${stop.photoKey}` : undefined });
    }
    return { ok: true } as const;
  });
