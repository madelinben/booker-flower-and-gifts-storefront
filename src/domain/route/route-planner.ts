export interface Point { lat: number; lng: number }

const R = 6371;
const rad = (d: number) => (d * Math.PI) / 180;

/** Great-circle km. Straight-line, not road distance. */
export function haversineKm(a: Point, b: Point): number {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function pathLengthKm(start: Point, stops: Point[], end: Point): number {
  const all = [start, ...stops, end];
  return all.slice(1).reduce((sum, p, i) => sum + haversineKm(all[i], p), 0);
}

/**
 * Order of `stops` indexes for the shortest start -> stops -> end path: nearest-neighbour seed, then 2-opt until no swap helps.
 * ponytail: straight-line distances, heuristic not optimal (fine for a van's few dozen stops). Swap in Google Routes
 * `optimizeWaypointOrder` if road-distance accuracy matters.
 */
export function planRoute(start: Point, stops: Point[], end: Point): number[] {
  const left = stops.map((_, i) => i);
  const order: number[] = [];
  let here = start;
  while (left.length) {
    let best = 0;
    for (let k = 1; k < left.length; k++) if (haversineKm(here, stops[left[k]]) < haversineKm(here, stops[left[best]])) best = k;
    const [next] = left.splice(best, 1);
    order.push(next);
    here = stops[next];
  }
  const d = (order: number[]) => pathLengthKm(start, order.map((i) => stops[i]), end);
  let improved = true;
  while (improved) {
    improved = false;
    for (let i = 0; i < order.length - 1; i++) {
      for (let j = i + 1; j < order.length; j++) {
        const candidate = [...order.slice(0, i), ...order.slice(i, j + 1).reverse(), ...order.slice(j + 1)];
        if (d(candidate) < d(order) - 1e-9) { order.splice(0, order.length, ...candidate); improved = true; }
      }
    }
  }
  return order;
}

export type RouteItem = { type: 'stop'; id: number } | { type: 'break' };

/** Flat driver-edited list (stops plus section breaks) -> section/position per stop. Leading, trailing and doubled breaks are ignored. */
export function assignSections(items: RouteItem[]): { id: number; section: number; position: number }[] {
  const out: { id: number; section: number; position: number }[] = [];
  let section = 1;
  let position = 0;
  for (const item of items) {
    if (item.type === 'break') {
      if (position > 0) { section++; position = 0; }
    } else out.push({ id: item.id, section, position: position++ });
  }
  return out;
}

/** Cut an ordered stop list into `count` near-equal consecutive sections (extra stops go to the earliest sections). */
export function splitEvenly<T>(stops: T[], count: number): T[][] {
  const n = Math.max(1, Math.min(count, stops.length || 1));
  const base = Math.floor(stops.length / n);
  const extra = stops.length % n;
  const out: T[][] = [];
  let at = 0;
  for (let i = 0; i < n; i++) {
    const size = base + (i < extra ? 1 : 0);
    out.push(stops.slice(at, at + size));
    at += size;
  }
  return out;
}
