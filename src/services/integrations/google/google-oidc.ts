import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose';
import { z } from 'zod';
import { requireSetting } from '~/services/environment/require-setting';
import type { ServerEnvironment } from '~/services/environment/server-environment';

const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const JWKS_URL = 'https://www.googleapis.com/oauth2/v3/certs';
const ISSUERS = ['https://accounts.google.com', 'accounts.google.com'];

const googleKeys = createRemoteJWKSet(new URL(JWKS_URL));

/** Authorization-code request with PKCE. `prompt=select_account` stops a shared laptop silently reusing the wrong Google account. */
export function buildGoogleAuthUrl(input: { clientId: string; redirectUri: string; state: string; nonce: string; challenge: string }): string {
  const url = new URL(AUTH_URL);
  url.search = new URLSearchParams({
    client_id: input.clientId,
    redirect_uri: input.redirectUri,
    response_type: 'code',
    scope: 'openid email',
    state: input.state,
    nonce: input.nonce,
    code_challenge: input.challenge,
    code_challenge_method: 'S256',
    prompt: 'select_account',
  }).toString();
  return url.toString();
}

const tokenResponseSchema = z.object({ id_token: z.string() });

/**
 * Checks signature (Google's published keys), issuer, audience, expiry and nonce, and that Google verified the address.
 * `keys` is injectable so tests can sign their own tokens.
 */
export async function verifyGoogleIdToken(idToken: string, expected: { clientId: string; nonce: string }, keys: JWTVerifyGetKey = googleKeys): Promise<{ email: string }> {
  const { payload } = await jwtVerify(idToken, keys, { issuer: ISSUERS, audience: expected.clientId });
  if (payload.nonce !== expected.nonce) throw new Error('Google sign-in nonce mismatch.');
  if (payload.email_verified !== true || typeof payload.email !== 'string') throw new Error('Google account has no verified email.');
  return { email: payload.email };
}

export async function completeGoogleSignIn(
  input: { code: string; verifier: string; nonce: string; redirectUri: string },
  env: ServerEnvironment,
): Promise<{ email: string }> {
  const clientId = requireSetting(env.GOOGLE_CLIENT_ID, 'GOOGLE_CLIENT_ID');
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code: input.code,
      client_id: clientId,
      client_secret: requireSetting(env.GOOGLE_CLIENT_SECRET, 'GOOGLE_CLIENT_SECRET'),
      redirect_uri: input.redirectUri,
      grant_type: 'authorization_code',
      code_verifier: input.verifier,
    }),
  });
  if (!response.ok) throw new Error(`Google token exchange failed with status ${response.status}.`);
  const { id_token } = tokenResponseSchema.parse(await response.json());
  return verifyGoogleIdToken(id_token, { clientId, nonce: input.nonce });
}
