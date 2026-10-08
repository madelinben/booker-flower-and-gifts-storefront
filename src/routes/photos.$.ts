import { createFileRoute } from '@tanstack/react-router';
import { getServerEnvironment } from '~/services/environment/server-environment';

export const Route = createFileRoute('/photos/$')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const key = params._splat ?? '';
        if (!/^stops\/[0-9a-f-]{36}\.(jpg|png|webp)$/.test(key)) return new Response('Not found', { status: 404 });
        const object = await getServerEnvironment().PHOTOS.get(key);
        if (!object) return new Response('Not found', { status: 404 });
        return new Response(object.body as ReadableStream, {
          headers: { 'Content-Type': object.httpMetadata?.contentType ?? 'image/jpeg', 'Cache-Control': 'private, max-age=86400', 'X-Robots-Tag': 'noindex' },
        });
      },
    },
  },
});
