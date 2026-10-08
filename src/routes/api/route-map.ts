import { createFileRoute } from '@tanstack/react-router';
import { getRoute } from '~/data/Route/route-dal';
import { getCurrentStaff } from '~/services/auth/current-staff';
import { getServerEnvironment } from '~/services/environment/server-environment';
import { fetchStaticMap } from '~/services/maps/google-maps';

export const Route = createFileRoute('/api/route-map')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const env = getServerEnvironment();
        const staff = await getCurrentStaff();
        const id = Number(new URL(request.url).searchParams.get('id'));
        if (!staff || (staff.role !== 'driver' && staff.role !== 'admin') || !Number.isInteger(id) || !env.GOOGLE_MAPS_API_KEY) return new Response('Not found', { status: 404 });
        const route = await getRoute(env.DB, id);
        if (!route || (staff.role === 'driver' && route.driverEmail.toLowerCase() !== staff.email.toLowerCase())) return new Response('Not found', { status: 404 });
        const points = [{ lat: route.startLat, lng: route.startLng }, ...route.stops.filter((s) => s.lat !== null && s.lng !== null).map((s) => ({ lat: s.lat!, lng: s.lng! })), { lat: route.endLat, lng: route.endLng }];
        const res = await fetchStaticMap(points, env.GOOGLE_MAPS_API_KEY);
        return new Response(res.body, { status: res.status, headers: { 'Content-Type': res.headers.get('content-type') ?? 'image/png', 'Cache-Control': 'private, no-store' } });
      },
    },
  },
});
