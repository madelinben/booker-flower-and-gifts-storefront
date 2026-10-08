import { createFileRoute } from '@tanstack/react-router';
import { deleteCookie } from '@tanstack/react-start/server';
import { SESSION_COOKIE } from '~/services/auth/session';
import { getServerEnvironment } from '~/services/environment/server-environment';

export const Route = createFileRoute('/auth/logout')({
  server: {
    handlers: {
      // POST only so a stray link or image tag cannot sign anyone out; same-origin enforced.
      POST: ({ request }) => {
        const env = getServerEnvironment();
        if (request.headers.get('origin') !== env.SITE_ORIGIN) return new Response('Forbidden', { status: 403 });
        deleteCookie(SESSION_COOKIE, { path: '/' });
        return Response.redirect(`${env.SITE_ORIGIN}/`, 303);
      },
    },
  },
});
