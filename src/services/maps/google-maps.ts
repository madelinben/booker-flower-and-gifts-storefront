import type { Point } from '~/domain/route/route-planner';

/** Geocode a UK address with Google Geocoding; null when Google finds nothing. Throws on HTTP/quota errors. */
export async function geocode(address: string, apiKey: string): Promise<Point | null> {
  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
  url.search = new URLSearchParams({ address, region: 'uk', components: 'country:GB', key: apiKey }).toString();
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Geocoding failed with status ${res.status}.`);
  const json = (await res.json()) as { status: string; results: { geometry: { location: { lat: number; lng: number } } }[] };
  if (json.status === 'ZERO_RESULTS') return null;
  if (json.status !== 'OK') throw new Error(`Geocoding returned ${json.status}.`);
  return json.results[0].geometry.location;
}

/** Static map PNG with a path and lettered pins. Fetched server-side so the key never reaches the browser. */
export async function fetchStaticMap(points: Point[], apiKey: string): Promise<Response> {
  const url = new URL('https://maps.googleapis.com/maps/api/staticmap');
  const params = new URLSearchParams({ size: '640x400', scale: '2', key: apiKey });
  params.append('path', `color:0x1f3a2eff|weight:3|${points.map((p) => `${p.lat},${p.lng}`).join('|')}`);
  points.slice(0, 60).forEach((p, i) => params.append('markers', `color:0xb3202a|label:${i === 0 ? 'S' : String(i % 10)}|${p.lat},${p.lng}`));
  url.search = params.toString();
  return fetch(url);
}

/**
 * Google Maps directions deep link for the driver's phone.
 * ponytail: Maps URLs take ~9 waypoints; longer sections link their first 9 stops. Split the section or chunk links if drivers need more.
 */
export function directionsUrl(origin: Point, stops: Point[], destination: Point): string {
  const q = (p: Point) => `${p.lat},${p.lng}`;
  const url = new URL('https://www.google.com/maps/dir/');
  url.searchParams.set('api', '1');
  url.searchParams.set('origin', q(origin));
  url.searchParams.set('destination', q(destination));
  if (stops.length) url.searchParams.set('waypoints', stops.slice(0, 9).map(q).join('|'));
  url.searchParams.set('travelmode', 'driving');
  return url.toString();
}
