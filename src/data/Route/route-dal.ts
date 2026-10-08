import type { RouteItem } from '~/domain/route/route-planner';
import { assignSections } from '~/domain/route/route-planner';

export interface RouteSummary { id: number; driverEmail: string; routeDate: string; startLabel: string; startLat: number; startLng: number; endLabel: string; endLat: number; endLng: number }
export interface Stop {
  id: number; orderId: number; section: number; position: number; status: 'PENDING' | 'DELIVERED' | 'FAILED'; note: string; photoKey: string | null;
  recipientName: string; recipientPhone: string; addressLine1: string; addressLine2: string; postcode: string; giftMessage: string; lat: number | null; lng: number | null; externalRef: string;
}
export interface RouteDetail extends RouteSummary { stops: Stop[] }

interface RouteRow { id: number; driver_email: string; route_date: string; start_label: string; start_lat: number; start_lng: number; end_label: string; end_lat: number; end_lng: number }
const toRoute = (r: RouteRow): RouteSummary => ({
  id: r.id, driverEmail: r.driver_email, routeDate: r.route_date, startLabel: r.start_label, startLat: r.start_lat, startLng: r.start_lng, endLabel: r.end_label, endLat: r.end_lat, endLng: r.end_lng,
});
const ROUTE_COLS = 'id, driver_email, route_date, start_label, start_lat, start_lng, end_label, end_lat, end_lng';

export async function listRoutes(db: D1Database, driverEmail: string | null, date?: string): Promise<RouteSummary[]> {
  const where: string[] = [];
  const binds: string[] = [];
  if (driverEmail) { binds.push(driverEmail.toLowerCase()); where.push(`driver_email = ?${binds.length}`); }
  if (date) { binds.push(date); where.push(`route_date = ?${binds.length}`); }
  const { results } = await db.prepare(`SELECT ${ROUTE_COLS} FROM routes ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY id DESC LIMIT 50`).bind(...binds).all<RouteRow>();
  return results.map(toRoute);
}

export async function getRoute(db: D1Database, id: number): Promise<RouteDetail | null> {
  const row = await db.prepare(`SELECT ${ROUTE_COLS} FROM routes WHERE id = ?1`).bind(id).first<RouteRow>();
  if (!row) return null;
  const { results } = await db
    .prepare(
      `SELECT s.id, s.order_id, s.section, s.position, s.status, s.note, s.photo_key, o.recipient_name, o.recipient_phone, o.address_line1, o.address_line2, o.postcode, o.gift_message, o.lat, o.lng, o.external_ref
       FROM route_stops s JOIN orders o ON o.id = s.order_id WHERE s.route_id = ?1 ORDER BY s.section, s.position`,
    )
    .bind(id)
    .all<{ id: number; order_id: number; section: number; position: number; status: Stop['status']; note: string; photo_key: string | null; recipient_name: string; recipient_phone: string; address_line1: string; address_line2: string; postcode: string; gift_message: string; lat: number | null; lng: number | null; external_ref: string }>();
  return {
    ...toRoute(row),
    stops: results.map((r) => ({
      id: r.id, orderId: r.order_id, section: r.section, position: r.position, status: r.status, note: r.note, photoKey: r.photo_key, recipientName: r.recipient_name, recipientPhone: r.recipient_phone,
      addressLine1: r.address_line1, addressLine2: r.address_line2, postcode: r.postcode, giftMessage: r.gift_message, lat: r.lat, lng: r.lng, externalRef: r.external_ref,
    })),
  };
}

export async function createRoute(db: D1Database, route: Omit<RouteSummary, 'id'>, orderedOrderIds: number[], now = new Date().toISOString()): Promise<number> {
  const inserted = await db
    .prepare(`INSERT INTO routes (driver_email, route_date, start_label, start_lat, start_lng, end_label, end_lat, end_lng, created_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9) RETURNING id`)
    .bind(route.driverEmail.toLowerCase(), route.routeDate, route.startLabel, route.startLat, route.startLng, route.endLabel, route.endLat, route.endLng, now)
    .first<{ id: number }>();
  const id = inserted!.id;
  await db.batch(orderedOrderIds.map((orderId, i) => db.prepare('INSERT INTO route_stops (route_id, order_id, section, position) VALUES (?1, ?2, 1, ?3)').bind(id, orderId, i)));
  return id;
}

/** Persist the driver's drag-and-drop result. Only stops that belong to this route are touched. */
export async function saveLayout(db: D1Database, routeId: number, items: RouteItem[]): Promise<void> {
  const layout = assignSections(items);
  await db.batch(layout.map((l) => db.prepare('UPDATE route_stops SET section = ?1, position = ?2 WHERE id = ?3 AND route_id = ?4').bind(l.section, l.position, l.id, routeId)));
}

export async function getStop(db: D1Database, stopId: number): Promise<(Stop & { routeId: number; driverEmail: string }) | null> {
  const row = await db.prepare('SELECT s.route_id, r.driver_email FROM route_stops s JOIN routes r ON r.id = s.route_id WHERE s.id = ?1').bind(stopId).first<{ route_id: number; driver_email: string }>();
  if (!row) return null;
  const route = await getRoute(db, row.route_id);
  const stop = route?.stops.find((s) => s.id === stopId);
  return stop ? { ...stop, routeId: row.route_id, driverEmail: row.driver_email } : null;
}

export async function setStopPhoto(db: D1Database, stopId: number, key: string): Promise<void> {
  await db.prepare('UPDATE route_stops SET photo_key = ?1 WHERE id = ?2').bind(key, stopId).run();
}

export async function completeStop(db: D1Database, stopId: number, status: 'DELIVERED' | 'FAILED', note: string, now = new Date().toISOString()): Promise<boolean> {
  const res = await db.prepare("UPDATE route_stops SET status = ?1, note = ?2, completed_at = ?3 WHERE id = ?4 AND status = 'PENDING'").bind(status, note, now, stopId).run();
  return res.meta.changes === 1;
}
