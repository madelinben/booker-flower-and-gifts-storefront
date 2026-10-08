import { createFileRoute } from '@tanstack/react-router';
import { getStop, setStopPhoto } from '~/data/Route/route-dal';
import { getCurrentStaff } from '~/services/auth/current-staff';
import { getServerEnvironment } from '~/services/environment/server-environment';

const MAX_BYTES = 8 * 1024 * 1024;
const TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

export const Route = createFileRoute('/api/stop-photo')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const env = getServerEnvironment();
        if (request.headers.get('origin') !== env.SITE_ORIGIN) return new Response('Forbidden', { status: 403 });
        const staff = await getCurrentStaff();
        if (!staff || (staff.role !== 'driver' && staff.role !== 'admin')) return new Response('Forbidden', { status: 403 });

        const form = await request.formData();
        const stopId = Number(form.get('stopId'));
        const file = form.get('photo');
        if (!Number.isInteger(stopId) || !(file instanceof File)) return new Response('Bad request', { status: 400 });
        const ext = TYPES[file.type];
        if (!ext) return new Response('Photo must be JPEG, PNG or WebP.', { status: 415 });
        if (file.size > MAX_BYTES) return new Response('Photo must be under 8 MB.', { status: 413 });

        const stop = await getStop(env.DB, stopId);
        if (!stop || (staff.role === 'driver' && stop.driverEmail.toLowerCase() !== staff.email.toLowerCase())) return new Response('Not found', { status: 404 });

        // Unguessable key: the customer email links straight to it, so no login is needed to view the delivery photo.
        const key = `stops/${crypto.randomUUID()}.${ext}`;
        await env.PHOTOS.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } });
        await setStopPhoto(env.DB, stopId, key);
        return Response.json({ key });
      },
    },
  },
});
