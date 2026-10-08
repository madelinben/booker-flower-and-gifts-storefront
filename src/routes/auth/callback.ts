import { createFileRoute } from '@tanstack/react-router';
import { deleteCookie, getCookie, setCookie } from '@tanstack/react-start/server';
import { findStaff } from '~/data/Staff/staff-dal';
import { LOGIN_COOKIE, openLoginState } from '~/services/auth/login-state';
import { createSessionToken, SESSION_COOKIE, SESSION_HOURS } from '~/services/auth/session';
import { requireSetting } from '~/services/environment/require-setting';
import { getServerEnvironment } from '~/services/environment/server-environment';
import { completeGoogleSignIn } from '~/services/integrations/google/google-oidc';
import { safeNextPath } from '~/utilities/safe-next-path';

export const Route = createFileRoute('/auth/callback')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const env = getServerEnvironment();
        const url = new URL(request.url);
        const secret = requireSetting(env.SESSION_SECRET, 'SESSION_SECRET');
        const login = await openLoginState(getCookie(LOGIN_COOKIE), secret);
        deleteCookie(LOGIN_COOKIE, { path: '/auth' });
        const code = url.searchParams.get('code');
        if (!login || !code || url.searchParams.get('state') !== login.state) {
          return new Response('Sign-in expired or invalid. Start again from /auth/login.', { status: 400 });
        }
        let email: string;
        try {
          ({ email } = await completeGoogleSignIn({ code, verifier: login.verifier, nonce: login.nonce, redirectUri: `${env.SITE_ORIGIN}/auth/callback` }, env as never));
        } catch (error) {
          console.error('Google sign-in failed.', error);
          return new Response('Google sign-in failed. Start again from /auth/login.', { status: 400 });
        }
        const staff = await findStaff(env.DB, email);
        const bootstrap = !!env.BOOTSTRAP_ADMIN_EMAIL && env.BOOTSTRAP_ADMIN_EMAIL.toLowerCase() === email.toLowerCase();
        if (!bootstrap && !staff?.active) return new Response('This Google account is not on the staff list.', { status: 403 });
        setCookie(SESSION_COOKIE, await createSessionToken(email, secret), {
          httpOnly: true, secure: url.protocol === 'https:', sameSite: 'lax', path: '/', maxAge: SESSION_HOURS * 3600,
        });
        const role = bootstrap ? 'admin' : staff!.role;
        return Response.redirect(`${env.SITE_ORIGIN}${safeNextPath(login.next, role === 'driver' ? '/driver' : '/admin/orders')}`, 302);
      },
    },
  },
});
