import { createFileRoute } from '@tanstack/react-router';
import { setCookie } from '@tanstack/react-start/server';
import { codeChallenge, LOGIN_COOKIE, newLoginState, sealLoginState } from '~/services/auth/login-state';
import { requireSetting } from '~/services/environment/require-setting';
import { getServerEnvironment } from '~/services/environment/server-environment';
import { buildGoogleAuthUrl } from '~/services/integrations/google/google-oidc';
import { safeNextPath } from '~/utilities/safe-next-path';

export const Route = createFileRoute('/auth/login')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const env = getServerEnvironment();
        const url = new URL(request.url);
        const login = newLoginState(safeNextPath(url.searchParams.get('next')));
        setCookie(LOGIN_COOKIE, await sealLoginState(login, requireSetting(env.SESSION_SECRET, 'SESSION_SECRET')), {
          httpOnly: true, secure: url.protocol === 'https:', sameSite: 'lax', path: '/auth', maxAge: 600,
        });
        return Response.redirect(
          buildGoogleAuthUrl({
            clientId: requireSetting(env.GOOGLE_CLIENT_ID, 'GOOGLE_CLIENT_ID'),
            redirectUri: `${env.SITE_ORIGIN}/auth/callback`,
            state: login.state, nonce: login.nonce, challenge: await codeChallenge(login.verifier),
          }),
          302,
        );
      },
    },
  },
});
